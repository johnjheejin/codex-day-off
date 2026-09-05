import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const evidence = process.env.AFTERGLOW_EVIDENCE_DIR || 'assets/verification/2026-09-05-refinement';
test.beforeAll(() => fs.mkdirSync(evidence, { recursive: true }));

async function observeScene(page) {
  // Observe the renderer boundary without adding test controls to the product.
  await page.addInitScript(() => {
    let create;
    Object.defineProperty(window, 'createAfterglowRenderer', {
      get: () => create,
      set: factory => {
        create = options => {
          const renderer = factory(options);
          const render = renderer.render;
          renderer.render = state => {
            window.observedSky = state;
            window.observedFrames = (window.observedFrames || 0) + 1;
            return render(state);
          };
          return renderer;
        };
      }
    });
  });
}

test('Three.js intro, both scene surfaces, and one active drawing buffer', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?debug=1');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  await expect(page.locator('#canvas')).toHaveJSProperty('width', 1);
  await expect(page.locator('#world')).toHaveCSS('background-color', 'rgb(17, 17, 15)');
  await page.screenshot({ path: `${evidence}/desktop-night.png` });
  await page.locator('#appearanceToggle').click();
  await expect(page.locator('#world')).toHaveCSS('background-color', 'rgb(243, 243, 238)');
  await expect(page.locator('#appearanceToggle')).toHaveAccessibleName('Current scene: Paper Sky. Switch to Night Sky.');
  await page.screenshot({ path: `${evidence}/desktop-paper.png` });
  expect(errors).toEqual([]);
});

test('complete 30 seconds, collect with the cursor, export the 3D sky, replay releases blooms', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await observeScene(page);
  await page.goto('/?debug=1');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  await page.getByRole('button', { name: 'Begin day off' }).click();
  for (let i = 0; i < 10; i++) {
    const point = await page.evaluate(() => window.observedSky.particles.find(p => p.x > 60 && p.y > 80 && p.x < innerWidth - 60 && p.y < innerHeight - 60));
    if (point) await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(650);
  }
  await expect.poll(async () => parseInt(await page.locator('#count').textContent())).toBeGreaterThan(3);
  console.log('Measured desktop:', await page.locator('#debugPanel').textContent());
  await page.screenshot({ path: `${evidence}/desktop-playing.png` });
  await expect(page.locator('#result')).not.toHaveClass(/hidden/, { timeout: 31000 });
  await expect(page.getByRole('button', { name: 'Download PNG' })).toBeEnabled();
  const exported = await page.locator('#afterglowHandoffPreview').evaluate(async image => {
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let colorful = 0;
    for (let i = 0; i < pixels.length; i += 4) if (Math.max(...pixels.slice(i, i + 3)) - Math.min(...pixels.slice(i, i + 3)) > 40) colorful++;
    return { width: canvas.width, height: canvas.height, colorful };
  });
  expect(exported.width).toBe(1200);
  expect(exported.height).toBe(630);
  expect(exported.colorful).toBeGreaterThan(500);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG' }).click();
  await (await downloadPromise).saveAs(`${evidence}/played-sky.png`);
  await page.getByRole('button', { name: 'Post to LinkedIn' }).click();
  await expect(page.locator('#afterglowHandoffDialog')).toBeVisible();
  await expect(page.locator('#handoffSteps li')).toHaveCount(3);
  await page.getByRole('button', { name: 'Not now' }).click();
  await page.getByRole('button', { name: 'Take another thirty seconds' }).click();
  await expect(page.locator('#count')).toHaveText('00 thoughts');
  // Shared base/connection/study geometries and four petal variants stay bounded.
  await expect.poll(async () => Number(await page.locator('#world').getAttribute('data-geometries'))).toBeLessThanOrEqual(14);
  await expect.poll(async () => Number(await page.locator('#world').getAttribute('data-draw-calls'))).toBeLessThanOrEqual(6);
  expect(errors).toEqual([]);
});

for (const profile of [
  { name: 'mobile', width: 360, height: 780 },
  { name: 'touch-desktop-site', width: 980, height: 2123 }
]) {
  test(`${profile.name}: bounded pixels, 60fps baseline, touch control and reachable sharing`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: profile, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await observeScene(page);
    await page.goto('/?debug=1');
    await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
    const pixels = await page.locator('#skyCanvas').evaluate(canvas => canvas.width * canvas.height);
    expect(pixels).toBeLessThanOrEqual(1500000);
    await page.screenshot({ path: `${evidence}/${profile.name}-intro.png` });
    await page.getByRole('button', { name: 'Begin day off' }).click();
    await expect(page.locator('#canvas')).toHaveCSS('touch-action', 'none');
    await page.locator('#canvas').dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 1, clientX: 100, clientY: 200 });
    await page.locator('#canvas').dispatchEvent('pointermove', { pointerType: 'touch', pointerId: 1, clientX: 150, clientY: 250 });
    await expect.poll(() => page.evaluate(() => Math.abs(window.observedSky.player.x - 150))).toBeLessThan(5);
    await page.locator('#canvas').dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 1 });
    await expect(page.locator('#world')).toHaveAttribute('data-target-fps', '60');
    await page.goto('/?preview=result&debug=1');
    const buttons = page.locator('[data-afterglow-destination]');
    await expect(buttons).toHaveCount(6);
    await expect(buttons.first()).toBeEnabled();
    const imageSize = await page.locator('#resultPreview').evaluate(async image => {
      await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight };
    });
    expect(imageSize.width / imageSize.height).toBeCloseTo(profile.width / profile.height, 3);
    expect(imageSize.width * imageSize.height).toBeLessThanOrEqual(1500000);
    expect(Math.max(imageSize.width, imageSize.height)).toBeLessThanOrEqual(1920);
    if (profile.name === 'mobile') {
      const bounds = await page.locator('#resultPreview').evaluate(async image => {
        await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        const w = Math.floor(canvas.width * .36), h = Math.floor(canvas.height * .15);
        const data = ctx.getImageData(0, Math.floor(canvas.height * .125), w, h).data;
        let left = w, right = -1, top = h, bottom = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          if (data[i] > 50 && data[i] > data[i + 1] * 1.3 && data[i] > data[i + 2] * 1.2) {
            left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
          }
        }
        return { width: right - left, height: bottom - top };
      });
      expect(bounds.width).toBeGreaterThan(10);
      expect(bounds.width).toBeLessThan(imageSize.width * .3);
      expect(bounds.width / bounds.height).toBeLessThan(4);
    }
    const primary = await buttons.first().boundingBox();
    expect(primary.y + primary.height).toBeLessThan(profile.height);
    for (const button of await buttons.all()) {
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeInViewport();
    }
    expect(await page.locator('#result').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.locator('#result').evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: `${evidence}/${profile.name}-result.png` });
    await context.close();
  });
}

test('lost WebGL context returns the existing 12-thought result to Canvas', async ({ page }) => {
  await page.goto('/?preview=result&debug=1');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  await page.locator('#skyCanvas').evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'canvas2d');
  await expect(page.locator('#skyCanvas')).toHaveCount(0);
  await expect(page.locator('#finalCount')).toHaveText('12');
  await page.locator('#appearanceToggle').click();
  await expect(page.getByRole('button', { name: 'Download PNG' })).toBeEnabled();
  expect(await page.locator('#canvas').evaluate(canvas => canvas.width * canvas.height)).toBeGreaterThan(1);
});

test('bundle failure still allows entry and play', async ({ page }) => {
  await page.route('**/assets/afterglow-three.js', route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin day off' }).click();
  await expect(page.locator('#world')).toHaveClass(/playing/);
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'canvas2d');
});

test('mobile fallback PNG keeps the completed portrait framing after rotation and scene changes', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.route('**/assets/afterglow-three.js', route => route.abort());
  await page.goto('/?preview=result');
  const download = page.getByRole('button', { name: 'Download PNG' });
  await expect(download).toBeEnabled();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => page.locator('#canvas').evaluate(canvas => canvas.style.width)).toBe('844px');
  await page.locator('#appearanceToggle').click();
  await expect(download).toBeEnabled();
  const exported = await page.locator('#resultPreview').evaluate(async image => {
    await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
    return { width: canvas.width, height: canvas.height, corner: [...ctx.getImageData(0, 0, 1, 1).data] };
  });
  expect(exported.width / exported.height).toBeCloseTo(390 / 844, 3);
  expect(exported.width * exported.height).toBeLessThanOrEqual(1500000);
  expect(exported.corner).toEqual([243, 243, 238, 255]);
  const pending = page.waitForEvent('download');
  await download.click();
  await (await pending).saveAs(`${evidence}/mobile-paper-fallback-sky.png`);
  await context.close();
});

test('reduced motion holds the intro sculpture still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  const first = await page.locator('#skyStudy').screenshot();
  await page.waitForTimeout(350);
  const second = await page.locator('#skyStudy').screenshot();
  expect(first.equals(second)).toBe(true);
});

test('resize bursts avoid duplicate buffer allocation; hide and restore release and resume resources', async ({ page }) => {
  await observeScene(page);
  await page.goto('/?debug=1');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  await page.evaluate(() => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width');
    window.bufferAllocations = 0;
    Object.defineProperty(HTMLCanvasElement.prototype, 'width', { ...descriptor, set(value) { window.bufferAllocations++; descriptor.set.call(this, value); } });
    for (let i = 0; i < 80; i++) window.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.bufferAllocations)).toBe(0);
  await page.getByRole('button', { name: 'Begin day off' }).click();
  await page.waitForTimeout(200);
  const pausedFrames = await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    return window.observedFrames;
  });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.observedFrames)).toBe(pausedFrames);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => window.observedFrames)).toBeGreaterThan(pausedFrames);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await expect(page.locator('#skyCanvas')).toHaveCount(0);
  await expect(page.locator('#canvas')).toHaveJSProperty('width', 1);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  await expect(page.locator('#skyCanvas')).toHaveCount(1);
});

test('the introductory bloom responds to drag and keyboard without starting play', async ({ page }) => {
  await observeScene(page);
  await page.goto('/');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  const art = await page.locator('#studyTurn').boundingBox();
  await page.mouse.move(art.x + art.width / 2, art.y + art.height / 2);
  await page.mouse.down();
  await page.mouse.move(art.x + art.width / 2 + 70, art.y + art.height / 2 + 20, { steps: 6 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.observedSky.studyRotation.y)).toBeGreaterThan(.5);
  const before = await page.evaluate(() => window.observedSky.studyRotation.y);
  await page.locator('#studyTurn').focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.observedSky.studyRotation.y)).toBeGreaterThan(before);
  expect(await page.evaluate(() => window.observedSky.mode)).toBe('intro');
});

test('pause freezes time and rendering, Space and Escape return to the same sky', async ({ page }) => {
  await observeScene(page);
  await page.goto('/');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  await page.getByRole('button', { name: 'Begin day off' }).click();
  await page.waitForTimeout(250);
  await page.keyboard.press('Space');
  await expect(page.locator('#pauseDialog')).toBeVisible();
  const time = await page.locator('#time').textContent();
  const frames = await page.evaluate(() => window.observedFrames);
  await page.waitForTimeout(1200);
  await expect(page.locator('#time')).toHaveText(time);
  expect(await page.evaluate(() => window.observedFrames)).toBe(frames);
  await page.keyboard.press('Escape');
  await expect(page.locator('#pauseDialog')).not.toBeVisible();
  await expect(page.locator('#canvas')).toBeFocused();
  await page.waitForTimeout(1100);
  const resumedTime = parseInt(await page.locator('#time').textContent());
  expect(resumedTime).toBeLessThan(parseInt(time));
  expect(resumedTime).toBeGreaterThanOrEqual(parseInt(time) - 2);
  await page.getByRole('button', { name: 'Pause your day off' }).click();
  await expect(page.getByRole('button', { name: 'Return to the sky' })).toBeFocused();
  await page.getByRole('button', { name: 'Return to the sky' }).click();
  await expect(page.locator('#pauseDialog')).not.toBeVisible();
});

test('result shows the actual export, rests at zero frames, and can be viewed at full size', async ({ page }) => {
  await observeScene(page);
  await page.goto('/?preview=result&debug=1');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  await expect(page.locator('#viewSky')).toBeEnabled();
  await expect(page.locator('#finalBloom')).toHaveText('4');
  const image = await page.locator('#resultPreview').evaluate(async image => { await image.decode(); return { width: image.naturalWidth, src: image.src }; });
  expect(image.width).toBe(1200);
  await expect.poll(() => page.evaluate(() => window.observedSky.connections.length)).toBeGreaterThan(0);
  await page.waitForTimeout(300);
  const frames = await page.evaluate(() => window.observedFrames);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.observedFrames)).toBe(frames);
  await page.screenshot({ path: `${evidence}/desktop-result.png` });
  await page.locator('#viewSky').click();
  await expect(page.locator('#world')).toHaveClass(/viewing/);
  await expect(page.locator('#canvas')).toBeFocused();
  await expect(page.locator('#skyCanvas')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `${evidence}/full-sky.png` });
  await page.keyboard.press('Escape');
  await expect(page.locator('#viewSky')).toBeFocused();
  await page.locator('#appearanceToggle').click();
  await expect.poll(() => page.locator('#resultPreview').getAttribute('src')).not.toBe(image.src);
  await expect(page.locator('#viewSky')).toBeEnabled();
});

test('sound defaults on after starting, plays a note, and remembers an explicit mute', async ({ page }) => {
  await observeScene(page);
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    window.audioEngines = 0;
    window.collectionNotes = 0;
    window.AudioContext = class extends Original {
      constructor(...args) { super(...args); window.audioEngines++; window.lastAudioEngine = this; }
      createOscillator() { window.collectionNotes++; return super.createOscillator(); }
    };
  });
  await page.goto('/');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
  expect(await page.evaluate(() => window.audioEngines)).toBe(0);
  await expect(page.locator('#soundToggle')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Begin day off' }).click();
  await page.waitForTimeout(300);
  const target = await page.evaluate(() => window.observedSky.particles.find(p => p.x > 30 && p.y > 100 && p.x < innerWidth - 30 && p.y < innerHeight - 90));
  await page.mouse.move(target.x, target.y);
  await expect.poll(() => page.evaluate(() => window.collectionNotes)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Turn sound off' }).click();
  await expect.poll(() => page.evaluate(() => window.lastAudioEngine.state)).toBe('closed');
  await expect(page.locator('#soundToggle')).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(page.locator('#soundToggle')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#start').click();
  expect(await page.evaluate(() => window.audioEngines)).toBe(0);
});

test('small phone and tablet layouts keep controls reachable without horizontal overflow', async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'three');
    for (const selector of ['#intro', '.topbar']) expect(await page.locator(selector).evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.locator('#start').scrollIntoViewIfNeeded();
    await expect(page.locator('#start')).toBeInViewport();
    await page.goto('/?preview=result');
    await expect(page.locator('[data-afterglow-destination="native"]')).toBeEnabled();
    const primary = await page.locator('[data-afterglow-destination="native"]').boundingBox();
    expect(primary.y + primary.height).toBeLessThan(viewport.height);
    await page.locator('#viewSky').scrollIntoViewIfNeeded();
    await expect(page.locator('#viewSky')).toBeInViewport();
    expect(await page.locator('#result').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
});
