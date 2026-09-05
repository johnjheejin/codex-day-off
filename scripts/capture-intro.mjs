import { chromium } from '@playwright/test';
import fs from 'node:fs';

const folder = 'assets/verification/2026-09-06-intro';
fs.mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta' });
const records = [];
try {
  for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'mobile', width: 390, height: 844 }, { name: 'small', width: 320, height: 568 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: viewport.width < 800, isMobile: viewport.width < 800 });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:8000/');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#world.three-ready').waitFor();
    for (const scene of ['night', 'paper']) {
      if (scene === 'paper') await page.locator('#appearanceToggle').click();
      await page.screenshot({ path: `${folder}/${viewport.name}-${scene}.png`, animations: 'disabled' });
    }
    records.push(await page.evaluate(name => {
      const intro = document.querySelector('#intro'), start = document.querySelector('#start').getBoundingClientRect();
      return { name, fontLoaded: document.fonts.check('100px "Afterglow Newsreader"'), overflows: intro.scrollWidth > intro.clientWidth, startBottom: start.bottom, viewportHeight: innerHeight,
        headline: [...document.querySelectorAll('h1 span:not(:has(span))')].map(el => { const r = document.createRange(); r.selectNodeContents(el); const b = r.getBoundingClientRect(); return { text: el.textContent, left: b.left, right: b.right, top: b.top, bottom: b.bottom }; }) };
    }, viewport.name));
    if (viewport.name === 'mobile') {
      await page.route('**/assets/fonts/*.woff2', route => route.abort());
      await page.reload();
      await page.locator('#world.three-ready').waitFor();
      await page.screenshot({ path: `${folder}/mobile-font-fallback.png`, animations: 'disabled' });
      records.push(await page.evaluate(() => ({ name: 'mobile-font-fallback', overflows: document.querySelector('#intro').scrollWidth > document.querySelector('#intro').clientWidth, buttonWidth: document.querySelector('#start').getBoundingClientRect().width })));
    }
    await context.close();
  }
  fs.writeFileSync(`${folder}/layout.json`, JSON.stringify(records, null, 2) + '\n');
  console.log(JSON.stringify(records, null, 2));
} finally { await browser.close(); }
