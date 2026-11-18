import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { loggingSource } from './helpers/logging.mjs';

async function harness({ cache, fetchRates } = {}) {
  const values = new Map();
  const context = vm.createContext({
    GM_getValue: (key, fallback) => values.has(key) ? values.get(key) : fallback,
    GM_setValue: (key, value) => values.set(key, value), GM_deleteValue: key => values.delete(key),
    GM_info: { script: { version: '1.3.1' } }, fetchRates,
    // JSON hydration of the existing cache format must produce a Map.
    cache: cache ? JSON.stringify({ caches: { 'USD:CNY': cache } }) : null
  });
  const modules = await Promise.all(['settings', 'rates', 'index'].map(name =>
    readFile(new URL(`../src/conversion/${name}.js`, import.meta.url), 'utf8')));
  // Obtain the existing serializer from the conversion bundle, without starting page features.
  const serializer = modules[2].slice(modules[2].indexOf('  class Jsons {'), modules[2].indexOf('  const countyInfos'));
  vm.runInContext(await loggingSource() + '\n' + serializer + '\n' + modules[0] + '\n' + modules[1] + `
    const settings = createConversionSettings({Jsons, countyCode2Info: new Map()});
    if (cache) GM_setValue('Storage:RateCache', cache);
    const service = createRateService({storage: settings.storage, fetchRates,
      getContext: () => ({setting: {oldVersion: '1.3.1', currVersion: '1.3.1', rateCacheExpired: 3600000},
        currentCountyInfo: {currencyCode: 'USD'}, targetCountyInfo: {currencyCode: 'CNY'}})});
  `, context);
  return vm.runInContext('service', context);
}

test('rate service hydrates existing caches without making requests', async () => {
  const service = await harness({ cache: { from: 'USD', to: 'CNY', rate: 0.125, createdAt: Date.now() },
    fetchRates: () => { throw Error('unexpected request'); } });
  assert.equal(await service.getRate(), 0.125);
});

test('concurrent currency queries merge into one request and then use memory cache', async () => {
  let calls = 0;
  const service = await harness({ fetchRates: async () => { calls++; return new Map([['CNY', { USD: 0.125 }]]); } });
  assert.deepEqual(await Promise.all([service.getRate(), service.getRate()]), [0.125, 0.125]);
  assert.equal(await service.getRate(), 0.125);
  assert.equal(calls, 1);
});

test('rate refresh failures fall back to stale cache, and missing rates trip the circuit breaker', async () => {
  const stale = await harness({ cache: { from: 'USD', to: 'CNY', rate: 0.125, createdAt: 1 },
    fetchRates: async () => { throw Error('offline'); } });
  assert.equal(await stale.getRate(), 0.125);
  assert.equal(stale.isBroken, false);
  let calls = 0;
  const empty = await harness({ fetchRates: async () => { calls++; throw Error('offline'); } });
  await assert.rejects(empty.getRate(), /offline/);
  await assert.rejects(empty.getRate(), /熔断/);
  assert.equal(calls, 1);
});
