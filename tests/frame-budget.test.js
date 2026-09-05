import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FrameBudget, boundedDpr } from '../src/frame-budget.js';

function run(budget, { hz = 60, cpu = .5, gpu = .7, seconds = 10, start = 0 } = {}) {
  let lastRender = start;
  let lastWork = start;
  for (let now = start + 1000 / hz; now < start + seconds * 1000; now += 1000 / hz) {
    budget.tick(now);
    const interval = 1000 / budget.targetFps;
    if (now - lastRender >= interval - .75) {
      budget.record(now, cpu, gpu, now - lastWork);
      lastWork = now;
      lastRender = now - Math.max(0, (now - lastRender) % interval);
    }
  }
}

test('pixel budget holds at 8K without a minimum-DPR loophole', () => {
  for (const touch of [true, false]) for (const [w, h] of [[360,780], [980,2123], [7680,4320]]) {
    const dpr = boundedDpr(w, h, 3, touch);
    assert.ok(Math.floor(w * dpr) * Math.floor(h * dpr) <= (touch ? 1500000 : 3200000));
  }
});

test('healthy 60Hz hardware keeps 60fps and full resolution', () => {
  const budget = new FrameBudget();
  run(budget);
  assert.equal(budget.targetFps, 60);
  assert.equal(budget.quality, 1);
});

test('healthy 90Hz and 120Hz hardware earn native refresh without uneven 90-on-120 pacing', () => {
  for (const hz of [90, 120]) {
    const budget = new FrameBudget();
    run(budget, { hz, seconds: 14 });
    assert.equal(budget.targetFps, hz);
    assert.equal(budget.quality, 1);
  }
});

test('GPU pressure lowers resolution before frame rate', () => {
  const budget = new FrameBudget();
  run(budget, { gpu: 12, seconds: 4 });
  assert.ok(budget.quality < 1);
  assert.equal(budget.targetFps, 60);
  run(budget, { gpu: 12, seconds: 14, start: 4000 });
  assert.equal(budget.quality, .6);
  assert.equal(budget.targetFps, 30);
});

test('one slow window does not reallocate or lower fps', () => {
  const budget = new FrameBudget();
  run(budget, { gpu: 20, seconds: 2 });
  assert.equal(budget.quality, 1);
  assert.equal(budget.targetFps, 60);
});

test('recovery is gradual and missing GPU timers still permit cadence-based adaptation', () => {
  const budget = new FrameBudget();
  budget.quality = .6;
  budget.targetFps = 30;
  run(budget, { gpu: null, seconds: 25 });
  assert.equal(budget.targetFps, 60);
  assert.ok(budget.quality > .6);
  assert.equal(budget.gpuMs, null);
});

test('background pause discards stale timing without resetting earned quality', () => {
  const budget = new FrameBudget();
  budget.quality = .85;
  run(budget, { seconds: 1 });
  budget.reset(100000);
  run(budget, { seconds: 2, start: 100000 });
  assert.equal(budget.quality, .85);
  assert.equal(budget.targetFps, 60);
});
