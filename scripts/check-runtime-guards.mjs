import fs from 'node:fs';

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
  ['mobile target fps', "mobilePerformance ? (width > 760 ? 30 : 45) : 60"],
  ['scene control', 'id="appearanceToggle"'],
  ['night scene label', '🌙 Night Sky'],
  ['paper scene label', '☀️ Paper Sky'],
  ['mobile result scrolling', 'touch-action: pan-y'],
  ['result scroll reset', 'result.scrollTop = 0'],
  ['browser recolor guard', 'color-scheme: only light'],
  ['page-exit resource release', "addEventListener('pagehide'"],
];

for (const [label, needle] of required) {
  if (!html.includes(needle)) throw new Error(`Missing runtime guard: ${label}`);
}

const resultMarkup = html.match(/<section id="result"[\s\S]*?<\/section>/)?.[0] || '';
const shareButtonCount = (resultMarkup.match(/data-share=/g) || []).length;
if (shareButtonCount !== 6) throw new Error(`Expected 6 share destinations, found ${shareButtonCount}.`);
if (resultMarkup.indexOf('class="share-panel"') > resultMarkup.indexOf('class="result-meta"')) {
  throw new Error('The mobile-first share panel must precede result metadata in the result flow.');
}

for (const forbidden of ['feTurbulence', 'mix-blend-mode: multiply']) {
  if (html.includes(forbidden)) throw new Error(`Forbidden full-screen effect returned: ${forbidden}`);
}

function chooseDpr({ width, height, deviceDpr, touch }) {
  const budget = touch ? 1_500_000 : 3_200_000;
  const cap = touch ? 1 : 1.5;
  return Math.max(.75, Math.min(deviceDpr, cap, Math.sqrt(budget / (width * height))));
}

const profiles = [
  { name: 'Galaxy S24 mobile approximation', width: 360, height: 780, deviceDpr: 3, touch: true, budget: 1_500_000, targetFps: 45 },
  { name: 'Galaxy S24 desktop-site approximation', width: 980, height: 2123, deviceDpr: 3, touch: true, budget: 1_500_000, targetFps: 30 },
  { name: 'Desktop 1280×720', width: 1280, height: 720, deviceDpr: 2, touch: false, budget: 3_200_000, targetFps: 60 },
];

for (const profile of profiles) {
  const dpr = chooseDpr(profile);
  const pixels = Math.round(profile.width * dpr) * Math.round(profile.height * dpr);
  if (pixels > profile.budget * 1.01) {
    throw new Error(`${profile.name} exceeds pixel budget: ${pixels} > ${profile.budget}`);
  }
  console.log(`${profile.name}: ${profile.targetFps}fps, ${dpr.toFixed(2)}× DPR, ${pixels.toLocaleString()} pixels`);
}

console.log('Runtime guard checks passed.');
