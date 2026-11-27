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
    CART_SUMMARY_ID: 'summary', EXTRA_CLASS: 'sapx-extra-price',
    conversion: { setting: { regionalDisplayCurrency: 'CNY' }, getRate: async () => 0.125 }
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
  assert.match(box.innerHTML, /≈ CNY\s+48\.00/);
  requests.slice(0, 3).forEach(resolve => resolve({ ok: true, final: 999 }));
  await first;
  assert.match(box.innerHTML, /≈ CNY\s+48\.00/);
  assert.equal(inserted, 0);
  const third = context.updateCartSummary();
  rows[0] = cartRow('/sub/40');
  requests.slice(6).forEach(resolve => resolve({ ok: true, final: 500 }));
  await third;
  assert.match(box.innerHTML, /≈ CNY\s+48\.00/);
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

test('regional app prices recognize free games without a price overview', async () => {
  const { context } = await harness(['network.js', 'regional-prices.js'], {
    GM_xmlhttpRequest({ url, onload }) {
      const params = new URL(url).searchParams;
      const hasBasic = params.get('filters')?.split(',').includes('basic');
      const block = params.get('cc') === 'CN' ? { success: false } : {
        success: true, data: hasBasic ? { is_free: true } : []
      };
      onload({ status: 200, responseText: JSON.stringify({ [params.get('appids')]: block }) });
    }
  });
  const item = { type: 'app', id: '1599340' };
  const us = { id: 'USD', currency: 'USD', ccCandidates: ['US'] };
  const cn = { id: 'CNY', currency: 'CNY', ccCandidates: ['CN'] };

  const price = await context.getPriceForItem(item, us);
  assert.equal(price?.ok, true);
  assert.equal(price.free, true);
  assert.deepEqual([price.initial, price.final, price.finalFormatted], [0, 0, 'Free']);
  assert.equal(await context.getPriceForItem(item, cn), null);
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

test('regional prices only queue near the viewport and keep shared requests while a viewer remains', async () => {
  let viewport;
  const requests = [];
  const { context, document, time, observers } = await harness(['network.js', 'bundle-prices.js', 'regional-prices.js'], {
    isCartPage: () => false, isWishlistPage: () => false,
    getTargetRegion: () => ({ id: 'USD', currency: 'USD', ccCandidates: ['US'] }),
    EXTRA_CLASS: 'sapx-extra-price', MARK_ATTR: 'data-region', getShowRegionCode: () => false,
    IntersectionObserver: class {
      targets = new Set();
      constructor(callback, options) { this.callback = callback; this.options = options; viewport = this; }
      observe(node) { this.targets.add(node); }
      unobserve(node) { this.targets.delete(node); }
      disconnect() { this.targets.clear(); }
      report(nodes, isIntersecting) { this.callback(nodes.map(target => ({ target, isIntersecting }))); }
    },
    GM_xmlhttpRequest({ url, onload }) {
      const id = new URL(url).searchParams.get('appids');
      requests.push({ id, finish: () => onload({ status: 200, responseText: JSON.stringify({
        [id]: { success: true, data: { is_free: true } }
      }) }) });
    }
  });
  context.window.getComputedStyle = () => ({});
  context.location.pathname = '/search/';
  const selector = vm.runInContext('PRICE_SELECTORS', context);
  const priceElement = id => ({
    nodeType: 1, isConnected: true, appId: String(id), textContent: '$10.00',
    classList: { contains: () => false }, matches: value => value.includes('.discount_final_price'),
    closest(value) { return value === 'a[href]' ? { getAttribute: () => '/app/' + this.appId + '/' } : null; },
    querySelector(value) { return value === '.sapx-extra-price' ? this.extra : null; },
    querySelectorAll() { return []; }, appendChild(node) { this.extra = node; }
  });
  const prices = Array.from({ length: 200 }, (_, index) => priceElement(index + 1));
  const duplicate = priceElement(5);
  document.querySelectorAll = value => value.startsWith(selector) ? [...prices, duplicate] : [];
  document.createElement = () => ({ style: {}, setAttribute() {} });
  const scope = context.startObserver();
  await time.advance(200);
  assert.equal(viewport.options.rootMargin, '200px');
  assert.equal(viewport.targets.size, 201);
  viewport.report(prices.slice(6), false);
  await settle();
  assert.equal(requests.length, 0);

  viewport.report([...prices.slice(0, 6), duplicate], true);
  await settle();
  const waiting = () => vm.runInContext('requestQueue.queue.length', context);
  assert.deepEqual(requests.map(request => request.id), ['1', '2', '3', '4']);
  assert.equal(waiting(), 2);
  viewport.report([prices[0], prices[4], prices[5]], false);
  assert.equal(waiting(), 1);
  requests[0].finish();
  await settle();
  assert.equal(requests.at(-1).id, '5');
  assert.equal(prices[0].extra, undefined);
  requests.at(-1).finish();
  await settle();
  assert.equal(duplicate.extra.textContent, '(Free)');
  assert.equal(prices[4].extra, undefined);

  viewport.report([prices[0], prices[5]], true);
  await settle();
  assert.equal(prices[0].extra.textContent, '(Free)');
  assert.deepEqual(requests.map(request => request.id), ['1', '2', '3', '4', '5', '6']);
  viewport.report([prices[6]], true);
  assert.equal(waiting(), 1);
  prices[6].isConnected = false;
  observers[0].callback([{ type: 'childList', target: document.body, removedNodes: [prices[6]] }]);
  assert.equal(waiting(), 0);
  assert.equal(viewport.targets.has(prices[6]), false);

  prices[1].appId = '200';
  requests[1].finish();
  await settle();
  assert.equal(prices[1].extra, undefined);
  await time.advance(200);
  const replacement = requests.filter(request => request.id === '200');
  assert.equal(replacement.length, 1);
  replacement[0].finish();
  await settle();
  assert.equal(prices[1].extra.textContent, '(Free)');

  scope.dispose();
  await settle();
  assert.equal(viewport.targets.size, 0);
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

test('JPY Steam prices are converted into the selected currency without initializing account conversion', async () => {
  const requests = [];
  const { context } = await harness([
    'config.js', 'network.js', 'regional-prices.js', 'conversion/settings.js',
    'conversion/rates.js', 'conversion/price-processor.js', 'conversion/index.js'
  ], {
    GM_info: { script: { version: '1.10.0' } },
    GM_xmlhttpRequest({ url, onload }) {
      if (url.includes('/appdetails')) {
        onload({ status: 200, responseText: JSON.stringify({ 10: { success: true, data: { price_overview: {
          currency: 'JPY', initial: 150000, final: 75000, initial_formatted: '¥1,500', final_formatted: '¥750'
        } } } }) });
      } else {
        requests.push(url);
        onload({ status: 200, responseText: JSON.stringify({ USD: { JPY: 150 } }) });
      }
    }
  });
  const price = await context.getAppPrice('10', 'JP', 'JPY');
  assert.deepEqual([price.initial, price.final], [1500, 750]);
  const settings = vm.runInContext('conversion.setting', context);
  const formatFinal = () => context.formatRegionalDisplayPrice(price.final, price.currency, price.finalFormatted);
  assert.equal(await formatFinal(), '¥750');
  settings.regionalDisplayCurrency = 'JPY';
  assert.equal(await formatFinal(), '¥750');
  assert.equal(requests.length, 0);
  settings.regionalDisplayCurrency = 'USD';
  const expected = amount => '≈ ' + new Intl.NumberFormat(undefined, {
    style: 'currency', currency: 'USD', currencyDisplay: 'code'
  }).format(amount);
  assert.deepEqual(await Promise.all([
    context.formatRegionalDisplayPrice(price.initial, price.currency, price.initialFormatted), formatFinal()
  ]), [expected(10), expected(5)]);
  assert.equal(await formatFinal(), expected(5));
  assert.deepEqual(requests, ['https://api.augmentedsteam.com/rates/v1?to=JPY']);
  settings.regionalDisplayCurrency = 'EUR';
  assert.equal(await formatFinal(), '¥750');
});
