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

  const priceCache = new Map();
  const pendingPrices = new Map();
  const pendingElements = new WeakSet();
  const CACHE_TTL_MS = 5 * 60 * 1000;

  function cacheGet(key) {
    const v = priceCache.get(key);
    if (!v) return undefined;
    if (Date.now() - v.ts > CACHE_TTL_MS) { priceCache.delete(key); return undefined; }
    return v.value;
  }

  function cacheSet(key, value) { priceCache.set(key, { ts: Date.now(), value }); }

  function normalizePrice(o) {
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

  async function getAppPrice(appid, cc, currencyFallback) {
    const url = 'https://store.steampowered.com/api/appdetails?appids=' + appid + '&cc=' + cc + '&filters=price_overview,is_free';
    const text = await requestQueue.enqueue(() => gmGet(url));
    const parsed = JSON.parse(text);
    const block = parsed && parsed[String(appid)];
    if (!block || !block.success) return null;
    const data = block.data || {};
    if (data.is_free) return normalizePrice({ currency: currencyFallback, final: 0, initial: 0, finalFormatted: 'Free', initialFormatted: 'Free' });
    const po = data.price_overview;
    if (!po) return null;
    return normalizePrice({
      currency: po.currency,
      final: po.final,
      initial: po.initial,
      finalFormatted: po.final_formatted,
      initialFormatted: po.initial_formatted || po.final_formatted,
      discountPercent: po.discount_percent
    });
  }

  async function getPackagePrice(packageid, cc, currencyFallback) {
    try {
      const payload = {
        ids: [{ packageid: parseInt(packageid, 10) }],
        context: { language: 'schinese', country_code: cc, steam_realm: 1 },
        data_request: { include_all_purchase_options: true }
      };
      const url = 'https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=' + encodeURIComponent(JSON.stringify(payload));
      const text = await requestQueue.enqueue(() => gmGet(url));
      const parsed = JSON.parse(text);
      const items = parsed && parsed.response && parsed.response.store_items;
      if (items && items.length > 0) {
        const item = items[0];
        let po = item.best_purchase_option;
        if (!po && item.purchase_options && item.purchase_options.length > 0) {
          po = item.purchase_options.find(o => o.final_price_in_cents !== undefined) || item.purchase_options[0];
        }
        if (po && po.final_price_in_cents !== undefined) {
          if (!po.currency_code || po.currency_code === currencyFallback) {
            return normalizePrice({
              currency: po.currency_code || currencyFallback,
              final: parseInt(po.final_price_in_cents, 10),
              initial: po.original_price_in_cents ? parseInt(po.original_price_in_cents, 10) : parseInt(po.final_price_in_cents, 10),
              finalFormatted: po.formatted_final_price,
              initialFormatted: po.formatted_original_price || po.formatted_final_price,
              discountPercent: po.discount_pct
            });
          }
        }
      }
    } catch (error) { regionalLog.debug('package.fallback', '套餐接口失败，尝试备用接口', { packageid, cc, error }); }

    try {
      const url = 'https://store.steampowered.com/api/packagedetails?packageids=' + packageid + '&cc=' + cc;
      const text = await requestQueue.enqueue(() => gmGet(url));
      const parsed = JSON.parse(text);
      const block = parsed && parsed[String(packageid)];
      if (!block || !block.success) return null;
      const p = (block.data && (block.data.price || block.data.price_overview)) || null;
      if (!p) return null;
      return normalizePrice({
        currency: p.currency,
        final: p.final,
        initial: p.initial,
        finalFormatted: p.final_formatted,
        initialFormatted: p.initial_formatted,
        discountPercent: p.discount_percent
      });
    } catch (e) {
      regionalLog.debug('package.unavailable', '备用套餐接口失败', { packageid, cc, error: e });
      return null;
    }
  }

  async function getBundlePrice(bundleid, cc, currencyFallback) {
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
    const text = await requestQueue.enqueue(() => gmGet(url));
    const parsed = JSON.parse(text);
    const items = parsed && parsed.response && parsed.response.store_items;
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

    return normalizePrice({
      currency: po.currency_code || currencyFallback,
      final: finalMinor,
      initial: Number.isFinite(initialMinor) ? initialMinor : finalMinor,
      finalFormatted: po.formatted_final_price,
      initialFormatted: po.formatted_original_price || po.formatted_final_price,
      discountPercent: po.discount_pct
    });
  }

  function getPriceForItem(item, region) {
    const key = item.type + ':' + item.id + ':' + region.id;
    if (pendingPrices.has(key)) { regionalLog.debug('price.join', '复用进行中的价格查询', { item: key }); return pendingPrices.get(key); }
    const pending = fetchPriceForItem(item, region).finally(() => pendingPrices.delete(key));
    pendingPrices.set(key, pending);
    return pending;
  }

  async function fetchPriceForItem(item, region) {
    const key = item.type + ':' + item.id + ':' + region.id;
    const cached = cacheGet(key);
    if (cached !== undefined) { regionalLog.debug('cache.hit', '命中价格缓存', { item: key }); return cached; }
    const task = regionalLog.begin('price.fetch', { item: key });
    for (const cc of region.ccCandidates) {
      task.debug('candidate', '读取候选地区', { cc });
      try {
        let res = null;
        if (item.type === 'app') res = await getAppPrice(item.id, cc, region.currency);
        else if (item.type === 'package') res = await getPackagePrice(item.id, cc, region.currency);
        else if (item.type === 'bundle') res = await getBundlePrice(item.id, cc, region.currency);
        if (res && res.ok) {
          if (item.type === 'bundle' || !res.currency || res.currency === region.currency) {
            cacheSet(key, res);
            task.end('地区价格读取成功', { item: key, country: cc });
            return res;
          }
        }
      } catch (error) { task.debug('candidate.failed', '候选地区价格读取失败', { item: key, country: cc, error }); }
    }
    cacheSet(key, null);
    task.end('没有可用地区价格', { item: key, available: false });
    return null;
  }

  function inferItemFromScope(scopeEl) {
    if (!scopeEl) return null;

    // 1) 愿望单 React 条目
    const draggable = scopeEl.closest('[data-rfd-draggable-id^="WishlistItem-"]');
    if (draggable) {
      const m = (draggable.getAttribute('data-rfd-draggable-id') || '').match(/^WishlistItem-(\d+)-/);
      if (m) return { type: 'app', id: m[1] };
    }

    // 2) 商店页购买区块隔离
    const targetGame = scopeEl.closest('.game_area_purchase_game, .game_area_purchase_game_wrapper');
    if (targetGame) {
      // 优先识别捆绑包，再识别套餐和单个游戏。
      const bundleEls = targetGame.querySelectorAll('[href*="/bundle/"], [onclick*="ShowBundleInfo"], [onclick*="addBundleToCart"], [data-ds-bundleid]');
      for (const el of bundleEls) {
        const attr = el.getAttribute('href') || el.getAttribute('onclick') || el.getAttribute('data-ds-bundleid') || '';
        const m = attr.match(/\/bundle\/(\d+)/) || attr.match(/ShowBundleInfo\(['"]?(\d+)['"]?\)/) || attr.match(/addBundleToCart\(['"]?(\d+)['"]?/) || attr.match(/^(\d+)/);
        if (m) return { type: 'bundle', id: m[1] };
      }

      // 兼容某些老样式下 data-ds-bundleid 在父级容器的情况
      const closestBnd = scopeEl.closest('[data-ds-bundleid]');
      if (closestBnd && closestBnd.dataset.dsBundleid) {
        return { type: 'bundle', id: closestBnd.dataset.dsBundleid.split(',')[0] };
      }

      // 接下来才是 Package (隐藏表单 input[name="subid"])
      const subInput = targetGame.querySelector('input[name="subid"]');
      if (subInput && subInput.value) {
        return { type: 'package', id: subInput.value };
      }

      // 查找 Package (data-ds-packageid)
      const pkgHolder = targetGame.querySelector('[data-ds-packageid]');
      if (pkgHolder && pkgHolder.dataset.dsPackageid) {
        return { type: 'package', id: pkgHolder.dataset.dsPackageid.split(',')[0] };
      }

      // 从 addToCart 按钮提取
      const addBtn = targetGame.querySelector('a[href*="addToCart"], button[onclick*="addToCart"], a[onclick*="addToCart"]');
      if (addBtn) {
        const attr = addBtn.getAttribute('href') || addBtn.getAttribute('onclick') || '';
        const m = attr.match(/addToCart\((\d+)/) || attr.match(/subid=(\d+)/);
        if (m) return { type: 'package', id: m[1] };
      }

      // 查找 App
      const appHolder = targetGame.querySelector('[data-ds-appid]');
      if (appHolder && appHolder.dataset.dsAppid) {
        return { type: 'app', id: appHolder.dataset.dsAppid.split(',')[0] };
      }

      // 文本兜底 (# 1324561 或 # 87495)
      const textMatch = targetGame.textContent.match(/#\s*(\d+)/);
      if (textMatch) {
        if (/捆绑包|bundle/i.test(targetGame.textContent)) {
          return { type: 'bundle', id: textMatch[1] };
        }
        return { type: 'package', id: textMatch[1] };
      }
    }

    // 3) 常规 data 属性
    const holder = scopeEl.closest('[data-ds-appid],[data-ds-packageid],[data-ds-bundleid]');
    if (holder) {
      const bnd = holder.dataset.dsBundleid;
      const pkg = holder.dataset.dsPackageid && holder.dataset.dsPackageid.split(',')[0];
      const app = holder.dataset.dsAppid && holder.dataset.dsAppid.split(',')[0];
      if (bnd) return { type: 'bundle', id: bnd };
      if (pkg) return { type: 'package', id: pkg };
      if (app) return { type: 'app', id: app };
    }

    // 4) data-app-id
    const appIdHolder = scopeEl.closest('[data-app-id]');
    if (appIdHolder) {
      const id = String(appIdHolder.getAttribute('data-app-id')).split(',')[0].trim();
      if (/^\d+$/.test(id)) return { type: 'app', id };
    }

    // 5) 向上逐层遍历，找 /app/ 链接
    let node = scopeEl;
    while (node && node !== document.body) {
      if (node.tagName === 'A') {
        const m = (node.getAttribute('href') || '').match(/\/app\/(\d+)/);
        if (m) return { type: 'app', id: m[1] };
      }
      const link = node.querySelector('a[href*="/app/"]');
      if (link) {
        const m = (link.getAttribute('href') || '').match(/\/app\/(\d+)/);
        if (m) return { type: 'app', id: m[1] };
      }
      node = node.parentElement;
    }

    // 6) 自身或子元素找链接
    const link = scopeEl.querySelector('a[href*="/app/"],a[href*="/sub/"],a[href*="/bundle/"]');
    if (link) {
      const h = link.getAttribute('href') || '';
      let m = h.match(/\/bundle\/(\d+)/); if (m) return { type: 'bundle', id: m[1] };
      m = h.match(/\/app\/(\d+)/); if (m) return { type: 'app', id: m[1] };
      m = h.match(/\/sub\/(\d+)/); if (m) return { type: 'package', id: m[1] };
    }

    // 7) 当前页面
    const p = location.pathname;
    let m = p.match(/^\/bundle\/(\d+)/); if (m) return { type: 'bundle', id: m[1] };
    m = p.match(/^\/app\/(\d+)/); if (m) return { type: 'app', id: m[1] };
    m = p.match(/^\/sub\/(\d+)/); if (m) return { type: 'package', id: m[1] };

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

  function upsertExtraInside(priceEl, region, formatted) {
    let span = priceEl.querySelector('.' + EXTRA_CLASS);
    const text = getShowRegionCode() ? '(' + region.short + ' ' + formatted + ')' : '(' + formatted + ')';
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

  async function enhancePriceElement(priceEl, forceType = 'auto') {
    if (!priceEl || priceEl.nodeType !== 1 || priceEl.classList.contains(EXTRA_CLASS)) return;
    if (pendingElements.has(priceEl)) return;
    const txt = priceEl.textContent.trim();
    if (!txt || /^-\d+%$/.test(txt) || txt.length > 120) return;
    if (priceEl.offsetWidth === 0 && !priceEl.closest('.game_area_purchase_game_dropdown_menu')) return;

    const region = getTargetRegion();
    const exist = priceEl.querySelector('.' + EXTRA_CLASS);
    if (exist && exist.getAttribute(MARK_ATTR) === region.id) return;

    const item = inferItemFromScope(priceEl);
    if (!item) return;

    const locked = priceEl.querySelector('.sapx-region-locked');
    if (locked && locked.getAttribute(MARK_ATTR) === region.id) return;

    pendingElements.add(priceEl);
    let price;
    try { price = await getPriceForItem(item, region); }
    finally { pendingElements.delete(priceEl); }
    if (!priceEl.isConnected) return;
    if (!price || !price.ok) {
      markRegionLocked(priceEl, region);
      regionalLog.debug('render.locked', '标记地区不可用', { item, region: region.id });
      return;
    }
    priceEl.querySelector('.sapx-region-locked')?.remove();

    let wantInitial = false;
    if (forceType === 'initial') {
      wantInitial = true;
    } else if (forceType === 'final') {
      wantInitial = false;
    } else {
      wantInitial = isOriginalPriceElement(priceEl);
    }

    const formatted = wantInitial ? (price.initialFormatted || price.finalFormatted) : price.finalFormatted;
    if (!formatted) return;

    upsertExtraInside(priceEl, region, formatted);
    regionalLog.debug('render.price', '地区价格已显示', { item, region: region.id, kind: wantInitial ? 'initial' : 'final' });
  }

  async function updateCartSummary() {
    if (!isCartPage()) return;
    const region = getTargetRegion();
    const itemNodes = document.querySelectorAll('.i-xXuvHLioU-[role="button"]');
    const items = itemNodes.length ? itemNodes : document.querySelectorAll('.bKkQiLkI-vk-');
    const totalValue = Array.from(document.querySelectorAll('.i1XZFikuzME- .n9HLAjXXhvI-'))
      .find(element => element.getClientRects().length > 0) || document.querySelector('.i1XZFikuzME- .n9HLAjXXhvI-');
    const totalRow = totalValue?.closest('._1mIUrXeHG3k-') || Array.from(document.querySelectorAll('.i1XZFikuzME- > div'))
      .find(row => /预计总额/.test(row.textContent));
    if (!items.length || !totalRow) {
      regionalLog.debug('summary.wait', '购物车汇总等待页面节点', { items: items.length, totalRow: Boolean(totalRow) });
      scheduleCartSummaryRetry();
      return;
    }

    let sumMinor = 0;
    let missingCount = 0;

    for (const row of items) {
      const item = inferItemFromScope(row);
      if (!item) continue;
      const price = await getPriceForItem(item, region);
      if (price && price.ok && price.final !== null && Number.isFinite(price.final)) sumMinor += price.final;
      else missingCount++;
    }

    let box = document.getElementById(CART_SUMMARY_ID);
    if (!box || !box.isConnected) {
      box = document.createElement('div');
      box.id = CART_SUMMARY_ID;
      totalRow.after(box);
    }

    const totalText = formatMinorToCurrency(sumMinor, region.currency);
    const label = getShowRegionCode() ? '目标地区预计付款 (' + region.short + ')' : '目标地区预计付款';

    let html = '<div class="sapx-row"><div class="sapx-label">' + label + '：</div><div class="sapx-value">' + totalText + '</div></div>';
    if (missingCount > 0) html += '<div class="sapx-warn">目标地区有 ' + missingCount + ' 款锁区游戏，未计入小计</div>';
    if (box.innerHTML !== html) box.innerHTML = html;
    regionalLog.debug('summary.complete', '购物车额外地区汇总完成', {
      region: region.id,
      total: totalText,
      items: items.length,
      missing: missingCount
    });
  }

  let cartSummaryRetry = null;
  function scheduleCartSummaryRetry() {
    if (cartSummaryRetry || !isCartPage()) return;
    cartSummaryRetry = setTimeout(() => {
      cartSummaryRetry = null;
      updateCartSummary();
    }, 800);
  }

  const PRICE_SELECTORS = [
    '.discount_final_price', '.discount_original_price', '.game_purchase_price',
    '.game_area_dlc_price', '.col.search_price.responsive_secondrow strike',
    '.col.search_price.responsive_secondrow .discount_final_price',
    '.Panel.Focusable .StoreOriginalPrice', '.Panel.Focusable .pk-LoKoNmmPK4GBiC9DR8',
    '._2WLaY5TxjBGVyuWe_6KS3N', '.game_area_purchase_game_dropdown_selection > span',
    '.game_area_purchase_game_dropdown_menu_item_text',
    '.StoreOriginalPrice', '.j3jr1YqpBGk- > .-nS4ZC0Bruo-'
  ].join(',');

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

  function scanCartFallback() {
    document.querySelectorAll('.i-xXuvHLioU-[role="button"]').forEach(row => {
      row.querySelectorAll('.StoreOriginalPrice, .j3jr1YqpBGk- > .-nS4ZC0Bruo-')
        .forEach(price => enhancePriceElement(price));
    });
  }

  function scanWishlistFallback() {
    document.querySelectorAll('[data-rfd-draggable-id^="WishlistItem-"]').forEach(row => {
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
        enhancePriceElement(priceLeaves[0], 'initial');
        enhancePriceElement(priceLeaves[priceLeaves.length - 1], 'final');
      } else if (priceLeaves.length === 1) {
        enhancePriceElement(priceLeaves[0], 'final');
      }
    });
  }

  let scanTimer = null;

  function scheduleScan() {
    if (scanTimer) return;
    scanTimer = setTimeout(() => {
      scanTimer = null;
      const elements = document.querySelectorAll(PRICE_SELECTORS);
      regionalLog.debug('scan.start', '扫描价格节点', { count: elements.length });
      elements.forEach(el => { enhancePriceElement(el); });
      if (isWishlistPage()) scanWishlistFallback();
      if (isCartPage()) { scanCartFallback(); updateCartSummary(); }
    }, 450);
  }

  function startObserver() {
    regionalLog.info('observer.ready', '地区价格扫描与动态监听已启用');
    const obs = new MutationObserver(mutations => {
      if (mutations.some(mutation => !mutation.target.parentElement?.closest('#' + UI_ROOT_ID + ', .' + EXTRA_CLASS + ', #' + CART_SUMMARY_ID) &&
          !(mutation.target.nodeType === 1 && mutation.target.closest('#' + UI_ROOT_ID + ', .' + EXTRA_CLASS + ', #' + CART_SUMMARY_ID)))) scheduleScan();
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
