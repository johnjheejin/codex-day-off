import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { files, digest } from './prepare-pages.mjs';

// Remove only the two observed Cloudflare additions. Unknown modifications fail verification.
const cloudflareLoader = new RegExp("<script>\\(function\\(\\)\\{function\\ c\\(\\)\\{var\\ b=a\\.contentDocument\\|\\|\\(a\\.contentWindow\\&\\&a\\.contentWindow\\.document\\);if\\(b\\)\\{var\\ d=b\\.createElement\\('script'\\);d\\.innerHTML=\"window\\.__CF\\$cv\\$params=\\{r:'[a-zA-Z0-9]+',t:'[a-zA-Z0-9=]+'\\};var\\ a=document\\.createElement\\('script'\\);a\\.src='/cdn\\-cgi/challenge\\-platform/scripts/jsd/main\\.js';document\\.getElementsByTagName\\('head'\\)\\[0\\]\\.appendChild\\(a\\);\";b\\.getElementsByTagName\\('head'\\)\\[0\\]\\.appendChild\\(d\\)\\}\\}if\\(document\\.body\\)\\{var\\ a=document\\.createElement\\('iframe'\\);a\\.height=1;a\\.width=1;a\\.style\\.position='absolute';a\\.style\\.top=0;a\\.style\\.left=0;a\\.style\\.border='none';a\\.style\\.visibility='hidden';document\\.body\\.appendChild\\(a\\);if\\('loading'!==document\\.readyState\\)c\\(\\);else\\ if\\(window\\.addEventListener\\)document\\.addEventListener\\('DOMContentLoaded',c\\);else\\{var\\ e=document\\.onreadystatechange\\|\\|function\\(\\)\\{\\};document\\.onreadystatechange=function\\(b\\)\\{e\\(b\\);'loading'!==document\\.readyState\\&\\&\\(document\\.onreadystatechange=e,c\\(\\)\\)\\}\\}\\}\\}\\)\\(\\);</script>");
export const normalizeHTML = html => html
  .replace(/(?<=<body>)<a href="(?:https:\/\/dayoff\.tmcowork\.com)?\/cdn-cgi\/content\?id=[^"<>]+" aria-hidden="true" rel="nofollow noopener" style="display: none !important; visibility: hidden !important"><\/a>/, '')
  .replace(cloudflareLoader, '');

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
const base = process.argv[2];
if (!base || new URL(base).protocol !== 'https:') throw new Error('Pass the HTTPS deployment URL.');
let last;
for (let attempt = 0; attempt < 12; attempt++) {
  const results = await Promise.all(files.map(async file => {
    try {
    const response = await fetch(new URL(file === 'index.html' ? '/' : file, base), { signal: AbortSignal.timeout(20000) });
    const actual = Buffer.from(await response.arrayBuffer());
    const expected = await readFile(file);
    const normalized = file === 'index.html' ? Buffer.from(normalizeHTML(actual.toString())) : actual;
    return { file, status: response.status, expected: digest(expected), actual: digest(actual), normalized: digest(normalized), matches: response.ok && digest(expected) === digest(normalized) };
    } catch (error) { return { file, matches: false, error: error.name }; }
  }));
  last = results;
  if (results.every(file => file.matches)) {
    await mkdir('test-results', { recursive: true });
    await writeFile('test-results/deployment-integrity.json', JSON.stringify({ base, checkedAt: new Date().toISOString(), files: results }, null, 2) + '\n');
    console.log(`Verified all ${results.length} files at ${base}`);
    process.exit(0);
  }
  console.log(`Waiting for deployment (${attempt + 1}/12): ${results.filter(file => !file.matches).map(file => file.file).join(', ')}`);
  await new Promise(resolve => setTimeout(resolve, 10000));
}
console.error(JSON.stringify(last, null, 2));
process.exit(1);

}
