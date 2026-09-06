import test from 'node:test';
import assert from 'node:assert/strict';
import { Euler, Matrix4, Vector3 } from 'three';
import { SkyView, skyTransform, projectSkyPoint } from '../src/sky-view.js';
import { paintBloom, bloomPose, flowerVertices } from '../src/garden-motion.js';

const flowers = () => Array.from({ length: 12 }, (_, i) => ({ x: 160 + i * 4, y: 300, petals: 6, size: 22, rotation: .3, born: 0, color: '#ff6f61' }));
test('live touch and rotation preserve the original artwork and finish rendering at rest', () => {
  const source = flowers(), original = structuredClone(source), sky = new SkyView({ mobile: true });
  sky.enter(source, [{ from: source[0], to: source[1] }]);
  sky.layout(390, 844);
  sky.move(sky.blooms[0].screen.x + 40, sky.blooms[0].screen.y + 20, 100);
  sky.update(116, 16, 390, 844);
  assert.equal(sky.response.active.size, 4);
  assert.ok(sky.needsFrame(116));
  for (let now = 132; now < 2200; now += 16) sky.update(now, 16, 390, 844);
  assert.equal(sky.needsFrame(2200), false);
  sky.turn(500, 10000, 390, 844);
  assert.equal(sky.pitch, 1.1);
  sky.layout(390, 844);
  assert.notEqual(sky.blooms[0].screen.x, source[0].x);
  assert.equal(sky.links[0].from, sky.blooms[0]);
  assert.deepEqual(source, original);
  sky.reset();
  assert.equal(sky.yaw, 0);
  sky.leave();
  assert.equal(sky.needsFrame(3000), false);
  assert.equal(sky.blooms.length, 0);
});

test('Canvas world projection and flower vertices match the Three.js YXZ group rotation', () => {
  const view = skyTransform(1440, 900, .65, -1.2), bloom = { ...flowers()[0], depth: 70, leanX: .17, leanY: -.1 };
  const world = new Matrix4().makeRotationFromEuler(new Euler(view.pitch, view.yaw, 0, 'YXZ'));
  world.scale(new Vector3(view.scale, view.scale, view.scale));
  const origin = new Vector3(bloom.x - 720, 450 - bloom.y, bloom.depth).applyMatrix4(world);
  const projected = projectSkyPoint(bloom, view);
  assert.ok(Math.abs(projected.x - (720 + origin.x)) < 1e-8);
  assert.ok(Math.abs(projected.y - (view.centerY - origin.y)) < 1e-8);
  bloom.screen = projected;
  const points = [];
  const ctx = { save() {}, restore() {}, translate() {}, beginPath() {}, stroke() {}, arc() {}, fill() {}, moveTo(x, y) { points.push([x,y]); }, lineTo(x,y) { points.push([x,y]); } };
  paintBloom(ctx, bloom, 3, 2200, { view, finished: true });
  const pose = bloomPose(bloom, 3, 2200, false, true);
  const local = new Matrix4().makeRotationFromEuler(new Euler(pose.rx, pose.ry, pose.rz));
  local.scale(new Vector3(pose.sx, pose.sy, pose.sz));
  world.multiply(local);
  const vertices = flowerVertices(6, 3);
  for (let i = 0; i < points.length; i += 17) {
    const point = new Vector3().fromArray(vertices, i * 3).applyMatrix4(world);
    assert.ok(Math.abs(points[i][0] - point.x) < 1e-8);
    assert.ok(Math.abs(points[i][1] + point.y) < 1e-8);
  }
});

test('reduced motion allows deliberate rotation with no automatic sway; suspension clears input', () => {
  const sky = new SkyView({ reducedMotion: true });
  sky.enter(flowers(), []);
  sky.move(180, 300, 100);
  sky.update(116, 16, 390, 844);
  assert.equal(sky.needsFrame(116), false);
  sky.turn(30, 20, 390, 844);
  assert.ok(sky.needsFrame(116));
  sky.update(132, 16, 390, 844);
  assert.equal(sky.needsFrame(132), false);
  assert.ok(sky.yaw > 0);
  sky.suspend();
  sky.update(148, 16, 390, 844);
  assert.equal(sky.response.active.size, 0);
  assert.equal(sky.needsFrame(148), false);
});

test('the closing reveal opens depth once, returns to the front and stops rendering', () => {
  const source = flowers(), original = structuredClone(source);
  const sky = new SkyView(); sky.enter(source, []); sky.reveal();
  assert.equal(sky.layout(390, 844).scale, 1);
  for (let now = 20; now <= 1400; now += 20) sky.update(now, 20, 390, 844);
  assert.ok(sky.yaw > .6 && sky.pitch < -.19);
  assert.ok(sky.needsFrame(1400));
  sky.suspend();
  assert.equal(sky.revealElapsed, 1400);
  for (let now = 1420; now <= 2800; now += 20) sky.update(now, 20, 390, 844);
  assert.equal(sky.yaw, 0); assert.equal(sky.pitch, 0);
  assert.equal(sky.needsFrame(2800), false);
  assert.deepEqual(source, original);
  const quiet = new SkyView({ reducedMotion: true }); quiet.enter(source, []); quiet.reveal();
  assert.equal(quiet.revealing, false);
});

test('a short touch survives a late first frame, settles, and is discarded on suspension', () => {
  const sky = new SkyView({ mobile: true }); sky.enter(flowers(), []); sky.layout(390, 844);
  const point = sky.blooms[0].screen;
  sky.move(point.x + 40, point.y + 20, 100);
  sky.pointerUntil = 0; // A finger can lift before the next frame is available.
  sky.update(500, 50, 390, 844);
  assert.ok(sky.response.active.size > 0);
  for (let now = 516; now < 2500; now += 16) sky.update(now, 16, 390, 844);
  assert.equal(sky.needsFrame(2500), false);
  sky.move(point.x + 40, point.y + 20, 2600); sky.suspend();
  sky.update(2900, 50, 390, 844);
  assert.equal(sky.needsFrame(2900), false);
  assert.equal(sky.response.active.size, 0);
});
