import { readFile, mkdir, writeFile } from 'node:fs/promises';

const original = await readFile('Steam Store Enhancer.user.js', 'utf8');
const lines = original.replace(/\r\n/g, '\n').split('\n');
await mkdir('src', { recursive: true });
const sections = {
  'metadata.txt': [1, 29],
  'config.js': [34, 93],
  'styles.js': [95, 147],
  'settings.js': [149, 276],
  'regional-prices.js': [278, 800],
  'conversion.js': [808, 1924],
  'family-library.js': [1938, 2269],
  'cart-tools.js': [2271, 2667]
};
for (const [name, [start, end]] of Object.entries(sections)) {
  await writeFile('src/' + name, lines.slice(start - 1, end).join('\n') + '\n');
}
