import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const beta = '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || (existsSync(beta) ? beta : undefined) });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const [name, width, height] of [['social-card', 1200, 630], ['apple-touch-icon', 180, 180]]) {
    await page.setViewportSize({ width, height });
    const source = await readFile(`assets/brand/${name}.svg`, 'utf8');
    await page.setContent(`<style>html,body{margin:0;overflow:hidden}svg{display:block;width:100vw;height:100vh}</style>${source}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `assets/brand/${name}.png`, animations: 'disabled' });
  }
} finally { await browser.close(); }
