  function wishlistSaleEndTimestamp(item) {
    if (!item || typeof item !== 'object') return null;
    const options = [item.best_purchase_option, ...(Array.isArray(item.purchase_options) ? item.purchase_options : []), item];
    for (const option of options) {
      for (const discount of option?.active_discounts || []) {
        const value = Number(discount?.discount_end_date || discount?.discount_expiration);
        if (Number.isFinite(value) && value > 0) return value < 1e12 ? value * 1000 : value;
      }
      const value = Number(option?.discount_end_date || option?.discount_expiration);
      if (Number.isFinite(value) && value > 0) return value < 1e12 ? value * 1000 : value;
    }
    return null;
  }

  function formatWishlistSaleCountdown(milliseconds) {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const remainder = (seconds % 60).toString().padStart(2, '0');
    return (days ? days + '天 ' : '') + hours + ':' + minutes + ':' + remainder;
  }

  function findWishlistSalePrice(row) {
    const blocks = [...row.querySelectorAll('.discount_block')];
    const discountedBlock = blocks.find(block => {
      if (Number(block.getAttribute('data-discount')) > 0) return true;
      return [...block.querySelectorAll('.discount_pct')].some(element => /^\s*-\s*\d+\s*%\s*$/.test(element.textContent));
    });
    if (discountedBlock) return discountedBlock;

    // Steam's current React wishlist renders prices inside an app link and uses hashed classes.
    const links = [...(row.matches?.('a[href*="/app/"]') ? [row] : []), ...row.querySelectorAll('a[href*="/app/"]')];
    for (const link of links) {
      const accessiblePrice = [...link.querySelectorAll('[aria-label]')].find(element =>
        /(?:立省|节省|save)\s*\d+\s*%/i.test(element.getAttribute('aria-label') || '')
      );
      if (accessiblePrice) return link;
      const percent = [...link.querySelectorAll('div, span')].find(element =>
        element.children.length === 0 && /^\s*-\s*\d+\s*%\s*$/.test(element.textContent)
      );
      if (percent) return percent;
    }
    return null;
  }

  function findWishlistSaleBadgePosition(row, price) {
    const priceLink = price.closest?.('a[href*="/app/"]') || price;
    // Find the nearest wrapper containing both the price and cart actions, then
    // place the badge after that wrapper rather than inside the bordered price card.
    for (let parent = priceLink.parentElement; parent && parent !== row; parent = parent.parentElement) {
      if (parent.querySelector('button, [role="button"]') && parent.parentElement) {
        return { container: parent.parentElement, reference: parent.nextSibling };
      }
    }
    const priceContainer = priceLink.parentElement;
    return priceContainer?.parentElement
      ? { container: priceContainer.parentElement, reference: priceContainer.nextSibling }
      : { container: priceContainer, reference: priceLink.nextSibling };
  }

  function normalizeStoreSaleRow(row) {
    return row.closest?.('a.search_result_row, a.tab_item, a.tab_row_item, a.recommendation_link, .store_main_capsule, .store_capsule, .small_cap, .large_cap, .wishlist_row, .wishlistRowItem, [data-rfd-draggable-id^="WishlistItem-"]') ||
      row.closest?.('[data-ds-appid], [data-app-id]') || row;
  }

  function isVisibleSaleRow(row) {
    return row.isConnected && (!row.getClientRects || row.getClientRects().length > 0);
  }

  function storeSaleCountdownStyle() {
    return '.sse-wishlist-sale-expiration{display:block;margin:5px 0 0;color:#9acb7a;font-size:11px;line-height:1.4;white-space:normal;pointer-events:none}.sse-wishlist-sale-expiration.sse-ending-soon{color:#e6a15a}.sse-wishlist-sale-expiration.sse-sale-ended{color:#e46767}' +
      '.tab_row_item .sse-home-sale-expiration{contain:inline-size;margin:2px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums;pointer-events:auto}' +
      '.search_result_row .sse-search-sale-expiration{display:block;box-sizing:border-box;width:max-content;max-width:none;margin:0;white-space:nowrap;overflow:visible;text-overflow:clip;text-align:left;font-variant-numeric:tabular-nums;position:absolute;left:0;top:100%;z-index:1;pointer-events:auto}';
  }

  function findStoreSaleBadgePosition(row) {
    if (row.matches('.wishlist_row, .wishlistRowItem, [data-rfd-draggable-id^="WishlistItem-"]') ||
        row.getAttribute?.('data-rfd-draggable-id')?.startsWith('WishlistItem-')) {
      return { ...findWishlistSaleBadgePosition(row, findWishlistSalePrice(row)), className: '', compact: false };
    }
    if (row.matches('a.tab_row_item') && row.closest?.('#home_tabs_row')) {
      const info = row.querySelector(':scope > .tab_item_content > .tab_item_col:not(.tab_item_price)');
      return info ? { container: info, className: 'sse-home-sale-expiration', compact: true } : null;
    }
    if (row.matches('.search_result_row')) {
      const price = row.querySelector('.discount_block');
      if (!price) return null;
      return { container: row, anchor: price, className: 'sse-search-sale-expiration', compact: true };
    }
    return { container: row, className: '', compact: false };
  }

  function positionSearchSaleBadge(badge, row, price) {
    const rowRect = row.getBoundingClientRect();
    const priceRect = price.getBoundingClientRect();
    const badgeRect = badge.getBoundingClientRect();
    const left = priceRect.right - rowRect.left - (row.clientLeft || 0) - badgeRect.width;
    badge.style.top = `${priceRect.bottom - rowRect.top - (row.clientTop || 0)}px`;
    badge.style.left = `${Math.max(0, left)}px`;
  }

  function storeSaleAppId(row) {
    const draggableId = row.getAttribute('data-rfd-draggable-id') || '';
    const wishlistId = draggableId.match(/^WishlistItem-(\d+)/);
    if (wishlistId) return wishlistId[1];
    const ids = new Set();
    for (const element of [row, ...row.querySelectorAll('[data-ds-appid], [data-app-id]')]) {
      const id = element.getAttribute('data-ds-appid') || element.getAttribute('data-app-id') || '';
      if (/^\d+$/.test(id)) ids.add(id);
    }
    const links = [...(row.matches?.('a[href*="/app/"]') ? [row] : []), ...row.querySelectorAll('a[href*="/app/"]')];
    for (const link of links) {
      const id = (link.getAttribute('href') || '').match(/\/app\/(\d+)(?:\/|$|\?)/)?.[1];
      if (id) ids.add(id);
    }
    return ids.size === 1 ? ids.values().next().value : null;
  }

  function initializeStoreSaleCountdown() {
    if (location.hostname !== 'store.steampowered.com' || !GM_getValue('sse_wishlist_sale_enabled', true)) return;

    const log = diagnostics.scope('wishlist-sale');
    const scope = createFeatureScope('wishlist-sale');
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    const initialPath = location.pathname;
    const rowsByApp = new Map();
    const expiryByApp = new Map();
    const queuedApps = new Set();
    const pendingApps = new Set();
    const retryByApp = new Map();
    const refreshedAt = new Map();
    const rowIds = new WeakMap();
    const badges = new Set();
    let cancelRetry;
    let cancelHydration;
    let flushTimer = null;
    const hydrationWaitStarted = Date.now();

    if (!document.getElementById('sse-store-sale-style')) {
      const style = document.createElement('style');
      style.id = 'sse-store-sale-style';
      style.textContent = storeSaleCountdownStyle();
      document.head.appendChild(style);
      scope.own(() => style.remove());
    }

    function isDiscounted(row) {
      return Boolean(findWishlistSalePrice(row));
    }

    function renderExpiry(appId) {
      if (!scope.active) return;
      const endTime = expiryByApp.get(appId);
      const rows = rowsByApp.get(appId);
      if (!rows) return;
      if (!endTime) {
        if (expiryByApp.has(appId)) for (const row of rows) row.querySelector('.sse-wishlist-sale-expiration')?.remove();
        return;
      }
      for (const row of rows) {
        if (!isVisibleSaleRow(row) || storeSaleAppId(row) !== appId) continue;
        const price = findWishlistSalePrice(row);
        if (!price) continue;
        const position = isWishlistPage()
          ? { ...findWishlistSaleBadgePosition(row, price), className: '', compact: false }
          : findStoreSaleBadgePosition(row);
        if (!position?.container) continue;
        const existing = row.querySelector('.sse-wishlist-sale-expiration');
        if (existing && existing.dataset.endTime === String(endTime) && existing.parentElement === position.container) continue;
        existing?.remove();
        const badge = document.createElement('span');
        badge.className = 'sse-wishlist-sale-expiration' + (position.className ? ' ' + position.className : '');
        badge.dataset.endTime = String(endTime);
        if (position.anchor) {
          if (getComputedStyle(position.container).position === 'static') position.container.style.position = 'relative';
        }
        badges.add(badge);
        position.container.insertBefore(badge, position.reference || null);
      }
    }

    function updateCountdowns() {
      const now = Date.now();
      if (document.hidden) return;
      for (const badge of badges) {
        if (!badge.isConnected) { badges.delete(badge); continue; }
        const endTime = Number(badge.dataset.endTime);
        const remaining = endTime - now;
        const endDate = new Date(endTime);
        const dateText = Number.isFinite(endTime) ? `${endDate.getFullYear()}年${endDate.getMonth() + 1}月${endDate.getDate()}日 ${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}` : '';
        const homeCompact = badge.classList.contains?.('sse-home-sale-expiration');
        const searchCompact = badge.classList.contains?.('sse-search-sale-expiration');
        const prefix = homeCompact || searchCompact ? '' : `折扣结束：${dateText} · `;
        if (remaining <= 0) {
          const text = `${prefix}${searchCompact ? `已结束 · ${dateText}` : '已结束'}`;
          if (badge.textContent !== text) badge.textContent = text;
          badge.classList.add('sse-sale-ended');
          badge.classList.remove('sse-ending-soon');
        } else {
          const text = `${prefix}剩余 ${formatWishlistSaleCountdown(remaining)}`;
          if (badge.textContent !== text) badge.textContent = text;
          badge.classList.toggle('sse-ending-soon', remaining <= 3600000);
          badge.classList.remove('sse-sale-ended');
        }
        badge.title = `折扣结束时间：${endDate.toLocaleString()}`;
        if (searchCompact) {
          const row = badge.closest('.search_result_row');
          const price = row?.querySelector('.discount_block');
          if (price) positionSearchSaleBadge(badge, row, price);
        }
      }
    }

    function hasVisibleSaleRow(id) {
      return [...(rowsByApp.get(id) || [])].some(row => isVisibleSaleRow(row) && storeSaleAppId(row) === id && isDiscounted(row));
    }

    function scheduleRetry() {
      cancelRetry?.();
      const times = [...retryByApp].filter(([id, state]) => !pendingApps.has(id) && Number.isFinite(state.at) && hasVisibleSaleRow(id)).map(([, state]) => state.at);
      if (!times.length) return;
      cancelRetry = scope.timeout(() => {
        cancelRetry = null;
        for (const [id, state] of retryByApp) {
          if (state.at <= Date.now() && rowsByApp.has(id)) queuedApps.add(id);
        }
        flushQueuedApps();
        scheduleRetry();
      }, Math.max(1, Math.min(...times) - Date.now()));
    }

    async function fetchExpirations(appIds) {
      if (!scope.active || location.hostname !== 'store.steampowered.com' || location.pathname !== initialPath) return;
      for (let offset = 0; offset < appIds.length; offset += 100) {
        if (!scope.active) return;
        const claimed = appIds.slice(offset, offset + 100);
        const batch = claimed.filter(hasVisibleSaleRow);
        for (const id of claimed) if (!batch.includes(id)) pendingApps.delete(id);
        if (!batch.length) continue;
        try {
          const session = readStoreSession(document, page);
          const payload = {
            ids: batch.map(appid => ({ appid: Number(appid) })),
            context: { language: session.language || 'schinese', country_code: session.country || 'US', steam_realm: 1 },
            data_request: { include_all_purchase_options: true }
          };
          const url = 'https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=' + encodeURIComponent(JSON.stringify(payload));
          const response = JSON.parse(await requestQueue.enqueue(() => gmGet(url, { signal: scope.signal }), { signal: scope.signal }));
          const items = validateStoreItems(response);
          if (!scope.active) return;
          for (const id of batch) { expiryByApp.set(id, null); refreshedAt.set(id, Date.now()); retryByApp.delete(id); }
          for (const item of items) {
            const id = String(item.appid || item.id || '');
            if (batch.includes(id)) expiryByApp.set(id, wishlistSaleEndTimestamp(item));
          }
          log.debug('expiry.loaded', '已读取愿望单折扣结束时间', { requested: batch.length, found: items.length });
        } catch (error) {
          if (!scope.active) return;
          for (const id of batch) {
            const failures = (retryByApp.get(id)?.failures || 0) + 1;
            retryByApp.set(id, { failures, at: Date.now() + Math.min(900000, 30000 * 2 ** Math.min(failures - 1, 5)) });
          }
          log.warn('expiry.failed', '读取愿望单折扣结束时间失败，稍后重试', { count: batch.length, error });
        } finally {
          batch.forEach(id => pendingApps.delete(id));
        }
        for (const id of batch) {
          renderExpiry(id);
        }
      }
      pruneRows();
      updateCountdowns();
      scheduleRetry();
    }

    function flushQueuedApps() {
      flushTimer = null;
      const appIds = [...queuedApps].filter(id => !pendingApps.has(id) && hasVisibleSaleRow(id) &&
        (!retryByApp.has(id) || retryByApp.get(id).at <= Date.now()));
      queuedApps.clear();
      if (!appIds.length) return;
      // Claim all batches before awaiting, so a concurrent scan cannot enqueue them twice.
      appIds.forEach(id => pendingApps.add(id));
      fetchExpirations(appIds).catch(error => { if (scope.active) log.error('expiry.unexpected', '折扣处理异常', { error }); });
    }

    function scan(rows) {
      if (isWishlistPage() && page.SSR && !page.SSR.hydrated && Date.now() - hydrationWaitStarted < 15000) {
        if (!cancelHydration) cancelHydration = scope.timeout(() => { cancelHydration = null; scanner.scan(); }, 500);
        return;
      }
      const candidates = new Set();
      for (const node of rows) {
        if (node.matches('div[data-index]') && node.querySelector('[data-rfd-draggable-id^="WishlistItem-"]')) continue;
        candidates.add(normalizeStoreSaleRow(node));
      }
      for (const row of candidates) {
        if (!isVisibleSaleRow(row)) continue;
        const appId = storeSaleAppId(row);
        const previous = rowIds.get(row);
        if (previous && previous !== appId) {
          rowsByApp.get(previous)?.delete(row);
          row.querySelectorAll('.sse-wishlist-sale-expiration').forEach(node => node.remove());
        }
        rowIds.set(row, appId);
        if (!appId) continue;
        if (!isDiscounted(row)) {
          row.querySelectorAll('.sse-wishlist-sale-expiration').forEach(element => element.remove());
          continue;
        }
        if (!rowsByApp.has(appId)) rowsByApp.set(appId, new Set());
        rowsByApp.get(appId).add(row);
        if (expiryByApp.has(appId)) renderExpiry(appId);
        const expires = expiryByApp.get(appId) || 0;
        const ttl = expires ? 300000 : 60000;
        if ((!refreshedAt.has(appId) || Date.now() - refreshedAt.get(appId) >= ttl) && !pendingApps.has(appId)) queuedApps.add(appId);
      }
      pruneRows();
      updateCountdowns();
      if (queuedApps.size && !flushTimer) flushTimer = scope.timeout(flushQueuedApps, 180);
    }
    function pruneRows(removed = []) {
      for (const node of removed) {
        const rows = [node, ...(node.querySelectorAll?.(PAGE_ADAPTERS.wishlist.rows + ',' + PAGE_ADAPTERS.storeSale.rows) || [])];
        for (const row of rows) {
          const id = rowIds.get(row);
          if (!id || row.isConnected) continue;
          rowsByApp.get(id)?.delete(row);
          row.querySelectorAll?.('.sse-wishlist-sale-expiration').forEach(badge => { badges.delete(badge); badge.remove(); });
          rowIds.delete(row);
        }
      }
      for (const [appId, appRows] of rowsByApp) {
        for (const row of appRows) if (storeSaleAppId(row) !== appId || !isDiscounted(row)) {
          appRows.delete(row);
          row.querySelectorAll('.sse-wishlist-sale-expiration').forEach(badge => badges.delete(badge));
        }
        if (!appRows.size) {
          rowsByApp.delete(appId); expiryByApp.delete(appId); refreshedAt.delete(appId); retryByApp.delete(appId); queuedApps.delete(appId);
        }
      }
      for (const badge of badges) if (!badge.isConnected) badges.delete(badge);
    }

    const scanner = createDomScanner({ scope, selector: PAGE_ADAPTERS.wishlist.rows + ',' + PAGE_ADAPTERS.storeSale.rows, process: scan,
      attributes: ITEM_ATTRIBUTES, name: 'wishlist-sale', removed: pruneRows, delay: 300 });
    const homeTabs = document.querySelector('#home_tabs_row');
    if (homeTabs) {
      // Steam switches tabs by changing the existing panels' inline display styles.
      const observer = new MutationObserver(records => scanner.notify(records.filter(record => record.target.matches('.home_tab_content'))));
      observer.observe(homeTabs, { subtree: true, attributes: true, attributeFilter: ['style', 'hidden'] });
      scope.own(() => observer.disconnect());
    }
    scope.interval(updateCountdowns, 1000);
    scope.interval(() => { if (!document.hidden) scan([...rowsByApp.values()].flatMap(rows => [...rows])); }, 60000);
    scope.listen(document, 'visibilitychange', () => { if (!document.hidden) { updateCountdowns(); scanner.scan(); } });
    scope.own(() => {
      badges.forEach(badge => badge.remove()); badges.clear(); rowsByApp.clear(); queuedApps.clear(); pendingApps.clear();
    });
    log.info('initialize', '愿望单及商店列表折扣结束时间和倒计时已启用');
  }

  function initializeWishlistSaleCountdown() { return initializeStoreSaleCountdown(); }
