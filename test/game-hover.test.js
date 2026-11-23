import assert from 'node:assert/strict';
import test from 'node:test';
import { harness } from './helpers/runtime.mjs';

test('hover card stays on the left even when the right side has more room', async () => {
  const { context } = await harness(['game-hover.js']);
  const row = { left: 400, right: 1000, top: 94, bottom: 146 };
  const viewport = { width: 1600, height: 750 };
  const placement = context.gameHoverPlacement(row, viewport);
  assert.equal(placement.side, 'left');
  assert.equal(placement.left, 68);

  const narrow = context.gameHoverPlacement({ ...row, left: 0, right: 320 }, { width: 1000, height: 500 });
  assert.equal(narrow.side, 'below');
  assert.equal(narrow.width, 324);
  assert.equal(narrow.maxHeight, 338);
});

test('hover card reads Steam review totals without confusing missing data and no reviews', async () => {
  const { context } = await harness(['game-hover.js']);
  const { gameHoverReviews } = context;
  assert.equal(gameHoverReviews({ response: { query_summary: { total_positive: 9, total_reviews: 10 } } }), '90% 好评（10 条）');
  assert.equal(gameHoverReviews({ query_summary: { total_positive: 0, total_reviews: 10 } }), '0% 好评（10 条）');
  assert.equal(gameHoverReviews({ success: 1, query_summary: { total_positive: 9, total_reviews: 10 } }), '90% 好评（10 条）');
  assert.equal(gameHoverReviews({ success: 1, query_summary: { total_positive: 0, total_reviews: 0 } }), '暂无评测（0 条）');
  assert.equal(gameHoverReviews({ success: 1, query_summary: { total_positive: 10, total_reviews: 9 } }), null);
  assert.equal(gameHoverReviews({ success: 0 }), null);
});

test('hover details extract only the first five tags and distinguish language columns', async () => {
  const { context } = await harness(['game-hover.js']);
  const text = textContent => ({ textContent });
  const cell = (name, checked = false) => ({ ...text(name), querySelector: () => checked ? {} : null });
  const fields = new Map([
    ['link[rel="canonical"]', { getAttribute: () => 'https://store.steampowered.com/app/42/' }],
    ['#appHubAppName, .apphub_AppName', text(' Example ')],
    ['.early_access_header, .early_access_banner, #earlyAccessHeader', {}],
    ['.game_description_snippet', text(' Description. ')]
  ]);
  const doc = {
    querySelector: selector => fields.get(selector) || (selector === '.game_description_snippet, #appHubAppName, .apphub_AppName' ? fields.get('.game_description_snippet') : null),
    querySelectorAll(selector) {
      if (selector === 'table.game_language_options tr') return [
        { querySelectorAll: () => [cell('英语'), cell('', true), cell('✔'), cell('')] },
        { querySelectorAll: () => [cell('简体中文'), cell('', true), cell(''), cell('', true)] }
      ];
      if (selector === '.glance_tags a.app_tag') return ['A', 'B', 'C', 'D', 'E', 'F'].map(text);
      for (const key of ['publisher', 'developer', 'franchise']) {
        if (selector.startsWith(`#${key}_row`)) return [text(key)];
      }
      return [];
    }
  };
  assert.deepEqual(JSON.parse(JSON.stringify(context.parseGameHoverPage(doc, '42'))), {
    name: 'Example', publishers: 'publisher', developers: 'developer', franchises: 'franchise', earlyAccess: true,
    languages: [['英语', '简体中文'], ['英语'], ['简体中文']], tags: ['A', 'B', 'C', 'D', 'E'], description: 'Description.', reviews: null
  });
  assert.equal(context.parseGameHoverPage(doc, '43'), null);
  fields.delete('#appHubAppName, .apphub_AppName');
  assert.equal(context.parseGameHoverPage(doc, '42'), null);
});

test('hover target resolves a React wishlist row and ignores store package links', async () => {
  const { context } = await harness(['wishlist-sale.js', 'game-hover.js']);
  context.location.origin = 'https://store.steampowered.com';
  const row = {
    closest: selector => selector === 'a[href]' ? null : row,
    matches: selector => selector.includes('.wishlist_row'),
    getAttribute: key => key === 'data-rfd-draggable-id' ? 'WishlistItem-42' : null
  };
  assert.equal(context.findGameHoverItem({ closest: selector => selector === 'a[href]' ? null : row }).row, row);
  assert.equal(context.findGameHoverItem(row).id, '42');

  const packageLink = { href: 'https://store.steampowered.com/sub/123/', closest: () => null, matches: selector => selector === 'a[href]' };
  assert.equal(context.findGameHoverItem({ closest: () => packageLink }), null);
});

test('store capsule links inside a broad container retain the hovered game ID', async () => {
  const { context } = await harness(['wishlist-sale.js', 'game-hover.js']);
  context.location.origin = 'https://store.steampowered.com';
  const row = { closest: () => row, matches: () => false, getAttribute: () => null, querySelectorAll: selector =>
    selector.includes('href') ? [link, { getAttribute: () => '/app/43/' }] : [] };
  const link = { href: 'https://store.steampowered.com/app/42/', getAttribute: () => '/app/42/' };
  const target = { closest: selector => selector === 'a[href]' ? link : row };
  assert.equal(context.findGameHoverItem(target).row, link);
  assert.equal(context.findGameHoverItem(target).id, '42');
});

test('hover review fallback uses the overall store summary and preserves its source', async () => {
  const { context } = await harness(['game-hover.js']);
  const row = {
    getAttribute: key => key === 'data-tooltip-html' ? '１,２３４ 篇评测中有 ９１％ 为好评' : null,
    querySelector: () => null
  };
  assert.equal(context.parseGameHoverStoreReviews({ querySelector: () => row }), '91% 好评（1,234 条） · 商店摘要');
  assert.equal(context.parseGameHoverStoreReviews({ querySelector: () => null }), null);
});

test('friend activity recognizes game names from store and community links inside the feed', async () => {
  const { context } = await harness(['game-hover.js']);
  Object.assign(context.location, {
    hostname: 'steamcommunity.com', origin: 'https://steamcommunity.com', href: 'https://steamcommunity.com/id/player/home/'
  });
  for (const path of ['/my/home', '/id/player/home/', '/profiles/76561198000000000/home']) {
    context.location.pathname = path;
    assert.equal(context.isGameHoverPage(), true);
  }
  context.location.pathname = '/id/player/friends/';
  assert.equal(context.isGameHoverPage(), false);

  function hoverLink(href, textContent = 'Game name', inFeed = true) {
    const link = { href, textContent, closest: () => inFeed ? {} : null };
    return { link, result: context.findGameHoverItem({ closest: () => link }) };
  }
  for (const href of ['https://store.steampowered.com/app/42/Game/', 'https://steamcommunity.com/app/42/']) {
    const { link, result } = hoverLink(href);
    assert.equal(result.row, link);
    assert.equal(result.id, '42');
  }
  assert.equal(hoverLink('https://example.com/app/42/').result, null);
  assert.equal(hoverLink('https://steamcommunity.com/id/player/').result, null);
  assert.equal(hoverLink('https://steamcommunity.com/app/42/', ' ').result, null);
  assert.equal(hoverLink('https://steamcommunity.com/app/42/', 'Game name', false).result, null);
});

test('friend activity loads both the game page and its fallback from the Steam store', async () => {
  const requests = [];
  const { context, document } = await harness(['game-hover.js'], {
    gmGet: async url => { requests.push(url); return '{}'; }
  });
  Object.assign(context.location, { origin: 'https://steamcommunity.com', pathname: '/my/home/' });
  document.createElement = () => ({ content: { querySelector: () => null } });
  await context.loadGameHoverDetails('42', 'schinese', { signal: new AbortController().signal });
  assert.deepEqual(requests, [
    'https://store.steampowered.com/app/42/?l=schinese',
    'https://store.steampowered.com/api/appdetails?appids=42&l=schinese'
  ]);
});

test('hover fills localized tags and reads only explicit Steam franchises when the store HTML is unavailable', async () => {
  const calls = [];
  const { context } = await harness(['game-hover.js'], {
    gmGet: async address => {
      const url = new URL(address);
      calls.push(url);
      if (url.pathname.includes('GetTagList')) {
        return JSON.stringify({ response: { tags: [{ tagid: 1695, name: '开放世界' }, { tagid: 4115, name: '赛博朋克' }] } });
      }
      const [{ appid }] = JSON.parse(url.searchParams.get('input_json')).ids;
      const basic_info = appid === 620 ? { franchises: [{ name: 'Portal' }] } : { publishers: [{ name: 'CD PROJEKT RED' }] };
      return JSON.stringify({ response: { store_items: [{ appid, basic_info, tags: [{ tagid: 4115 }, { tagid: 1695 }] }] } });
    }
  });
  const session = { language: 'schinese', country: 'CN' };
  const options = { signal: new AbortController().signal };
  const tagNames = await context.loadGameHoverTagNames(session.language, options);
  const cache = { get: async () => tagNames };
  const cyberpunk = await context.fillGameHoverMetadata({ tags: [] }, '1091500', session, options, cache);
  assert.deepEqual(Array.from(cyberpunk.tags), ['赛博朋克', '开放世界']);
  assert.equal(cyberpunk.franchises, '');
  const portal = await context.fillGameHoverMetadata({ tags: [] }, '620', session, options, cache);
  assert.equal(portal.franchises, 'Portal');
  const withoutNames = await context.fillGameHoverMetadata({ tags: ['原标签'] }, '620', session, options, {
    get: async () => { throw new Error('标签列表不可用'); }
  });
  assert.deepEqual(withoutNames.tags, ['原标签']);
  assert.equal(withoutNames.franchises, 'Portal');
  assert.equal(calls[0].searchParams.get('language'), 'schinese');
  assert.equal(JSON.parse(calls[1].searchParams.get('input_json')).data_request.include_tag_count, 5);
});

test('hover reviews use the current Steamworks endpoint and request all languages', async () => {
  const calls = [];
  const { context } = await harness(['game-hover.js'], {
    gmGet: async (url, options) => {
      calls.push({ url: new URL(url), options });
      return JSON.stringify({ response: { query_summary: { total_positive: 19, total_reviews: 20 } } });
    }
  });
  assert.equal(await context.loadGameHoverReviews('42', { timeout: 8000 }), '95% 好评（20 条）');
  const [{ url, options }] = calls;
  assert.equal(url.origin + url.pathname, 'https://api.steampowered.com/IUserReviewsService/GetAppReviews/v1/');
  assert.deepEqual(JSON.parse(url.searchParams.get('input_json')), {
    appid: 42, languages: ['all'], filter: 0, cursor: '*', review_type: 0, purchase_type: 1, num_per_page: 1
  });
  assert.equal(options.anonymous, true);
});
