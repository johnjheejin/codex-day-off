import { test, expect } from '@playwright/test';

async function observe(page) {
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame, cancel = window.cancelAnimationFrame;
    const pending = new Set(); window.peakSkyFrames = 0;
    window.requestAnimationFrame = callback => {
      let id = request.call(window, now => { pending.delete(id); callback(now); });
      if (callback.name === 'frame') { pending.add(id); window.peakSkyFrames = Math.max(window.peakSkyFrames, pending.size); }
      return id;
    };
    window.cancelAnimationFrame = id => { pending.delete(id); cancel.call(window, id); };
    let factory;
    Object.defineProperty(window, 'createAfterglowRenderer', { get: () => factory, set: create => {
      factory = options => {
        const renderer = create(options), render = renderer.render;
        renderer.render = state => { window.keptState = state; window.keptFrames = (window.keptFrames || 0) + 1; return render(state); };
        return renderer;
      };
    } });
  });
}
async function ready(page) {
  await observe(page); await page.goto('/?preview=result');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  await expect(page.locator('#viewSky')).toBeEnabled();
}

test('completion briefly reveals depth, pauses while hidden, then leaves the sky ready to touch', async ({ page }) => {
  await observe(page); await page.clock.install(); await page.goto('/');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  await page.locator('#start').click();
  await page.clock.fastForward(30100);
  await expect(page.locator('#keepSky')).toBeVisible();
  await page.clock.runFor(1300);
  expect(await page.evaluate(() => window.keptState.view.yaw)).toBeGreaterThan(.5);
  await page.screenshot({ path: test.info().outputPath('closing-depth.png') });
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  const frames = await page.evaluate(() => window.keptFrames);
  await page.clock.fastForward(5000);
  expect(await page.evaluate(() => window.keptFrames)).toBe(frames);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.clock.runFor(2000);
  await expect(page.locator('#skyTools')).toBeVisible();
  await expect(page.locator('#result')).not.toBeVisible();
  await expect(page.locator('#canvas')).toBeFocused();
  expect(await page.evaluate(() => window.keptState.view.yaw)).toBe(0);
  const resting = await page.evaluate(() => window.keptFrames);
  await page.clock.runFor(5000);
  expect(await page.evaluate(() => window.keptFrames)).toBe(resting);
});

test('sharing is a modal choice and returns to the same turned sky and original PNG', async ({ page }) => {
  await ready(page);
  await expect(page.getByRole('button', { name: 'Share image', exact: true })).not.toBeVisible();
  const png = await page.locator('#resultPreview').getAttribute('src');
  await page.locator('#skyOrbit').click(); await page.locator('#canvas').focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.keptState.view.yaw)).toBeGreaterThan(0);
  const yaw = await page.evaluate(() => window.keptState.view.yaw);
  await page.locator('#skyKeep').click();
  await expect(page.locator('#result')).toBeVisible();
  await expect(page.locator('#resultTitle')).toBeFocused();
  await expect(page.locator('[data-afterglow-destination]')).toHaveCount(6);
  await page.keyboard.press('Escape');
  await expect(page.locator('#result')).not.toBeVisible();
  await expect(page.locator('#skyKeep')).toBeFocused();
  expect(await page.evaluate(() => window.keptState.view.yaw)).toBe(yaw);
  expect(await page.locator('#resultPreview').getAttribute('src')).toBe(png);
  expect(await page.evaluate(() => window.peakSkyFrames)).toBe(1);
  await page.locator('#skyTouch').click();
  await expect.poll(() => page.evaluate(() => window.keptState.view.yaw)).toBe(0);
});

test('the logo opens the landing and restores the last sky across resize and an abandoned new pause', async ({ page }) => {
  await ready(page);
  const png = await page.locator('#resultPreview').getAttribute('src');
  await page.locator('#homeButton').click();
  await expect(page.locator('#intro')).not.toHaveClass(/hidden/);
  await expect(page.locator('#returnSky')).toBeVisible();
  await expect(page.locator('#skyTools')).toBeHidden();
  expect(await page.evaluate(() => window.keptState.blooms.length)).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  await page.locator('#appearanceToggle').click();
  await page.locator('#returnSky').click();
  await expect(page.locator('#skySummary')).toContainText('12 thoughts');
  await expect(page.locator('#world')).not.toHaveClass(/light-field/);
  expect(await page.locator('#resultPreview').getAttribute('src')).toBe(png);
  expect(await page.evaluate(() => window.keptState.blooms.length)).toBe(12);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.locator('#homeButton').click();
  const returnButton = await page.locator('#returnSky').boundingBox();
  expect(returnButton.y + returnButton.height).toBeLessThanOrEqual(568);
  await page.screenshot({ path: test.info().outputPath('landing-return.png') });
  await page.locator('#start').click();
  await page.waitForTimeout(300); await page.locator('#homeButton').click();
  await expect(page.locator('#homeDialog')).toBeVisible();
  const time = await page.locator('#time').textContent();
  const frames = await page.evaluate(() => window.keptFrames);
  await page.waitForTimeout(1200);
  expect(await page.locator('#time').textContent()).toBe(time);
  expect(await page.evaluate(() => window.keptFrames)).toBe(frames);
  await page.keyboard.press('Escape');
  await expect(page.locator('#canvas')).toBeFocused();
  await expect(page.locator('#world')).toHaveClass(/playing/);
  await page.locator('#homeButton').click(); await page.locator('#confirmHome').click();
  await expect(page.locator('#intro')).not.toHaveClass(/hidden/);
  await page.locator('#returnSky').click();
  await expect(page.locator('#skySummary')).toContainText('12 thoughts');
  expect(await page.locator('#resultPreview').getAttribute('src')).toBe(png);
  await page.locator('#skyKeep').click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG' }).click();
  expect((await download).suggestedFilename()).toContain('afterglow');
});
