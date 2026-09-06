import { readFile, writeFile } from 'node:fs/promises';
import { Matrix4, Euler, Vector3 } from 'three';
import { flowerVertices } from '../src/garden-motion.js';

const brand = JSON.parse(await readFile('assets/brand/identity.json', 'utf8'));
const mark = brand.markPaths.map(path => `<path d="${path.d}" ${path.fill ? 'fill="currentColor"' : `fill="none" stroke="currentColor" stroke-width="${path.strokeWidth}" stroke-linejoin="round" stroke-linecap="round"`}/>`).join('');
const word = `<path d="${brand.wordmarkPath}" fill="currentColor"/>`;
const wordWidth = brand.wordmarkViewBox[2];
const svg = (viewBox, body, color = '#11110f') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" style="color:${color}">${body}</svg>\n`;
const lockup = `<g transform="translate(0 6) scale(1.08)">${mark}</g><g transform="translate(52 0)">${word}</g>`;
for (const [file, source] of Object.entries({
  'mark.svg': svg('0 0 36 36', mark),
  'wordmark.svg': svg(brand.wordmarkViewBox.join(' '), word),
  'afterglow.svg': svg(`0 0 ${wordWidth + 52} 49`, lockup),
  'afterglow-night.svg': svg(`0 0 ${wordWidth + 52} 49`, lockup, '#f4f4ef'),
  'favicon.svg': svg('0 0 48 48', `<rect width="48" height="48" rx="11" fill="#f3f3ee"/><g transform="translate(6 6)">${mark}</g>`),
  'apple-touch-icon.svg': svg('0 0 180 180', `<rect width="180" height="180" fill="#f3f3ee"/><g transform="translate(36 32) scale(3)">${mark}</g>`)
})) await writeFile(`assets/brand/${file}`, source);

const header = `<svg class="brand-symbol" viewBox="0 0 36 36" aria-hidden="true">${mark}</svg>
        <span class="brand-copy"><svg class="brand-wordmark" viewBox="${brand.wordmarkViewBox.join(' ')}" aria-hidden="true">${word}</svg><span class="brand-desc">Codex’s Day Off</span></span>`;
let html = await readFile('index.html', 'utf8');
if (!html.includes('<!-- identity:start -->')) throw new Error('Missing header identity marker');
html = html.replace(/<!-- identity:start -->[\s\S]*?<!-- identity:end -->/, `<!-- identity:start -->\n        ${header}\n        <!-- identity:end -->`);
await writeFile('index.html', html);

const points = flowerVertices(9, 4, 48);
const matrix = new Matrix4().makeRotationFromEuler(new Euler(.7, -.52, .25));
const paths = Array.from({ length: 4 }, () => []);
for (let i = 0; i < points.length; i += 6) {
  const a = new Vector3().fromArray(points, i).multiplyScalar(106).applyMatrix4(matrix);
  const b = new Vector3().fromArray(points, i + 3).multiplyScalar(106).applyMatrix4(matrix);
  paths[Math.floor(i / (48 * 6)) % 4].push(`M${(896 + a.x).toFixed(1)} ${(280 + a.y).toFixed(1)}L${(896 + b.x).toFixed(1)} ${(280 + b.y).toFixed(1)}`);
}
const petals = paths.map((path, i) => `<path d="${path.join('')}" stroke="${['#5b8def', '#3aa981', '#f3a712', '#ff6f61'][i]}" stroke-width="1" opacity=".68"/>`).join('');
const cover = svg('0 0 1200 630', `<rect width="1200" height="630" fill="#f3f3ee"/>
<path d="M48 48H1152V582H48Z" stroke="#11110f" opacity=".14"/>
<g fill="#6f6f69" font-family="Arial,sans-serif" font-size="12" letter-spacing="2"><text x="80" y="90">CODEX’S DAY OFF</text><text x="1120" y="90" text-anchor="end">A MOMENT, KEPT.</text></g>
<g transform="translate(80 231) scale(1.5)">${lockup}</g>
<text x="82" y="342" fill="#3e3e39" font-family="Arial,sans-serif" font-size="20">Close the tabs. Open the sky.</text>
${petals}<circle cx="896" cy="280" r="2.2" fill="#11110f"/>
<path d="M80 510H1120" stroke="#11110f" opacity=".14"/>
<text x="80" y="550" fill="#3e3e39" font-family="Arial,sans-serif" font-size="15">Thirty seconds to make a sky. All the time to stay.</text>
<text x="1120" y="550" fill="#6f6f69" font-family="Arial,sans-serif" font-size="13" text-anchor="end">dayoff.tmcowork.com</text>`);
await writeFile('assets/brand/social-card.svg', cover);
console.log('Built identity SVGs and inline header from assets/brand/identity.json.');
