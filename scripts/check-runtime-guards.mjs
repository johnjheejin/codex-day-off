import fs from 'node:fs';
import { boundedDpr } from '../src/frame-budget.js';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

if (!script) throw new Error('Inline application script was not found.');
new Function(script);

const required = [
  ['touch hardware detection', "matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0"],
  ['mobile pixel budget', 'const mobilePixelBudget = 1500000'],
  ['desktop pixel budget', 'const desktopPixelBudget = 3200000'],
  ['resize debounce', 'setTimeout(() => resize(), 180)'],
  ['same-size resize guard', 'nextWidth === width && nextHeight === height'],
  ['measured frame budget', 'frameBudget?.targetFps ?? 60'],
  ['Canvas fallback', 'function useCanvasFallback'],
  ['single active drawing buffer', 'canvas.width = skyRenderer ? 1'],
  ['background idle scheduling', "else if (mode === 'intro' && !reducedMotion) idleTimer = setTimeout"],
  ['scene control', 'id="appearanceToggle"'],
  ['night scene label', '🌙 Night Sky'],
  ['paper scene label', '☀️ Paper Sky'],
  ['mobile result scrolling', 'touch-action: pan-y'],
  ['result scroll reset', 'result.scrollTop = 0'],
  ['direct result preview', "previewMode === 'result'"],
  ['night intro surface', 'background: var(--night)'],
  ['scene transition budget', 'background 320ms cubic-bezier(.16, 1, .3, 1)'],
  ['topbar transition budget', 'border-color 320ms cubic-bezier(.16, 1, .3, 1)'],
  ['browser recolor guard', 'color-scheme: only light'],
  ['page-exit resource release', "addEventListener('pagehide'"],
  ['handoff visibility resilience guard', 'function ensureAfterglowHandoffVisible'],
];

for (const [label, needle] of required) {
  if (!html.includes(needle)) throw new Error(`Missing runtime guard: ${label}`);
}

const resultMarkup = html.match(/<section id="result"[\s\S]*?(?=<dialog id="afterglowHandoffDialog")/)?.[0] || '';
const css = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] || '';
const genericShareHook = /(?:class|id|data-[\w-]+)=["'][^"']*share/i;
const genericShareSelector = /[.#][\w-]*share[\w-]*/i;
if (genericShareHook.test(html)
  || genericShareSelector.test(css)
  || html.includes('[data-share')
  || html.includes('dataset.share')) {
  throw new Error('Generic share-named DOM hooks can trigger cosmetic social filters.');
}

const destinations = [...resultMarkup.matchAll(/data-afterglow-destination="([^"]+)"/g)].map(match => match[1]);
const expectedDestinations = ['native', 'download', 'linkedin', 'x', 'telegram', 'kakao'];
if (destinations.length !== expectedDestinations.length
  || expectedDestinations.some((destination, index) => destinations[index] !== destination)) {
  throw new Error(`Expected six Afterglow handoff destinations, found: ${destinations.join(', ')}`);
}
if (!resultMarkup.includes('<section class="afterglow-handoff" aria-labelledby="afterglowHandoffTitle">')) {
  throw new Error('The Afterglow handoff must remain a labelled semantic section.');
}
if (resultMarkup.indexOf('class="afterglow-handoff"') > resultMarkup.indexOf('class="result-meta"')) {
  throw new Error('The mobile-first handoff section must precede result metadata in the result flow.');
}

for (const forbidden of ['feTurbulence', 'mix-blend-mode: multiply']) {
  if (html.includes(forbidden)) throw new Error(`Forbidden full-screen effect returned: ${forbidden}`);
}

const profiles = [
  { name: 'Galaxy S24 mobile approximation', width: 360, height: 780, deviceDpr: 3, touch: true, budget: 1_500_000, targetFps: 60 },
  { name: 'Galaxy S24 desktop-site approximation', width: 980, height: 2123, deviceDpr: 3, touch: true, budget: 1_500_000, targetFps: 60 },
  { name: 'Desktop 1280×720', width: 1280, height: 720, deviceDpr: 2, touch: false, budget: 3_200_000, targetFps: 60 },
  { name: '8K display', width: 7680, height: 4320, deviceDpr: 2, touch: false, budget: 3_200_000, targetFps: 60 },
];

for (const profile of profiles) {
  const dpr = boundedDpr(profile.width, profile.height, profile.deviceDpr, profile.touch);
  const pixels = Math.floor(profile.width * dpr) * Math.floor(profile.height * dpr);
  if (pixels > profile.budget * 1.01) {
    throw new Error(`${profile.name} exceeds pixel budget: ${pixels} > ${profile.budget}`);
  }
  console.log(`${profile.name}: ${profile.targetFps}fps, ${dpr.toFixed(2)}× DPR, ${pixels.toLocaleString()} pixels`);
}

console.log('Runtime guard checks passed.');
