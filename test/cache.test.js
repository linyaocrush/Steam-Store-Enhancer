import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

test('menu cache clearing removes all persistent caches, retains settings and user data, then reloads', async () => {
  const values = new Map([
    ['sse_restrictions_database_v1', {}], ['sse_restrictions_steam_v1', {}],
    ['sse_restrictions_steam_requests_v1', {}], ['sse_family_cache_v1', {}], ['Storage:RateCache', {}],
    ['Storage:Setting', { test: true }], ['sse_log_level', 'debug'],
    ['sse_friend_groups_123', { friends: [] }], ['fac_cart', '10']
  ]);
  let reloaded = false;
  const context = vm.createContext({
    GM_deleteValue: key => values.delete(key),
    diagnostics: { scope: () => ({ info() {} }) },
    location: { reload() { reloaded = true; } }
  });
  vm.runInContext(await readFile(new URL('../src/cache.js', import.meta.url), 'utf8') + '\nclearScriptCaches();', context);
  assert.deepEqual([...values.keys()], ['Storage:Setting', 'sse_log_level', 'sse_friend_groups_123', 'fac_cart']);
  assert.equal(reloaded, true);
});
