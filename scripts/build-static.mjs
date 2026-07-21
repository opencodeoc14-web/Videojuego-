import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const files = [
  'index.html',
  'manifest.webmanifest',
  'app-icon.svg',
  'sw.js',
  'src/styles.css',
  'web/characters.js',
  'web/audio.js',
  'web/effects.js',
  'web/track.js',
  'web/features.js',
  'web/kart.js',
  'web/ui.js',
  'web/game.js',
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const relativePath of files) {
  const destination = resolve(dist, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await cp(resolve(root, relativePath), destination);
}
await cp(resolve(root, 'index.html'), resolve(dist, '404.html'));
console.log(`Static build ready: ${dist}`);
