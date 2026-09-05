import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const evidence = process.env.AFTERGLOW_EVIDENCE_DIR || 'assets/verification/2026-09-06-gestures';
test.beforeAll(() => fs.mkdirSync(evidence, { recursive: true }));

async function observe(page) {
  await page.addInitScript(() => {
    let create;
    Object.defineProperty(window, 'createAfterglowRenderer', {
      get: () => create,
      set: factory => {
        create = options => {
          const renderer = factory(options), render = renderer.render;
          renderer.render = state => {
            window.observedSky = state;
            window.observedFrames = (window.observedFrames ?? 0) + 1;
            return render(state);
          };
          return renderer;
        };
      }
    });
  });
}

test('real pointer gestures shape flowers and nearby flowers lean without new geometry', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await observe(page);
  await page.goto('/?debug=1');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  await expect(page.locator('#keepSky')).toBeHidden();
  await page.getByRole('button', { name: 'Begin day off' }).click();
  for (let i = 0; i < 8; i++) {
    const point = await page.evaluate(() => window.observedSky.particles.find(p => p.x > 80 && p.y > 140 && p.x < innerWidth - 80 && p.y < innerHeight - 120));
    if (point) await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(600);
  }
  const forms = await page.evaluate(() => window.observedSky.blooms.map(({ petals, size, rotation, stretch, fullness, curl }) => ({ petals, size, rotation, stretch, fullness, curl })));
  expect(forms.length).toBeGreaterThan(2);
  expect(forms.every(form => Number.isFinite(form.curl))).toBe(true);
  expect(new Set(forms.map(form => form.stretch.toFixed(2))).size).toBeGreaterThan(1);
  const bloom = await page.evaluate(() => window.observedSky.blooms[0]);
  await page.mouse.move(bloom.x + 55, bloom.y + 25);
  await expect.poll(() => page.evaluate(() => Math.hypot(window.observedSky.blooms[0].leanX ?? 0, window.observedSky.blooms[0].leanY ?? 0))).toBeGreaterThan(.05);
  await page.screenshot({ path: `${evidence}/night-gesture-garden.png` });
  await page.locator('#appearanceToggle').click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${evidence}/paper-gesture-garden.png` });
  expect(Number(await page.locator('#world').getAttribute('data-geometries'))).toBeLessThanOrEqual(14);
  console.log('Gesture garden:', await page.locator('#debugPanel').textContent());
  // The Canvas renderer continues from those exact gesture forms after a GPU loss.
  const before = await page.evaluate(() => window.observedSky.blooms[0]);
  await page.locator('#skyCanvas').evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'canvas2d');
  expect(await page.locator('#canvas').evaluate(canvas => {
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let colored = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] > 30 && Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) - Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) > 40) colored++;
    return colored;
  })).toBeGreaterThan(500);
  await page.screenshot({ path: `${evidence}/paper-canvas-garden.png` });
  expect(await page.evaluate(() => window.observedSky.blooms[0].stretch)).toBe(before.stretch);
  await expect(page.getByRole('button', { name: 'Pause your day off' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('touch gestures retain a portrait Paper Sky and stay within the mobile drawing budget', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await observe(page);
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  await page.locator('#appearanceToggle').click();
  await page.getByRole('button', { name: 'Begin day off' }).click();
  await page.clock.runFor(50);
  for (let i = 0; i < 5; i++) {
    const point = await page.evaluate(() => window.observedSky.particles.find(p => p.x > 20 && p.y > 100 && p.x < innerWidth - 20 && p.y < innerHeight - 80));
    if (point) {
      await page.locator('#canvas').dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 1, clientX: point.x, clientY: point.y });
      await page.clock.runFor(750);
      await page.locator('#canvas').dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 1 });
    } else await page.clock.runFor(750);
  }
  expect(await page.evaluate(() => window.observedSky.blooms.length)).toBeGreaterThan(1);
  expect(await page.locator('#skyCanvas').evaluate(canvas => canvas.width * canvas.height)).toBeLessThanOrEqual(1500000);
  await page.screenshot({ path: `${evidence}/mobile-paper-playing.png` });
  await page.clock.fastForward(30100);
  await page.clock.runFor(1000);
  await page.screenshot({ path: `${evidence}/mobile-paper-ending.png`, animations: 'disabled' });
  await page.getByRole('button', { name: 'Keep this sky' }).click();
  await expect(page.locator('#viewSky')).toBeEnabled();
  const dimensions = await page.locator('#resultPreview').evaluate(async image => { await image.decode(); return [image.naturalWidth, image.naturalHeight]; });
  expect(dimensions[0] / dimensions[1]).toBeCloseTo(390 / 844, 3);
  expect(dimensions[0] * dimensions[1]).toBeLessThanOrEqual(1500000);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG' }).click();
  await (await download).saveAs(`${evidence}/mobile-paper-gesture-sky.png`);
  await context.close();
});

test('completion leaves a quiet sky, stops collecting, pauses when hidden and then rests', async ({ page }) => {
  await observe(page);
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  await page.getByRole('button', { name: 'Begin day off' }).click();
  await page.clock.fastForward(30100);
  await expect(page.locator('#keepSky')).toBeVisible();
  await expect(page.locator('#keepSky')).toBeFocused();
  await expect(page.locator('#result')).toHaveClass(/hidden/);
  const count = await page.locator('#count').textContent();
  expect(await page.evaluate(() => window.observedSky.particles.length)).toBe(0);
  await page.mouse.move(150, 250);
  await page.clock.runFor(350);
  await expect(page.locator('#count')).toHaveText(count);
  const frames = await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    return window.observedFrames;
  });
  await page.clock.fastForward(3000);
  expect(await page.evaluate(() => window.observedFrames)).toBe(frames);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(350);
  await expect(page.locator('#keepSky')).toBeVisible();
  await page.screenshot({ path: `${evidence}/quiet-ending.png`, animations: 'disabled' });
  await page.clock.runFor(1300);
  await expect(page.locator('#result')).not.toHaveClass(/hidden/);
  await expect(page.locator('#resultTitle')).toBeFocused();
  await expect(page.locator('#viewSky')).toBeEnabled();
  const atRest = await page.evaluate(() => window.observedFrames);
  await page.clock.runFor(2000);
  expect(await page.evaluate(() => window.observedFrames)).toBe(atRest);
});

test('the ending can be skipped and reduced motion proceeds directly to the result', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin day off' }).click();
  await page.clock.fastForward(30100);
  await expect(page.locator('#keepSky')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#result')).not.toHaveClass(/hidden/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.getByRole('button', { name: 'Begin day off' }).click();
  await page.clock.fastForward(30100);
  await expect(page.locator('#keepSky')).toBeHidden();
  await expect(page.locator('#result')).not.toHaveClass(/hidden/);
});

test('both script bundles can fail without preventing a complete Canvas experience', async ({ page }) => {
  await page.route('**/assets/afterglow-*.js', route => route.abort());
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin day off' }).click();
  await page.clock.fastForward(30100);
  await page.getByRole('button', { name: 'Keep this sky' }).click();
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'canvas2d');
  await expect(page.getByRole('button', { name: 'Download PNG' })).toBeEnabled();
});
