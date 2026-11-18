  const RESTRICTION_LABELS = Object.freeze({
    0: { text: '非受限', className: 'normal' },
    1: { text: 'Steam 正在了解', className: 'learning' },
    2: { text: '受限', className: 'restricted' },
    3: { text: '无效', className: 'invalid' }
  });

  function createRestrictionResolver(database, steam, now = () => Date.now()) {
    const pending = new Map();
    const retryAt = new Map();
    database.subscribe?.(() => { pending.clear(); retryAt.clear(); });
    return appid => {
      if (!Number.isSafeInteger(appid) || appid <= 0) return Promise.resolve(null);
      if (retryAt.has(appid) && now() >= retryAt.get(appid)) { pending.delete(appid); retryAt.delete(appid); }
      if (!pending.has(appid)) pending.set(appid, (async () => {
        const data = await database.load();
        const status = data?.get(appid);
        if ([0, 1, 2].includes(status)) return { status, source: 'database' };
        const live = await steam.lookup(appid);
        if ([0, 1, 2].includes(live)) return { status: live, source: 'steam' };
        retryAt.set(appid, now() + 15 * 60 * 1000);
        diagnostics.scope('restrictions').debug('resolve.unconfirmed', 'Steam 未能确认游戏状态，稍后重试', { appid, databaseStatus: status });
        return status === 3 ? { status: 3, source: 'database' } : null;
      })().catch(error => {
        retryAt.set(appid, now() + 15 * 60 * 1000);
        diagnostics.scope('restrictions').error('resolve.failed', '游戏受限状态查询失败', { appid, error });
        return null;
      }));
      return pending.get(appid);
    };
  }

  function restrictionAppId(title, path = location.pathname) {
    if (title.matches('#appHubAppName')) return Number(path.match(/^\/app\/(\d+)/)?.[1]) || null;
    const row = title.closest('[data-rfd-draggable-id^="WishlistItem-"], [data-ds-appid], [data-app-id], .search_result_row, .tab_item, .wishlist_row, .gameListRow, .recommendation_link');
    if (row) {
      const id = row.getAttribute('data-rfd-draggable-id')?.match(/^WishlistItem-(\d+)-/)?.[1] ||
        row.getAttribute('data-ds-appid') || row.getAttribute('data-app-id');
      if (/^\d+$/.test(id || '')) return Number(id);
      // A multi-app capsule or package must not inherit the current detail page's AppID.
      if (id) return null;
      const href = row.getAttribute('href') || row.querySelector('a[href*="/app/"]')?.getAttribute('href');
      const found = href?.match(/\/app\/(\d+)(?:\/|$|\?)/);
      if (found) return Number(found[1]);
    }
    const link = title.closest('a[href*="/app/"]');
    if (link) return Number(link.getAttribute('href')?.match(/\/app\/(\d+)(?:\/|$|\?)/)?.[1]) || null;
    // These homepage titles sit beside, rather than inside, their app link.
    const card = title.closest('.community_recommendation_app, .home_content.single');
    const appLink = card?.querySelector('a[href*="/app/"]');
    const id = appLink?.getAttribute('data-ds-appid');
    if (id) return /^\d+$/.test(id) ? Number(id) : null;
    return Number(appLink?.getAttribute('href')?.match(/\/app\/(\d+)(?:\/|$|\?)/)?.[1]) || null;
  }

  function isRestrictionWishlistTitle(link) {
    if (link.querySelector('img, [class*="price" i], [class*="discount" i], .sse-extra-price, .sse-cart-button')) return false;
    if (link.closest('[class*="price" i], [class*="discount" i], .game_purchase_action')) return false;
    // New wishlist purchase links also point to /app/, but contain prices rather than a title.
    const text = link.textContent.trim();
    return Boolean(text) && !/(?:[$€£¥₹₽₩₺₴₫฿]|\b(?:USD|EUR|CNY|RMB|HKD|TWD|JPY|KRW)\b|[-−]\s*\d+\s*%)/i.test(text);
  }

  function prepareRestrictionWishlistTitle(title) {
    if (!title.closest('.wishlist_row, [data-rfd-draggable-id^="WishlistItem-"]')) return;
    let text = title.querySelector('.sse-restriction-title-text');
    if (!text) {
      text = createElement('span', '', 'sse-restriction-title-text');
      // Keep the original nodes and link handlers while giving only the name an ellipsis.
      for (const child of [...title.childNodes]) {
        if (child.nodeType === 1 && child.matches('.sse-restriction-badge')) continue;
        text.appendChild(child);
      }
      title.prepend(text);
    }
    title.classList.add('sse-restriction-wishlist-title');
  }

  function initializeRestrictionBadges() {
    const log = diagnostics.scope('restrictions');
    if (!/^(store\.steampowered\.com|steamcommunity\.com)$/.test(location.hostname) ||
        !GM_getValue('sse_restrictions_enabled', true)) return;
    const scope = createFeatureScope('restrictions');
    const read = key => GM_getValue(key, null);
    const write = (key, value) => GM_setValue(key, value);
    const database = createRestrictionDatabase({ read, write, request: (url, options) => restrictionRequest(url, { ...options, signal: scope.signal }) });
    const resolve = createRestrictionResolver(database, createSteamRestrictionLookup({ read, write, signal: scope.signal }));
    const style = createElement('style');
    style.textContent = `
      .sse-restriction-badge{display:inline-block!important;vertical-align:middle;margin-left:6px;padding:2px 5px;border-radius:2px;font:600 11px/1.4 Arial,sans-serif;white-space:nowrap;text-decoration:none!important;letter-spacing:normal;text-shadow:none;pointer-events:none}
      .sse-restriction-normal{background:#237447;color:#e4ffed!important}
      .sse-restriction-learning{background:#e6b642;color:#302407!important}
      .sse-restriction-restricted{background:#ac3038;color:#fff0f1!important}
      .sse-restriction-invalid{background:#505965;color:#f0f2f5!important}
      .sse-restriction-wishlist-title{display:flex!important;align-items:center;min-width:0;max-width:100%;overflow:hidden;text-overflow:clip!important}
      .sse-restriction-wishlist-title>.sse-restriction-title-text{flex:0 1 auto;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
      .sse-restriction-wishlist-title>.sse-restriction-badge{flex:0 0 auto}
    `;
    document.head.appendChild(style);
    scope.own(() => {
      revision++;
      style.remove();
      document.querySelectorAll('.sse-restriction-badge').forEach(node => node.remove());
      document.querySelectorAll('.sse-restriction-title-text').forEach(node => node.replaceWith(...node.childNodes));
      document.querySelectorAll('.sse-restriction-wishlist-title').forEach(node => node.classList.remove('sse-restriction-wishlist-title'));
    });
    const selector = PAGE_ADAPTERS.restrictions.titles;
    let states = new WeakMap();
    let revision = 0;
    async function enhance(title) {
      if (title.closest('#sapx-ui-root, #sse-family-dialog, #sse-cart-tools') || !title.textContent.trim()) return;
      // Wishlist app links include artwork and purchase links as well as the game name.
      if (title.matches('[data-rfd-draggable-id^="WishlistItem-"] a') && !isRestrictionWishlistTitle(title)) {
        title.querySelectorAll('.sse-restriction-badge').forEach(badge => badge.remove());
        states.delete(title);
        return;
      }
      // Select the innermost title when the carousel wraps its name in another div.
      if (title.matches('.store_main_capsule .app_name') && title.querySelector('div')) return;
      const appid = restrictionAppId(title);
      const previous = states.get(title);
      if (!appid) {
        title.querySelectorAll('.sse-restriction-badge').forEach(badge => badge.remove());
        states.delete(title);
        return;
      }
      if (previous?.appid === appid && (previous.pending ||
          (previous.retryAt ? Date.now() < previous.retryAt : title.querySelector('.sse-restriction-badge')))) return;
      title.querySelectorAll('.sse-restriction-badge').forEach(badge => badge.remove());
      const state = { appid, pending: true };
      const startedRevision = revision;
      states.set(title, state);
      const result = await resolve(appid);
      if (!scope.active || !title.isConnected || revision !== startedRevision || states.get(title) !== state || restrictionAppId(title) !== appid) return;
      state.pending = false;
      if (!result || result.status === 3) state.retryAt = Date.now() + 15 * 60 * 1000;
      if (!result) return;
      const label = RESTRICTION_LABELS[result.status];
      const badge = createElement('span', label.text, `sse-restriction-badge sse-restriction-${label.className}`);
      badge.setAttribute('data-sse-restriction-appid', String(appid));
      badge.title = `${label.text} · ${result.source === 'steam' ? 'Steam 商店实时查询' : '受限游戏数据库'} · AppID ${appid}`;
      const existing = title.querySelector('.sse-restriction-badge');
      if (existing) existing.remove();
      prepareRestrictionWishlistTitle(title);
      title.appendChild(badge);
      log.debug('badge.render', '游戏受限状态已显示', { appid, ...result });
    }
    const scanner = createDomScanner({ scope, selector, name: 'restrictions', attributes: ITEM_ATTRIBUTES, process: titles => {
      log.debug('scan', '扫描游戏标题', { count: titles.length });
      titles.forEach(title => { enhance(title).catch(error => log.error('badge.failed', '游戏受限标记失败', { error })); });
    } });
    const scan = () => scanner.scan();
    const unsubscribe = database.subscribe?.(() => {
      revision++;
      states = new WeakMap();
      scan();
    });
    if (unsubscribe) scope.own(unsubscribe);
    // Recheck on long-lived tabs and when returning from a suspended/background tab.
    const refresh = () => {
      database.load().catch(error => log.warn('refresh.failed', '数据库刷新失败', { error }));
      scan();
    };
    scope.interval(() => { if (!document.hidden) refresh(); }, 60 * 1000);
    scope.listen(window, 'pageshow', refresh);
    scope.listen(document, 'visibilitychange', () => { if (!document.hidden) refresh(); });
    log.info('initialize', '游戏受限状态标记已启用');
    scan();
  }
