import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { harness, settle } from './helpers/runtime.mjs';

function cartRow(href, attributes = {}) {
  const capsule = href == null ? null : { getAttribute: key => key === 'href' ? href : null };
  return {
    isConnected: true,
    matches: selector => selector === '.bKkQiLkI-vk-',
    getAttribute: key => attributes[key] ?? null,
    querySelector: selector => selector.includes('wuZBJ1ixmBQ') ? capsule : null,
    querySelectorAll: () => [capsule, { getAttribute: () => '/app/99/' }].filter(Boolean),
    closest: () => null
  };
}

function cartWrapper(row) {
  return { matches: () => false, querySelector: selector => selector === '.bKkQiLkI-vk-' ? row : null };
}

test('cart summary requests all items concurrently and discards obsolete results', async () => {
  const region = { id: 'USD', short: 'US', currency: 'USD' };
  const requests = [];
  const rows = [10, 20, 30].map(id => cartRow('/sub/' + id));
  let inserted = 0;
  const totalRow = { isConnected: true, after() { inserted++; } };
  const total = { getClientRects: () => [1], closest: () => totalRow };
  const box = { isConnected: true, innerHTML: '' };
  const { context, document } = await harness(['bundle-prices.js', 'regional-prices.js'], {
    isCartPage: () => true, getTargetRegion: () => region, getShowRegionCode: () => true,
    CART_SUMMARY_ID: 'summary', EXTRA_CLASS: 'sapx-extra-price'
  });
  document.querySelectorAll = selector => selector.includes('role="button"') ? rows : selector.includes('n9HLAj') ? [total] : [];
  document.querySelector = () => total;
  document.getElementById = () => box;
  context.requestPrice = () => new Promise(resolve => requests.push(resolve));
  vm.runInContext('getPriceForItem = requestPrice;', context);
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
  rows[0] = cartRow('/sub/40');
  requests.slice(6).forEach(resolve => resolve({ ok: true, final: 500 }));
  await third;
  assert.ok(box.innerHTML.includes('6.00'));
});

test('cart summary and displayed prices use the cart capsule instead of unrelated links', async () => {
  const region = { id: 'CNY', short: 'CN', currency: 'CNY' };
  const bundle = cartRow('/bundle/42/?snr=1');
  const edition = cartRow('/app/10/', { 'data-ds-packageid': '123' });
  const rows = [cartWrapper(bundle), bundle, cartWrapper(edition), edition, cartWrapper(null)];
  const totalRow = { isConnected: true };
  const total = { getClientRects: () => [1], closest: () => totalRow };
  const box = { isConnected: true, innerHTML: '' };
  const { context, document } = await harness(['bundle-prices.js', 'regional-prices.js'], {
    isCartPage: () => true, getTargetRegion: () => region, getShowRegionCode: () => true,
    CART_SUMMARY_ID: 'summary'
  });
  document.querySelectorAll = selector => selector.includes('role="button"') ? rows : selector.includes('n9HLAj') ? [total] : [];
  document.getElementById = () => box;
  const calls = [];
  context.requestPrice = async item => { calls.push(context.itemKey(item)); return { ok: true, final: 250 }; };
  vm.runInContext('getPriceForItem = requestPrice;', context);

  // Generic lookup cannot distinguish the bundle from its included game link.
  assert.equal(context.inferItemFromScope(bundle), null);
  const priceEl = { closest: selector => bundle.matches(selector) ? bundle : null };
  assert.equal(context.itemKey(context.inferRegionalPriceItem(priceEl)), 'bundle:42');
  await context.updateCartSummary();
  assert.deepEqual(calls, ['bundle:42', 'package:123']);
  assert.match(box.innerHTML, /5\.00/);
  assert.doesNotMatch(box.innerHTML, /sapx-warn/);
});

test('cart summary distinguishes unidentified rows, failed queries, and actual zero prices', async () => {
  const rows = [cartRow('#'), cartRow('/sub/12/'), cartRow('/sub/13/')];
  const totalRow = { isConnected: true };
  const total = { getClientRects: () => [1], closest: () => totalRow };
  let removed = false;
  const box = { isConnected: true, innerHTML: '', remove() { removed = true; } };
  const { context, document } = await harness(['bundle-prices.js', 'regional-prices.js'], {
    isCartPage: () => true, getTargetRegion: () => ({ id: 'CNY', short: 'CN', currency: 'CNY' }),
    getShowRegionCode: () => false, CART_SUMMARY_ID: 'summary'
  });
  document.querySelectorAll = selector => selector.includes('role="button"') ? rows : [total];
  document.getElementById = () => box;
  context.requestPrice = async item => {
    if (item.id === '12') throw Error('offline');
    return { ok: true, final: 0 };
  };
  vm.runInContext('getPriceForItem = requestPrice;', context);

  await context.updateCartSummary();
  assert.match(box.innerHTML, /已确认小计.*0\.00/);
  assert.match(box.innerHTML, /有 2 项价格暂时无法确认/);
  assert.doesNotMatch(box.innerHTML, /锁区/);

  rows.pop();
  await context.updateCartSummary();
  assert.match(box.innerHTML, /sapx-value">—/);
  assert.doesNotMatch(box.innerHTML, /0\.00/);

  rows.splice(0, rows.length, cartWrapper(null));
  await context.updateCartSummary();
  assert.equal(removed, true);
});

test('temporary regional network failure is not cached or labeled as confirmed unavailability', async () => {
  let calls = 0;
  const { context } = await harness(['network.js', 'bundle-prices.js', 'regional-prices.js']);
  context.requestPrice = async () => { calls++; throw Error('offline'); };
  vm.runInContext('getAppPrice = requestPrice;', context);
  const item = { type: 'app', id: '10' }, region = { id: 'USD', currency: 'USD', ccCandidates: ['US'] };
  await assert.rejects(context.getPriceForItem(item, region), /offline/);
  await assert.rejects(context.getPriceForItem(item, region), /offline/);
  assert.equal(calls, 2);
  assert.equal(vm.runInContext('priceCache.size', context), 0);
  await settle();
});

test('extra cart price is rendered for an ambiguous bundle and follows a replaced capsule', async () => {
  let row = cartRow('/bundle/42/');
  let extra;
  const priceEl = {
    nodeType: 1, isConnected: true, textContent: '$10.00',
    classList: { contains: () => false },
    closest: selector => row.matches(selector) ? row : null,
    querySelector: selector => selector === '.sapx-extra-price' ? extra : null,
    querySelectorAll: () => extra ? [extra] : [],
    appendChild(node) { extra = node; }
  };
  const { context, document } = await harness(['bundle-prices.js', 'regional-prices.js'], {
    isCartPage: () => true, getTargetRegion: () => ({ id: 'CNY', short: 'CN' }),
    getShowRegionCode: () => true, EXTRA_CLASS: 'sapx-extra-price', MARK_ATTR: 'data-region'
  });
  document.createElement = () => {
    const attrs = new Map();
    return { style: {}, setAttribute: (key, value) => attrs.set(key, value),
      getAttribute: key => attrs.get(key), remove() { extra = undefined; } };
  };
  const calls = [];
  context.requestPrice = async item => {
    calls.push(context.itemKey(item));
    return { ok: true, finalFormatted: item.type === 'bundle' ? '¥20.00' : '¥30.00' };
  };
  vm.runInContext('getPriceForItem = requestPrice;', context);
  await context.enhancePriceElement(priceEl, 'final');
  assert.equal(extra.textContent, '(CN ¥20.00)');
  await context.enhancePriceElement(priceEl, 'final');
  assert.equal(calls.length, 1);
  row = cartRow('/sub/123/');
  await context.enhancePriceElement(priceEl, 'final');
  assert.equal(extra.textContent, '(CN ¥30.00)');
  assert.deepEqual(calls, ['bundle:42', 'package:123']);
});
