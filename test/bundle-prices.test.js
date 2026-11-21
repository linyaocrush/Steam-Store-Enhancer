import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { harness } from './helpers/runtime.mjs';

const steamid = '76561198000000001';
const region = { id: 'CNY', currency: 'CNY', short: 'CN', ccCandidates: ['CN'] };
const option = { bundleid: 42, must_purchase_as_set: false, final_price_in_cents: '9900',
  formatted_final_price: '¥99.00', original_price_in_cents: '12000', formatted_original_price: '¥120.00' };
const packageItem = (id, apps, base, final) => ({ m_nPackageID: id, m_rgIncludedAppIDs: apps,
  m_nBasePriceInCents: base, m_nFinalPriceWithBundleDiscount: final });
const details = (items, increment = 1) => ({ increment, data: { m_bMustPurchaseAsSet: 0, m_rgItems: items } });
const ownership = (apps = [], packages = [], subscriptions = []) => ({
  rgOwnedApps: new Set(apps.map(String)), rgOwnedPackages: new Set(packages.map(String)),
  rgMasterSubApps: new Set(subscriptions.map(String))
});

async function bundleHarness({ cart = false, signedIn = true, purchaseOption = option } = {}) {
  const calls = [];
  const page = { UserConfig: { steamid: signedIn ? steamid : '' }, SSR: { loaderData: [{ strWebAPIToken: 'private-token' }] } };
  const result = await harness(['network.js', 'bundle-prices.js', 'regional-prices.js'], {
    unsafeWindow: page, isCartPage: () => cart, getTargetRegion: () => region,
    getShowRegionCode: () => true, CART_SUMMARY_ID: 'summary', EXTRA_CLASS: 'sapx-extra-price', MARK_ATTR: 'data-region'
  });
  const { context } = result;
  context.gmGet = async (url, options) => {
    calls.push({ url, options });
    return JSON.stringify({ response: { store_items: [{ best_purchase_option: purchaseOption }] } });
  };
  context.fetchJson = async url => {
    calls.push({ url });
    if (url.includes('GetCart')) return { data: { response: { cart: { line_items: [
      { line_item_id: '1', bundleid: 42, flags: { is_gift: false } }
    ] } } }, headers: { get: () => '1' } };
    return { data: { rgOwnedApps: [10], rgOwnedPackages: [0] } };
  };
  // The anonymous bundle-page loader is exercised separately below.
  context.readRegionalBundleDetails = async () => details([
    packageItem(1, [10], 4000, 3000), packageItem(2, [20], 8000, 6000)
  ]);
  return { ...result, calls, page };
}

test('completion removes owned packages and fully owned app sets, retains partially owned packages and subscriptions', async () => {
  const { context } = await bundleHarness();
  const result = context.calculateBundleCompletion(details([
    packageItem(1, [10, 11], 4000, 3000), // owned package
    packageItem(2, [20, 21], 5000, 4000), // all apps owned via other packages
    packageItem(3, [30, 31], 6000, 4444), // only one app owned: charge entire package
    packageItem(4, [40], 7000, 5555), // subscription ownership is not permanent
    packageItem(5, [], 1000, 999) // an empty app list does not mean owned
  ]), ownership([20, 21, 30, 40], [1], [40]), 'CNY');
  assert.equal(result.initial, 14000);
  assert.equal(result.final, 10998);
  assert.equal(result.excluded, 2);
  assert.equal(result.remaining, 3);
  assert.equal(result.completion, true);
});

test('completion sums Steam per-package discounted prices before currency rounding, including zero and JPY', async () => {
  const { context } = await bundleHarness();
  const data = details([packageItem(1, [10], 200000, 123475), packageItem(2, [20], 200, 75)], 100);
  const yen = context.calculateBundleCompletion(data, ownership(), 'JPY');
  assert.equal(yen.final, 1236);
  assert.equal(yen.initial, 2002);
  assert.match(yen.finalFormatted, /1,236/);
  const allOwned = context.calculateBundleCompletion(data, ownership([10, 20]), 'JPY');
  assert.equal(allOwned.final, 0);
  assert.equal(allOwned.remaining, 0);
  assert.equal(allOwned.ok, true);
  const free = context.calculateBundleCompletion(details([packageItem(1, [10], 0, 0)]), ownership(), 'CNY');
  assert.equal(free.final, 0);
});

test('completion refuses incomplete, duplicate or invalid data instead of producing a partial price', async () => {
  const { context } = await bundleHarness();
  for (const data of [
    details([]), details([packageItem(1, [10], 100, undefined)]),
    details([packageItem(1, [10], 100, -1)]), details([packageItem(1, [10], 100, 101)]),
    details([packageItem(1, null, 100, 90)]), details([packageItem(0, [10], 100, 90)]),
    details([packageItem(1, [10], 100, 90), packageItem(1, [10], 100, 90)]),
    details([packageItem(1, [10], 100, 90)], 0),
    { increment: 1, data: { m_bMustPurchaseAsSet: 1, m_rgItems: [packageItem(1, [10], 100, 90)] } }
  ]) assert.throws(() => context.calculateBundleCompletion(data, ownership(), 'CNY'));
});

test('bundle fetch calculates and caches personalized prices for the current account', async () => {
  const { context, calls } = await bundleHarness();
  const item = { type: 'bundle', id: '42' };
  const price = await context.getPriceForItem(item, region);
  assert.equal(price.final, 6000);
  assert.equal(price.initial, 8000);
  assert.equal(price.excluded, 1);
  assert.equal(await context.getPriceForItem(item, region), price);
  assert.equal(calls.filter(call => call.url.includes('GetItems')).length, 1);
  assert.equal(calls.filter(call => call.url.includes('userdata')).length, 1);
});

test('cart price annotation and summary both display the calculated completion price', async () => {
  const { context, document } = await bundleHarness({ cart: true });
  const capsule = { getAttribute: key => key === 'href' ? '/bundle/42/' : null };
  const row = { isConnected: true, matches: selector => selector === '.bKkQiLkI-vk-',
    getAttribute: () => null, querySelector: () => capsule };
  const totalRow = { isConnected: true };
  const total = { getClientRects: () => [1], closest: () => totalRow };
  const box = { isConnected: true, innerHTML: '' };
  document.querySelectorAll = selector => selector.includes('role="button"') ? [row] : selector.includes('n9HLAj') ? [total] : [];
  document.getElementById = () => box;
  let extra;
  document.createElement = () => {
    const attrs = new Map();
    return { style: {}, setAttribute: (key, value) => attrs.set(key, value), getAttribute: key => attrs.get(key) };
  };
  const priceEl = { nodeType: 1, isConnected: true, textContent: '$10.00', classList: { contains: () => false },
    closest: () => row, querySelectorAll: () => [], querySelector: selector => selector === '.sapx-extra-price' ? extra : null,
    appendChild(node) { extra = node; } };
  await context.enhancePriceElement(priceEl, 'final');
  assert.match(extra.textContent, /预计补齐.*60\.00/);
  await context.updateCartSummary();
  assert.match(box.innerHTML, /预计付款.*60\.00/);
  assert.match(box.innerHTML, /含 1 项按当前账号已拥有内容计算的预计补齐价/);
  assert.doesNotMatch(box.innerHTML, /99\.00/);

  // With nothing owned, preserve the API's price and skip completion arithmetic.
  const originalFetch = context.fetchJson;
  context.fetchJson = url => url.includes('GetCart') ? originalFetch(url) : Promise.resolve({ data: { rgOwnedApps: [], rgOwnedPackages: [0] } });
  vm.runInContext('bundleOwnershipCache.clear(); priceCache.clear();', context);
  context.calculateBundleCompletion = () => { throw Error('must not calculate an unowned bundle'); };
  extra = undefined;
  await context.enhancePriceElement(priceEl, 'final');
  assert.equal(extra.textContent, '(CN ¥99.00)');
  await context.updateCartSummary();
  assert.match(box.innerHTML, /预计付款.*99\.00/);
  assert.doesNotMatch(box.innerHTML, /预计补齐价/);
});

test('set-only bundles and anonymous visitors keep the full price without loading ownership', async () => {
  for (const config of [{ purchaseOption: { ...option, must_purchase_as_set: true } }, { signedIn: false }]) {
    const { context, calls } = await bundleHarness(config);
    const price = await context.getBundlePrice('42', 'CN', 'CNY');
    assert.equal(price.final, 9900);
    assert.equal(price.completion, undefined);
    assert.equal(calls.length, 1);
  }
});

test('ownership failure is unconfirmed, never a lock or a cached full price, and can be retried', async () => {
  const { context, time } = await bundleHarness();
  context.fetchJson = async () => { throw Error('offline'); };
  await assert.rejects(context.getPriceForItem({ type: 'bundle', id: '42' }, region), /offline/);
  assert.equal(vm.runInContext('priceCache.size', context), 0);
  context.fetchJson = async () => ({ data: { rgOwnedApps: [10], rgOwnedPackages: [], rgMasterSubApps: [] } });
  await time.advance(10000);
  assert.equal((await context.getPriceForItem({ type: 'bundle', id: '42' }, region)).final, 6000);
});

test('owned lists are validated and cached by account; subscription apps remain chargeable', async () => {
  const { context, calls, page } = await bundleHarness();
  await context.getBundlePrice('42', 'CN', 'CNY');
  page.UserConfig.steamid = '76561198000000002';
  context.fetchJson = async () => {
    calls.push({ url: 'userdata-second-account' });
    return { data: { rgOwnedApps: [10], rgOwnedPackages: [], rgMasterSubApps: [10] } };
  };
  assert.equal((await context.getBundlePrice('42', 'CN', 'CNY')).final, 9900);
  assert.ok(calls.some(call => call.url === 'userdata-second-account'));
  page.UserConfig.steamid = '76561198000000003';
  context.fetchJson = async () => ({ data: { rgOwnedPackages: [] } });
  await assert.rejects(context.getBundlePrice('42', 'CN', 'CNY'), /数据不完整/);
});

test('ownership accepts optional omitted fields, empty objects and ID maps without losing subscription exclusions', async () => {
  for (const data of [
    { rgOwnedApps: [10] },
    { rgOwnedApps: [10], rgOwnedPackages: [] },
    { rgOwnedApps: [10], rgOwnedPackages: [0, '0', 12345] },
    { rgOwnedApps: [10], rgOwnedPackages: { 0: true, 12345: true } },
    { rgOwnedApps: ['10'], rgOwnedPackages: {}, rgMasterSubApps: null, rgAutoGrantApps: {} },
    { rgOwnedApps: { 10: true, 20: false }, rgOwnedPackages: { 1: 0 }, rgMasterSubApps: {} }
  ]) {
    const { context } = await bundleHarness();
    context.fetchJson = async () => ({ data });
    assert.equal((await context.getBundlePrice('42', 'CN', 'CNY')).final, 6000);
  }
  for (const key of ['rgMasterSubApps', 'rgAutoGrantApps']) {
    const { context } = await bundleHarness();
    context.fetchJson = async () => ({ data: { rgOwnedApps: [10], rgOwnedPackages: [], [key]: { 10: true } } });
    assert.equal((await context.getBundlePrice('42', 'CN', 'CNY')).final, 9900);
  }
});

test('system package zero does not block actual package or app ownership deductions', async () => {
  const { context } = await bundleHarness();
  context.fetchJson = async () => ({ data: { rgOwnedApps: [], rgOwnedPackages: [0, 1] } });
  const price = await context.getBundlePrice('42', 'CN', 'CNY');
  assert.equal(price.final, 6000);
  assert.equal(price.excluded, 1);
  assert.equal(context.readBundleOwnedIds({ rgOwnedPackages: [0] }, 'rgOwnedPackages').size, 0);
  assert.throws(() => context.readBundleOwnedIds({ rgOwnedPackages: [0, -1] }, 'rgOwnedPackages'), /无效 ID/);
  assert.throws(() => context.readBundleOwnedIds({ rgOwnedApps: [0] }, 'rgOwnedApps'), /无效 ID/);
});

test('missing package ownership can use app ownership but cannot confirm an app-less package', async () => {
  const { context } = await bundleHarness();
  context.fetchJson = async () => ({ data: { rgOwnedApps: [10] } });
  assert.equal((await context.getBundlePrice('42', 'CN', 'CNY')).final, 6000);
  const owned = ownership();
  owned.packagesKnown = false;
  assert.throws(() => context.calculateBundleCompletion(details([packageItem(1, [], 100, 90)]), owned, 'CNY'), /无法确认所有权/);
});

test('ownership still rejects missing required collections and malformed IDs or maps', async () => {
  const { context } = await bundleHarness();
  for (const [data, key] of [
    [{}, 'rgOwnedApps'], [{ rgOwnedApps: null }, 'rgOwnedApps'],
    [{ rgOwnedApps: [10, 'bad'] }, 'rgOwnedApps'],
    [{ rgOwnedPackages: { 1: 'yes' } }, 'rgOwnedPackages'],
    [{ rgMasterSubApps: { bad: true } }, 'rgMasterSubApps']
  ]) assert.throws(() => context.readBundleOwnedIds(data, key), new RegExp(key));
});

test('bundle 72164 prices match its Steam package data when one or both games are owned', async () => {
  const { context } = await bundleHarness();
  // Anonymous CN bundle page: existing package discounts plus a 10% bundle discount.
  const data = details([packageItem(348063, [1044490], 8000, 3960), packageItem(563481, [1591490], 7000, 3150)]);
  assert.equal(context.calculateBundleCompletion(data, ownership(), 'CNY').final, 7110);
  assert.equal(context.calculateBundleCompletion(data, ownership([1044490]), 'CNY').final, 3150);
  assert.equal(context.calculateBundleCompletion(data, ownership([1591490]), 'CNY').final, 3960);
  assert.equal(context.calculateBundleCompletion(data, ownership([1044490, 1591490]), 'CNY').final, 0);
});

test('cart self purchases use completion while gifts keep full price and mixed recipients stay unknown', async () => {
  const { context } = await bundleHarness({ cart: true });
  assert.equal((await context.getBundlePrice('42', 'CN', 'CNY')).final, 6000);
  context.fetchJson = async () => ({ data: { response: { cart: { line_items: [
    { line_item_id: '1', bundleid: 42, flags: { is_gift: true } }
  ] } } } });
  vm.runInContext('bundleCartCache.clear();', context);
  const gift = await context.getBundlePrice('42', 'CN', 'CNY');
  assert.equal(gift.final, 9900);
  assert.equal(gift.fullBundle, true);
  assert.equal(gift.completion, undefined);
  context.fetchJson = async () => ({ data: { response: { cart: { line_items: [
    { line_item_id: '1', bundleid: 42, flags: { is_gift: true } },
    { line_item_id: '2', bundleid: 42, flags: { is_gift: false } }
  ] } } } });
  vm.runInContext('bundleCartCache.clear();', context);
  await assert.rejects(context.getBundlePrice('42', 'CN', 'CNY'), /不同收礼人/);
});

test('anonymous bundle page request checks region, bundle identity, JSON and currency increment', async () => {
  const { context } = await harness(['network.js', 'bundle-prices.js', 'regional-prices.js']);
  let country = 'CN', valid = true;
  const payload = JSON.stringify(details([packageItem(1, [10], 100, 90)]).data);
  context.DOMParser = class {
    parseFromString() {
      return { querySelector: selector => {
        if (selector === '#application_config') return { getAttribute: key => key === 'data-config' ? JSON.stringify({ COUNTRY: country }) : null };
        if (selector === '[data-ds-bundleid="42"][data-ds-bundle-data]') return { getAttribute: () => valid ? payload : '{broken' };
        return null;
      } };
    }
  };
  context.gmGet = async (url, options) => {
    assert.ok(url.includes('/bundle/42/?cc=CN'));
    assert.equal(options.anonymous, true);
    return '<script>GStoreItemData.SetCurrencyMinPriceIncrement(1);</script>';
  };
  assert.equal((await context.readRegionalBundleDetails('42', 'CN')).increment, 1);
  country = 'US';
  await assert.rejects(context.readRegionalBundleDetails('42', 'CN'), /地区不符/);
  country = 'CN'; valid = false;
  await assert.rejects(context.readRegionalBundleDetails('42', 'CN'), /不可解析/);
});
