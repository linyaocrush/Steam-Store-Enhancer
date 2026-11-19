import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { harness, settle } from './helpers/runtime.mjs';

test('cart summary requests all items concurrently and discards obsolete results', async () => {
  const region = { id: 'USD', short: 'US', currency: 'USD' };
  const requests = [];
  const rows = [10, 20, 30].map(id => ({ id: String(id), isConnected: true }));
  let inserted = 0;
  const totalRow = { isConnected: true, after() { inserted++; } };
  const total = { getClientRects: () => [1], closest: () => totalRow };
  const box = { isConnected: true, innerHTML: '' };
  const { context, document } = await harness(['regional-prices.js'], {
    isCartPage: () => true, getTargetRegion: () => region, getShowRegionCode: () => true,
    CART_SUMMARY_ID: 'summary', EXTRA_CLASS: 'sapx-extra-price'
  });
  document.querySelectorAll = selector => selector.includes('role="button"') ? rows : selector.includes('n9HLAj') ? [total] : [];
  document.querySelector = () => total;
  document.getElementById = () => box;
  context.requestPrice = () => new Promise(resolve => requests.push(resolve));
  vm.runInContext(`inferItemFromScope = row => itemRef('app', row.id);
    getPriceForItem = requestPrice;`, context);
  const first = context.updateCartSummary();
  assert.equal(requests.length, 3);
  const second = context.updateCartSummary();
  assert.equal(requests.length, 6);
  requests.slice(3).forEach(resolve => resolve({ ok: true, final: 200 }));
  await second;
  assert.ok(box.innerHTML.includes('6.00'));
  requests.slice(0, 3).forEach(resolve => resolve({ ok: true, final: 999 }));
  await first;
  assert.ok(box.innerHTML.includes('6.00'));
  assert.equal(inserted, 0);
  const third = context.updateCartSummary();
  rows[0].id = '40';
  requests.slice(6).forEach(resolve => resolve({ ok: true, final: 500 }));
  await third;
  assert.ok(box.innerHTML.includes('6.00'));
});

test('temporary regional network failure is not cached or labeled as confirmed unavailability', async () => {
  let calls = 0;
  const { context } = await harness(['network.js', 'regional-prices.js']);
  context.requestPrice = async () => { calls++; throw Error('offline'); };
  vm.runInContext('getAppPrice = requestPrice;', context);
  const item = { type: 'app', id: '10' }, region = { id: 'USD', currency: 'USD', ccCandidates: ['US'] };
  await assert.rejects(context.getPriceForItem(item, region), /offline/);
  await assert.rejects(context.getPriceForItem(item, region), /offline/);
  assert.equal(calls, 2);
  assert.equal(vm.runInContext('priceCache.size', context), 0);
  await settle();
});
