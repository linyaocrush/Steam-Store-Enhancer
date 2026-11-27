  const regionalLog = diagnostics.scope('regional-prices');
  const currencyDigitsCache = new Map();

  function getCurrencyFractionDigits(currency) {
    if (currencyDigitsCache.has(currency)) return currencyDigitsCache.get(currency);
    let digits = 2;
    try { digits = new Intl.NumberFormat('en-US', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits; } catch (e) {}
    currencyDigitsCache.set(currency, digits);
    return digits;
  }

  function formatMinorToCurrency(minor, currency) {
    const fd = getCurrencyFractionDigits(currency);
    const major = minor / Math.pow(10, fd);
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(major); } catch (e) { return String(major.toFixed(fd)) + ' ' + currency; }
  }

  function steamCentsToMinor(cents, currency) {
    // Steam returns hundredths even for currencies such as JPY.
    if (!Number.isSafeInteger(cents) || cents < 0) throw invalidResponse('地区价格金额无效');
    return Math.round(cents * Math.pow(10, getCurrencyFractionDigits(currency)) / 100);
  }

  async function formatRegionalDisplayPrice(minor, source, original) {
    const target = conversion.setting.regionalDisplayCurrency;
    if (!target || source === target) return original;
    try {
      const rate = minor === 0 ? 1 : await conversion.getRate(source, target);
      const amount = minor / Math.pow(10, getCurrencyFractionDigits(source)) / rate;
      if (!(rate > 0) || !Number.isFinite(amount)) throw new Error('换算金额无效');
      return '≈ ' + new Intl.NumberFormat(undefined, { style: 'currency', currency: target, currencyDisplay: 'code' }).format(amount);
    } catch (error) {
      regionalLog.debug('conversion.fallback', '额外地区汇率不可用，显示原币价格', { source, target, error });
      return original;
    }
  }

  const priceCache = new Map();
  const pendingPrices = new Map();
  const pendingElements = new WeakMap();
  const CACHE_TTL_MS = 5 * 60 * 1000;
  let regionalScope;
  let summaryRevision = 0;
  const enhancedItems = new WeakMap();

  function cacheGet(key) {
    const v = priceCache.get(key);
    if (!v) return undefined;
    if (Date.now() - v.ts > CACHE_TTL_MS) { priceCache.delete(key); return undefined; }
    return v.value;
  }

  function cacheSet(key, value) {
    priceCache.set(key, { ts: Date.now(), value });
    if (priceCache.size > 1000) priceCache.delete(priceCache.keys().next().value);
  }

  function normalizePrice(o) {
    if (!Number.isSafeInteger(o.final) || o.final < 0 || !Number.isSafeInteger(o.initial) || o.initial < 0 ||
        !/^[A-Z]{3}$/.test(o.currency || '')) throw invalidResponse('地区价格字段无效');
    return {
      ok: Boolean(o.finalFormatted || o.initialFormatted),
      currency: o.currency,
      final: o.final,
      initial: o.initial,
      finalFormatted: o.finalFormatted,
      initialFormatted: o.initialFormatted,
      discountPercent: o.discountPercent
    };
  }

  function requestRegionalPrice(url, signal, pending) {
    const controller = pending?.queueController;
    if (pending && !pending.eager && !pending.viewers.size) {
      throw requestError('aborted', '价格查询已取消');
    }
    if (pending) pending.waiting = true;
    return requestQueue.enqueue(() => {
      if (pending) pending.waiting = false;
      // Viewport exits cancel queue entries. In-flight fetches use the feature signal.
      return gmGet(url, { signal, retries: 2 });
    }, { signal: controller?.signal ?? signal });
  }

  async function getAppPrice(appid, cc, currencyFallback, signal = regionalScope?.signal, pending) {
    // Steam returns is_free under the basic filter and omits price_overview for free apps.
    const url = 'https://store.steampowered.com/api/appdetails?appids=' + appid + '&cc=' + cc + '&filters=basic,price_overview';
    const text = await requestRegionalPrice(url, signal, pending);
    const parsed = JSON.parse(text);
    const block = parsed && parsed[String(appid)];
    if (!block || !block.success) return null;
    const data = block.data || {};
    if (data.is_free === true) return { ...normalizePrice({ currency: currencyFallback, final: 0, initial: 0, finalFormatted: 'Free', initialFormatted: 'Free' }), free: true };
    const po = data.price_overview;
    if (!po) return null;
    return normalizePrice({
      currency: po.currency,
      final: steamCentsToMinor(po.final, po.currency),
      initial: steamCentsToMinor(po.initial, po.currency),
      finalFormatted: po.final_formatted,
      initialFormatted: po.initial_formatted || po.final_formatted,
      discountPercent: po.discount_percent
    });
  }

  async function getPackagePrice(packageid, cc, currencyFallback, signal = regionalScope?.signal, pending) {
    try {
      const payload = {
        ids: [{ packageid: parseInt(packageid, 10) }],
        context: { language: 'schinese', country_code: cc, steam_realm: 1 },
        data_request: { include_all_purchase_options: true }
      };
      const url = 'https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=' + encodeURIComponent(JSON.stringify(payload));
      const text = await requestRegionalPrice(url, signal, pending);
      const parsed = JSON.parse(text);
      const items = validateStoreItems(parsed);
      if (items && items.length > 0) {
        const item = items[0];
        let po = item.best_purchase_option;
        if (!po && item.purchase_options && item.purchase_options.length > 0) {
          po = item.purchase_options.find(o => o.final_price_in_cents !== undefined) || item.purchase_options[0];
        }
        if (po && po.final_price_in_cents !== undefined) {
          if (!po.currency_code || po.currency_code === currencyFallback) {
            const final = parseInt(po.final_price_in_cents, 10);
            const initial = parseInt(po.original_price_in_cents || po.final_price_in_cents, 10);
            return normalizePrice({
              currency: po.currency_code || currencyFallback,
              final: steamCentsToMinor(final, currencyFallback),
              initial: steamCentsToMinor(initial, currencyFallback),
              finalFormatted: po.formatted_final_price,
              initialFormatted: po.formatted_original_price || po.formatted_final_price,
              discountPercent: po.discount_pct
            });
          }
        }
      }
    } catch (error) { if (error.kind === 'aborted') throw error; regionalLog.debug('package.fallback', '套餐接口失败，尝试备用接口', { packageid, cc, error }); }

    try {
      const url = 'https://store.steampowered.com/api/packagedetails?packageids=' + packageid + '&cc=' + cc;
      const text = await requestRegionalPrice(url, signal, pending);
      const parsed = JSON.parse(text);
      const block = parsed && parsed[String(packageid)];
      if (!block || !block.success) return null;
      const p = (block.data && (block.data.price || block.data.price_overview)) || null;
      if (!p) return null;
      const currency = p.currency || currencyFallback;
      const final = steamCentsToMinor(p.final, currency);
      const initial = steamCentsToMinor(p.initial, currency);
      return normalizePrice({
        currency,
        final,
        initial,
        finalFormatted: p.final_formatted || formatMinorToCurrency(final, currency),
        initialFormatted: p.initial_formatted || formatMinorToCurrency(initial, currency),
        discountPercent: p.discount_percent
      });
    } catch (e) {
      regionalLog.debug('package.unavailable', '备用套餐接口失败', { packageid, cc, error: e });
      throw e;
    }
  }

  async function getBundlePrice(bundleid, cc, currencyFallback, signal = regionalScope?.signal, pending) {
    const payload = {
      ids: [{ bundleid: parseInt(bundleid, 10) }],
      context: {
        language: 'schinese',
        country_code: cc,
        steam_realm: 1
      },
      data_request: {
        include_all_purchase_options: true
      }
    };
    const url = 'https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=' + encodeURIComponent(JSON.stringify(payload));
    const text = await requestRegionalPrice(url, signal, pending);
    const parsed = JSON.parse(text);
    const items = validateStoreItems(parsed);
    if (!items || !items.length) return null;

    const item = items[0];
    let po = item.best_purchase_option;
    if (!po && item.purchase_options && item.purchase_options.length > 0) {
      po = item.purchase_options.find(o => o.final_price_in_cents !== undefined) || item.purchase_options[0];
    }
    if (!po) return null;

    if (po.currency_code && po.currency_code !== currencyFallback) {
      return null;
    }

    const finalMinor = parseInt(po.final_price_in_cents, 10);
    const initialMinor = parseInt(po.original_price_in_cents, 10);
    if (!Number.isFinite(finalMinor)) return null;

    const fullPrice = normalizePrice({
      currency: po.currency_code || currencyFallback,
      final: steamCentsToMinor(finalMinor, currencyFallback),
      initial: steamCentsToMinor(Number.isFinite(initialMinor) ? initialMinor : finalMinor, currencyFallback),
      finalFormatted: po.formatted_final_price,
      initialFormatted: po.formatted_original_price || po.formatted_final_price,
      discountPercent: po.discount_pct
    });
    return personalizeRegionalBundle(bundleid, cc, currencyFallback, po, fullPrice, signal);
  }

  let bundleCartRevision = 0;
  function regionalPriceKey(item, region) {
    const base = item.type + ':' + item.id + ':' + region.id;
    if (item.type !== 'bundle') return base;
    return base + ':' + (regionalBundleSession().steamid || 'anonymous') + ':' +
      (isCartPage() ? 'cart:' + bundleCartRevision : 'store');
  }

  function getPriceForItem(item, region, viewer) {
    if (viewer?.aborted) return Promise.reject(requestError('aborted', '价格查询已取消'));
    const key = regionalPriceKey(item, region);
    let pending = pendingPrices.get(key);
    if (pending) regionalLog.debug('price.join', '复用进行中的价格查询', { item: key });
    else {
      pending = { viewers: new Map(), eager: false, waiting: false, queueController: new AbortController() };
      pendingPrices.set(key, pending);
    }
    if (!viewer) pending.eager = true;
    else if (!pending.viewers.has(viewer)) {
      const leave = () => {
        pending.viewers.delete(viewer);
        if (pending.waiting && !pending.eager && !pending.viewers.size) {
          if (pendingPrices.get(key) === pending) pendingPrices.delete(key);
          pending.queueController.abort();
        }
      };
      pending.viewers.set(viewer, leave);
      viewer.addEventListener('abort', leave, { once: true });
    }
    pending.promise ??= fetchPriceForItem(item, region, key, pending).finally(() => {
      if (pendingPrices.get(key) === pending) pendingPrices.delete(key);
      for (const [signal, leave] of pending.viewers) signal.removeEventListener('abort', leave);
      pending.viewers.clear();
    });
    return pending.promise;
  }

  async function fetchPriceForItem(item, region, key, pending) {
    const cached = cacheGet(key);
    if (cached !== undefined) { regionalLog.debug('cache.hit', '命中价格缓存', { item: key }); return cached; }
    const task = regionalLog.begin('price.fetch', { item: key });
    const scope = regionalScope;
    let failure;
    for (const cc of region.ccCandidates) {
      task.debug('candidate', '读取候选地区', { cc });
      try {
        if (scope?.active === false) throw requestError('aborted', '价格查询已取消');
        let res = null;
        if (item.type === 'app') res = await getAppPrice(item.id, cc, region.currency, scope?.signal, pending);
        else if (item.type === 'package') res = await getPackagePrice(item.id, cc, region.currency, scope?.signal, pending);
        else if (item.type === 'bundle') res = await getBundlePrice(item.id, cc, region.currency, scope?.signal, pending);
        if (scope?.active === false) throw requestError('aborted', '价格查询已取消');
        if (res && res.ok) {
          if (item.type === 'bundle' || !res.currency || res.currency === region.currency) {
            cacheSet(key, res);
            task.end('地区价格读取成功', { item: key, country: cc });
            return res;
          }
        }
      } catch (error) {
        if (error.kind === 'aborted') { task.cancel('查询取消'); throw error; }
        failure = error;
        task.debug('candidate.failed', '候选地区价格读取失败', { item: key, country: cc, error });
      }
    }
    if (failure) { task.fail(failure); throw failure; }
    cacheSet(key, null);
    task.end('没有可用地区价格', { item: key, available: false });
    return null;
  }

  function isOriginalPriceElement(el) {
    if (el.classList.contains('discount_original_price') ||
        el.classList.contains('StoreOriginalPrice') ||
        el.tagName === 'STRIKE' ||
        !!el.closest('strike')) return true;
    try {
      const style = window.getComputedStyle(el);
      if ((style.textDecorationLine || '').includes('line-through')) return true;
      const parent = el.parentElement;
      if (parent) {
        const ps = window.getComputedStyle(parent);
        if ((ps.textDecorationLine || '').includes('line-through')) return true;
      }
    } catch (e) {}
    return false;
  }

  function upsertExtraInside(priceEl, region, formatted, price) {
    let span = priceEl.querySelector('.' + EXTRA_CLASS);
    const kind = price?.completion ? '预计补齐 ' : price?.fullBundle ? '整包 ' : '';
    const text = '(' + (getShowRegionCode() ? region.short + ' ' : '') + kind + formatted + ')';
    if (!span) {
      span = document.createElement('span');
      span.className = EXTRA_CLASS;
      span.setAttribute(MARK_ATTR, region.id);
      span.textContent = text;
      span.style.textDecoration = 'none';
      priceEl.appendChild(span);
    } else {
      span.setAttribute(MARK_ATTR, region.id);
      span.textContent = text;
      span.style.textDecoration = 'none';
    }
  }

  function markRegionLocked(priceEl, region) {
    let badge = priceEl.querySelector('.sapx-region-locked');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'sapx-region-locked';
      badge.textContent = '锁区';
      priceEl.appendChild(badge);
    }
    badge.setAttribute(MARK_ATTR, region.id);
  }

  function inferCartItem(row) {
    // The capsule links to the cart item. Other links can point to included apps
    // or to a different edition suggested by Steam.
    const capsule = row.querySelector(CART_ITEM_CAPSULE);
    for (const [type, attr] of [['bundle', 'data-ds-bundleid'], ['package', 'data-ds-packageid']]) {
      const ref = itemRef(type, row.getAttribute(attr)) || itemRef(type, capsule?.getAttribute(attr));
      if (ref) return ref;
    }
    if (capsule) return itemFromLink(capsule.getAttribute('href'));
    return itemRef('app', row.getAttribute('data-ds-appid')) ||
      itemRef('app', row.getAttribute('data-app-id')) || inferItemFromScope(row);
  }

  function inferRegionalPriceItem(priceEl) {
    if (isCartPage()) {
      const row = priceEl.closest(CART_ITEM_ROW) || priceEl.closest(CART_ITEM_WRAPPER);
      if (row) return inferCartItem(row);
    }
    return inferItemFromScope(priceEl);
  }

  async function enhancePriceElement(priceEl, forceType = 'auto', viewer) {
    if (viewer?.aborted || !priceEl || priceEl.nodeType !== 1 || priceEl.classList.contains(EXTRA_CLASS)) return;
    const txt = priceEl.textContent.trim();
    if (!txt || /^-\d+%$/.test(txt) || txt.length > 120) return;
    const region = getTargetRegion();
    const item = inferRegionalPriceItem(priceEl);
    const identity = item ? regionalPriceKey(item, region) : null;
    if (enhancedItems.get(priceEl) !== identity) {
      priceEl.querySelectorAll('.' + EXTRA_CLASS + ', .sapx-region-locked').forEach(node => node.remove());
    }
    if (!item) return;
    const exist = priceEl.querySelector('.' + EXTRA_CLASS);
    if (exist && exist.getAttribute(MARK_ATTR) === region.id) return;

    const locked = priceEl.querySelector('.sapx-region-locked');
    if (locked && locked.getAttribute(MARK_ATTR) === region.id) return;

    const scope = regionalScope;
    const previous = pendingElements.get(priceEl);
    if (previous && previous.scope === scope && previous.identity === identity && previous.viewer === viewer) return;
    const attempt = { scope, identity, viewer };
    pendingElements.set(priceEl, attempt);
    const wantInitial = forceType === 'initial' || (forceType === 'auto' && isOriginalPriceElement(priceEl));
    let price, formatted;
    try {
      price = await getPriceForItem(item, region, viewer);
      if (!priceEl.isConnected || scope?.active === false || viewer?.aborted) return;
      if (price?.ok) {
        formatted = wantInitial ? (price.initialFormatted || price.finalFormatted) : price.finalFormatted;
        if (formatted && !price.free) {
          formatted = await formatRegionalDisplayPrice(wantInitial ? price.initial : price.final, price.currency, formatted);
        }
      }
    }
    finally { if (pendingElements.get(priceEl) === attempt) pendingElements.delete(priceEl); }
    if (!priceEl.isConnected || scope?.active === false || viewer?.aborted || getTargetRegion().id !== region.id) return;
    const current = inferRegionalPriceItem(priceEl);
    if (!current || regionalPriceKey(current, region) !== identity) { scheduleScan(); return; }
    enhancedItems.set(priceEl, identity);
    if (!price || !price.ok) {
      markRegionLocked(priceEl, region);
      regionalLog.debug('render.locked', '标记地区不可用', { item, region: region.id });
      return;
    }
    priceEl.querySelector('.sapx-region-locked')?.remove();

    if (!formatted) return;

    upsertExtraInside(priceEl, region, formatted, price);
    regionalLog.debug('render.price', '地区价格已显示', { item, region: region.id, kind: wantInitial ? 'initial' : 'final' });
  }

  function getRegionalCartRows() {
    // Steam's outer button also wraps skeletons and the empty-cart message.
    // Count each real row once, with a fallback for the older cart markup.
    return Array.from(document.querySelectorAll(PAGE_ADAPTERS.cart.rows)).filter(row =>
      row.matches(CART_ITEM_ROW) || (!row.querySelector(CART_ITEM_ROW) &&
        Boolean(row.querySelector(CART_ITEM_PRICES))));
  }

  async function updateCartSummary() {
    if (!isCartPage()) return;
    const revision = ++summaryRevision;
    const scope = regionalScope;
    const path = location.pathname;
    const region = getTargetRegion();
    const items = getRegionalCartRows();
    const totalValue = Array.from(document.querySelectorAll('.i1XZFikuzME- .n9HLAjXXhvI-'))
      .find(element => element.getClientRects().length > 0) || document.querySelector('.i1XZFikuzME- .n9HLAjXXhvI-');
    const totalRow = totalValue?.closest('._1mIUrXeHG3k-') || Array.from(document.querySelectorAll('.i1XZFikuzME- > div'))
      .find(row => /预计总额/.test(row.textContent));
    if (!items.length || !totalRow) {
      document.getElementById(CART_SUMMARY_ID)?.remove();
      regionalLog.debug('summary.wait', '购物车汇总等待页面节点', { items: items.length, totalRow: Boolean(totalRow) });
      if (items.length) scheduleCartSummaryRetry();
      return;
    }

    let sumMinor = 0;
    let missingCount = 0;

    const refs = items.map(inferCartItem);
    const results = await Promise.all(refs.map(async item => {
      if (!item) return {};
      try { return { price: await getPriceForItem(item, region) }; }
      catch (_) { return { failed: true }; }
    }));
    if (revision !== summaryRevision || scope?.active === false || location.pathname !== path ||
        getTargetRegion().id !== region.id || !totalRow.isConnected) return;
    const unidentified = refs.filter(item => !item).length;
    let failed = 0;
    let priced = 0;
    let completionCount = 0;
    let fullBundleCount = 0;
    for (const result of results) {
      if (result.failed) failed++;
      else if (result.price?.ok && Number.isFinite(result.price.final)) {
        sumMinor += result.price.final;
        priced++;
        if (result.price.completion) completionCount++;
        if (result.price.fullBundle) fullBundleCount++;
      } else if (result.price === null) missingCount++;
    }

    const totalText = priced ? await formatRegionalDisplayPrice(sumMinor, region.currency, formatMinorToCurrency(sumMinor, region.currency)) : '—';
    if (revision !== summaryRevision || scope?.active === false || location.pathname !== path ||
        getTargetRegion().id !== region.id || !totalRow.isConnected) return;
    const currentRows = getRegionalCartRows();
    if (currentRows.length !== items.length || currentRows.some((row, i) => row !== items[i] ||
        itemKey(inferCartItem(row) || {}) !== itemKey(refs[i] || {}))) return;

    let box = document.getElementById(CART_SUMMARY_ID);
    if (!box || !box.isConnected) {
      box = document.createElement('div');
      box.id = CART_SUMMARY_ID;
      totalRow.after(box);
    }

    const unknownCount = unidentified + failed;
    const title = priced && priced < items.length ? '目标地区已确认小计' : '目标地区预计付款';
    const label = getShowRegionCode() ? title + ' (' + region.short + ')' : title;

    let html = '<div class="sapx-row"><div class="sapx-label">' + label + '：</div><div class="sapx-value">' + totalText + '</div></div>';
    if (missingCount > 0) html += '<div class="sapx-warn">目标地区有 ' + missingCount + ' 款锁区游戏，未计入小计</div>';
    if (unknownCount > 0) html += '<div class="sapx-warn">有 ' + unknownCount + ' 项价格暂时无法确认，未计入小计</div>';
    if (completionCount > 0) html += '<div class="sapx-warn">含 ' + completionCount + ' 项按当前账号已拥有内容计算的预计补齐价，以 Steam 结算为准</div>';
    if (fullBundleCount > 0) html += '<div class="sapx-warn">含 ' + fullBundleCount + ' 项礼物捆绑包整包价，未按收礼人计算补齐</div>';
    if (box.innerHTML !== html) box.innerHTML = html;
    regionalLog.debug('summary.complete', '购物车额外地区汇总完成', {
      region: region.id,
      total: totalText,
      items: items.length,
      priced,
      completion: completionCount,
      unidentified,
      failed,
      missing: missingCount
    });
  }

  let cartSummaryRetry = null;
  function scheduleCartSummaryRetry() {
    if (cartSummaryRetry || !isCartPage()) return;
    cartSummaryRetry = regionalScope.timeout(() => {
      cartSummaryRetry = null;
      updateCartSummary();
    }, 800);
  }

  function isPriceLeaf(el) {
    if (!el || el.children.length > 0) return false;
    if (el.classList.contains(EXTRA_CLASS)) return false;
    const txt = el.textContent.trim();
    if (!txt || txt.length > 25) return false;
    if (/^-\d+%$/.test(txt)) return false;
    if (/\d{4}年\d+月\d+日/.test(txt)) return false;
    if (/添加时间|发行日期|评测|好评|差评|用户标签|我的类别|添加到购物车|移除|愿望单|优先级/.test(txt)) return false;
    if (!/[\d]|Free|免费/i.test(txt)) return false;
    if (/^\d+$/.test(txt)) return false;
    return true;
  }

  function scanCartFallback(rows, enhance = enhancePriceElement) {
    rows.forEach(row => {
      row.querySelectorAll(CART_ITEM_PRICES)
        .forEach(price => enhance(price));
    });
  }

  function scanWishlistFallback(rows, enhance = enhancePriceElement) {
    rows.forEach(row => {
      let priceLeaves = [];

      const linkContainer = row.querySelector('div[role="link"]');
      if (linkContainer) {
        priceLeaves = Array.from(linkContainer.querySelectorAll('div')).filter(isPriceLeaf);
      }

      if (priceLeaves.length === 0) {
        const seen = new Set();
        row.querySelectorAll('a[href*="/app/"]').forEach(a => {
          Array.from(a.querySelectorAll('div')).forEach(el => {
            if (isPriceLeaf(el) && !seen.has(el)) {
              seen.add(el);
              priceLeaves.push(el);
            }
          });
        });
      }

      if (priceLeaves.length === 0) {
        const seen = new Set();
        Array.from(row.querySelectorAll('div')).forEach(el => {
          if (isPriceLeaf(el) && !seen.has(el)) {
            seen.add(el);
            priceLeaves.push(el);
          }
        });
      }

      if (priceLeaves.length === 0) return;

      if (priceLeaves.length >= 2) {
        enhance(priceLeaves[0], 'initial');
        enhance(priceLeaves[priceLeaves.length - 1], 'final');
      } else if (priceLeaves.length === 1) {
        enhance(priceLeaves[0], 'final');
      }
    });
  }

  let regionalScanner;
  function scheduleScan() { regionalScanner?.scan(); }
  function startObserver() {
    const scope = regionalScope = createFeatureScope('regional-prices');
    scope.own(() => {
      summaryRevision++;
      for (const pending of pendingPrices.values()) pending.queueController.abort();
      pendingPrices.clear();
      bundleCartCache.clear();
      bundleOwnershipCache.clear();
      bundleDetailsCache.clear();
      regionalScanner = null;
      cartSummaryRetry = null;
      document.querySelectorAll('.' + EXTRA_CLASS + ', .sapx-region-locked, #' + CART_SUMMARY_ID).forEach(node => node.remove());
    });
    const safeEnhance = (el, type, viewer) => enhancePriceElement(el, type, viewer).catch(error => {
      if (scope.active && error.kind !== 'aborted') regionalLog.debug('price.unconfirmed', '价格暂时无法确认', { error });
    });
    const cartPage = isCartPage();
    const wishlistPage = isWishlistPage();
    const prices = PRICE_SELECTORS + (cartPage ? ',.i1XZFikuzME-' : '');
    regionalScanner = createDomScanner({ scope, name: 'regional-prices', attributes: ITEM_ATTRIBUTES,
      selector: prices + ',' + PAGE_ADAPTERS.wishlist.rows + ',' + PAGE_ADAPTERS.cart.rows,
      characterData: prices + (cartPage ? ',' + CART_ITEM_PRICES : '') + (wishlistPage ? ',' + PAGE_ADAPTERS.wishlist.rows : ''),
      intersection: cartPage ? undefined : { rootMargin: '200px' },
      process: (elements, visibilitySignal) => {
        for (const el of elements) if (el.matches(PRICE_SELECTORS)) safeEnhance(el, 'auto', visibilitySignal?.(el));
        if (isWishlistPage()) for (const row of elements) {
          if (row.matches(PAGE_ADAPTERS.wishlist.rows)) {
            scanWishlistFallback([row], (el, type) => {
              if (!visibilitySignal || !el.matches(PRICE_SELECTORS)) safeEnhance(el, type, visibilitySignal?.(row));
            });
          }
        }
        if (isCartPage()) scanCartFallback(elements.filter(el => el.matches(PAGE_ADAPTERS.cart.rows)), safeEnhance);
      },
      changed: () => {
        summaryRevision++;
        if (isCartPage()) {
          bundleCartRevision++;
          bundleCartCache.clear();
          for (const key of priceCache.keys()) if (key.startsWith('bundle:')) priceCache.delete(key);
        }
        if (isCartPage()) updateCartSummary().catch(error => regionalLog.debug('summary.failed', '汇总暂不可用', { error }));
      }
    });
    return scope;
  }
