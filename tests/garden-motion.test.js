import test from 'node:test';
import assert from 'node:assert/strict';
import { Euler, Matrix4, Vector3 } from 'three';
import { GestureTrace, BloomResponse, bloomPose, flowerVertices, paintBloom } from '../src/garden-motion.js';

function tracePath(hz, path) {
  const trace = new GestureTrace();
  trace.reset(...path(0));
  for (let frame = 1; frame <= hz * 2; frame++) trace.sample(...path(frame / hz), 1000 / hz, 1000, 1000);
  return trace;
}

test('the same gesture produces matching forms at 30, 60 and 120 Hz', () => {
  const path = t => [500 + Math.cos(t * 3) * 150, 500 + Math.sin(t * 3) * 150];
  const baseline = tracePath(60, path).flower();
  for (const hz of [30, 120]) {
    const flower = tracePath(hz, path).flower();
    assert.equal(flower.petals, baseline.petals);
    for (const key of ['rotation', 'stretch', 'fullness', 'curl', 'size']) {
      assert.ok(Math.abs(flower[key] - baseline[key]) < .035, `${key} differs at ${hz} Hz`);
    }
  }
});

test('straight, curved, reversed and resting gestures leave distinct, bounded flowers', () => {
  const straight = tracePath(60, t => [200 + t * 300, 500]).flower();
  const curve = tracePath(60, t => [500 + Math.cos(t * 3) * 150, 500 + Math.sin(t * 3) * 150]).flower();
  const reversed = tracePath(60, t => [500 + Math.cos(-t * 3) * 150, 500 + Math.sin(-t * 3) * 150]).flower();
  const rest = tracePath(60, () => [500, 500]).flower();
  assert.ok(curve.petals < straight.petals);
  assert.ok(curve.curl > .5 && reversed.curl < -.5);
  assert.ok(straight.stretch > rest.stretch + .15);
  assert.ok(rest.fullness > straight.fullness);
  for (const flower of [straight, curve, reversed, rest]) {
    assert.ok(flower.petals >= 5 && flower.petals <= 8);
    assert.ok(flower.size >= 19 && flower.size <= 24);
  }
});

test('resuming or resizing a gesture discards the old position and heading', () => {
  const trace = tracePath(60, t => [100 + t * 300, 200]);
  trace.reset(900, 600);
  trace.sample(900, 600, 16, 1000, 1000);
  assert.equal(trace.speed, 0);
  assert.equal(trace.curve, 0);
});

test('only the closest four flowers receive touch response, which decays at any cadence', () => {
  for (const hz of [30, 60, 120]) {
    const response = new BloomResponse(4);
    const blooms = Array.from({ length: 40 }, (_, i) => ({ x: 30 + i * 4, y: 40 }));
    for (let i = 0; i < hz; i++) response.update(blooms, { x: 0, y: 0 }, 1000 / hz);
    assert.equal(blooms.filter(bloom => Math.abs(bloom.leanX ?? 0) > .001).length, 4);
    assert.ok(blooms.slice(0, 4).every(bloom => bloom.leanX < 0 && bloom.leanY < 0));
    assert.ok(blooms.every(bloom => Math.abs(bloom.leanX ?? 0) < .3));
    for (let i = 0; i < hz * 2; i++) response.update(blooms, { x: 0, y: 0 }, 1000 / hz, { enabled: false });
    assert.equal(response.active.size, 0);
    assert.ok(blooms.every(bloom => !bloom.leanX && !bloom.leanY));
  }
});

test('reduced motion immediately clears responses and freezes every flower pose', () => {
  const response = new BloomResponse();
  const bloom = { x: 50, y: 50, born: 0, ...tracePath(60, t => [t * 100, 10]).flower() };
  response.update([bloom], { x: 0, y: 0 }, 300);
  assert.notEqual(bloom.leanX, 0);
  response.update([bloom], { x: 0, y: 0 }, 16, { reducedMotion: true });
  assert.equal(bloom.leanX, 0);
  assert.deepEqual(bloomPose(bloom, 0, 100, true), bloomPose(bloom, 0, 8000, true));
});

test('Canvas projects the same cached flower geometry and pose as Three.js', () => {
  const bloom = { x: 100, y: 100, born: 0, petals: 5, size: 22, rotation: -.8, stretch: 1.4, fullness: .88, curl: -.6, leanX: .2, leanY: -.1, color: '#ff6f61' };
  const pose = bloomPose(bloom, 2, 2500, false, true);
  const points = [];
  const context = { save() {}, restore() {}, translate() {}, beginPath() {}, stroke() {}, arc() {}, fill() {}, moveTo(x, y) { points.push([x, y]); }, lineTo(x, y) { points.push([x, y]); } };
  paintBloom(context, bloom, 2, 2500, { finished: true });
  const vertices = flowerVertices(5, 3);
  assert.equal(flowerVertices(5, 3), vertices);
  const matrix = new Matrix4().makeRotationFromEuler(new Euler(pose.rx, pose.ry, pose.rz));
  matrix.scale(new Vector3(pose.sx, pose.sy, pose.sz));
  assert.equal(points.length, vertices.length / 3);
  for (let i = 0; i < points.length; i += 19) {
    const point = new Vector3().fromArray(vertices, i * 3).applyMatrix4(matrix);
    assert.ok(Math.abs(points[i][0] - point.x) < 1e-8);
    assert.ok(Math.abs(points[i][1] + point.y) < 1e-8);
  }
});
