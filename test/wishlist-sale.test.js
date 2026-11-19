import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { harness } from './helpers/runtime.mjs';

test('homepage countdown mounts inside game information and loads hidden tabs only after showing them', async () => {
  const calls = [];
  const { context, document, time, observers } = await harness(['wishlist-sale.js'], {
    isWishlistPage: () => false,
    readStoreSession: () => ({}), requestQueue: { enqueue: task => task() },
    gmGet: async url => {
      const ids = JSON.parse(new URL(url).searchParams.get('input_json')).ids.map(item => item.appid);
      calls.push(ids);
      return JSON.stringify({ response: { store_items: ids.map(appid => ({ appid, discount_end_date: 1800000000 })) } });
    }
  });
  document.head = { appendChild() {} };
  document.getElementById = () => null;
  document.createElement = () => ({ dataset: {}, className: '', textContent: '',
    classList: { contains(name) { return name === 'sse-home-sale-expiration'; }, add() {}, remove() {}, toggle() {} },
    remove() { this.isConnected = false; } });
  const tabs = {};
  function makeRow(id, visible) {
    const row = { nodeType: 1, isConnected: true, visible, getClientRects() { return this.visible ? [{}] : []; },
      getAttribute(name) { return name === 'data-ds-appid' ? String(id) : name === 'href' ? `/app/${id}/` : null; },
      matches(selector) { return selector === 'a.tab_row_item' || selector === 'a[href*="/app/"]'; },
      closest(selector) { return selector === '#home_tabs_row' ? tabs : selector.includes('a.tab_row_item') ? row : null; },
      querySelector(selector) {
        if (selector === ':scope > .tab_item_content > .tab_item_col:not(.tab_item_price)') return info;
        return selector === '.sse-wishlist-sale-expiration' ? row.badge : null;
      },
      querySelectorAll(selector) { return selector === '.discount_block' ? [{ getAttribute: () => '20' }] : []; },
      insertBefore() { assert.fail('countdown must not become a sibling of the homepage content and image'); } };
    const info = { insertBefore(badge) { row.badge = badge; badge.parentElement = info; badge.isConnected = true; } };
    return row;
  }
  const rows = [makeRow(10, true), makeRow(20, false)];
  document.querySelector = selector => selector === '#home_tabs_row' ? tabs : null;
  document.querySelectorAll = () => rows;
  vm.runInContext('initializeStoreSaleCountdown()', context);
  await time.advance(500);
  assert.deepEqual(calls, [[10]]);
  assert.equal(rows[0].badge.textContent.startsWith('剩余 '), true);
  assert.match(rows[0].badge.title, /折扣结束时间/);
  assert.equal(rows[1].badge, undefined);
  rows[0].visible = false;
  rows[1].visible = true;
  const panel = { nodeType: 1, matches: selector => selector === '.home_tab_content', closest: () => null, querySelectorAll: () => [rows[1]] };
  observers[1].callback([{ type: 'attributes', target: panel }]);
  await time.advance(500);
  assert.deepEqual(calls, [[10], [20]]);
  assert.ok(rows[1].badge);
  vm.runInContext("featureScopes.get('wishlist-sale').dispose()", context);
  assert.equal(observers.every(observer => observer.disconnected), true);
});

test('wishlist sale expiry supports Steam active discount timestamps', async () => {
  const source = await readFile(new URL('../src/wishlist-sale.js', import.meta.url), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source, context);

  assert.equal(context.wishlistSaleEndTimestamp({
    best_purchase_option: { active_discounts: [{ discount_end_date: 1800000000 }] }
  }), 1800000000000);
  assert.equal(context.wishlistSaleEndTimestamp({
    purchase_options: [{ active_discounts: [{ discount_expiration: 1800000000000 }] }]
  }), 1800000000000);
  assert.equal(context.wishlistSaleEndTimestamp({ best_purchase_option: { active_discounts: [] } }), null);
  assert.equal(context.wishlistSaleEndTimestamp(null), null);
});

test('wishlist sale countdown formats days and zero-padded time', async () => {
  const source = await readFile(new URL('../src/wishlist-sale.js', import.meta.url), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source, context);

  assert.equal(context.formatWishlistSaleCountdown(90061000), '1天 01:01:01');
  assert.equal(context.formatWishlistSaleCountdown(61000), '00:01:01');
  assert.equal(context.formatWishlistSaleCountdown(-10), '00:00:00');
});

test('new React wishlist discount prices are detected without relying on hashed CSS classes', async () => {
  const source = await readFile(new URL('../src/wishlist-sale.js', import.meta.url), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source, context);

  const accessiblePrice = { getAttribute: () => '立省 78%。原价为 $20.99，折后为 $4.63。' };
  const priceLink = { querySelectorAll: selector => selector === '[aria-label]' ? [accessiblePrice] : [] };
  const row = {
    querySelectorAll(selector) {
      if (selector === '.discount_block') return [];
      if (selector === 'a[href*="/app/"]') return [priceLink];
      return [];
    }
  };

  assert.equal(context.findWishlistSalePrice(row), priceLink);
});

test('discount price detection includes a store card when the card itself is the app link', async () => {
  const source = await readFile(new URL('../src/wishlist-sale.js', import.meta.url), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source, context);
  const accessiblePrice = { getAttribute: () => '立省 50%' };
  const card = { matches: selector => selector === 'a[href*="/app/"]',
    getAttribute: () => '/app/10/', querySelectorAll: selector => selector === '[aria-label]' ? [accessiblePrice] : [] };
  assert.equal(context.findWishlistSalePrice(card), card);
});

test('store sale rows resolve one AppID and reject ambiguous multi-game cards', async () => {
  const source = await readFile(new URL('../src/wishlist-sale.js', import.meta.url), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source, context);
  const element = id => ({ getAttribute: name => name === 'data-ds-appid' ? id : null });
  const row = { getAttribute: () => null, querySelectorAll: () => [element('10')] };
  assert.equal(context.storeSaleAppId(row), '10');
  assert.equal(context.storeSaleAppId({ ...row, querySelectorAll: () => [element('10'), element('20')] }), null);
});

test('search result countdown is absolutely anchored below the price frame, outside it', async () => {
  const source = await readFile(new URL('../src/wishlist-sale.js', import.meta.url), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source, context);
  const price = {};
  const nextColumnNode = {};
  const priceFrame = { parentElement: null, nextSibling: nextColumnNode };
  const priceColumn = { parentElement: null };
  priceFrame.parentElement = priceColumn;
  const rowContainer = {};
  priceColumn.parentElement = rowContainer;
  const row = {
    matches: selector => selector === '.search_result_row',
    querySelector: selector => selector === '.discount_block' ? price : null
  };
  price.parentElement = priceFrame;
  const position = context.findStoreSaleBadgePosition(row);
  assert.equal(position.container, row);
  assert.equal(position.anchor, price);
  assert.notEqual(position.container, priceFrame);
  assert.equal(position.className, 'sse-search-sale-expiration');
  assert.equal(position.compact, true);
});

test('search result countdown stays on one line without clipping its text', async () => {
  const source = await readFile(new URL('../src/wishlist-sale.js', import.meta.url), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source, context);
  const style = context.storeSaleCountdownStyle();
  const searchRule = style.split('.search_result_row .sse-search-sale-expiration{')[1];
  assert.ok(searchRule);
  assert.match(searchRule, /display:block/);
  assert.match(searchRule, /position:absolute/);
  assert.match(searchRule, /left:0/);
  assert.match(searchRule, /top:100%/);
  assert.match(searchRule, /width:max-content/);
  assert.match(searchRule, /white-space:nowrap/);
  assert.match(searchRule, /overflow:visible/);
  assert.match(searchRule, /text-overflow:clip/);
  assert.match(searchRule, /margin:0/);
  assert.match(searchRule, /text-align:left/);
  assert.doesNotMatch(searchRule, /margin-left:auto/);
  assert.doesNotMatch(searchRule, /text-align:right/);
  assert.doesNotMatch(searchRule, /contain:inline-size/);
});

test('search countdown fits below the actual price inside the clipped result row', async () => {
  const source = await readFile(new URL('../src/wishlist-sale.js', import.meta.url), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source, context);
  const badge = { style: {}, getBoundingClientRect: () => ({ width: 103, height: 15.4 }) };
  const row = { clientLeft: 1, clientTop: 1, getBoundingClientRect: () => ({ left: 395.5, top: 452, bottom: 524 }) };
  const price = { getBoundingClientRect: () => ({ right: 1183.5625, bottom: 504 }) };
  context.positionSearchSaleBadge(badge, row, price);
  assert.equal(badge.style.top, '51px');
  assert.equal(badge.style.left, '684.0625px');
  assert.ok(452 + 1 + parseFloat(badge.style.top) + 15.4 < 524);
  price.getBoundingClientRect = () => ({ right: 1200, bottom: 500 });
  context.positionSearchSaleBadge(badge, row, price);
  assert.equal(badge.style.top, '47px');
  assert.equal(badge.style.left, '700.5px');
});

test('wishlist sale badge is placed after the price/cart area, outside its inner flex card', async () => {
  const source = await readFile(new URL('../src/wishlist-sale.js', import.meta.url), 'utf8');
  const button = {};
  const priceLink = {};
  const row = {};
  const outerLayout = { parentElement: row };
  const afterPurchase = {};
  const purchaseRow = {
    parentElement: outerLayout,
    nextSibling: afterPurchase,
    querySelector: () => button
  };
  const priceCard = { parentElement: purchaseRow };
  purchaseRow.querySelector = selector => selector === 'button, [role="button"]' ? button : null;
  priceCard.querySelector = () => null;
  priceLink.parentElement = priceCard;
  priceLink.closest = () => priceLink;
  const context = vm.createContext({});
  vm.runInContext(source, context);

  const position = context.findWishlistSaleBadgePosition(row, priceLink);
  assert.equal(position.container, outerLayout);
  assert.equal(position.reference, afterPurchase);
});
