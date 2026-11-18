import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { loggingSource } from './helpers/logging.mjs';

async function harness(extra = {}) {
  const context = vm.createContext({ GM_getValue: (_, fallback) => fallback, GM_setValue() {}, ...extra });
  const sources = await Promise.all(['shared.js', 'network.js', 'restrictions/database.js', 'restrictions/steam.js', 'restrictions/index.js']
    .map(path => readFile(new URL('../src/' + path, import.meta.url), 'utf8')));
  vm.runInContext(await loggingSource() + '\n' + sources.join('\n'), context);
  return context;
}
const rows = JSON.stringify([{ appid: 10, status: 0 }, { appid: 20, status: 1 }, { appid: 30, status: 2 }, { appid: 40, status: 3 }]);

test('database races range probes, pins revisions, downloads fastest valid source and caches daily', async () => {
  const context = await harness();
  const calls = [];
  const values = new Map();
  const sha = 'a'.repeat(40);
  const dependencies = {
    read: key => values.get(key), write: (key, value) => values.set(key, value), now: () => 100000,
    sources: ['slow', 'fast'].map(id => ({ id, url: ref => `${id}/${ref}` })),
    request: async (url, options) => {
      calls.push({ url, options });
      if (url.includes('api.github.com')) return { text: JSON.stringify([{ sha }]) };
      if (options.probe) return { ms: url.startsWith('fast') ? 5 : 50 };
      return { text: rows, ms: 20 };
    }
  };
  const database = context.createRestrictionDatabase(dependencies);
  const [first, second] = await Promise.all([database.load(), database.load()]);
  assert.equal(first, second);
  assert.equal(first.get(10), 0);
  assert.equal(first.get(40), 3);
  assert.equal(calls.filter(call => call.options.probe).length, 2);
  assert.equal(calls.at(-1).url, `fast/${sha}`);
  const count = calls.length;
  assert.equal((await context.createRestrictionDatabase(dependencies).load()).get(20), 1);
  assert.equal(calls.length, count);
});

test('invalid fastest response falls back, while all failures can retain stale valid data', async () => {
  const context = await harness();
  const calls = [];
  const database = context.createRestrictionDatabase({ read() {}, write() {},
    sources: ['bad', 'good'].map(id => ({ id, url: () => id })),
    request: async (url, options) => {
      if (url.includes('api.github.com')) throw Error('offline');
      if (options.probe) return { ms: url === 'bad' ? 1 : 2 };
      calls.push(url);
      return { text: url === 'bad' ? '<html>proxy error</html>' : rows };
    }
  });
  assert.equal((await database.load()).get(30), 2);
  assert.deepEqual(calls, ['bad', 'good']);
  const stale = context.createRestrictionDatabase({
    read: () => ({ version: 1, updated: 1, rows: [[10, 0]] }), write() {}, now: () => 1000000000,
    sources: [{ id: 'down', url: () => 'down' }], request: async () => { throw Error('offline'); }
  });
  assert.equal((await stale.load()).get(10), 0);
  for (const text of ['[]', '[{"appid":10,"status":4}]', '[{"appid":10,"status":0},{"appid":10,"status":2}]']) {
    assert.throws(() => context.parseRestrictionDatabase(text));
  }
});

test('status zero is a database hit; missing and invalid apps use Steam once, unknown never becomes normal', async () => {
  const context = await harness();
  const calls = [];
  const resolve = context.createRestrictionResolver({ load: async () => new Map([[10, 0], [20, 1], [30, 2], [40, 3]]) },
    { lookup: async id => { calls.push(id); return id === 50 ? 2 : null; } });
  for (const [id, status] of [[10, 0], [20, 1], [30, 2], [40, 3], [50, 2]]) {
    assert.equal((await resolve(id)).status, status);
  }
  assert.equal(await resolve(60), null);
  await Promise.all([resolve(50), resolve(50)]);
  assert.deepEqual(calls, [40, 50, 60]);
});

test('Steam parser requires an actual app feature panel and distinguishes learning and restricted labels', async () => {
  const context = await harness();
  const doc = (label, valid = true, url = 'https://store.steampowered.com/app/10/') => ({
    querySelector(selector) {
      if (selector === 'link[rel="canonical"]') return { getAttribute: () => url };
      return valid ? {} : null;
    },
    querySelectorAll: () => label ? [{ textContent: label, querySelector: () => ({ textContent: label }) }] : []
  });
  assert.equal(context.parseSteamRestriction(doc('Profile Features Limited'), 10), 2);
  assert.equal(context.parseSteamRestriction(doc('Steam is learning about this game'), 10), 1);
  assert.equal(context.parseSteamRestriction(doc(''), 10), 0);
  assert.equal(context.parseSteamRestriction(doc('', false), 10), null);
  assert.equal(context.parseSteamRestriction(doc('', true, 'https://store.steampowered.com/'), 10), null);
});

test('Steam fallback limits concurrency, deduplicates apps and persists confirmed status', async () => {
  const context = await harness();
  let running = 0;
  let peak = 0;
  let requests = 0;
  const values = new Map();
  const service = context.createSteamRestrictionLookup({
    read: key => values.get(key), write: (key, value) => values.set(key, value),
    wait: async () => {},
    parse: () => 1,
    request: async () => { requests++; running++; peak = Math.max(peak, running); await Promise.resolve(); running--; return 'html'; }
  });
  await Promise.all([10, 10, 20, 30, 40].map(id => service.lookup(id)));
  assert.equal(requests, 4);
  assert.equal(peak, 1);
  const cached = context.createSteamRestrictionLookup({ read: key => values.get(key), write() {},
    request: () => { throw Error('must not request'); } });
  assert.equal(await cached.lookup(10), 1);
});

test('badge mounts next to game title, updates recycled AppIDs and ignores its own observer mutations', async () => {
  let observer;
  let scheduled;
  let id = '10';
  const badges = [];
  const row = { getAttribute: key => key === 'data-ds-appid' ? id : null };
  const title = {
    textContent: 'Game', isConnected: true,
    closest: selector => selector.startsWith('[data-rfd-') ? row : null,
    matches: () => false,
    querySelectorAll: () => [...badges], querySelector: () => badges[0] || null,
    appendChild(badge) { badges.push(badge); }
  };
  const context = await harness({
    location: { hostname: 'store.steampowered.com', pathname: '/search/' },
    setTimeout: callback => { scheduled = callback; return 1; },
    setInterval() { return 1; }, clearInterval() {}, window: { addEventListener() {} },
    MutationObserver: class { constructor(callback) { observer = callback; } observe() {} },
    document: {
      head: { appendChild() {} }, body: {}, querySelectorAll: () => [title],
      addEventListener() {},
      createElement() { return { setAttribute() {}, remove() { badges.splice(badges.indexOf(this), 1); } }; }
    }
  });
  vm.runInContext(`createRestrictionDatabase = () => ({load: async () => new Map([[10, 0], [20, 2]])});
    createSteamRestrictionLookup = () => ({lookup: async () => null}); initializeRestrictionBadges();`, context);
  const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
  scheduled(); scheduled = null;
  await flush();
  assert.equal(badges.length, 1);
  assert.equal(badges[0].textContent, '非受限');
  observer([{ type: 'childList', target: title, addedNodes: [{ nodeType: 1, matches: () => true }], removedNodes: [] }]);
  assert.equal(scheduled, null);
  id = '20';
  observer([{ type: 'attributes', target: title }]);
  scheduled(); scheduled = null;
  await flush();
  assert.equal(badges.length, 1);
  assert.equal(badges[0].textContent, '受限');
});

test('expired database serves cached data immediately, replaces old rows and refreshes again after 24 hours', async () => {
  const context = await harness();
  const key = 'sse_restrictions_database_v1';
  const day = 86400000;
  let time = day + 100;
  const values = new Map([[key, { version: 1, updated: 1, rows: [[10, 0], [99, 2]] }]]);
  let downloads = 0;
  let notify = 0;
  let release;
  const database = context.createRestrictionDatabase({
    read: key => values.get(key), write: (key, value) => values.set(key, value), now: () => time,
    sources: [{ id: 'test', url: () => 'data' }],
    request: async (url, options) => {
      if (url.includes('api.github.com')) throw Error('offline');
      if (options.probe) return { ms: 1 };
      downloads++;
      return new Promise(resolve => { release = () => resolve({ text: JSON.stringify([{ appid: 10, status: downloads === 1 ? 2 : 1 }]) }); });
    }
  });
  database.subscribe(() => notify++);
  assert.equal((await database.load()).get(10), 0);
  for (let i = 0; i < 20; i++) await Promise.resolve();
  assert.equal(downloads, 1);
  release();
  for (let i = 0; i < 20; i++) await Promise.resolve();
  assert.equal((await database.load()).get(10), 2);
  assert.equal((await database.load()).has(99), false);
  assert.equal(values.get(key).rows.length, 1);
  assert.equal(values.get(key).updated, time);
  assert.equal(notify, 1);
  time += day - 1;
  await database.load();
  assert.equal(downloads, 1);
  time += 1;
  assert.equal((await database.load()).get(10), 2);
  for (let i = 0; i < 20; i++) await Promise.resolve();
  assert.equal(downloads, 2);
  release();
  for (let i = 0; i < 20; i++) await Promise.resolve();
  assert.equal((await database.load()).get(10), 1);
  assert.equal(notify, 2);
});

test('homepage title selection includes current tab rows and carousel names and reads their own AppIDs', async () => {
  const context = await harness({ location: { pathname: '/' } });
  let selectors = '';
  const title = {
    matches: () => false,
    closest(selector) {
      selectors = selector;
      return { getAttribute: key => key === 'data-ds-appid' ? '4232910' : null };
    }
  };
  assert.equal(context.restrictionAppId(title), 4232910);
  assert.match(selectors, /data-ds-appid/);
  // Actual current homepage markup uses .tab_item_title, not .tab_item_name.
  const source = await readFile(new URL('../src/restrictions/index.js', import.meta.url), 'utf8');
  assert.match(source, /\.tab_item_title/);
  assert.match(source, /\.store_main_capsule \.app_name/);
});

test('homepage sibling titles resolve the card app and preserve demo identity from data attributes', async () => {
  const context = await harness({ location: { pathname: '/' } });
  for (const cardClass of ['.community_recommendation_app', '.home_content.single']) {
    const link = { getAttribute: key => ({ 'data-ds-appid': '5520360', href: '/app/5517930/' })[key] };
    const title = {
      matches: () => false,
      closest: selector => selector.includes(cardClass) ? { querySelector: () => link } : null
    };
    assert.equal(context.restrictionAppId(title), 5520360);
    link.getAttribute = key => key === 'href' ? '/app/5517930/' : null;
    assert.equal(context.restrictionAppId(title), 5517930);
    link.getAttribute = key => key === 'data-ds-appid' ? '10,20' : '/app/10/';
    assert.equal(context.restrictionAppId(title), null);
  }
});

test('unconfirmed fallback is deduplicated then retried after 15 minutes without reloading the page', async () => {
  const context = await harness();
  let time = 1;
  let requests = 0;
  const steam = context.createSteamRestrictionLookup({
    read() {}, write() {}, now: () => time,
    wait: async ms => { time += ms; },
    request: async () => { requests++; return ''; },
    parse: () => requests === 1 ? null : 2
  });
  const resolve = context.createRestrictionResolver({ load: async () => new Map() }, steam, () => time);
  assert.equal(await resolve(10), null);
  assert.equal(await resolve(10), null);
  assert.equal(requests, 1);
  time += 15 * 60 * 1000;
  assert.equal((await resolve(10)).status, 2);
  assert.equal(requests, 2);
});

test('Steam confirmed cache never expires or evicts older entries and database still has priority', async () => {
  const context = await harness();
  const values = new Map([['sse_restrictions_steam_v1', { 10: { status: 1, updated: 1 } }]]);
  let requests = 0;
  const steam = context.createSteamRestrictionLookup({
    read: key => values.get(key), write: (key, value) => values.set(key, value),
    now: () => 365 * 86400000, wait: async () => {}, parse: () => 2,
    request: async () => { requests++; return ''; }
  });
  assert.equal(await steam.lookup(10), 1);
  await steam.lookup(20);
  assert.equal(values.get('sse_restrictions_steam_v1')[10].status, 1);
  const resolve = context.createRestrictionResolver({ load: async () => new Map([[10, 0]]) }, steam);
  assert.equal((await resolve(10)).status, 0);
  assert.equal(requests, 1);
});

test('Steam requests start four seconds apart and persisted blocking cooldown prevents queued and reloaded requests', async () => {
  const context = await harness();
  const values = new Map();
  let time = 100;
  const starts = [];
  const dependencies = {
    read: key => values.get(key), write: (key, value) => values.set(key, value),
    now: () => time, wait: async ms => { time += ms; }, parse: () => 0,
    request: async () => {
      starts.push(time);
      if (starts.length === 2) throw Object.assign(Error('HTTP 429'), { status: 429 });
      return '';
    }
  };
  const steam = context.createSteamRestrictionLookup(dependencies);
  const results = await Promise.all([10, 20, 30].map(id => steam.lookup(id)));
  assert.deepEqual(results, [0, null, null]);
  assert.deepEqual(starts, [100, 4100]);
  const reload = context.createSteamRestrictionLookup(dependencies);
  assert.equal(await reload.lookup(40), null);
  assert.equal(starts.length, 2);
  time += 15 * 60000;
  assert.equal(await reload.lookup(40), 0);
  assert.equal(starts.length, 3);
});

test('three unconfirmed Steam pages pause the remaining queue', async () => {
  const context = await harness();
  let time = 100;
  let requests = 0;
  const steam = context.createSteamRestrictionLookup({ read() {}, write() {},
    now: () => time, wait: async ms => { time += ms; }, parse: () => null,
    request: async () => { requests++; return ''; }
  });
  await Promise.all([10, 20, 30, 40].map(id => steam.lookup(id)));
  assert.equal(requests, 3);
});

test('wishlist restriction badges accept game names and reject artwork, discount and purchase links', async () => {
  const context = await harness();
  const link = (text, child = false, parent = false) => ({
    textContent: text, querySelector: () => child ? {} : null, closest: () => parent ? {} : null
  });
  assert.equal(context.isRestrictionWishlistTitle(link('ELDEN RING')), true);
  assert.equal(context.isRestrictionWishlistTitle(link('-80% $1.63 (¥10.87)')), false);
  assert.equal(context.isRestrictionWishlistTitle(link('Free To Play', true)), false);
  assert.equal(context.isRestrictionWishlistTitle(link('Buy', false, true)), false);
  assert.equal(context.isRestrictionWishlistTitle(link('Artwork', true)), false);
});

test('wishlist title gives the name a separate ellipsis container and preserves the badge and original nodes', async () => {
  const context = await harness({ document: { createElement: () => ({
    children: [], appendChild(node) { this.children.push(node); }
  }) } });
  const name = { nodeType: 3, textContent: 'A very long game name' };
  const badge = { nodeType: 1, matches: () => true };
  let wrapper;
  const title = {
    closest: () => ({}), childNodes: [name, badge],
    querySelector: () => wrapper,
    prepend(node) { wrapper = node; },
    classList: { add(value) { assert.equal(value, 'sse-restriction-wishlist-title'); } }
  };
  context.prepareRestrictionWishlistTitle(title);
  context.prepareRestrictionWishlistTitle(title);
  assert.equal(wrapper.className, 'sse-restriction-title-text');
  assert.deepEqual(wrapper.children, [name]);
});
