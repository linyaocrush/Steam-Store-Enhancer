import assert from 'node:assert/strict';
import test from 'node:test';
import { harness, settle } from './helpers/runtime.mjs';

test('malformed session JSON falls back independently and account IDs yield exact SteamIDs', async () => {
  const { context } = await harness();
  const doc = { querySelector: () => ({ getAttribute: key => ({ 'data-config': '{broken', 'data-store_user_config': '[]', 'data-userinfo': 'null' })[key] }) };
  const result = context.readStoreSession(doc, { Config: { COUNTRY_CODE: 'cn' }, g_AccountID: 39734273,
    SSR: { loaderData: ['invalid', JSON.stringify({ strWebAPIToken: 'private' })] } });
  assert.equal(result.steamid, String(76561197960265728n + 39734273n));
  assert.equal(result.token, 'private');
  assert.equal(result.country, 'CN');
});

test('item references normalize package aliases and reject ambiguous IDs', async () => {
  const { context } = await harness();
  assert.equal(context.itemKey(context.itemRef('sub', '0010')), 'package:10');
  assert.equal(context.itemField({ type: 'sub', id: 10 }), 'packageid');
  for (const id of [0, -1, '1,2', 'text', Number.MAX_SAFE_INTEGER + 1]) assert.equal(context.itemRef('app', id), null);
  assert.equal(context.itemRef('unknown', 10), null);
  assert.equal(context.itemFromLink('/bundle/42/').type, 'bundle');
});

test('shared identification uses the actual card and does not inherit another app from the page', async () => {
  const { context } = await harness();
  context.location.pathname = '/app/999/';
  const link = { getAttribute: () => '/app/10/' };
  const card = { closest: () => null, querySelectorAll: () => [link] };
  assert.equal(context.inferItemFromScope(card).id, '10');
  card.querySelectorAll = () => [link, { getAttribute: () => '/app/20/' }];
  assert.equal(context.inferItemFromScope(card), null);
  card.querySelectorAll = () => [];
  assert.equal(context.inferItemFromScope(card), null);
  const holder = { getAttribute: key => key === 'data-ds-appid' ? '10,20' : null };
  card.closest = selector => selector.includes('[data-ds-appid]') ? holder : null;
  assert.equal(context.inferItemFromScope(card), null);
});

test('invalid purchase prices and cart payloads fail validation before rendering or writing', async () => {
  const { context } = await harness();
  assert.throws(() => context.validateStoreItems({ response: {} }), /商品列表/);
  assert.throws(() => context.validateStoreItems({ response: { store_items: [{ best_purchase_option: { packageid: 1, final_price_in_cents: 'NaN' } }] } }), /价格/);
  assert.throws(() => context.validateCartResponse({ response: {} }, 'GetCart'), /项目列表/);
  assert.throws(() => context.validateCartResponse({ response: { cart: { line_items: [{ packageid: 1 }] } } }, 'GetCart'), /项目/);
  assert.equal(context.validateCartResponse({ response: { cart: { line_items: [] } } }, 'GetCart').cart.line_items.length, 0);
});

test('async cache merges pending work, bounds settled entries and retries failed or missing data', async () => {
  const { context } = await harness();
  let now = 1, count = 0;
  const cache = context.createAsyncCache({ now: () => now, maxEntries: 2, ttl: 100, missingTtl: 10, retryDelay: 5,
    load: async key => { count++; if (key === 'bad' && count === 1) throw Error('offline'); return key === 'missing' ? null : key; } });
  const first = cache.get('bad');
  assert.equal(first, cache.get('bad'));
  await assert.rejects(first, /offline/);
  await assert.rejects(cache.get('bad'), /offline/);
  assert.equal(count, 1);
  now += 5;
  assert.equal(await cache.get('bad'), 'bad');
  assert.equal(await cache.get('missing'), null);
  const afterMissing = count;
  await cache.get('missing');
  assert.equal(count, afterMissing);
  now += 10;
  await cache.get('missing');
  assert.equal(count, afterMissing + 1);
  await cache.get('next');
  await settle();
  assert.ok(cache.size <= 2);
});
