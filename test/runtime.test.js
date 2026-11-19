import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { harness, eventTarget, settle } from './helpers/runtime.mjs';

test('feature replacement cancels waits, timers, listeners and old observer exactly once', async () => {
  const { context, time, window, observers } = await harness();
  vm.runInContext(`globalThis.first = createFeatureScope('example');
    first.listen(window, 'change', () => {});
    first.timeout(() => { globalThis.unexpected = true; }, 500);
    first.interval(() => {}, 1000);
    globalThis.waiting = first.wait(4000);
    createDomScanner({ scope: first, selector: '.price', process() {} });`, context);
  assert.equal(window.count(), 1);
  assert.ok(time.size > 0);
  vm.runInContext(`globalThis.second = createFeatureScope('example'); first.dispose();`, context);
  assert.equal(await context.waiting, false);
  assert.equal(context.first.active, false);
  assert.equal(context.second.active, true);
  assert.equal(observers[0].disconnected, true);
  assert.equal(window.count(), 0);
  assert.equal(time.size, 0);
  await time.advance(5000);
  assert.equal(context.unexpected, undefined);
});

test('100 mutations process only one new price instead of rescanning 1000 existing prices', async () => {
  let fullQueries = 0;
  let subtreeQueries = 0;
  const processed = [];
  const price = () => ({ nodeType: 1, isConnected: true,
    matches: selector => selector === '.price', closest: () => null, querySelectorAll: () => [] });
  const existing = Array.from({ length: 1000 }, price);
  const { context, document, time, observers } = await harness([], { process: nodes => processed.push(...nodes) });
  document.querySelectorAll = () => { fullQueries++; return existing; };
  vm.runInContext(`globalThis.scope = createFeatureScope('prices');
    globalThis.scanner = createDomScanner({ scope, selector: '.price', process, delay: 200 });`, context);
  await time.advance(200);
  assert.equal(processed.length, 1000);
  processed.length = 0;
  const added = price();
  const branch = { nodeType: 1, closest: () => null, matches: () => false,
    querySelectorAll: () => { subtreeQueries++; return [added]; } };
  const records = Array.from({ length: 100 }, () => ({ type: 'childList', target: document.body, addedNodes: [branch], removedNodes: [] }));
  observers[0].callback(records);
  await time.advance(200);
  assert.deepEqual(processed, [added]);
  assert.equal(fullQueries, 1);
  assert.equal(context.scanner.metrics.fullScans, 1);
  assert.equal(subtreeQueries, 1);
  const owned = { nodeType: 1, matches: () => true, closest: () => null };
  observers[0].callback([{ type: 'childList', target: added, addedNodes: [owned], removedNodes: [] }]);
  assert.equal(time.size, 0);
  added.isConnected = false;
  observers[0].callback([{ type: 'attributes', target: added }]);
  await time.advance(200);
  assert.deepEqual(processed, [added]);
});

test('attribute changes collect descendants and ancestor rows; removal invokes housekeeping', async () => {
  const processed = [];
  let removed = 0;
  const { context, time, observers } = await harness([], { process: nodes => processed.push(...nodes), removed: () => removed++ });
  vm.runInContext(`globalThis.scope = createFeatureScope('recycle');
    createDomScanner({ scope, selector: '.row, .price', process, removed, initial: false });`, context);
  const row = { nodeType: 1, isConnected: true, matches: selector => selector === '.row, .price', closest: () => null, querySelectorAll: () => [child] };
  const child = { nodeType: 1, isConnected: true, matches: selector => selector === '.row, .price', closest: () => null, parentElement: row };
  row.closest = selector => selector === '.row, .price' ? row : null;
  observers[0].callback([{ type: 'attributes', target: row }]);
  await time.advance(200);
  assert.deepEqual(processed, [row, child]);
  observers[0].callback([{ type: 'childList', target: row, addedNodes: [], removedNodes: [{ nodeType: 1 }] }]);
  await time.advance(200);
  assert.equal(removed, 1);
});

test('runtime handles SPA routing, feature switches, repeated startup and page teardown', async () => {
  const store = new Map();
  const starts = new Map();
  const { readFile } = await import('node:fs/promises');
  const { context, time, window } = await harness([], {
    GM_getValue: (key, fallback) => store.get(key) ?? fallback,
    GM_registerMenuCommand() {}, addStyle() {}, openSettingsUI() {}, clearScriptCaches() {},
    isWishlistPage: () => context.location.pathname.startsWith('/wishlist'),
    startFeature: name => starts.set(name, (starts.get(name) || 0) + 1)
  });
  vm.runInContext(`function boot(name) { startFeature(name); return createFeatureScope(name); }
    function startObserver() { return boot('regional-prices'); }
    const conversion = { start: () => boot('conversion') };
    function initializeFamilyLibrary() { boot('family'); return { open() {} }; }
    function initializeCartTools() { boot('cart'); }
    function initializeFriendTools() { boot('friends'); }
    function initializeRestrictionBadges() { boot('restrictions'); }
    function initializeStoreSaleCountdown() { boot('wishlist-sale'); }`, context);
  vm.runInContext(await readFile(new URL('../src/main.js', import.meta.url), 'utf8'), context);
  assert.equal(starts.get('wishlist-sale'), 1);
  await time.advance(2000);
  assert.equal(starts.get('wishlist-sale'), 1);
  store.set('sse_cart_enabled', false);
  await time.advance(1000);
  assert.equal(vm.runInContext("featureScopes.has('cart')", context), false);
  context.location.pathname = '/app/10/';
  window.emit('popstate');
  assert.equal(vm.runInContext("featureScopes.has('wishlist-sale')", context), true);
  assert.ok(starts.get('wishlist-sale') >= 2);
  assert.equal(starts.get('friends'), undefined);
  vm.runInContext('startFeatureRuntime()', context);
  assert.equal(time.size, 1);
  window.emit('pagehide', { persisted: false });
  assert.equal(time.size, 0);
  assert.equal(vm.runInContext('featureScopes.size', context), 0);
  assert.equal(window.count(), 0);
  await settle();
});
