import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { harness, settle } from './helpers/runtime.mjs';

test('wishlist retries without DOM changes, deduplicates pending apps and continues after a failed batch', async () => {
  const calls = [];
  const mounted = [];
  const { context, time, document, observers } = await harness(['wishlist-sale.js'], {
    isWishlistPage: () => true,
    readStoreSession: () => ({ country: 'US', language: 'english' }),
    requestQueue: { enqueue: task => Promise.resolve().then(task) },
    gmGet: async url => {
      const ids = JSON.parse(new URL(url).searchParams.get('input_json')).ids.map(item => item.appid);
      calls.push(ids);
      if (calls.length === 1) throw Error('offline');
      return JSON.stringify({ response: { store_items: ids.map(appid => ({ appid, discount_end_date: 1800000000 })) } });
    }
  });
  document.getElementById = () => null;
  document.head = { appendChild() {} };
  document.createElement = () => ({ dataset: {}, style: {}, classList: { add() {}, remove() {}, toggle() {} },
    textContent: '', isConnected: false, remove() { this.isConnected = false; } });
  const rows = Array.from({ length: 101 }, (_, i) => {
    const row = { nodeType: 1, isConnected: true, matches: () => false, closest: () => null,
      getAttribute: () => `WishlistItem-${i + 1}-0`,
      querySelector: selector => selector === '.sse-wishlist-sale-expiration' ? row.badge?.isConnected ? row.badge : null : null,
      querySelectorAll: selector => selector === '.discount_block' ? [discount] : selector === '.sse-wishlist-sale-expiration' ? row.badge ? [row.badge] : [] : [] };
    const parent = { parentElement: row,
      insertBefore(badge) { row.badge = badge; badge.isConnected = true; mounted.push(badge); } };
    const purchase = { parentElement: parent, querySelector: () => true };
    const discount = { getAttribute: () => '20', closest: () => discount,
      parentElement: { parentElement: purchase, querySelector: () => null } };
    row.matches = selector => selector !== 'div[data-index]' && !selector.includes('sse-') && !selector.includes('sapx-');
    return row;
  });
  document.querySelectorAll = () => rows;
  vm.runInContext('initializeWishlistSaleCountdown()', context);
  await time.advance(500);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].length, 100);
  assert.equal(calls[1].length, 1);
  assert.equal(rows[100].badge?.isConnected, true);
  await time.advance(29999);
  assert.equal(calls.length, 3);
  assert.equal(calls[2].length, 100);
  assert.equal(rows[0].badge?.isConnected, true);
  assert.equal(rows[0].badge?.textContent.includes('剩余'), true);
  const before = calls.length;
  observers[0].callback([{ type: 'attributes', target: rows[0] }]);
  await time.advance(500);
  assert.equal(calls.length, before);
  vm.runInContext("featureScopes.get('wishlist-sale').dispose()", context);
  assert.equal(time.size, 0);
  assert.equal(mounted.some(badge => badge.isConnected), false);
  await settle();
});

test('wishlist query claims all AppIDs while awaiting a response', async () => {
  let resolveRequest;
  let count = 0;
  const { context, document, time, observers } = await harness(['wishlist-sale.js'], {
    isWishlistPage: () => true,
    readStoreSession: () => ({}), requestQueue: { enqueue: task => task() },
    gmGet: () => { count++; return new Promise(resolve => { resolveRequest = resolve; }); }
  });
  document.head = { appendChild() {} };
  document.getElementById = () => null;
  document.createElement = () => ({ remove() {} });
  const discount = { getAttribute: () => '20' };
  const row = { nodeType: 1, isConnected: true, closest: () => null,
    matches: selector => selector !== 'div[data-index]' && !selector.includes('sse-') && !selector.includes('sapx-'),
    getAttribute: () => 'WishlistItem-10-0', querySelector: () => null,
    querySelectorAll: selector => selector === '.discount_block' ? [discount] : [] };
  document.querySelectorAll = () => [row];
  vm.runInContext('initializeWishlistSaleCountdown()', context);
  await time.advance(500);
  assert.equal(count, 1);
  for (let i = 0; i < 5; i++) {
    observers[0].callback([{ type: 'attributes', target: row }]);
    await time.advance(500);
  }
  assert.equal(count, 1);
  resolveRequest(JSON.stringify({ response: { store_items: [] } }));
  await settle();
  await time.advance(500);
  assert.equal(count, 1);
  vm.runInContext("featureScopes.get('wishlist-sale').dispose()", context);
});
