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

test('friend comment tool is included and requires explicit confirmation', async () => {
  const source = await readFile(new URL('../src/friend-tools.js', import.meta.url), 'utf8');
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(source, /window\.confirm\(/);
  assert.match(source, /setTimeout\(resolve, 4000\)/);
  assert.match(source, /for \(let index = 0; index < friends\.length; index\+\+\)/);
  assert.match(source, /status\.setAttribute\('aria-live', 'polite'\)/);
  assert.match(source, /finally \{\s*send\.disabled = false;/);
  assert.match(source, /\/comment\/Profile\/post\//);
  assert.match(source, /renderFriends\(\)/);
  assert.match(source, /checkbox\.type = 'checkbox'/);
  assert.doesNotMatch(source, /backgroundIMG|setBackgroundImg/);
  assert.match(source, /GM_setValue\(GROUP_STORAGE_KEY, groups\)/);
  assert.match(source, /removeFromGroup\.addEventListener/);
  assert.match(source, /deleteGroup\.addEventListener/);
  assert.match(source, /已加载好友/);
  assert.match(source, /在线好友/);
  assert.match(source, /new MutationObserver/);
  assert.match(main, /initializeFriendTools\(\)/);
});
