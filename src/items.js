  function itemRef(type, id) {
    const canonical = { app: 'app', sub: 'package', package: 'package', bundle: 'bundle' }[type];
    const number = Number(id);
    return canonical && /^\d+$/.test(String(id)) && Number.isSafeInteger(number) && number > 0
      ? { type: canonical, id: String(number) } : null;
  }
  function itemField(item) { return { app: 'appid', package: 'packageid', sub: 'packageid', bundle: 'bundleid' }[itemRef(item.type, item.id)?.type]; }
  function itemKey(item) { const ref = itemRef(item.type, item.id); return ref ? `${ref.type}:${ref.id}` : null; }
  function itemFromLink(href) {
    const match = String(href || '').match(/\/(app|sub|bundle)\/(\d+)(?:\/|$|\?)/);
    return match ? itemRef(match[1], match[2]) : null;
  }
  function inferItemFromScope(scopeEl) {
    if (!scopeEl) return null;
    const wishlist = scopeEl.closest('[data-rfd-draggable-id^="WishlistItem-"]');
    const wishId = wishlist?.getAttribute('data-rfd-draggable-id')?.match(/^WishlistItem-(\d+)/)?.[1];
    if (wishId) return itemRef('app', wishId);
    const purchase = scopeEl.closest('.game_area_purchase_game, .game_area_purchase_game_wrapper');
    if (purchase) {
      for (const node of purchase.querySelectorAll('[href*="/bundle/"], [onclick*="ShowBundleInfo"], [onclick*="addBundleToCart"], [data-ds-bundleid]')) {
        const id = node.getAttribute('data-ds-bundleid') ||
          (node.getAttribute('href') || node.getAttribute('onclick') || '').match(/(?:\/bundle\/|ShowBundleInfo\(['"]?|addBundleToCart\(['"]?)(\d+)/)?.[1];
        const ref = itemRef('bundle', id);
        if (ref) return ref;
      }
      const bundleHolder = scopeEl.closest('[data-ds-bundleid]');
      const bundleId = bundleHolder?.getAttribute('data-ds-bundleid')?.split(',')[0];
      if (itemRef('bundle', bundleId)) return itemRef('bundle', bundleId);
      const sub = purchase.querySelector('input[name="subid"]');
      const ref = itemRef('package', sub?.value);
      if (ref) return ref;
      const add = purchase.querySelector('a[href*="addToCart"], button[onclick*="addToCart"], a[onclick*="addToCart"]');
      const id = (add?.getAttribute('href') || add?.getAttribute('onclick') || '').match(/(?:addToCart\(|subid=)(\d+)/)?.[1];
      if (itemRef('package', id)) return itemRef('package', id);
      for (const [type, attr] of [['bundle', 'data-ds-bundleid'], ['package', 'data-ds-packageid'], ['app', 'data-ds-appid']]) {
        const holder = purchase.querySelector(`[${attr}]`);
        const value = holder?.getAttribute(attr)?.split(',')[0];
        if (itemRef(type, value)) return itemRef(type, value);
      }
    }
    const holder = scopeEl.closest('[data-ds-appid],[data-ds-packageid],[data-ds-bundleid],[data-app-id]');
    if (holder) {
      for (const [type, attr] of [['bundle', 'data-ds-bundleid'], ['package', 'data-ds-packageid'], ['app', 'data-ds-appid'], ['app', 'data-app-id']]) {
        const value = holder.getAttribute(attr);
        if (!value) continue;
        // Multi-app capsules must not silently inherit the first unrelated game.
        return itemRef(type, value);
      }
    }
    const link = scopeEl.closest('a[href]');
    const own = itemFromLink(link?.getAttribute('href'));
    if (own) return own;
    const card = scopeEl.closest('.search_result_row, .tab_item, .recommendation_link, .wishlist_row, .game_area_purchase_game, .game_purchase_action, .i-xXuvHLioU-, .bKkQiLkI-vk-') || scopeEl;
    const links = card.querySelectorAll('a[href*="/app/"],a[href*="/sub/"],a[href*="/bundle/"]');
    const refs = new Map();
    for (const child of links) {
      const ref = itemFromLink(child.getAttribute('href'));
      if (ref) refs.set(itemKey(ref), ref);
    }
    if (refs.size === 1) return refs.values().next().value;
    if (!refs.size && purchase) return itemFromLink(location.pathname);
    return null;
  }

  function invalidResponse(message = '接口返回了无效数据') { return Object.assign(new Error(message), { kind: 'invalid-response' }); }
  function validatePurchaseOption(option) {
    if (!option || typeof option !== 'object' ||
        (!itemRef('package', option.packageid) && !itemRef('bundle', option.bundleid))) throw invalidResponse('无效购买选项');
    for (const key of ['final_price_in_cents', 'original_price_in_cents']) {
      if (option[key] != null && (!/^\d+$/.test(String(option[key])) || !Number.isSafeInteger(Number(option[key])))) throw invalidResponse('无效商品价格');
    }
    if (option.discount_pct != null && (!Number.isFinite(Number(option.discount_pct)) || Number(option.discount_pct) < 0 || Number(option.discount_pct) > 100)) throw invalidResponse('无效折扣');
    return option;
  }
  function validateStoreItems(data) {
    const items = data?.response?.store_items;
    if (!Array.isArray(items)) throw invalidResponse('缺少商品列表');
    for (const item of items) {
      if (!item || typeof item !== 'object') throw invalidResponse('无效商品');
      if (item.purchase_options != null && !Array.isArray(item.purchase_options)) throw invalidResponse('无效购买选项列表');
      item.purchase_options?.forEach(validatePurchaseOption);
      if (item.best_purchase_option) validatePurchaseOption(item.best_purchase_option);
    }
    return items;
  }
  function validateCartResponse(data, method) {
    const response = data?.response;
    if (!response || typeof response !== 'object' || Array.isArray(response)) throw invalidResponse('缺少购物车响应');
    if (method === 'GetCart') {
      if (!response.cart || !Array.isArray(response.cart.line_items)) throw invalidResponse('缺少购物车项目列表');
      for (const item of response.cart.line_items) {
        if (!item || !/^\d+$/.test(String(item.line_item_id)) ||
            (!itemRef('package', item.packageid) && !itemRef('bundle', item.bundleid))) throw invalidResponse('无效购物车项目');
      }
    }
    return response;
  }

  // In-flight entries are never evicted. Settled entries have a TTL and a cap.
  function createAsyncCache({ load, ttl = 300000, missingTtl = 60000, retryDelay = 30000, maxEntries = 500,
    now = () => Date.now() }) {
    const entries = new Map();
    function prune() {
      for (const [key, entry] of entries) if (!entry.pending && entry.expires <= now()) entries.delete(key);
      for (const [key, entry] of entries) {
        if (entries.size <= maxEntries) break;
        if (!entry.pending) entries.delete(key);
      }
    }
    return {
      get(key, ...args) {
        const saved = entries.get(key);
        if (saved && (saved.pending || saved.expires > now())) return saved.promise;
        const entry = { pending: true, expires: Infinity };
        entry.promise = Promise.resolve().then(() => load(key, ...args)).then(value => {
          entry.expires = now() + (value == null ? missingTtl : ttl);
          return value;
        }, error => { entry.expires = now() + retryDelay; throw error; }).finally(() => { entry.pending = false; prune(); });
        entries.set(key, entry);
        prune();
        return entry.promise;
      },
      clear() { entries.clear(); },
      get size() { return entries.size; }
    };
  }
