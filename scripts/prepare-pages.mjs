import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const files = [
  'index.html', 'assets/afterglow-three.js', 'assets/afterglow-garden.js',
  'assets/afterglow-three.js.LEGAL.txt', 'assets/THREE-LICENSE.txt',
  'assets/fonts/newsreader-display-latin.woff2', 'assets/fonts/NEWSREADER-OFL.txt', 'assets/fonts/README.md'
];
export const digest = data => createHash('sha256').update(data).digest('hex');

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const destination = resolve('dist');
  // Only our generated directory is replaced; the old user ZIP is never touched.
  await rm(destination, { recursive: true, force: true });
  const manifest = [];
  for (const file of files) {
    const data = await readFile(file);
    const target = resolve(destination, file);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(file, target);
    manifest.push({ file, bytes: data.length, sha256: digest(data) });
  }
  await mkdir('test-results', { recursive: true });
  await writeFile('test-results/pages-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Prepared ${files.length} public files (${manifest.reduce((n, file) => n + file.bytes, 0)} bytes) in dist/`);
}
