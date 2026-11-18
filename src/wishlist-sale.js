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

  function initializeWishlistSaleCountdown() {
    if (location.hostname !== 'store.steampowered.com' || !isWishlistPage()) return;

    const log = diagnostics.scope('wishlist-sale');
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    const rowsByApp = new Map();
    const expiryByApp = new Map();
    const queuedApps = new Set();
    let flushTimer = null;
    let scanTimer = null;
    const hydrationWaitStarted = Date.now();

    if (!document.getElementById('sse-wishlist-sale-style')) {
      const style = document.createElement('style');
      style.id = 'sse-wishlist-sale-style';
      style.textContent = '.sse-wishlist-sale-expiration{display:block;margin:5px 0 0;color:#9acb7a;font-size:11px;line-height:1.4;white-space:normal;pointer-events:none}.sse-wishlist-sale-expiration.sse-ending-soon{color:#e6a15a}.sse-wishlist-sale-expiration.sse-sale-ended{color:#e46767}';
      document.head.appendChild(style);
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
      if (!endTime) return;
      const rows = rowsByApp.get(appId);
      if (!rows) return;
      for (const row of rows) {
        if (!row.isConnected || !isDiscounted(row) || row.querySelector('.sse-wishlist-sale-expiration')) continue;
        const price = findWishlistSalePrice(row);
        if (!price) continue;
        const badge = document.createElement('span');
        badge.className = 'sse-wishlist-sale-expiration';
        badge.dataset.endTime = String(endTime);
        if (price.matches('a[href*="/app/"]')) price.appendChild(badge);
        else price.after(badge);
      }
      updateCountdowns();
    }

    function updateCountdowns() {
      const now = Date.now();
      document.querySelectorAll('.sse-wishlist-sale-expiration[data-end-time]').forEach(badge => {
        const endTime = Number(badge.dataset.endTime);
        const remaining = endTime - now;
        const endDate = new Date(endTime);
        const dateText = Number.isFinite(endTime) ? `${endDate.getFullYear()}年${endDate.getMonth() + 1}月${endDate.getDate()}日 ${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}` : '';
        if (remaining <= 0) {
          badge.textContent = `折扣结束：${dateText} · 已结束`;
          badge.classList.add('sse-sale-ended');
          badge.classList.remove('sse-ending-soon');
        } else {
          badge.textContent = `折扣结束：${dateText} · 剩余 ${formatWishlistSaleCountdown(remaining)}`;
          badge.classList.toggle('sse-ending-soon', remaining <= 3600000);
          badge.classList.remove('sse-sale-ended');
        }
        badge.title = `折扣结束时间：${endDate.toLocaleString()}`;
      });
    }

    async function fetchExpirations(appIds) {
      const session = readStoreSession(document, page);
      for (let offset = 0; offset < appIds.length; offset += 100) {
        const batch = appIds.slice(offset, offset + 100);
        try {
          const payload = {
            ids: batch.map(appid => ({ appid: Number(appid) })),
            context: { language: session.language || 'schinese', country_code: session.country || 'US', steam_realm: 1 },
            data_request: { include_all_purchase_options: true }
          };
          const url = 'https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=' + encodeURIComponent(JSON.stringify(payload));
          const response = JSON.parse(await requestQueue.enqueue(() => gmGet(url)));
          const items = response.response?.store_items || [];
          for (const item of items) {
            const id = String(item.appid || item.id || '');
            if (batch.includes(id)) expiryByApp.set(id, wishlistSaleEndTimestamp(item));
          }
          log.debug('expiry.loaded', '已读取愿望单折扣结束时间', { requested: batch.length, found: items.length });
        } catch (error) {
          log.warn('expiry.failed', '读取愿望单折扣结束时间失败', { count: batch.length, error });
        }
        for (const id of batch) {
          if (!expiryByApp.has(id)) expiryByApp.set(id, null);
          renderExpiry(id);
        }
      }
    }

    function flushQueuedApps() {
      flushTimer = null;
      const appIds = [...queuedApps];
      queuedApps.clear();
      if (!appIds.length) return;
      fetchExpirations(appIds);
    }

    function scan() {
      if (page.SSR && !page.SSR.hydrated && Date.now() - hydrationWaitStarted < 15000) {
        if (!scanTimer) scanTimer = setTimeout(() => { scanTimer = null; scan(); }, 500);
        return;
      }
      const rows = document.querySelectorAll('.wishlist_row, .wishlistRowItem, [data-rfd-draggable-id^="WishlistItem-"], .Panel div[data-index]');
      for (const row of rows) {
        if (row.matches('div[data-index]') && row.querySelector('[data-rfd-draggable-id^="WishlistItem-"]')) continue;
        const appId = appIdFor(row);
        if (!appId) continue;
        if (!isDiscounted(row)) {
          row.querySelectorAll('.sse-wishlist-sale-expiration').forEach(element => element.remove());
          continue;
        }
        if (!rowsByApp.has(appId)) rowsByApp.set(appId, new Set());
        rowsByApp.get(appId).add(row);
        if (expiryByApp.has(appId)) renderExpiry(appId);
        else queuedApps.add(appId);
      }
      for (const [appId, appRows] of rowsByApp) {
        for (const row of appRows) if (!row.isConnected) appRows.delete(row);
        if (!appRows.size) rowsByApp.delete(appId);
      }
      if (queuedApps.size && !flushTimer) flushTimer = setTimeout(flushQueuedApps, 180);
    }

    const observer = new MutationObserver(mutations => {
      const relevant = mutations.some(mutation => {
        if (mutation.target.nodeType === 1 && mutation.target.closest('.sse-wishlist-sale-expiration')) return false;
        return [...mutation.addedNodes, ...mutation.removedNodes].some(node =>
          node.nodeType !== 1 || (!node.matches('.sse-wishlist-sale-expiration') && !node.closest('.sse-wishlist-sale-expiration'))
        );
      });
      if (!relevant || scanTimer) return;
      scanTimer = setTimeout(() => { scanTimer = null; scan(); }, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    scan();
    setInterval(updateCountdowns, 1000);
    log.info('initialize', '愿望单折扣结束时间和倒计时已启用');
  }
