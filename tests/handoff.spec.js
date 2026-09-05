import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/?preview=result');
  await expect(page.locator('[data-afterglow-destination="native"]')).toBeEnabled();
}

test('unsupported image sharing explains the handoff before downloading or copying', async ({ page }) => {
  await page.addInitScript(() => {
    window.nativeCalls = 0;
    Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { window.nativeCalls++; } });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedCaption = text; } } });
  });
  const downloads = [];
  page.on('download', item => downloads.push(item));
  await ready(page);
  await page.getByRole('button', { name: 'Share image', exact: true }).click();
  await expect(page.locator('#afterglowHandoffDialog')).toBeVisible();
  await expect(page.locator('#afterglowHandoffDialogTitle')).toBeFocused();
  await expect(page.locator('#afterglowHandoffDialogCopy')).toContainText('cannot send your image directly');
  expect(downloads).toHaveLength(0);
  expect(await page.evaluate(() => window.nativeCalls)).toBe(0);
  expect(await page.evaluate(() => window.copiedCaption)).toBeUndefined();
  const download = page.waitForEvent('download');
  await page.locator('#afterglowHandoffDialogContinue').click();
  await download;
  await expect(page.locator('#afterglowHandoffDialog')).not.toBeVisible();
  expect(await page.evaluate(() => window.copiedCaption)).toBe(await page.locator('#afterglowCaption').inputValue());
  await expect(page.locator('#toast')).toHaveText('PNG downloaded. Caption and link copied.');
});

test('native image sharing always includes the PNG and cancellation stays quiet', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: data => data.files?.[0]?.type === 'image/png' });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async data => {
      window.nativePayload = { text: data.text, type: data.files[0].type, size: data.files[0].size };
      throw new DOMException('Cancelled', 'AbortError');
    } });
  });
  await ready(page);
  await page.getByRole('button', { name: 'Share image', exact: true }).click();
  const payload = await page.evaluate(() => window.nativePayload);
  expect(payload.type).toBe('image/png');
  expect(payload.size).toBeGreaterThan(1000);
  expect(payload.text).toContain('https://dayoff.tmcowork.com');
  await expect(page.locator('#afterglowHandoffDialog')).not.toBeVisible();
  await expect(page.locator('#toast')).not.toHaveClass(/show/);
});

test('clipboard failure keeps a selectable caption visible and never claims it was copied', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new DOMException('Denied', 'NotAllowedError'); } } });
    document.execCommand = () => false;
  });
  await ready(page);
  await page.getByRole('button', { name: 'Send with KakaoTalk' }).click();
  await expect(page.locator('#afterglowHandoffDialogCopy')).toContainText('attach it in your chat');
  const download = page.waitForEvent('download');
  await page.locator('#afterglowHandoffDialogContinue').click();
  await download;
  await expect(page.locator('#afterglowDialogCaption')).toBeFocused();
  expect(await page.locator('#afterglowDialogCaption').evaluate(field => field.selectionEnd - field.selectionStart)).toBeGreaterThan(50);
  await expect(page.locator('#toast')).toHaveText('PNG downloaded. Copy the caption manually below.');
  await expect(page.locator('#afterglowHandoffDialog .caption-status')).toContainText('Copy did not work');
  // Legacy copying must place its temporary field inside the modal's active tree.
  await page.evaluate(() => {
    document.execCommand = () => document.activeElement?.parentElement === document.querySelector('#afterglowHandoffDialog');
  });
  await page.locator('#afterglowHandoffDialog [data-afterglow-copy]').click();
  await expect(page.locator('#afterglowHandoffDialog .caption-status')).toHaveText('Caption and link copied.');
  await page.getByRole('button', { name: 'Not now', exact: true }).click();
  await expect(page.locator('#afterglowHandoffDialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Send with KakaoTalk' })).toBeFocused();
});

test('external app guides keep the image manual and only open after the review step', async ({ page }) => {
  await page.addInitScript(() => {
    window.openedTargets = [];
    window.open = () => ({ opener: window, location: { set href(value) { window.openedTargets.push(value); } } });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } });
  });
  await ready(page);
  for (const [network, domain] of [['linkedin', 'linkedin.com'], ['x', 'twitter.com'], ['telegram', 't.me']]) {
    await page.locator(`[data-afterglow-destination="${network}"]`).click();
    await expect(page.locator('#handoffSteps li')).toHaveCount(3);
    await expect(page.locator('#afterglowHandoffPreviewNote')).toContainText('1200 × 630 PNG');
    const before = await page.evaluate(() => window.openedTargets.length);
    const download = page.waitForEvent('download');
    await page.locator('#afterglowHandoffDialogContinue').click();
    await download;
    await expect(page.locator('#afterglowHandoffDialog')).not.toBeVisible();
    const targets = await page.evaluate(() => window.openedTargets);
    expect(targets).toHaveLength(before + 1);
    expect(new URL(targets.at(-1)).hostname).toContain(domain);
  }
});

test('a blocked destination tab leaves the guide available without triggering a download', async ({ page }) => {
  await page.addInitScript(() => { window.open = () => null; });
  let downloads = 0;
  page.on('download', () => downloads++);
  await ready(page);
  await page.getByRole('button', { name: 'Post to LinkedIn' }).click();
  await page.locator('#afterglowHandoffDialogContinue').click();
  await expect(page.locator('#afterglowHandoffDialog')).toBeVisible();
  await expect(page.locator('#toast')).toContainText('blocked');
  expect(downloads).toBe(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Post to LinkedIn' })).toBeFocused();
});
