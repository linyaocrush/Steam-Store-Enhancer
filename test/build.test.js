import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { build, sources } from '../scripts/build.mjs';

test('installable userscript is generated from all source modules', async () => {
  const generated = await build();
  const checkedIn = await readFile(new URL('../Steam Store Enhancer.user.js', import.meta.url), 'utf8');
  assert.equal(generated, checkedIn.replace(/\r\n/g, '\n'));
  for (const source of sources) assert.ok(generated.includes(`// ---- ${source} ----`));
});

test('shared session and DOM helpers are used by feature modules', async () => {
  const shared = await readFile(new URL('../src/shared.js', import.meta.url), 'utf8');
  const family = await readFile(new URL('../src/family-library.js', import.meta.url), 'utf8');
  const cart = await readFile(new URL('../src/cart-tools.js', import.meta.url), 'utf8');
  assert.match(shared, /function readStoreSession/);
  assert.match(shared, /function createElement/);
  assert.match(family, /readStoreSession\(document, page\)/);
  assert.match(family, /createElement\('div', undefined, 'sse-family-window'\)/);
  assert.doesNotMatch(family, /\bnode\(/);
  assert.match(cart, /readStoreSession\(doc, globals\)/);
});
