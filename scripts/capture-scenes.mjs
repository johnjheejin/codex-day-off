import { chromium } from '@playwright/test';
import fs from 'node:fs';

const folder = 'assets/verification/2026-09-06-scenes';
fs.mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta' });
const records = [];
try {
  for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'mobile', width: 390, height: 844 }, { name: 'small', width: 320, height: 568 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: viewport.width < 800, isMobile: viewport.width < 800 });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:8000/?preview=result');
    await page.locator('#viewSky:not(:disabled)').waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (const scene of ['night', 'paper']) {
      if (scene === 'paper') {
        await page.locator('#appearanceToggle').click();
        await page.locator('#viewSky:not(:disabled)').waitFor();
      }
      await page.screenshot({ path: `${folder}/${viewport.name}-${scene}-result.png`, animations: 'disabled' });
      records.push(await page.evaluate(({ name, scene }) => {
        const result = document.querySelector('#result');
        const rect = document.querySelector('[data-afterglow-destination="native"]').getBoundingClientRect();
        return { name, scene, resultOverflows: result.scrollWidth > result.clientWidth, primaryBottom: rect.bottom, height: innerHeight };
      }, { name: viewport.name, scene }));
      await page.locator('[data-afterglow-destination="linkedin"]').click();
      await page.screenshot({ path: `${folder}/${viewport.name}-${scene}-guide.png`, animations: 'disabled' });
      records.push(await page.locator('#afterglowHandoffDialog').evaluate((dialog, name) => ({ name, dialogOverflows: dialog.scrollWidth > dialog.clientWidth, dialogHeight: dialog.clientHeight, contentHeight: dialog.scrollHeight }), viewport.name));
      await page.keyboard.press('Escape');
      await page.locator('#result').evaluate(el => { el.scrollTop = 0; });
    }
    const download = page.waitForEvent('download');
    await page.locator('[data-afterglow-destination="download"]').click();
    await (await download).saveAs(`${folder}/${viewport.name}-paper-sky.png`);
    await page.goto('http://127.0.0.1:8000/');
    await page.getByRole('button', { name: 'Begin day off' }).click();
    await page.mouse.move(viewport.width * .6, viewport.height * .4);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${folder}/${viewport.name}-paper-play.png`, animations: 'disabled' });
    await page.getByRole('button', { name: 'Pause your day off' }).click();
    await page.screenshot({ path: `${folder}/${viewport.name}-paper-pause.png`, animations: 'disabled' });
    await page.keyboard.press('Escape');
    await page.locator('#appearanceToggle').click();
    await page.getByRole('button', { name: 'Pause your day off' }).click();
    await page.screenshot({ path: `${folder}/${viewport.name}-night-pause.png`, animations: 'disabled' });
    await context.close();
  }
  fs.writeFileSync(`${folder}/layout.json`, JSON.stringify(records, null, 2) + '\n');
  console.log(JSON.stringify(records, null, 2));
} finally { await browser.close(); }
