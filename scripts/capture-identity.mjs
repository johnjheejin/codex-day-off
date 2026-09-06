import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const base = process.env.AFTERGLOW_BASE_URL || 'http://127.0.0.1:8000';
const folder = 'assets/verification/2026-09-06-identity';
await mkdir(folder, { recursive: true });
const beta = '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || (existsSync(beta) ? beta : undefined) });
const records = [];
try {
  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['small', 320, 568]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: width < 760, isMobile: width < 760 });
    const page = await context.newPage();
    const capture = async suffix => {
      await page.mouse.move(5, 5);
      await page.screenshot({ path: `${folder}/${name}-${suffix}.png` });
    };
    await page.goto(base);
    await page.locator('#world.three-ready').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#appearanceToggle').click();
    await page.waitForTimeout(500);
    await capture('intro');
    const brand = await page.locator('#homeButton').boundingBox();
    const actions = await page.locator('.topbar-actions').boundingBox();
    if (brand.x + brand.width > actions.x) throw new Error(`${name}: brand overlaps controls`);
    records.push({ name, width, height, brand, actions });
    await page.goto(`${base}/?preview=result`);
    await page.locator('#viewSky:not([disabled])').waitFor({ state: 'attached' });
    if (name === 'desktop') {
      await page.locator('#skyOrbit').click(); await page.locator('#canvas').focus();
      for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
    }
    await page.waitForTimeout(500);
    await capture('live');
    await page.locator('#skyKeep').click();
    await page.waitForTimeout(500);
    await capture('share');
    const download = page.waitForEvent('download');
    await page.locator('[data-afterglow-destination="download"]').click();
    await (await download).saveAs(`${folder}/${name}-saved.png`);
    await page.locator('#toast.show').waitFor({ state: 'hidden' });
    await page.keyboard.press('Escape');
    await page.locator('#appearanceToggle').click();
    await page.waitForTimeout(500);
    await capture('night');
    if (name === 'small') {
      await page.locator('#homeButton').click();
      await page.waitForTimeout(600);
      await capture('return');
    }
    await context.close();
  }
  await writeFile(`${folder}/layout.json`, JSON.stringify({ base, checkedAt: new Date().toISOString(), records }, null, 2) + '\n');
} finally { await browser.close(); }
