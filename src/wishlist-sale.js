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
    for (const link of row.querySelectorAll('a[href*="/app/"]')) {
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

  function initializeWishlistSaleCountdown() {
    if (location.hostname !== 'store.steampowered.com' || !isWishlistPage() || !GM_getValue('sse_wishlist_sale_enabled', true)) return;

    const log = diagnostics.scope('wishlist-sale');
    const scope = createFeatureScope('wishlist-sale');
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    const rowsByApp = new Map();
    const expiryByApp = new Map();
    const queuedApps = new Set();
    const pendingApps = new Set();
    const retryByApp = new Map();
    const refreshedAt = new Map();
    const rowIds = new WeakMap();
    const badges = new Set();
    let cancelRetry;
    let flushTimer = null;
    const hydrationWaitStarted = Date.now();

    if (!document.getElementById('sse-wishlist-sale-style')) {
      const style = document.createElement('style');
      style.id = 'sse-wishlist-sale-style';
      style.textContent = '.sse-wishlist-sale-expiration{display:block;margin:5px 0 0;color:#9acb7a;font-size:11px;line-height:1.4;white-space:normal;pointer-events:none}.sse-wishlist-sale-expiration.sse-ending-soon{color:#e6a15a}.sse-wishlist-sale-expiration.sse-sale-ended{color:#e46767}';
      document.head.appendChild(style);
      scope.own(() => style.remove());
    }

    function appIdFor(row) {
      const draggableId = row.getAttribute('data-rfd-draggable-id') || '';
      const match = draggableId.match(/^WishlistItem-(\d+)/);
      if (match) return match[1];
      const href = row.querySelector('a[href*="/app/"]')?.getAttribute('href') || '';
      return href.match(/\/app\/(\d+)/)?.[1] || null;
    }

    function isDiscounted(row) {
      return Boolean(findWishlistSalePrice(row));
    }

    function renderExpiry(appId) {
      const endTime = expiryByApp.get(appId);
      const rows = rowsByApp.get(appId);
      if (!rows) return;
      if (!endTime) {
        if (expiryByApp.has(appId)) for (const row of rows) row.querySelector('.sse-wishlist-sale-expiration')?.remove();
        return;
      }
      for (const row of rows) {
        if (!row.isConnected || appIdFor(row) !== appId || !isDiscounted(row)) continue;
        const existing = row.querySelector('.sse-wishlist-sale-expiration');
        if (existing && existing.dataset.endTime === String(endTime)) continue;
        existing?.remove();
        const price = findWishlistSalePrice(row);
        if (!price) continue;
        const badge = document.createElement('span');
        badge.className = 'sse-wishlist-sale-expiration';
        badge.dataset.endTime = String(endTime);
        badges.add(badge);
        // Mount below the price/action flex row so Steam's layout cannot squeeze it beside the price.
        const position = findWishlistSaleBadgePosition(row, price);
        if (position.container) position.container.insertBefore(badge, position.reference || null);
        else price.after(badge);
      }
      updateCountdowns();
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
        if (remaining <= 0) {
          const text = `折扣结束：${dateText} · 已结束`;
          if (badge.textContent !== text) badge.textContent = text;
          badge.classList.add('sse-sale-ended');
          badge.classList.remove('sse-ending-soon');
        } else {
          badge.textContent = `折扣结束：${dateText} · 剩余 ${formatWishlistSaleCountdown(remaining)}`;
          badge.classList.toggle('sse-ending-soon', remaining <= 3600000);
          badge.classList.remove('sse-sale-ended');
        }
        badge.title = `折扣结束时间：${endDate.toLocaleString()}`;
      }
    }

    function scheduleRetry() {
      cancelRetry?.();
      const times = [...retryByApp].filter(([id, state]) => rowsByApp.has(id) && !pendingApps.has(id) && Number.isFinite(state.at)).map(([, state]) => state.at);
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
      const session = readStoreSession(document, page);
      for (let offset = 0; offset < appIds.length; offset += 100) {
        if (!scope.active) return;
        const batch = appIds.slice(offset, offset + 100);
        batch.forEach(id => pendingApps.add(id));
        try {
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
      scheduleRetry();
    }

    function flushQueuedApps() {
      flushTimer = null;
      const appIds = [...queuedApps].filter(id => !pendingApps.has(id) && rowsByApp.has(id) &&
        (!retryByApp.has(id) || retryByApp.get(id).at <= Date.now()));
      queuedApps.clear();
      if (!appIds.length) return;
      // Claim all batches before awaiting, so a concurrent scan cannot enqueue them twice.
      appIds.forEach(id => { pendingApps.add(id); if (retryByApp.has(id)) retryByApp.get(id).at = Infinity; });
      fetchExpirations(appIds).catch(error => { if (scope.active) log.error('expiry.unexpected', '折扣处理异常', { error }); });
    }

    function scan(rows) {
      if (page.SSR && !page.SSR.hydrated && Date.now() - hydrationWaitStarted < 15000) {
        scope.timeout(() => scanner.scan(), 500);
        return;
      }
      for (const row of rows) {
        if (row.matches('div[data-index]') && row.querySelector('[data-rfd-draggable-id^="WishlistItem-"]')) continue;
        const appId = appIdFor(row);
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
      if (queuedApps.size && !flushTimer) flushTimer = scope.timeout(flushQueuedApps, 180);
    }
    function pruneRows() {
      for (const [appId, appRows] of rowsByApp) {
        for (const row of appRows) if (!row.isConnected || appIdFor(row) !== appId) appRows.delete(row);
        if (!appRows.size) {
          rowsByApp.delete(appId); expiryByApp.delete(appId); refreshedAt.delete(appId); retryByApp.delete(appId); queuedApps.delete(appId);
        }
      }
      for (const badge of badges) if (!badge.isConnected) badges.delete(badge);
    }

    const scanner = createDomScanner({ scope, selector: PAGE_ADAPTERS.wishlist.rows, process: scan,
      attributes: ITEM_ATTRIBUTES, name: 'wishlist-sale', removed: pruneRows, delay: 300 });
    scope.interval(updateCountdowns, 1000);
    scope.interval(() => { if (!document.hidden) scan([...rowsByApp.values()].flatMap(rows => [...rows])); }, 60000);
    scope.listen(document, 'visibilitychange', () => { if (!document.hidden) { updateCountdowns(); scanner.scan(); } });
    scope.own(() => {
      badges.forEach(badge => badge.remove()); badges.clear(); rowsByApp.clear(); queuedApps.clear(); pendingApps.clear();
    });
    log.info('initialize', '愿望单折扣结束时间和倒计时已启用');
  }
