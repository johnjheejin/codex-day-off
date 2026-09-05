import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const evidence = process.env.AFTERGLOW_EVIDENCE_DIR || 'assets/verification/2026-09-06-living-sky';
test.beforeAll(() => fs.mkdirSync(evidence, { recursive: true }));
async function observe(page) {
  await page.addInitScript(() => {
    let create;
    Object.defineProperty(window, 'createAfterglowRenderer', { get: () => create, set: factory => {
      create = options => { const renderer = factory(options), render = renderer.render;
        renderer.render = state => { window.observedSky = state; window.observedFrames = (window.observedFrames ?? 0) + 1; return render(state); };
        return renderer;
      };
    } });
    const original = CanvasRenderingContext2D.prototype.clearRect;
    window.canvasFrames = 0;
    CanvasRenderingContext2D.prototype.clearRect = function(...args) { if (this.canvas.id === 'canvas') window.canvasFrames++; return original.apply(this, args); };
  });
}
async function enter(page) {
  await page.goto('/?preview=result');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  await expect(page.locator('#viewSky')).toBeEnabled();
  await page.locator('#viewSky').click();
  await expect.poll(() => page.evaluate(() => !!window.observedSky.view)).toBe(true);
}
async function atRest(page, property = 'observedFrames') {
  await page.waitForTimeout(1600);
  const frames = await page.evaluate(key => window[key], property);
  await page.waitForTimeout(350);
  expect(await page.evaluate(key => window[key], property)).toBe(frames);
}

test('kept sky sways, rotates and resets without changing the saved image or source flowers', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await observe(page); await enter(page);
  const original = await page.evaluate(() => ({ png: document.querySelector('#resultPreview').src, blooms: JSON.stringify(window.observedSky.blooms.map(b => b.source)) }));
  const bloom = await page.evaluate(() => window.observedSky.blooms[0].screen);
  await page.mouse.move(bloom.x + 40, bloom.y + 25);
  await expect.poll(() => page.evaluate(() => Math.abs(window.observedSky.blooms[0].leanX))).toBeGreaterThan(.025);
  await page.waitForTimeout(360);
  await page.screenshot({ path: `${evidence}/night-live-touch.png` });
  await atRest(page);
  await page.locator('#skyOrbit').click();
  await page.mouse.move(650, 420); await page.mouse.down(); await page.mouse.move(950, 520, { steps: 15 }); await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.observedSky.view.yaw)).toBeGreaterThan(.5);
  await page.waitForTimeout(360);
  await page.screenshot({ path: `${evidence}/night-live-turned.png` });
  expect(await page.evaluate(() => JSON.stringify(window.observedSky.blooms.map(b => b.source)))).toBe(original.blooms);
  expect(await page.locator('#resultPreview').getAttribute('src')).toBe(original.png);
  await page.locator('#skyReset').click();
  await expect.poll(() => page.evaluate(() => window.observedSky.view.yaw)).toBe(0);
  await page.locator('#canvas').focus(); await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.observedSky.view.yaw)).toBeGreaterThan(0);
  await page.keyboard.press('r');
  await expect.poll(() => page.evaluate(() => window.observedSky.view.yaw)).toBe(0);
  await page.keyboard.press('Escape'); await expect(page.locator('#viewSky')).toBeFocused();
  await expect(page.locator('#skyTools')).toBeHidden();
  await atRest(page);
  expect(errors).toEqual([]);
});

test('small phone touch and 3D views stay reachable and keep a single bounded drawing buffer', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const page = await context.newPage(); await observe(page); await enter(page);
  const canvas = page.locator('#canvas');
  const point = await page.evaluate(() => window.observedSky.blooms[0].screen);
  await canvas.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 1, clientX: point.x + 25, clientY: point.y + 10 });
  await expect.poll(() => page.evaluate(() => Math.abs(window.observedSky.blooms[0].leanX))).toBeGreaterThan(.02);
  await canvas.dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 1 });
  await page.locator('#skyOrbit').click();
  await canvas.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 2, clientX: 130, clientY: 250 });
  await canvas.dispatchEvent('pointermove', { pointerType: 'touch', pointerId: 2, clientX: 240, clientY: 280 });
  await canvas.dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 2 });
  await expect.poll(() => page.evaluate(() => window.observedSky.view.yaw)).toBeGreaterThan(.5);
  for (const id of ['skyTouch','skyOrbit','skyReset','skyReturn']) {
    const box = await page.locator(`#${id}`).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44); expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320); expect(box.y + box.height).toBeLessThanOrEqual(568);
  }
  expect(await page.locator('#skyCanvas').evaluate(c => c.width * c.height)).toBeLessThanOrEqual(1500000);
  expect(await canvas.evaluate(c => c.width * c.height)).toBe(1);
  await page.waitForTimeout(360);
  await page.screenshot({ path: `${evidence}/mobile-night-turned.png` });
  await page.keyboard.press('Escape'); await page.locator('#appearanceToggle').click(); await page.locator('#viewSky').click();
  await page.locator('#skyOrbit').click(); await canvas.focus(); await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(360);
  await page.screenshot({ path: `${evidence}/mobile-paper-live.png` });
  await page.locator('#skyCanvas').evaluate(c => c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'canvas2d');
  await canvas.focus(); await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(360);
  await page.screenshot({ path: `${evidence}/mobile-paper-canvas-live.png` });
  expect(await canvas.evaluate(c => {
    const data = c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n = 0;
    for (let i=0;i<data.length;i+=4) if (data[i+3] > 30 && Math.max(data[i],data[i+1],data[i+2]) - Math.min(data[i],data[i+1],data[i+2]) > 40) n++;
    return n;
  })).toBeGreaterThan(100);
  await atRest(page, 'canvasFrames');
  await context.close();
});

test('reduced motion keeps live sky still but supports deliberate rotation and hidden-page suspension', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await observe(page); await enter(page);
  const point = await page.evaluate(() => window.observedSky.blooms[0].screen);
  await page.mouse.move(point.x+20,point.y+20); await atRest(page);
  expect(await page.evaluate(() => window.observedSky.blooms.every(b => !b.leanX && !b.leanY))).toBe(true);
  await page.locator('#skyOrbit').click(); await page.locator('#canvas').focus(); await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.observedSky.view.yaw)).toBeGreaterThan(0);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  const frames = await page.evaluate(() => window.observedFrames);
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.observedFrames)).toBe(frames);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  await atRest(page);
});

test('sound can start when preference storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }); });
  await page.goto('/');
  await expect(page.locator('#soundToggle')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#soundToggle').click();
  await expect(page.locator('#soundToggle')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#start').click();
  await expect(page.locator('#world')).toHaveClass(/playing/);
});
