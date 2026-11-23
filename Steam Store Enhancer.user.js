// ==UserScript==
// @name         Steam Store Enhancer
// @namespace   https://github.com/linyaocrush/Steam-Store-Enhancer
// @homepageURL  https://greasyfork.org/zh-CN/scripts/605911-steam-store-enhancer
// @homepageURL  https://github.com/linyaocrush/Steam-Store-Enhancer
// @downloadURL  https://raw.githubusercontent.com/linyaocrush/Steam-Store-Enhancer/main/Steam%20Store%20Enhancer.user.js
// @updateURL    https://raw.githubusercontent.com/linyaocrush/Steam-Store-Enhancer/main/Steam%20Store%20Enhancer.user.js
// @version      1.11.2
// @description  Steam 额外地区价格、汇率转换、悬停游戏详情、快速加购、愿望单及商店列表折扣倒计时、购物车批量管理与家庭库游戏标记。
// @author       linyaocrush, marioplus, Chr_, Cliencer Goge, Miku39
// @license      AGPL-3.0
// @match        https://store.steampowered.com/*
// @match        https://steamcommunity.com/*
// @match        https://checkout.steampowered.com/checkout/*
// @match        https://keylol.com/*
// @match        https://steamdb.keylol.com/tooltip*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_setValue
// @grant        GM_setClipboard
// @grant        GM_deleteValue
// @grant        GM_cookie
// @grant        GM_info
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      store.steampowered.com
// @connect      api.steampowered.com
// @connect      api.augmentedsteam.com
// @connect      raw.githubusercontent.com
// @connect      api.github.com
// @connect      cdn.jsdelivr.net
// @connect      fastly.jsdelivr.net
// ==/UserScript==

(function () {
  'use strict';

  // ---- config.js ----
  const STORAGE_KEY_REGION_ID = 'sapx_target_region_id_v1';
  const STORAGE_KEY_SHOW_CODE = 'sapx_show_region_code_v1';

  const REGIONS = [
    { id: 'SASIA_USD', short: 'SASIA', label: 'South Asia - USD', currency: 'USD', ccCandidates: ['PK'] },
    { id: 'CNY', short: 'CN', label: 'Chinese Yuan', currency: 'CNY', ccCandidates: ['CN'] },
    { id: 'INR', short: 'IN', label: 'Indian Rupee', currency: 'INR', ccCandidates: ['IN'] },
    { id: 'UAH', short: 'UA', label: 'Ukrainian Hryvnia', currency: 'UAH', ccCandidates: ['UA'] },
    { id: 'VND', short: 'VN', label: 'Vietnamese Dong', currency: 'VND', ccCandidates: ['VN'] },
    { id: 'IDR', short: 'ID', label: 'Indonesian Rupiah', currency: 'IDR', ccCandidates: ['ID'] },
    { id: 'KZT', short: 'KZ', label: 'Kazakhstani Tenge', currency: 'KZT', ccCandidates: ['KZ'] },
    { id: 'PHP', short: 'PH', label: 'Philippine Peso', currency: 'PHP', ccCandidates: ['PH'] },
    { id: 'KRW', short: 'KR', label: 'South Korea Won', currency: 'KRW', ccCandidates: ['KR'] },
    { id: 'PEN', short: 'PE', label: 'Peruvian Sol', currency: 'PEN', ccCandidates: ['PE'] },
    { id: 'JPY', short: 'JP', label: 'Japanese Yen', currency: 'JPY', ccCandidates: ['JP'] },
    { id: 'CIS_USD', short: 'CIS', label: 'CIS - U.S. Dollar', currency: 'USD', ccCandidates: ['AZ'] },
    { id: 'LATAM_USD', short: 'LATAM', label: 'LATAM - U.S. Dollar', currency: 'USD', ccCandidates: ['AR'] },
    { id: 'MENA_USD', short: 'MENA', label: 'MENA - U.S. Dollar', currency: 'USD', ccCandidates: ['TR'] },
    { id: 'THB', short: 'TH', label: 'Thai Baht', currency: 'THB', ccCandidates: ['TH'] },
    { id: 'MYR', short: 'MY', label: 'Malaysian Ringgit', currency: 'MYR', ccCandidates: ['MY'] },
    { id: 'CLP', short: 'CL', label: 'Chilean Peso', currency: 'CLP', ccCandidates: ['CL'] },
    { id: 'MXN', short: 'MX', label: 'Mexican Peso', currency: 'MXN', ccCandidates: ['MX'] },
    { id: 'UYU', short: 'UY', label: 'Uruguayan Peso', currency: 'UYU', ccCandidates: ['UY'] },
    { id: 'BRL', short: 'BR', label: 'Brazilian Real', currency: 'BRL', ccCandidates: ['BR'] },
    { id: 'TWD', short: 'TW', label: 'Taiwan Dollar', currency: 'TWD', ccCandidates: ['TW'] },
    { id: 'ZAR', short: 'ZA', label: 'South African Rand', currency: 'ZAR', ccCandidates: ['ZA'] },
    { id: 'AED', short: 'AE', label: 'U.A.E. Dirham', currency: 'AED', ccCandidates: ['AE'] },
    { id: 'HKD', short: 'HK', label: 'Hong Kong Dollar', currency: 'HKD', ccCandidates: ['HK'] },
    { id: 'NZD', short: 'NZ', label: 'New Zealand Dollar', currency: 'NZD', ccCandidates: ['NZ'] },
    { id: 'NOK', short: 'NO', label: 'Norwegian Krone', currency: 'NOK', ccCandidates: ['NO'] },
    { id: 'KWD', short: 'KW', label: 'Kuwaiti Dinar', currency: 'KWD', ccCandidates: ['KW'] },
    { id: 'COP', short: 'CO', label: 'Colombian Peso', currency: 'COP', ccCandidates: ['CO'] },
    { id: 'AUD', short: 'AU', label: 'Australian Dollar', currency: 'AUD', ccCandidates: ['AU'] },
    { id: 'USD', short: 'US', label: 'U.S. Dollar', currency: 'USD', ccCandidates: ['US'] },
    { id: 'CAD', short: 'CA', label: 'Canadian Dollar', currency: 'CAD', ccCandidates: ['CA'] },
    { id: 'SGD', short: 'SG', label: 'Singapore Dollar', currency: 'SGD', ccCandidates: ['SG'] },
    { id: 'SAR', short: 'SA', label: 'Saudi Riyal', currency: 'SAR', ccCandidates: ['SA'] },
    { id: 'QAR', short: 'QA', label: 'Qatari Riyal', currency: 'QAR', ccCandidates: ['QA'] },
    { id: 'GBP', short: 'GB', label: 'British Pound', currency: 'GBP', ccCandidates: ['GB'] },
    { id: 'EUR', short: 'EU', label: 'Euro', currency: 'EUR', ccCandidates: ['EU', 'DE'] },
    { id: 'PLN', short: 'PL', label: 'Polish Zloty', currency: 'PLN', ccCandidates: ['PL'] },
    { id: 'CRC', short: 'CR', label: 'Costa Rican Colon', currency: 'CRC', ccCandidates: ['CR'] },
    { id: 'ILS', short: 'IL', label: 'Israeli New Shekel', currency: 'ILS', ccCandidates: ['IL'] },
    { id: 'CHF', short: 'CH', label: 'Swiss Franc', currency: 'CHF', ccCandidates: ['CH'] },
    { id: 'RUB', short: 'RU', label: 'Russian Ruble', currency: 'RUB', ccCandidates: ['RU'] }
  ];

  function getRegionById(id) { return REGIONS.find(r => r.id === id) || null; }
  function getTargetRegion() { const id = GM_getValue(STORAGE_KEY_REGION_ID, 'CNY'); return getRegionById(id) || getRegionById('CNY'); }
  function getShowRegionCode() { return Boolean(GM_getValue(STORAGE_KEY_SHOW_CODE, true)); }
  function isCartPage() { return /^\/cart(?:\/|$)/i.test(location.pathname); }
  function isWishlistPage() { return /^\/wishlist(?:\/|$)/i.test(location.pathname); }

  const STYLE_ID = 'sapx-style';
  const EXTRA_CLASS = 'sapx-extra-price';
  const CART_SUMMARY_ID = 'sapx-cart-summary';
  const MARK_ATTR = 'data-sapx-region';

  const UI_STYLE_ID = 'sapx-ui-style';
  const UI_ROOT_ID = 'sapx-ui-root';

  // ---- logging/policy.js ----
  // Logging owns its settings. The legacy field is read only once for migration.
  const LOG_LEVELS = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40, off: Infinity });
  const LOG_LEVEL_KEY = 'sse_log_level';

  function isLogLevel(value) {
    return typeof value === 'string' && Object.hasOwn(LOG_LEVELS, value);
  }

  function createLogPolicy(read, write) {
    let current = 'info';
    try {
      const saved = read(LOG_LEVEL_KEY);
      if (isLogLevel(saved)) current = saved;
      else if (saved == null) {
        const legacy = read('Storage:Setting');
        const value = typeof legacy === 'string' ? JSON.parse(legacy) : legacy;
        if (isLogLevel(value?.logLevel)) {
          current = value.logLevel;
          write(LOG_LEVEL_KEY, current);
        }
      }
    } catch (_) { /* Diagnostics must also work when storage is unavailable. */ }
    return {
      getLevel() {
        try {
          const saved = read(LOG_LEVEL_KEY);
          if (isLogLevel(saved)) current = saved;
        } catch (_) {}
        return current;
      },
      setLevel(value) {
        if (!isLogLevel(value)) throw new TypeError('无效的日志等级：' + value);
        write(LOG_LEVEL_KEY, value);
        current = value;
      }
    };
  }

  // ---- logging/format.js ----
  // Store snapshots, never live objects, DOM nodes, credentials or request bodies.
  function snapshotLogData(input) {
    const seen = new WeakSet();
    let remaining = 150;
    const privateKey = /token|authorization|cookie|sessionid|password|secret|comment|gift_message/i;
    const cleanText = value => String(value)
      .replace(/((?:access_token|sessionid|token|key)=)[^\s&#]+/gi, '$1[redacted]')
      .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').slice(0, 3000);
    function visit(value, depth) {
      if (--remaining < 0) return '[limit]';
      if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;
      if (typeof value === 'string') return cleanText(value);
      if (typeof value !== 'object') return cleanText(value);
      if (seen.has(value)) return '[circular]';
      if (depth > 5) return '[depth limit]';
      seen.add(value);
      try {
        if (value.nodeType) return { node: value.nodeName || 'DOM', id: value.id || undefined };
        if (Object.prototype.toString.call(value) === '[object Error]') {
          return { name: cleanText(value.name), message: cleanText(value.message), stack: cleanText(value.stack || ''),
            ...(value.cause === undefined ? {} : { cause: visit(value.cause, depth + 1) }) };
        }
        if (Array.isArray(value)) return value.slice(0, 40).map(item => visit(item, depth + 1));
        if (Object.prototype.toString.call(value) === '[object Map]') return visit([...value.entries()], depth + 1);
        const result = {};
        for (const key of Object.keys(value).slice(0, 40)) {
          if (privateKey.test(key)) result[key] = '[redacted]';
          else {
            const descriptor = Object.getOwnPropertyDescriptor(value, key);
            Object.defineProperty(result, key, { enumerable: true, configurable: true, writable: true,
              value: descriptor && 'value' in descriptor ? visit(descriptor.value, depth + 1) : '[accessor]' });
          }
        }
        return result;
      } catch (_) { return '[unavailable]'; }
    }
    return visit(input, 0);
  }

  function renderLogRecord(sink, record) {
    const palette = { debug: '#536c84', info: '#14618b', warn: '#855400', error: '#b32c30' };
    // DEBUG uses log deliberately: users need not enable DevTools' Verbose filter.
    const method = record.level === 'debug' ? 'log' : record.level;
    const output = typeof sink[method] === 'function' ? sink[method] : sink.log;
    if (typeof output !== 'function') return;
    const timing = record.durationMs === undefined ? '' : ` · ${record.durationMs}ms`;
    const trace = record.operation ? ` @${record.operation}` : '';
    output.call(sink,
      '%c SSE %c %s %c %s %c %s %c%s',
      'background:#1b2838;color:#9ed8f5;border-radius:3px;padding:2px 5px;font-weight:bold',
      'color:#77838f;font-family:monospace', record.time.slice(11, 23) + 'Z',
      `background:${palette[record.level]};color:#fff;border-radius:3px;padding:2px 5px;font-weight:bold`, record.level.toUpperCase(),
      'font-weight:bold', `${record.module} / ${record.step}`,
      'font-weight:normal', `#${record.sequence}${trace}${timing} ${record.message}`,
      record);
  }

  // ---- logging/service.js ----
  function createDiagnostics({ read, write, sink, now = () => Date.now(), capacity = 200 }) {
    const policy = createLogPolicy(read, write);
    const history = [];
    let sequence = 0;
    let operation = 0;
    const enabled = level => isLogLevel(level) && level !== 'off' && LOG_LEVELS[level] >= LOG_LEVELS[policy.getLevel()];

    function emit(module, level, step, message, data, extra = {}) {
      if (!enabled(level)) return;
      try {
        const record = {
          sequence: ++sequence, time: new Date(now()).toISOString(), level, module, step,
          message: snapshotLogData(String(message)), ...extra,
          data: snapshotLogData(typeof data === 'function' ? data() : data)
        };
        history.push(record);
        if (history.length > capacity) history.shift();
        renderLogRecord(sink, record);
      } catch (_) { /* Logging must never interrupt the feature being observed. */ }
    }

    function scope(module) {
      const logger = { enabled };
      for (const level of ['debug', 'info', 'warn', 'error']) {
        logger[level] = (step, message, data) => emit(module, level, step, message, data);
      }
      logger.begin = (step, data, level = 'debug') => {
        const id = ++operation;
        const started = now();
        let settled = false;
        emit(module, level, step, '开始', data, { operation: id, status: 'start' });
        const finish = (severity, status, message, details) => {
          if (settled) return;
          settled = true;
          emit(module, severity, step, message, details, { operation: id, status,
            durationMs: Math.max(0, now() - started) });
        };
        const span = {
          end: (message = '完成', details) => finish(level, 'success', message, details),
          fail: (error, details) => finish('error', 'failure', '失败', { error, details }),
          cancel: (message = '已取消', details) => finish(level, 'cancelled', message, details)
        };
        for (const severity of ['debug', 'info', 'warn', 'error']) {
          span[severity] = (childStep, message, details) => {
            if (!settled) emit(module, severity, `${step}.${childStep}`, message, details, { operation: id });
          };
        }
        return span;
      };
      return Object.freeze(logger);
    }
    return Object.freeze({ scope, enabled, getLevel: policy.getLevel, setLevel: policy.setLevel,
      records: () => JSON.parse(JSON.stringify(history)), clear: () => { history.length = 0; } });
  }

  // ---- logging/index.js ----
  const diagnostics = createDiagnostics({
    read: key => GM_getValue(key, null),
    write: (key, value) => GM_setValue(key, value),
    sink: console
  });

  // ---- shared.js ----
  function createElement(tag, content, className) {
    const element = document.createElement(tag);
    if (content !== undefined) element.textContent = content;
    if (className) element.className = className;
    return element;
  }

  async function forEachConcurrent(items, concurrency, callback) {
    const iterator = items?.[Symbol.iterator]?.() || Array.from(items || []).values();
    const workerCount = Math.max(1, Math.floor(concurrency) || 1);
    let nextIndex = 0;
    await Promise.all(Array.from({ length: workerCount }, async () => {
      for (;;) {
        const entry = iterator.next();
        if (entry.done) return;
        await callback(entry.value, nextIndex++);
      }
    }));
  }

  function readStoreSession(doc, globals = {}) {
    const config = doc.querySelector('#application_config');
    const read = name => {
      try {
        const value = JSON.parse(config?.getAttribute(name) || '{}');
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      } catch (_) {
        diagnostics.scope('session').debug('config.invalid', '页面配置不可解析，尝试其他来源', { attribute: name });
        return {};
      }
    };
    const settings = { ...globals.Config, ...read('data-config') };
    const user = read('data-store_user_config');
    const info = read('data-userinfo');
    let steamid = String(info.steamid || globals.UserConfig?.steamid || globals.g_steamID || '');
    let token = user.webapi_token;
    for (const entry of globals.SSR?.loaderData || []) {
      try {
        const data = typeof entry === 'string' ? JSON.parse(entry) : entry;
        token ||= data?.strWebAPIToken;
        steamid ||= String(data?.steamid || '');
      } catch (_) {}
    }
    const account = globals.g_AccountID || globals.UserConfig?.accountid;
    if (!steamid && account) {
      const accountId = Number(account);
      if (Number.isInteger(accountId) && accountId > 0 && accountId <= 4294967295) steamid = String(76561197960265728n + BigInt(accountId));
    }
    const country = settings.COUNTRY || settings.COUNTRY_CODE || settings.country_code || globals.UserConfig?.country || '';
    return { steamid, token, country: String(country).toUpperCase(), language: settings.LANGUAGE || 'schinese' };
  }

  // ---- runtime.js ----
  const featureScopes = new Map();
  const SCRIPT_OWNED_SELECTOR = '#sapx-ui-root, #sapx-cart-summary, #sse-cart-tools, .sse-cart-dialog, #sse-family-dialog, #sse-family-chart-tooltip, #sse-family-nav, #sse-cart-extract, #sse-friend-tools, #sse-game-hover, .sapx-extra-price, .sapx-region-locked, .sse-family-badge, .sse-family-banner, .sse-quick-add, .sse-restriction-badge, .sse-wishlist-sale-expiration';

  function isStorePageReady() {
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    return location.hostname !== 'store.steampowered.com' || !page.SSR || Boolean(page.SSR.hydrated);
  }

  function createFeatureScope(name) {
    featureScopes.get(name)?.dispose();
    const disposers = new Set();
    const controller = typeof AbortController === 'function' ? new AbortController() : {
      signal: { aborted: false, addEventListener() {}, removeEventListener() {} },
      abort() { this.signal.aborted = true; }
    };
    const scope = {
      signal: controller.signal,
      get active() { return !controller.signal.aborted; },
      own(dispose) { disposers.add(dispose); return dispose; },
      release(dispose) { disposers.delete(dispose); },
      listen(target, event, callback, options) {
        target.addEventListener(event, callback, options);
        scope.own(() => target.removeEventListener(event, callback, options));
      },
      timeout(callback, delay) {
        let id;
        const cancel = () => { clearTimeout(id); disposers.delete(cancel); };
        id = setTimeout(() => { disposers.delete(cancel); if (scope.active) callback(); }, delay);
        scope.own(cancel);
        return cancel;
      },
      interval(callback, delay) {
        const id = setInterval(() => { if (scope.active) callback(); }, delay);
        return scope.own(() => clearInterval(id));
      },
      wait(delay) {
        return new Promise(resolve => {
          const finish = value => { controller.signal.removeEventListener('abort', abort); resolve(value); };
          const abort = () => { cancel(); finish(false); };
          const cancel = scope.timeout(() => finish(true), delay);
          if (!scope.active) abort();
          else controller.signal.addEventListener('abort', abort, { once: true });
        });
      },
      dispose() {
        if (!scope.active) return;
        controller.abort();
        for (const dispose of disposers) {
          try { dispose(); } catch (error) { diagnostics.scope('core').warn('dispose.failed', '功能清理失败', { name, error }); }
        }
        disposers.clear();
        if (featureScopes.get(name) === scope) featureScopes.delete(name);
      }
    };
    featureScopes.set(name, scope);
    return scope;
  }

  function queryIncluding(root, selector) {
    const result = root.matches?.(selector) ? [root] : [];
    return result.concat(Array.from(root.querySelectorAll?.(selector) || []));
  }

  // One observer per feature, bounded to changed subtrees. Ancestors are only
  // matched, never searched recursively for each mutation.
  function createDomScanner({ scope, selector, process, changed, removed, delay = 200,
    attributes = [], root = document.body, name = 'dom', initial = true }) {
    const log = diagnostics.scope(name);
    const pending = new Set();
    const metrics = { fullScans: 0, batches: 0, candidates: 0, mutations: 0, durationMs: 0 };
    let cancelTimer;
    let dirty = false;
    let lost = false;
    const removedNodes = new Set();
    const owned = node => Boolean(node?.matches?.(SCRIPT_OWNED_SELECTOR) || node?.closest?.(SCRIPT_OWNED_SELECTOR));
    function collect(node, descendants = true) {
      if (!node || owned(node)) return;
      if (node.nodeType === 3) node = node.parentElement;
      if (!node) return;
      if (node.matches?.(selector)) pending.add(node);
      const parent = node.parentElement?.closest?.(selector);
      if (parent && !owned(parent)) pending.add(parent);
      if (descendants) for (const match of node.querySelectorAll?.(selector) || []) {
        if (!owned(match)) pending.add(match);
      }
    }
    async function flush() {
      const cancel = cancelTimer;
      cancelTimer = null;
      cancel?.();
      if (!scope.active) return;
      const targets = [...pending].filter(node => node.isConnected !== false);
      pending.clear();
      const hadChanges = dirty, hadRemovals = lost;
      const detachedNodes = [...removedNodes];
      removedNodes.clear();
      dirty = lost = false;
      const start = Date.now();
      try {
        if (hadRemovals) removed?.(detachedNodes);
        if (hadChanges) changed?.();
        if (targets.length) await process(targets);
      } catch (error) { if (scope.active) log.error('scan.failed', '动态节点处理失败', { error }); }
      metrics.batches++;
      metrics.candidates += targets.length;
      metrics.durationMs += Date.now() - start;
      log.debug('scan.batch', '局部扫描完成', { ...metrics, targets: targets.length });
    }
    function schedule() { if (!cancelTimer) cancelTimer = scope.timeout(flush, delay); }
    function notify(mutations) {
      const visited = new Set();
      const collectOnce = (node, descendants) => {
        if (!node) return;
        const key = descendants ? node : null;
        if (key && visited.has(key)) return;
        if (key) visited.add(key);
        collect(node, descendants);
      };
      for (const mutation of mutations) {
        if (owned(mutation.target.nodeType === 3 ? mutation.target.parentElement : mutation.target)) continue;
        metrics.mutations++;
        if (mutation.type === 'childList') {
          const additions = Array.from(mutation.addedNodes || []);
          const removals = Array.from(mutation.removedNodes || []);
          const external = node => node.nodeType === 3 || (node.nodeType === 1 && !owned(node));
          const externalChange = [...additions, ...removals].some(external);
          if (!externalChange && (additions.length || removals.length)) continue;
          collect(mutation.target, false);
          additions.filter(external).forEach(node => collectOnce(node, true));
          if (removals.some(external)) {
            lost = true;
            removals.filter(external).forEach(node => removedNodes.add(node));
          }
        } else collectOnce(mutation.target, mutation.type === 'attributes');
        dirty = true;
      }
      if (dirty) schedule();
    }
    const observer = new MutationObserver(notify);
    observer.observe(root, { childList: true, subtree: true, characterData: true,
      ...(attributes.length ? { attributes: true, attributeFilter: attributes } : {}) });
    scope.own(() => { observer.disconnect(); cancelTimer?.(); pending.clear(); removedNodes.clear(); });
    const scan = () => {
      metrics.fullScans++;
      if (root === document.body && document.querySelectorAll) {
        for (const match of document.querySelectorAll(selector)) if (!owned(match)) pending.add(match);
      } else collect(root);
      dirty = true;
      schedule();
    };
    if (initial) scan();
    return { scan, notify, flush, metrics };
  }

  // ---- pages.js ----
  const CART_ITEM_ROW = '.bKkQiLkI-vk-';
  const CART_ITEM_WRAPPER = '.i-xXuvHLioU-[role="button"]';
  const CART_ITEM_CAPSULE = 'a.wuZBJ1ixmBQ-[href], ._7RJqaqzA6VI- a[href]';
  const CART_ITEM_PRICES = '.StoreOriginalPrice, .j3jr1YqpBGk- > .-nS4ZC0Bruo-';
  const PAGE_ADAPTERS = Object.freeze({
    wishlist: { rows: '.wishlist_row, .wishlistRowItem, [data-rfd-draggable-id^="WishlistItem-"], .Panel div[data-index]' },
    storeSale: { rows: 'a.search_result_row, a.tab_item, a.tab_row_item, a.recommendation_link, .store_main_capsule, .store_capsule, .small_cap, .large_cap, [data-ds-appid], [data-app-id]' },
    cart: { rows: CART_ITEM_ROW + ', ' + CART_ITEM_WRAPPER, total: '.i1XZFikuzME- .n9HLAjXXhvI-', anchors: '.i1XZFikuzME-, a[href*="checkout.steampowered.com/checkout"]' },
    quick: { rows: 'a.search_result_row, a.tab_item, a.recommendation_link, .wishlist_row, [data-rfd-draggable-id^="WishlistItem-"], .game_purchase_action' },
    family: { rows: 'a[href*="/app/"], [data-ds-appid], [data-app-id], [data-rfd-draggable-id^="WishlistItem-"]',
      anchors: '#wishlist_link, #store_nav_wishlist_link, a[href*="/wishlist"], .queue_and_playtime, #game_area_purchase, .game_area_purchase, #game_score' },
    restrictions: { titles: '#appHubAppName, .search_result_row .title, .tab_item_name, .wishlist_row .title, ' +
      '[data-rfd-draggable-id^="WishlistItem-"] a[href*="/app/"], .gameListRow .gameListRowItemName, ' +
      '.recommendation_link .game_name, .capsule .title, .store_capsule .title, .tab_item_title, ' +
      '.store_main_capsule .app_name, .store_main_capsule .app_name > div, .dailydeal_desc .game_name, ' +
      '.home_content .game_name, .community_recommendation_app .app_name, .home_content.single .single_title, ' +
      '[data-ds-appid] [class*="StoreSaleWidgetTitle"], [data-ds-appid] [class*="GameName"]' }
  });
  const ITEM_ATTRIBUTES = ['href', 'data-ds-appid', 'data-ds-packageid', 'data-ds-bundleid', 'data-app-id', 'data-rfd-draggable-id'];
  const PRICE_SELECTORS = [
    '.discount_final_price', '.discount_original_price', '.game_purchase_price',
    '.game_area_dlc_price', '.col.search_price.responsive_secondrow strike',
    '.col.search_price.responsive_secondrow .discount_final_price',
    '.Panel.Focusable .StoreOriginalPrice', '.Panel.Focusable .pk-LoKoNmmPK4GBiC9DR8',
    '._2WLaY5TxjBGVyuWe_6KS3N', '.game_area_purchase_game_dropdown_selection > span',
    '.game_area_purchase_game_dropdown_menu_item_text',
    '.StoreOriginalPrice', '.j3jr1YqpBGk- > .-nS4ZC0Bruo-'
  ].join(',');
  const CONVERSION_SELECTORS = [
    '.discount_prices > .discount_final_price',
    '.Hxi-pnf9Xlw- span.HOrB6lehQpg-', '.btnv6_white_transparent > span',
    '.Wh0L8EnwsPV_8VAu8TOYr', '._3j4dI1yA7cRfCvK8h406OB', '._1EKGZBnKFWOr3RqVdnLMRN', '._3fFFsvII7Y2KXNLDk_krOW',
    'div.accountData.price', '.addfunds_area_purchase_game.game_area_purchase_game > h1',
    '.addfunds_area_purchase_game.game_area_purchase_game.es_custom_money > p',
    'div.vTro5UlZ-gU- > div.QO6CjVPSFuI-', 'a.En-WtuWIGUc- > span.nikULGV-7Q0-',
    'div.-OkCLv-56oQ- > div._9Rf9BwU0xAQ-', 'div.-OkCLv-56oQ- > div.-HQzBzl6lqI-',
    'label.qhUI2RnjHYw-', 'button.cDJOlrqyRq8-.n5jTCXrzS8A-.Focusable', 'div.f6hU22EA7Z8peFWZVBJU',
    '.Panel.Focusable ._3-o3G9jt3lqcvbRXt8epsn.StoreOriginalPrice', '.Panel.Focusable .pk-LoKoNmmPK4GBiC9DR8',
    '._2WLaY5TxjBGVyuWe_6KS3N', '#checkout_review_cart_area .checkout_review_item_price > .price',
    '#review_subtotal_value.price', '#review_total_value.price', '#account_dropdown .account_name',
    '#es_summary .es_market_summary_item', '#marketWalletBalanceAmount', 'span.normal_price[data-price]',
    'button.inqz7Zdx9Xg-.ob-nIzzquk8-.fkz-MePtKwI-.D8IENuW8Q7w-', 'span.IokSIloSPlA-',
    'text.recharts-text.recharts-cartesian-axis-tick-value > tspan',
    '.QFW0BtI4l77AFmv1xLAkx._1B1XTNsfuwOaDPAkkr8M42 ._3hEeummFKRey8l5VXxZwxz > span',
    '.game_area_purchase_game_dropdown_selection > span',
    '.game_area_purchase_game_dropdown_menu_items_container_background.game_area_purchase_game_dropdown_menu_items_container td.game_area_purchase_game_dropdown_menu_item_text',
    '.discount_original_price', '.discount_final_price', '.col.search_price.responsive_secondrow strike',
    '#header_wallet_balance > span.tooltip', '.esi-wishlist-stat > .num',
    '.salepreviewwidgets_StoreOriginalPrice_1EKGZ', '.salepreviewwidgets_StoreSalePriceBox_Wh0L8',
    '.contenthubshared_OriginalPrice_3hBh3', '.contenthubshared_FinalPrice_F_tGv',
    '.salepreviewwidgets_StoreSalePriceBox_Wh0L8:not(.salepreviewwidgets_StoreSalePrepurchaseLabel_Wxeyn)',
    'tr.wallet_table_row > td.wht_total', 'tr.wallet_table_row > td.wht_wallet_change.wallet_column',
    'tr.wallet_table_row > td.wht_wallet_balance.wallet_column', '.package_totals_row > .price:not(.bundle_discount)',
    '#package_savings_bar > .savings.bundle_savings', '.home_page_content_title a.btn_small_tall > span'
  ];
  function getConversionSelectors() {
    return isCartPage() ? CONVERSION_SELECTORS.concat([
      '.StoreOriginalPrice', '.j3jr1YqpBGk- > .-nS4ZC0Bruo-', '.i1XZFikuzME- .n9HLAjXXhvI-',
      'main [class*="price" i]', 'main [class*="Price"]', '[role="main"] [class*="price" i]',
      '[class*="cart" i] [class*="price" i]', '[data-testid*="price" i]'
    ]) : CONVERSION_SELECTORS;
  }

  // ---- items.js ----
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
    const current = itemFromLink(location.pathname);
    if (current && (purchase || (current.type === 'app' && scopeEl.closest('#game_area_purchase')))) return current;
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

  // ---- network.js ----
  function requestError(kind, message, status) { return Object.assign(new Error(message), { kind, ...(status == null ? {} : { status }) }); }
  async function gmRequest(url, { signal, retries = 0, ...options } = {}) {
    const address = new URL(url);
    const task = diagnostics.scope('network').begin('request', { method: options.method || 'GET', endpoint: address.origin + address.pathname });
    const retryLimit = (options.method || 'GET').toUpperCase() === 'GET' && Number.isInteger(retries) ? Math.max(0, Math.min(retries, 2)) : 0;
    try {
      for (let attempt = 0; ; attempt++) {
        try {
          const response = await gmRequestAttempt(url, { ...options, signal });
          task.end('请求完成', { status: response.status });
          return response;
        } catch (error) {
          const transient = error.kind === 'network' || error.kind === 'timeout' ||
            (error.kind === 'http' && [408, 429, 500, 502, 503, 504].includes(error.status));
          if (!transient || attempt >= retryLimit || signal?.aborted) throw error;
          task.warn('retry', '读取暂时失败，稍后重试', { attempt: attempt + 1, kind: error.kind, status: error.status });
          await new Promise((resolve, reject) => {
            const abort = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(requestError('aborted', '请求已取消')); };
            const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, 1000 * 2 ** attempt);
            signal?.addEventListener('abort', abort, { once: true });
            if (signal?.aborted) abort();
          });
        }
      }
    } catch (error) {
      if (error.kind === 'aborted') task.cancel();
      else task.fail(error, { kind: error.kind, status: error.status });
      throw error;
    }
  }
  function gmRequestAttempt(url, { signal, timeout = 20000, probe = false, ...options } = {}) {
    return new Promise((resolve, reject) => {
      let handle;
      let settled = false;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener('abort', abort);
        if (error) reject(error);
        else resolve(value);
      };
      const abort = () => { finish(requestError('aborted', '请求已取消')); handle?.abort(); };
      if (signal?.aborted) { abort(); return; }
      signal?.addEventListener('abort', abort, { once: true });
      try {
        handle = GM_xmlhttpRequest({
          ...options, method: options.method || 'GET', url, timeout,
          ...(probe ? { headers: { ...options.headers, Range: 'bytes=0-16383' } } : {}),
          onprogress: event => {
            if (probe && event.loaded >= 16384) {
              finish(null, { status: event.status || 206, responseText: '' });
              handle?.abort();
            }
          },
          onload: response => {
            if ((response.status >= 200 && response.status < 300) || (response.status === 0 && response.responseText)) finish(null, response);
            else finish(requestError('http', 'HTTP ' + response.status, response.status));
          },
          onerror: () => finish(requestError('network', '网络请求失败')),
          ontimeout: () => finish(requestError('timeout', '请求超时')),
          onabort: () => finish(requestError('aborted', '请求已取消'))
        });
      } catch (_) { finish(requestError('network', '网络请求无法启动')); }
    });
  }
  async function gmGet(url, options) { return (await gmRequest(url, options)).responseText; }

  // No automatic retries: writes may have succeeded even when their response was lost.
  async function fetchJson(url, { signal, timeout = 20000, ...options } = {}) {
    const address = new URL(url, location.href);
    const task = diagnostics.scope('network').begin('fetch', { method: options.method || 'GET', endpoint: address.origin + address.pathname });
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => { timedOut = true; abort(); }, timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) throw requestError('http', 'HTTP ' + response.status, response.status);
      let data;
      try { data = await response.json(); } catch (_) { throw requestError('invalid-response', '接口返回了无效 JSON'); }
      task.end('请求完成', { status: response.status });
      return { data, headers: response.headers };
    } catch (cause) {
      const error = controller.signal.aborted ? requestError(timedOut ? 'timeout' : 'aborted', timedOut ? '请求超时' : '请求已取消')
        : cause.kind ? cause : requestError('network', '网络请求失败');
      task.fail(error);
      throw error;
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }

  class RequestQueue {
    constructor(concurrency = 4) { this.concurrency = concurrency; this.running = 0; this.queue = []; }
    enqueue(task, { signal } = {}) {
      return new Promise((resolve, reject) => {
        if (signal?.aborted) { reject(requestError('aborted', '排队任务已取消')); return; }
        const job = { task, resolve, reject, signal };
        job.abort = () => {
          const index = this.queue.indexOf(job);
          if (index >= 0) this.queue.splice(index, 1);
          reject(requestError('aborted', '排队任务已取消'));
        };
        signal?.addEventListener('abort', job.abort, { once: true });
        this.queue.push(job);
        diagnostics.scope('network').debug('queue.add', '请求进入队列', { waiting: this.queue.length, running: this.running });
        this._deq();
      });
    }
    _deq() {
      if (this.running >= this.concurrency) return;
      const job = this.queue.shift();
      if (!job) return;
      job.signal?.removeEventListener('abort', job.abort);
      this.running++;
      Promise.resolve().then(() => {
        if (job.signal?.aborted) throw requestError('aborted', '排队任务已取消');
        return job.task();
      }).then(job.resolve).catch(job.reject).finally(() => { this.running--; this._deq(); });
    }
  }
  const requestQueue = new RequestQueue(4);

  // ---- cache.js ----
  const SCRIPT_CACHE_KEYS = Object.freeze([
    'sse_restrictions_database_v1', 'sse_restrictions_steam_v1',
    'sse_restrictions_steam_requests_v1', 'sse_family_cache_v1', 'Storage:RateCache'
  ]);

  function clearScriptCaches() {
    try {
      SCRIPT_CACHE_KEYS.forEach(key => GM_deleteValue(key));
      diagnostics.scope('cache').info('clear', '脚本缓存已清除，刷新页面以释放内存缓存');
      location.reload();
    } catch (error) {
      diagnostics.scope('cache').error('clear.failed', '清除脚本缓存失败', { error });
      window.alert('清除缓存失败，请查看脚本日志。');
    }
  }

  // ---- styles.js ----
  function addStyle() {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent =
        '.sapx-extra-price{margin-left:6px;font-size:0.9em;opacity:1;white-space:nowrap;pointer-events:none;color:#67c1f5;display:inline-block;font-weight:normal;text-decoration:none!important}' +
        '.sapx-extra-price::before,.sapx-extra-price::after{content:none!important;display:none!important}' +
        '.sapx-region-locked{display:inline-block;margin-left:6px;color:#e46767!important;font-size:0.9em;font-weight:700;white-space:nowrap;pointer-events:none}' +
        'strike .sapx-extra-price,.discount_original_price .sapx-extra-price,.StoreOriginalPrice .sapx-extra-price{opacity:0.65;font-size:0.85em;color:#acb2b8;text-decoration:none!important}' +
        '#sapx-cart-summary{margin-top:8px;margin-bottom:8px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.1);color:#c6d4df;font-size:12px;line-height:1.4}' +
        '#sapx-cart-summary .sapx-row{display:flex;justify-content:space-between;gap:8px;align-items:center}' +
        '#sapx-cart-summary .sapx-label{font-size:11px;opacity:0.8;color:#acb2b8}' +
        '#sapx-cart-summary .sapx-value{font-weight:700;white-space:nowrap;color:#67c1f5;font-size:14px}' +
        '#sapx-cart-summary .sapx-warn{margin-top:4px;color:#e46767;font-size:10px;opacity:0.9}' +
        '.game_purchase_action_bg .discount_prices .discount_original_price{text-decoration:none!important}' +
        '.game_purchase_action_bg .discount_prices .discount_original_price::before,.game_purchase_action_bg .discount_prices .discount_original_price::after{content:none!important;display:none!important}' +
        '.game_purchase_action_bg .discount_prices .discount_original_price .sapx-extra-price{text-decoration:none!important}' +
        '#sse-game-hover{position:fixed;z-index:1200;box-sizing:border-box;margin:0;color:#20354a;background:#dce6ed;border-radius:6px;box-shadow:0 5px 22px #0009;font:13px/1.45 Arial,sans-serif;white-space:normal;overflow-wrap:anywhere}' +
        '#sse-game-hover[hidden]{display:none}' +
        '#sse-game-hover .sse-game-hover-body{box-sizing:border-box;overflow:auto;overscroll-behavior:contain;padding:12px 14px;border-radius:inherit}' +
        '#sse-game-hover .sse-game-hover-body>div+div{margin-top:5px}' +
        '#sse-game-hover .sse-game-hover-title{margin-bottom:8px;color:#132839;font-size:15px;font-weight:700}' +
        '#sse-game-hover .sse-game-hover-tags{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 8px}' +
        '#sse-game-hover .sse-game-hover-tags span{padding:1px 5px;border-radius:3px;background:#b9cfdf;color:#20354a;font-size:12px}' +
        '#sse-game-hover[data-side="left"]::after{content:"";position:absolute;left:calc(100% - 6px);top:var(--sse-game-hover-arrow);width:12px;height:12px;background:inherit;transform:translateY(-50%) rotate(45deg);pointer-events:none}';
      document.head.appendChild(style);
    }
    if (!document.getElementById(UI_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = UI_STYLE_ID;
      style.textContent =
        '#' + UI_ROOT_ID + '{position:fixed;inset:0;z-index:2147483647;display:none}' +
        '#' + UI_ROOT_ID + '.sapx-open{display:block}' +
        '#' + UI_ROOT_ID + ' .sapx-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.72)}' +
        '#' + UI_ROOT_ID + ' .sapx-panel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(520px,calc(100vw - 24px));background:linear-gradient(180deg,#1b2838 0%,#171a21 100%);border:1px solid rgba(255,255,255,0.08);box-shadow:0 18px 60px rgba(0,0,0,0.65);border-radius:6px;color:#c6d4df;font-family:Arial,Helvetica,sans-serif}' +
        '#' + UI_ROOT_ID + ' .sapx-header{display:flex;align-items:center;justify-content:space-between;padding:14px 14px 10px 14px;border-bottom:1px solid rgba(255,255,255,0.08)}' +
        '#' + UI_ROOT_ID + ' .sapx-title{font-size:14px;font-weight:700;letter-spacing:0.2px;color:#e5e5e5}' +
        '#' + UI_ROOT_ID + ' .sapx-close{appearance:none;border:0;background:transparent;color:#8f98a0;font-size:18px;line-height:1;cursor:pointer;padding:4px 6px}' +
        '#' + UI_ROOT_ID + ' .sapx-close:hover{color:#c6d4df}' +
        '#' + UI_ROOT_ID + ' .sapx-body{padding:14px;max-height:65vh;overflow-y:auto}' +
        '#' + UI_ROOT_ID + ' .sapx-input{box-sizing:border-box;width:100%;background:#0f141b;border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#c6d4df;padding:8px 10px;font-size:13px}' +
        '#' + UI_ROOT_ID + ' .sapx-details .sapx-field{margin-top:12px}' +
        '#' + UI_ROOT_ID + ' .sapx-error{color:#e46767;margin-top:8px;font-size:12px}' +
        '#' + UI_ROOT_ID + ' .sapx-field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}' +
        '#' + UI_ROOT_ID + ' .sapx-label{font-size:12px;color:#acb2b8}' +
        '#' + UI_ROOT_ID + ' select.sapx-select{appearance:none;background:#0f141b;border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#c6d4df;padding:8px 10px;font-size:13px;outline:none}' +
        '#' + UI_ROOT_ID + ' select.sapx-select:focus{border-color:rgba(103,193,245,0.8);box-shadow:0 0 0 2px rgba(103,193,245,0.15)}' +
        '#' + UI_ROOT_ID + ' .sapx-details{border:1px solid rgba(255,255,255,0.08);border-radius:4px;background:rgba(0,0,0,0.15);padding:10px}' +
        '#' + UI_ROOT_ID + ' .sapx-details summary{cursor:pointer;color:#67c1f5;font-size:12px;list-style:none}' +
        '#' + UI_ROOT_ID + ' .sapx-details summary::-webkit-details-marker{display:none}' +
        '#' + UI_ROOT_ID + ' .sapx-row{display:flex;align-items:center;gap:10px;margin-top:10px}' +
        '#' + UI_ROOT_ID + ' .sapx-check{display:flex;align-items:center;gap:8px;font-size:13px;color:#c6d4df}' +
        '#' + UI_ROOT_ID + ' input[type="checkbox"].sapx-checkbox{width:16px;height:16px;accent-color:#67c1f5}' +
        '#' + UI_ROOT_ID + ' .sapx-footer{display:flex;justify-content:flex-end;gap:10px;padding:12px 14px;border-top:1px solid rgba(255,255,255,0.08)}' +
        '#' + UI_ROOT_ID + ' .sapx-btn{appearance:none;border:0;border-radius:2px;padding:8px 12px;font-weight:700;cursor:pointer;font-size:13px}' +
        '#' + UI_ROOT_ID + ' .sapx-btn-primary{background:linear-gradient(180deg,#67c1f5 0%,#4aa3d6 100%);color:#0b1117}' +
        '#' + UI_ROOT_ID + ' .sapx-btn-primary:hover{filter:brightness(1.03)}' +
        '#' + UI_ROOT_ID + ' .sapx-btn-ghost{background:rgba(255,255,255,0.06);color:#c6d4df}' +
        '#' + UI_ROOT_ID + ' .sapx-btn-ghost:hover{background:rgba(255,255,255,0.09)}';
      document.head.appendChild(style);
    }
  }

  // ---- settings.js ----
  function ensureSettingsUI() {
    let root = document.getElementById(UI_ROOT_ID);
    if (root) return root;
    root = document.createElement('div');
    root.id = UI_ROOT_ID;
    root.innerHTML =
      '<div class="sapx-backdrop"></div>' +
      '<div class="sapx-panel" role="dialog" aria-modal="true" aria-label="Steam Store Enhancer 设置">' +
      '<div class="sapx-header">' +
      '<div class="sapx-title">Steam Store Enhancer 设置</div>' +
      '<button class="sapx-close" type="button" aria-label="Close">×</button>' +
      '</div>' +
      '<div class="sapx-body">' +
      '<div class="sapx-field">' +
      '<div class="sapx-label">额外显示的地区</div>' +
      '<select class="sapx-select" id="sapx-region-select"></select>' +
      '</div>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-extra-currency">额外地区价格显示货币</label><select class="sapx-select" id="sse-extra-currency"></select></div>' +
      
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-extra-enabled" type="checkbox" />启用额外地区价格</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-convert-enabled" type="checkbox" />启用价格转换</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-cart-enabled" type="checkbox" />启用快速加购与购物车管理</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-family-enabled" type="checkbox" />启用家庭库游戏标记</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-restrictions-enabled" type="checkbox" />显示游戏受限状态</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-wishlist-sale-enabled" type="checkbox" />显示愿望单及商店列表折扣倒计时</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-game-hover-enabled" type="checkbox" />悬停时显示游戏详情</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-family-auto" type="checkbox" />每隔 24 小时自动扫描家庭库</label></div>' +
      '<div class="sapx-field"><button class="sapx-btn sapx-btn-ghost" type="button" id="sse-family-open">管理家庭库：扫描、贡献统计与最近购入</button></div>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-convert-region">价格转换目标地区</label><select class="sapx-select" id="sse-convert-region"></select></div>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-log">日志等级</label><select class="sapx-select" id="sse-log"><option value="debug">debug · 全部步骤</option><option value="info">info · 运行概况</option><option value="warn">warn · 警告和错误</option><option value="error">error · 仅错误</option><option value="off">off · 关闭</option></select></div>' +
      '<div class="sapx-field"><button class="sapx-btn sapx-btn-ghost" type="button" id="sse-copy-logs">复制诊断日志</button></div>' +
      '<details class="sapx-details" id="sapx-adv">' +
      '<summary>更多设置</summary>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-cart-language">购物车工具语言</label><select class="sapx-select" id="sse-cart-language"><option value="ZH">中文</option><option value="EN">English</option></select></div>' +
      '<div class="sapx-row"><label class="sapx-check"><input class="sapx-checkbox" id="sse-cart-country" type="checkbox" />显示账号地区</label></div>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-symbol">转换后的货币符号</label><input class="sapx-input" id="sse-symbol" type="text" maxlength="20" /></div>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-position">货币符号位置</label><select class="sapx-select" id="sse-position"><option value="before">价格之前</option><option value="after">价格之后</option></select></div>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-cache-hours">汇率缓存有效期（小时）</label><input class="sapx-input" id="sse-cache-hours" type="number" min="0.01" step="any" /></div>' +
      '<div class="sapx-row"><label class="sapx-check"><input class="sapx-checkbox" id="sse-custom-enabled" type="checkbox" />使用自定义汇率</label></div>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-rate">自定义汇率（1 单位目标货币可兑换的原货币数量）</label><input class="sapx-input" id="sse-rate" type="number" min="0.000001" step="any" /></div>' +
      '<div class="sapx-row"><label class="sapx-check"><input class="sapx-checkbox" id="sse-disable-market" type="checkbox" />在市场首页禁用价格转换</label></div>' +
      '<div class="sapx-error" id="sse-error" role="alert"></div>' +
      '<div class="sapx-row">' +
      '<label class="sapx-check">' +
      '<input class="sapx-checkbox" id="sapx-show-code" type="checkbox" />' +
      '<span>显示地区代码（例如 CN / US）</span>' +
      '</label>' +
      '</div>' +
      '</details>' +
      '</div>' +
      '<div class="sapx-footer">' +
      '<button class="sapx-btn sapx-btn-ghost" type="button" id="sapx-cancel">取消</button>' +
      '<button class="sapx-btn sapx-btn-primary" type="button" id="sapx-save">保存并刷新</button>' +
      '</div>' +
      '</div>';
    document.documentElement.appendChild(root);
    const close = () => { root.classList.remove('sapx-open'); };
    root.querySelector('.sapx-backdrop').addEventListener('click', close);
    root.querySelector('.sapx-close').addEventListener('click', close);
    root.querySelector('#sapx-cancel').addEventListener('click', close);
    root.querySelector('#sse-family-open').addEventListener('click', () => { close(); familyLibrary.open(); });
    root.querySelector('#sse-copy-logs').addEventListener('click', async () => {
      const log = diagnostics.scope('settings');
      try {
        await GM_setClipboard(JSON.stringify({ level: diagnostics.getLevel(), records: diagnostics.records() }, null, 2), 'text');
        log.info('diagnostics.copy', '已复制当前页面最近的诊断日志');
        root.querySelector('#sse-copy-logs').textContent = '已复制';
      } catch (error) {
        log.error('diagnostics.copy', '复制诊断日志失败', { error });
        root.querySelector('#sapx-adv').open = true;
        root.querySelector('#sse-error').textContent = '日志复制失败，请重试。';
      }
    });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('sapx-open')) close(); }, { passive: true });
    return root;
  }

  function openSettingsUI() {
    const log = diagnostics.scope('settings');
    log.debug('panel.open', '打开设置', { level: diagnostics.getLevel() });
    const root = ensureSettingsUI();
    const select = root.querySelector('#sapx-region-select');
    const showCode = root.querySelector('#sapx-show-code');
    const adv = root.querySelector('#sapx-adv');
    adv.removeAttribute('open');
    const cur = getTargetRegion();
    select.replaceChildren(...REGIONS.map(region => {
      const option = document.createElement('option');
      option.value = region.id;
      option.textContent = region.label;
      return option;
    }));
    select.value = cur.id;
    showCode.checked = getShowRegionCode();
    const field = id => root.querySelector('#sse-' + id);
    const settings = conversion.setting;
    const originalCurrency = document.createElement('option');
    originalCurrency.value = '';
    originalCurrency.textContent = '使用地区原币';
    const currencyOptions = [...new Set(conversion.countries.map(country => country.currencyCode))].sort();
    field('extra-currency').replaceChildren(originalCurrency, ...currencyOptions.map(currency => {
      const option = document.createElement('option');
      option.value = currency;
      option.textContent = currency;
      return option;
    }));
    field('extra-currency').value = currencyOptions.includes(settings.regionalDisplayCurrency) ? settings.regionalDisplayCurrency : '';
    field('extra-enabled').checked = GM_getValue('sse_extra_enabled', true);
    field('convert-enabled').checked = GM_getValue('sse_convert_enabled', true);
    field('cart-enabled').checked = GM_getValue('sse_cart_enabled', true);
    field('family-enabled').checked = GM_getValue('sse_family_enabled', true);
    field('restrictions-enabled').checked = GM_getValue('sse_restrictions_enabled', true);
    field('wishlist-sale-enabled').checked = GM_getValue('sse_wishlist_sale_enabled', true);
    field('game-hover-enabled').checked = GM_getValue('sse_game_hover_enabled', true);
    field('family-auto').checked = GM_getValue('sse_family_auto', true);
    field('cart-language').value = GM_getValue('sse_cart_language', 'ZH');
    field('cart-country').checked = GM_getValue('sse_cart_country', false);
    field('convert-region').replaceChildren(...conversion.countries.map(country => {
      const option = document.createElement('option');
      option.value = country.code;
      option.textContent = country.name + ' (' + country.currencyCode + ')';
      return option;
    }));
    field('convert-region').value = settings.countyCode;
    field('symbol').value = settings.currencySymbol;
    field('position').value = settings.currencySymbolBeforeValue ? 'before' : 'after';
    field('cache-hours').value = settings.rateCacheExpired / 3600000;
    field('custom-enabled').checked = settings.useCustomRate;
    field('rate').value = settings.customRate;
    field('disable-market').checked = settings.disableOnMarket;
    field('log').value = diagnostics.getLevel();
    field('copy-logs').textContent = '复制诊断日志';
    field('error').textContent = '';
    field('rate').disabled = !field('custom-enabled').checked;
    field('custom-enabled').onchange = () => { field('rate').disabled = !field('custom-enabled').checked; };
    root.querySelector('#sapx-save').onclick = () => {
      const hours = Number(field('cache-hours').value);
      const rate = Number(field('rate').value);
      if (!Number.isFinite(hours) || hours <= 0 || (field('custom-enabled').checked && (!Number.isFinite(rate) || rate <= 0))) {
        log.warn('save.validate', '设置校验失败', { hours, customRateEnabled: field('custom-enabled').checked, rate });
        adv.open = true;
        field('error').textContent = '缓存有效期和启用后的自定义汇率必须为大于 0 的数字。';
        return;
      }
      const logLevel = field('log').value;
      try {
        diagnostics.setLevel(logLevel);
        conversion.save({ ...settings,
          countyCode: field('convert-region').value,
          regionalDisplayCurrency: field('extra-currency').value,
          currencySymbol: field('symbol').value,
          currencySymbolBeforeValue: field('position').value === 'before',
          rateCacheExpired: hours * 3600000,
          useCustomRate: field('custom-enabled').checked,
          customRate: Number.isFinite(rate) && rate > 0 ? rate : settings.customRate,
          disableOnMarket: field('disable-market').checked
        });
        GM_setValue('sse_extra_enabled', field('extra-enabled').checked);
        GM_setValue('sse_convert_enabled', field('convert-enabled').checked);
        GM_setValue('sse_cart_enabled', field('cart-enabled').checked);
        GM_setValue('sse_family_enabled', field('family-enabled').checked);
        GM_setValue('sse_restrictions_enabled', field('restrictions-enabled').checked);
        GM_setValue('sse_wishlist_sale_enabled', field('wishlist-sale-enabled').checked);
        GM_setValue('sse_game_hover_enabled', field('game-hover-enabled').checked);
        GM_setValue('sse_family_auto', field('family-auto').checked);
        GM_setValue('sse_cart_language', field('cart-language').value);
        GM_setValue('sse_cart_country', field('cart-country').checked);
        GM_setValue(STORAGE_KEY_REGION_ID, select.value);
        GM_setValue(STORAGE_KEY_SHOW_CODE, Boolean(showCode.checked));
        log.info('save.complete', '设置已保存，准备刷新页面', { level: diagnostics.getLevel() });
        log.debug('save.logging', '调试日志已启用');
        location.reload();
      } catch (error) {
        log.error('save.failed', '保存设置失败', { error });
        adv.open = true;
        field('error').textContent = '保存失败，请重试。';
      }
    };
    root.classList.add('sapx-open');
    select.focus();
  }

  // ---- bundle-prices.js ----
  function regionalBundleSession() {
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    return readStoreSession(document, page);
  }

  function readBundleOwnedIds(data, key, optional = false) {
    const value = data?.[key];
    // Steam's subscription/auto-grant fields are optional. PHP-backed
    // responses can also encode an empty collection as {} instead of [].
    if (optional && value == null) return new Set();
    const validId = id => (key === 'rgOwnedPackages' && (id === 0 || id === '0')) || Boolean(itemRef('app', id));
    const fail = reason => {
      regionalLog.debug('bundle.ownership.invalid', '所有权字段无法识别', {
        field: key, reason, format: value == null ? String(value) : Array.isArray(value) ? 'array' : typeof value,
        count: value && typeof value === 'object' ? Object.keys(value).length : undefined,
        invalidEntryType: Array.isArray(value) ? typeof value.find(id => !validId(id)) : undefined
      });
      throw invalidResponse('已拥有游戏数据不完整：' + key + ' (' + reason + ')');
    };
    let ids;
    if (Array.isArray(value)) ids = value;
    else if (Object.prototype.toString.call(value) === '[object Object]') {
      const entries = Object.entries(value);
      if (entries.some(([id, owned]) => !validId(id) || ![true, false, 1, 0].includes(owned))) fail('ID 映射无效');
      ids = entries.filter(([, owned]) => owned === true || owned === 1).map(([id]) => id);
    }
    if (!ids) fail('缺少列表');
    if (ids.some(id => !validId(id))) fail('列表中存在无效 ID');
    // Package 0 is a system subscription, not a purchasable bundle component.
    // Keep real package IDs strict without rejecting the entire library.
    return new Set(ids.filter(id => id !== 0 && id !== '0').map(id => itemRef('app', id).id));
  }

  const bundleOwnershipCache = createAsyncCache({ ttl: 300000, retryDelay: 10000, maxEntries: 4,
    load: async (steamid, signal) => {
      const accountid = BigInt(steamid) - 76561197960265728n;
      if (accountid <= 0n || accountid > 4294967295n) throw invalidResponse('无法确认当前账号');
      const { data } = await fetchJson('https://store.steampowered.com/dynamicstore/userdata/?id=' + accountid,
        { credentials: 'include', signal });
      const sets = { packagesKnown: data?.rgOwnedPackages != null };
      for (const key of ['rgOwnedApps', 'rgOwnedPackages', 'rgMasterSubApps', 'rgAutoGrantApps']) {
        sets[key] = readBundleOwnedIds(data, key, key !== 'rgOwnedApps');
      }
      return sets;
    }
  });

  const bundleCartCache = createAsyncCache({ ttl: 5000, retryDelay: 1000, maxEntries: 4,
    load: async (steamid, session, signal) => {
      if (!session.token) throw invalidResponse('无法确认购物车捆绑包的购买用途');
      const url = new URL('https://api.steampowered.com/IAccountCartService/GetCart/v1/');
      url.searchParams.set('access_token', session.token);
      const { data, headers } = await fetchJson(url.href, { signal });
      const result = headers?.get('x-eresult');
      if ((result && result !== '1') || (data?.response?.result != null && data.response.result !== 1)) {
        throw invalidResponse('无法读取购物车购买用途');
      }
      return validateCartResponse(data, 'GetCart').cart.line_items;
    }
  });

  async function bundlePurchaseMode(bundleid, session, signal) {
    if (!isCartPage()) return 'self';
    // Cart capsules have no line-item ID. When the same bundle is both a gift
    // and a self purchase, do not guess which recipient belongs to a row.
    const lines = (await bundleCartCache.get(session.steamid, session, signal))
      .filter(line => String(line.bundleid) === String(bundleid));
    if (!lines.length) throw invalidResponse('购物车捆绑包已变更');
    const gifts = lines.filter(line => line.flags?.is_gift === true);
    if (gifts.length && gifts.length !== lines.length) throw invalidResponse('同一捆绑包有不同收礼人，无法确认补齐价');
    return gifts.length ? 'gift' : 'self';
  }

  async function readRegionalBundleDetails(bundleid, cc, signal) {
    // An anonymous request keeps account-country cookies from overriding cc.
    const html = await requestQueue.enqueue(() => gmGet('https://store.steampowered.com/bundle/' + bundleid + '/?cc=' + cc + '&l=english',
      { signal, anonymous: true, retries: 2 }), { signal });
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (readStoreSession(doc).country !== cc) throw invalidResponse('捆绑包页面返回的地区不符');
    const holder = doc.querySelector('[data-ds-bundleid="' + bundleid + '"][data-ds-bundle-data]');
    let data;
    try { data = JSON.parse(holder?.getAttribute('data-ds-bundle-data') || 'null'); }
    catch (_) { throw invalidResponse('捆绑包组成数据不可解析'); }
    const increment = Number(html.match(/SetCurrencyMinPriceIncrement\(\s*(\d+)\s*\)/)?.[1]);
    if (!data || !Number.isSafeInteger(increment) || increment < 1) throw invalidResponse('缺少捆绑包组成或币种舍入规则');
    return { data, increment };
  }

  const bundleDetailsCache = createAsyncCache({ ttl: 300000, retryDelay: 10000, maxEntries: 100,
    load: (key, bundleid, cc, signal) => readRegionalBundleDetails(bundleid, cc, signal)
  });

  function selectBundleCompletionItems(details, ownership) {
    const { data, increment } = details;
    if (![false, 0].includes(data.m_bMustPurchaseAsSet) || data.m_bIsCommercial ||
        !Array.isArray(data.m_rgItems) || !data.m_rgItems.length ||
        !Number.isSafeInteger(increment) || increment < 1) throw invalidResponse('无法确认捆绑包补齐规则');
    const remaining = [];
    const seen = new Set();
    for (const item of data.m_rgItems) {
      const ref = itemRef('package', item.m_nPackageID);
      const apps = item.m_rgIncludedAppIDs;
      if (!ref || seen.has(ref.id) || !Array.isArray(apps) || apps.some(id => !itemRef('app', id))) {
        throw invalidResponse('捆绑包套餐组成不完整');
      }
      seen.add(ref.id);
      const owned = ownership.rgOwnedPackages.has(ref.id) || (apps.length > 0 && apps.every(id =>
        ownership.rgOwnedApps.has(String(id)) && !ownership.rgMasterSubApps.has(String(id)) &&
        !ownership.rgAutoGrantApps?.has(String(id))));
      if (owned) continue;
      if (!apps.length && ownership.packagesKnown === false) throw invalidResponse('该套餐缺少游戏列表，无法确认所有权');
      remaining.push(item);
    }
    return remaining;
  }

  function calculateBundleCompletion(details, ownership, currency) {
    const { data, increment } = details;
    const remaining = selectBundleCompletionItems(details, ownership);
    let initialCents = 0, finalCents = 0;
    for (const item of remaining) {
      // Steam supplies each package's bundle-discounted amount. Reusing it
      // preserves package discounts and per-package rounding.
      const base = item.m_nBasePriceInCents;
      const final = item.m_nFinalPriceWithBundleDiscount;
      if (!Number.isSafeInteger(base) || base < 0 || !Number.isSafeInteger(final) || final < 0 || final > base) {
        throw invalidResponse('缺少未拥有套餐的地区价格');
      }
      initialCents += base;
      finalCents += final;
      if (!Number.isSafeInteger(initialCents) || !Number.isSafeInteger(finalCents)) throw invalidResponse('捆绑包价格超出有效范围');
    }
    finalCents = Math.round(finalCents / increment) * increment;
    // Steam's *_in_cents uses hundredths even for JPY/KRW. Regional prices
    // and the cart summary use the currency's actual minor-unit scale.
    const scale = Math.pow(10, getCurrencyFractionDigits(currency)) / 100;
    const initial = Math.round(initialCents * scale), final = Math.round(finalCents * scale);
    return { ...normalizePrice({ currency, initial, final,
      initialFormatted: formatMinorToCurrency(initial, currency), finalFormatted: formatMinorToCurrency(final, currency) }),
      completion: true, excluded: data.m_rgItems.length - remaining.length, remaining: remaining.length };
  }

  async function personalizeRegionalBundle(bundleid, cc, currency, option, fullPrice) {
    if (option.must_purchase_as_set === true) return fullPrice;
    const session = regionalBundleSession();
    if (!session.steamid || session.steamid === '0') return fullPrice;
    if (option.must_purchase_as_set !== false) throw invalidResponse('捆绑包未返回补齐类型');
    const signal = regionalScope?.signal;
    if (await bundlePurchaseMode(bundleid, session, signal) === 'gift') {
      // A recipient's library is not the buyer's library.
      return { ...fullPrice, fullBundle: true };
    }
    const [details, ownership] = await Promise.all([
      bundleDetailsCache.get(bundleid + ':' + cc, bundleid, cc, signal), bundleOwnershipCache.get(session.steamid, signal)
    ]);
    if (regionalBundleSession().steamid !== session.steamid) throw invalidResponse('计算期间账号已变更');
    if (selectBundleCompletionItems(details, ownership).length === details.data.m_rgItems.length) {
      regionalLog.debug('bundle.full', '无已拥有套餐，使用接口整包价格', { bundleid, cc });
      return fullPrice;
    }
    const price = calculateBundleCompletion(details, ownership, currency);
    regionalLog.debug('bundle.completion', '目标地区补齐价格已计算', {
      bundleid, cc, excluded: price.excluded, remaining: price.remaining, final: price.finalFormatted
    });
    return price;
  }

  // ---- regional-prices.js ----
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
  const pendingElements = new WeakSet();
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

  async function getAppPrice(appid, cc, currencyFallback) {
    const url = 'https://store.steampowered.com/api/appdetails?appids=' + appid + '&cc=' + cc + '&filters=price_overview,is_free';
    const signal = regionalScope?.signal;
    const text = await requestQueue.enqueue(() => gmGet(url, { signal, retries: 2 }), { signal });
    const parsed = JSON.parse(text);
    const block = parsed && parsed[String(appid)];
    if (!block || !block.success) return null;
    const data = block.data || {};
    if (data.is_free) return { ...normalizePrice({ currency: currencyFallback, final: 0, initial: 0, finalFormatted: 'Free', initialFormatted: 'Free' }), free: true };
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

  async function getPackagePrice(packageid, cc, currencyFallback) {
    try {
      const payload = {
        ids: [{ packageid: parseInt(packageid, 10) }],
        context: { language: 'schinese', country_code: cc, steam_realm: 1 },
        data_request: { include_all_purchase_options: true }
      };
      const url = 'https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=' + encodeURIComponent(JSON.stringify(payload));
      const signal = regionalScope?.signal;
      const text = await requestQueue.enqueue(() => gmGet(url, { signal, retries: 2 }), { signal });
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
      const signal = regionalScope?.signal;
      const text = await requestQueue.enqueue(() => gmGet(url, { signal, retries: 2 }), { signal });
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
    const signal = regionalScope?.signal;
    const text = await requestQueue.enqueue(() => gmGet(url, { signal, retries: 2 }), { signal });
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
    return personalizeRegionalBundle(bundleid, cc, currencyFallback, po, fullPrice);
  }

  let bundleCartRevision = 0;
  function regionalPriceKey(item, region) {
    const base = item.type + ':' + item.id + ':' + region.id;
    if (item.type !== 'bundle') return base;
    return base + ':' + (regionalBundleSession().steamid || 'anonymous') + ':' +
      (isCartPage() ? 'cart:' + bundleCartRevision : 'store');
  }

  function getPriceForItem(item, region) {
    const key = regionalPriceKey(item, region);
    if (pendingPrices.has(key)) { regionalLog.debug('price.join', '复用进行中的价格查询', { item: key }); return pendingPrices.get(key); }
    const pending = fetchPriceForItem(item, region).finally(() => { if (pendingPrices.get(key) === pending) pendingPrices.delete(key); });
    pendingPrices.set(key, pending);
    return pending;
  }

  async function fetchPriceForItem(item, region) {
    const key = regionalPriceKey(item, region);
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
        if (item.type === 'app') res = await getAppPrice(item.id, cc, region.currency);
        else if (item.type === 'package') res = await getPackagePrice(item.id, cc, region.currency);
        else if (item.type === 'bundle') res = await getBundlePrice(item.id, cc, region.currency);
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

  async function enhancePriceElement(priceEl, forceType = 'auto') {
    if (!priceEl || priceEl.nodeType !== 1 || priceEl.classList.contains(EXTRA_CLASS)) return;
    if (pendingElements.has(priceEl)) return;
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

    pendingElements.add(priceEl);
    const scope = regionalScope;
    const wantInitial = forceType === 'initial' || (forceType === 'auto' && isOriginalPriceElement(priceEl));
    let price, formatted;
    try {
      price = await getPriceForItem(item, region);
      if (!priceEl.isConnected || scope?.active === false) return;
      if (price?.ok) {
        formatted = wantInitial ? (price.initialFormatted || price.finalFormatted) : price.finalFormatted;
        if (formatted && !price.free) {
          formatted = await formatRegionalDisplayPrice(wantInitial ? price.initial : price.final, price.currency, formatted);
        }
      }
    }
    finally { pendingElements.delete(priceEl); }
    if (!priceEl.isConnected || scope?.active === false || getTargetRegion().id !== region.id) return;
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
      pendingPrices.clear();
      bundleCartCache.clear();
      bundleOwnershipCache.clear();
      bundleDetailsCache.clear();
      regionalScanner = null;
      cartSummaryRetry = null;
      document.querySelectorAll('.' + EXTRA_CLASS + ', .sapx-region-locked, #' + CART_SUMMARY_ID).forEach(node => node.remove());
    });
    const safeEnhance = (el, type) => enhancePriceElement(el, type).catch(error => {
      if (scope.active) regionalLog.debug('price.unconfirmed', '价格暂时无法确认', { error });
    });
    regionalScanner = createDomScanner({ scope, name: 'regional-prices', attributes: ITEM_ATTRIBUTES,
      selector: PRICE_SELECTORS + ',' + PAGE_ADAPTERS.wishlist.rows + ',' + PAGE_ADAPTERS.cart.rows,
      process: elements => {
        for (const el of elements) if (el.matches(PRICE_SELECTORS)) safeEnhance(el);
        if (isWishlistPage()) scanWishlistFallback(elements.filter(el => el.matches(PAGE_ADAPTERS.wishlist.rows)), safeEnhance);
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

  // ---- conversion/settings.js ----
  function createConversionSettings({ Jsons, countyCode2Info }) {
    const log = diagnostics.scope('conversion.settings');
    const STORAGE_KEY_SETTING = 'Storage:Setting';
    class Setting {
      countyCode = 'CN';
      regionalDisplayCurrency = '';
      currencySymbol = '￥';
      currencySymbolBeforeValue = true;
      rateCacheExpired = 3600000;
      useCustomRate = false;
      customRate = 1;
      oldVersion = '0.0.0';
      currVersion = '0.0.0';
      disableOnMarket = false;
    }
    const storage = {
      getObjValue(cls, key, fallback) {
        const value = GM_getValue(key);
        if (!value) return fallback;
        return Jsons.readJson(typeof value === 'string' ? JSON.parse(value) : value, cls);
      },
      setObjValue(key, value) { GM_setValue(key, Jsons.toString(value)); },
      deleteValue(key) { GM_deleteValue(key); }
    };
    class SettingManager {
      constructor() { this.setting = this.loadSetting(); }
      loadSetting() {
        const setting = storage.getObjValue(Setting, STORAGE_KEY_SETTING, new Setting());
        delete setting.logLevel;
        setting.oldVersion = setting.currVersion;
        setting.currVersion = GM_info.script.version;
        if (setting.oldVersion === setting.currVersion) {
          log.debug('load', '读取转换设置', setting);
        } else {
          log.debug('version', '更新设置版本', { previous: setting.oldVersion, current: setting.currVersion });
          this.saveSetting(setting);
        }
        return setting;
      }
      saveSetting(setting) {
        delete setting.logLevel;
        this.setting = setting;
        storage.setObjValue(STORAGE_KEY_SETTING, setting);
        log.debug('save', '转换设置已保存', setting);
      }
      setCountyCode(code) {
        if (!countyCode2Info.has(code)) throw Error(`国家代码不存在：${code}`);
        this.setting.countyCode = code;
        this.saveSetting(this.setting);
      }
      setCurrencySymbol(value) { this.setting.currencySymbol = value; this.saveSetting(this.setting); }
      setCurrencySymbolBeforeValue(value) { this.setting.currencySymbolBeforeValue = value; this.saveSetting(this.setting); }
      setRateCacheExpired(value) { this.setting.rateCacheExpired = value; this.saveSetting(this.setting); }
      setUseCustomRate(value) { this.setting.useCustomRate = value; this.saveSetting(this.setting); }
      setCustomRate(value) { this.setting.customRate = value; this.saveSetting(this.setting); }
      reset() { this.saveSetting(new Setting()); }
    }
    SettingManager.instance = new SettingManager();
    return { SettingManager, storage };
  }

  // ---- conversion/rates.js ----
  function createRateService({ storage, getSetting, getContext, fetchRates }) {
    const log = diagnostics.scope('conversion.rates');
    const cacheKey = 'Storage:RateCache';
    class RateCaches {
      caches = new Map();
      getCache(from, to) { return this.caches.get(`${from}:${to}`); }
      setCache(cache) { this.caches.set(`${cache.from}:${cache.to}`, cache); }
    }
    class RateManager {
      memoryCache = null;
      pendingRequests = new Map();
      brokenPairs = new Set();
      async getRate4Remote(from, to) {
        const task = log.begin('fetch', { from, to });
        try {
          const response = await fetchRates(from);
          const rate = response.get(to)?.[from];
          if (!Number.isFinite(Number(rate)) || Number(rate) <= 0) throw new Error(`汇率接口没有返回有效币种对：${from} -> ${to}`);
          task.end('汇率读取成功', { rate });
          return rate;
        } catch (error) { task.fail(error); throw error; }
      }
      async getRate(source, target) {
        const from = source || getContext().currentCountyInfo.currencyCode;
        const to = target || getContext().targetCountyInfo.currencyCode;
        const key = `${from}:${to}`;
        if (this.brokenPairs.has(key)) throw new Error('该币种对的汇率请求已熔断');
        if (this.pendingRequests.has(key)) {
          log.debug('join', '复用进行中的汇率查询', { from, to });
          return this.pendingRequests.get(key);
        }
        const request = (async () => {
          if (!this.memoryCache) {
            this.memoryCache = this.loadRateCache();
            log.debug('cache.load', '汇率缓存已加载', { size: this.memoryCache.caches.size });
          }
          let cache = this.memoryCache.getCache(from, to);
          const now = Date.now();
          if (!cache?.rate || now > cache.createdAt + getSetting().rateCacheExpired) {
            log.debug('cache.miss', '汇率缓存缺失或过期', { from, to });
            try {
              const rate = await this.getRate4Remote(from, to);
              cache = { from, to, rate, createdAt: now };
              this.memoryCache.setCache(cache);
              this.saveRateCache();
            } catch (error) {
              if (error.kind === 'aborted') throw error;
              if (cache?.rate) {
                log.warn('cache.stale', '远程刷新失败，使用旧汇率缓存', { from, to, error });
                return cache.rate;
              }
              this.brokenPairs.add(key);
              log.error('breaker', '汇率不可用，停止请求该币种对', { from, to, error });
              throw error;
            }
          } else log.debug('cache.hit', '命中汇率缓存', { from, to });
          return cache.rate;
        })();
        this.pendingRequests.set(key, request);
        try { return await request; }
        finally { if (this.pendingRequests.get(key) === request) this.pendingRequests.delete(key); }
      }
      loadRateCache() {
        const setting = getSetting();
        if (setting.oldVersion !== setting.currVersion) {
          log.debug('cache.invalidate', '版本变化，刷新汇率缓存');
          this.clear();
          return new RateCaches();
        }
        return storage.getObjValue(RateCaches, cacheKey, new RateCaches());
      }
      saveRateCache() {
        if (!this.memoryCache) return;
        storage.setObjValue(cacheKey, this.memoryCache);
        log.debug('cache.save', '汇率缓存已保存', { size: this.memoryCache.caches.size });
      }
      clear() {
        this.memoryCache = null;
        storage.deleteValue(cacheKey);
        log.info('cache.clear', '汇率缓存已清除');
      }
      resetBreaker() { this.brokenPairs.clear(); }
    }
    return new RateManager();
  }

  // ---- conversion/price-processor.js ----
  function createPriceProcessor({ countries, countryMap, getSetting, getContext, getRate, isCart }) {
    const log = diagnostics.scope('conversion.prices');
    const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const separators = [...new Set(countries.flatMap(country => [country.decimalSep, country.thousandsSep].filter(Boolean)))];
    const numberPattern = new RegExp(`\\d[\\d${separators.map(value => value === ' ' ? '\\s' : escapeRegex(value)).join('')}]*\\d|\\d`, 'g');
    const rules = [...countries].sort((a, b) => b.symbol.length - a.symbol.length ||
      Number(a.fractionDigits === 0) - Number(b.fractionDigits === 0) || a.currencyCode.localeCompare(b.currencyCode));
    const ruleSets = new Map();

    function symbolRange(text, start, end, rule, relaxed) {
      if (rule.symbolPos === 'front') {
        let cursor = start;
        if (relaxed) while (cursor > 0 && /\s/.test(text[cursor - 1])) cursor--;
        const prefix = rule.symbol + (relaxed ? '' : rule.symbolGap);
        const left = cursor - prefix.length;
        if (left < 0 || text.substring(left, cursor).toUpperCase() !== prefix.toUpperCase()) return null;
        return { start: left, end };
      }
      let cursor = end;
      if (relaxed) while (cursor < text.length && /\s/.test(text[cursor])) cursor++;
      const suffix = (relaxed ? '' : rule.symbolGap) + rule.symbol;
      const right = cursor + suffix.length;
      if (right > text.length || text.substring(cursor, right).toUpperCase() !== suffix.toUpperCase()) return null;
      return { start, end: right };
    }
    function validNumber(value, rule) {
      const found = new Set(value.replace(/\d/g, '').split('').filter(Boolean).map(char => /\s/.test(char) ? ' ' : char));
      for (const separator of found) {
        if (separator !== rule.thousandsSep && separator !== rule.decimalSep) return false;
      }
      return !(rule.fractionDigits === 0 && rule.decimalSep && found.has(rule.decimalSep));
    }
    function parseNumber(value, rule) {
      let clean = rule.thousandsSep ? value.split(rule.thousandsSep).join('') : value;
      if (rule.decimalSep && rule.decimalSep !== '.') clean = clean.replace(rule.decimalSep, '.');
      const number = parseFloat(clean);
      return Number.isNaN(number) ? null : number;
    }
    function matchRule(text, number, start, end, rule, matches, fallback) {
      const range = symbolRange(text, start, end, rule, false);
      const value = parseNumber(number, rule);
      const candidate = bounds => ({ index: bounds.start, length: bounds.end - bounds.start,
        value, info: rule, raw: text.substring(bounds.start, bounds.end) });
      if (range && validNumber(number, rule) && value !== null) {
        matches.push(candidate(range));
        return true;
      }
      if (!fallback.candidate) {
        const relaxed = symbolRange(text, start, end, rule, true);
        if (relaxed && value !== null) fallback.candidate = candidate(relaxed);
      }
      return false;
    }
    async function processTextAsync(text, countryCode, targetSymbol, before, sourceCode) {
      if (!/\d/.test(text)) return text;
      const cart = isCart();
      const ruleKey = `${sourceCode}:${countryCode}:${cart}`;
      let ruleSet = ruleSets.get(ruleKey);
      if (!ruleSet) {
        ruleSet = {
          currentRule: countryMap.get(sourceCode),
          otherRules: rules.filter(country => country.code !== sourceCode &&
            (cart || (country.code !== countryCode && country.currencyCode !== countryMap.get(countryCode)?.currencyCode)))
        };
        ruleSets.set(ruleKey, ruleSet);
      }
      const { currentRule, otherRules } = ruleSet;
      const matches = [];
      for (const number of text.matchAll(numberPattern)) {
        const start = number.index;
        const end = start + number[0].length;
        const fallback = { candidate: null };
        let matched = currentRule && currentRule.code !== countryCode &&
          matchRule(text, number[0], start, end, currentRule, matches, fallback);
        if (!matched) {
          for (const rule of otherRules) {
            if (matchRule(text, number[0], start, end, rule, matches, fallback)) { matched = true; break; }
          }
        }
        if (!matched && fallback.candidate) matches.push(fallback.candidate);
      }
      if (!matches.length) return text;
      const currencies = [...new Set(matches.map(match => match.info.currencyCode))];
      const rates = new Map();
      const setting = getContext().setting;
      if (setting.useCustomRate) {
        log.debug('custom-rate', '使用自定义汇率', { rate: setting.customRate });
        currencies.forEach(code => rates.set(code, setting.customRate));
      } else {
        await Promise.all(currencies.map(async code => {
          try { rates.set(code, await getRate(code)); }
          catch (error) { log.error('rate-failed', '价格所需汇率不可用', { currency: code, error }); }
        }));
      }
      let result = text;
      let convertedCount = 0;
      for (const match of matches.sort((a, b) => b.index - a.index)) {
        const rate = rates.get(match.info.currencyCode);
        if (!rate) continue;
        const converted = Number.parseFloat((match.value / rate).toFixed(2));
        const formatted = before ? `(${targetSymbol}${converted})` : `(${converted}${targetSymbol})`;
        result = result.substring(0, match.index) + match.raw + formatted + result.substring(match.index + match.length);
        convertedCount++;
      }
      log.debug('converted', '价格文本处理完成', { matched: matches.length, converted: convertedCount, currencies });
      return result;
    }
    return {
      processTextAsync,
      convertContent(text) {
        const setting = getSetting();
        return processTextAsync(text, setting.countyCode, setting.currencySymbol,
          setting.currencySymbolBeforeValue, getContext().currentCountyInfo.code);
      }
    };
  }

  // ---- conversion/index.js ----
  const conversion = (() => {
  const countyObjs = JSON.parse('[{"code":"US","currencyCode":"USD","name":"美国","nameEn":"United States","symbol":"$","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":""},{"code":"CN","currencyCode":"CNY","name":"中国","nameEn":"China","symbol":"¥","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":""},{"code":"JP","currencyCode":"JPY","name":"日本","nameEn":"Japan","symbol":"¥","decimalSep":null,"thousandsSep":",","fractionDigits":0,"symbolPos":"front","symbolGap":""},{"code":"DE","currencyCode":"EUR","name":"德国","nameEn":"Germany","symbol":"€","decimalSep":",","thousandsSep":" ","fractionDigits":2,"symbolPos":"end","symbolGap":""},{"code":"RU","currencyCode":"RUB","name":"俄罗斯","nameEn":"Russia","symbol":"руб","decimalSep":",","thousandsSep":".","fractionDigits":2,"symbolPos":"end","symbolGap":" "},{"code":"PL","currencyCode":"PLN","name":"波兰","nameEn":"Poland","symbol":"zł","decimalSep":",","thousandsSep":" ","fractionDigits":2,"symbolPos":"end","symbolGap":" "},{"code":"BR","currencyCode":"BRL","name":"巴西","nameEn":"Brazil","symbol":"R$","decimalSep":",","thousandsSep":".","fractionDigits":2,"symbolPos":"front","symbolGap":""},{"code":"VN","currencyCode":"VND","name":"越南","nameEn":"Vietnam","symbol":"₫","decimalSep":null,"thousandsSep":".","fractionDigits":0,"symbolPos":"end","symbolGap":""},{"code":"KR","currencyCode":"KRW","name":"韩国","nameEn":"South Korea","symbol":"₩","decimalSep":null,"thousandsSep":",","fractionDigits":0,"symbolPos":"front","symbolGap":" "},{"code":"ID","currencyCode":"IDR","name":"印度尼西亚","nameEn":"Indonesia","symbol":"Rp","decimalSep":null,"thousandsSep":" ","fractionDigits":0,"symbolPos":"front","symbolGap":" "},{"code":"TW","currencyCode":"TWD","name":"中国台湾","nameEn":"Taiwan","symbol":"NT$","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":" "},{"code":"HK","currencyCode":"HKD","name":"中国香港","nameEn":"Hong Kong","symbol":"HK$","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":" "},{"code":"UA","currencyCode":"UAH","name":"乌克兰","nameEn":"Ukraine","symbol":"₴","decimalSep":",","thousandsSep":" ","fractionDigits":2,"symbolPos":"end","symbolGap":""},{"code":"KZ","currencyCode":"KZT","name":"哈萨克斯坦","nameEn":"Kazakhstan","symbol":"₸","decimalSep":",","thousandsSep":" ","fractionDigits":2,"symbolPos":"end","symbolGap":""},{"code":"GB","currencyCode":"GBP","name":"英国","nameEn":"United Kingdom","symbol":"£","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":""},{"code":"CH","currencyCode":"CHF","name":"瑞士","nameEn":"Switzerland","symbol":"CHF","decimalSep":".","thousandsSep":" ","fractionDigits":2,"symbolPos":"front","symbolGap":" "},{"code":"NO","currencyCode":"NOK","name":"挪威","nameEn":"Norway","symbol":"kr","decimalSep":",","thousandsSep":".","fractionDigits":2,"symbolPos":"end","symbolGap":" "},{"code":"TH","currencyCode":"THB","name":"泰国","nameEn":"Thailand","symbol":"฿","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":""},{"code":"PH","currencyCode":"PHP","name":"菲律宾","nameEn":"Philippines","symbol":"₱","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":""},{"code":"SG","currencyCode":"SGD","name":"新加坡","nameEn":"Singapore","symbol":"S$","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":""},{"code":"MY","currencyCode":"MYR","name":"马来西亚","nameEn":"Malaysia","symbol":"RM","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":""},{"code":"MX","currencyCode":"MXN","name":"墨西哥","nameEn":"Mexico","symbol":"Mex$","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":" "},{"code":"CA","currencyCode":"CAD","name":"加拿大","nameEn":"Canada","symbol":"C$","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":" "},{"code":"AU","currencyCode":"AUD","name":"澳大利亚","nameEn":"Australia","symbol":"A$","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":" "},{"code":"NZ","currencyCode":"NZD","name":"新西兰","nameEn":"New Zealand","symbol":"NZ$","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":" "},{"code":"IN","currencyCode":"INR","name":"印度","nameEn":"India","symbol":"₹","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":""},{"code":"CL","currencyCode":"CLP","name":"智利","nameEn":"Chile","symbol":"CLP$","decimalSep":null,"thousandsSep":".","fractionDigits":0,"symbolPos":"front","symbolGap":""},{"code":"PE","currencyCode":"PEN","name":"秘鲁","nameEn":"Peru","symbol":"S/.","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":" "},{"code":"CO","currencyCode":"COP","name":"哥伦比亚","nameEn":"Colombia","symbol":"COL$","decimalSep":",","thousandsSep":".","fractionDigits":2,"symbolPos":"front","symbolGap":" "},{"code":"ZA","currencyCode":"ZAR","name":"南非","nameEn":"South Africa","symbol":"R","decimalSep":".","thousandsSep":" ","fractionDigits":2,"symbolPos":"front","symbolGap":" "},{"code":"SA","currencyCode":"SAR","name":"沙特阿拉伯","nameEn":"Saudi Arabia","symbol":"SR","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"end","symbolGap":" "},{"code":"AE","currencyCode":"AED","name":"阿联酋","nameEn":"United Arab Emirates","symbol":"AED","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"end","symbolGap":" "},{"code":"IL","currencyCode":"ILS","name":"以色列","nameEn":"Israel","symbol":"₪","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"front","symbolGap":""},{"code":"KW","currencyCode":"KWD","name":"科威特","nameEn":"Kuwait","symbol":"KD","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"end","symbolGap":" "},{"code":"QA","currencyCode":"QAR","name":"卡塔尔","nameEn":"Qatar","symbol":"QR","decimalSep":".","thousandsSep":",","fractionDigits":2,"symbolPos":"end","symbolGap":" "},{"code":"CR","currencyCode":"CRC","name":"哥斯达黎加","nameEn":"Costa Rica","symbol":"₡","decimalSep":",","thousandsSep":".","fractionDigits":2,"symbolPos":"front","symbolGap":""},{"code":"UY","currencyCode":"UYU","name":"乌拉圭","nameEn":"Uruguay","symbol":"$U","decimalSep":",","thousandsSep":".","fractionDigits":2,"symbolPos":"front","symbolGap":""}]');
  class Jsons {
static toJson(obj) {
      if (obj === null || typeof obj !== "object") {
        return obj;
      }
      if (obj instanceof Map) {
        const json2 = {};
        for (const [key, value] of obj) {
          json2[key] = this.toJson(value);
        }
        return json2;
      }
      if (Array.isArray(obj)) {
        return obj.map((v) => this.toJson(v));
      }
      const json = {};
      const keys = Object.keys(obj);
      for (const key of keys) {
        json[key] = this.toJson(obj[key]);
      }
      return json;
    }
static toString(obj) {
      return JSON.stringify(this.toJson(obj));
    }
static readJson(json, cls) {
      if (!cls) {
        if (typeof json !== "object" || json === null) {
          throw new Error("Invalid JSON input");
        }
        return json;
      }
      const instance = new cls();
      if (instance instanceof Map) {
        return this.handleMap(json, instance);
      }
      for (const key of Reflect.ownKeys(json)) {
        const value = json[key];
        if (value === null || value === void 0) {
          instance[key] = value;
          continue;
        }
        const fieldValue = instance[key];
        if (fieldValue !== null && typeof fieldValue === "object" && !(fieldValue instanceof Array)) {
          if (fieldValue instanceof Map) {
            instance[key] = this.handleMap(value, fieldValue);
          } else if (fieldValue instanceof Object) {
            instance[key] = this.readJson(value, fieldValue.constructor);
          }
        } else if (Array.isArray(fieldValue)) {
          instance[key] = value.map(
            (item) => typeof item === "object" ? this.readJson(item, fieldValue[0]?.constructor) : item
          );
        } else {
          instance[key] = value;
        }
      }
      return instance;
    }
static handleMap(value, mapInstance) {
      const map = new Map();
      if (value && typeof value === "object") {
        for (const key of Object.keys(value)) {
          const mapValue = value[key];
          if (mapValue === null || mapValue === void 0) {
            map.set(key, mapValue);
            continue;
          }
          const existingValue = mapInstance.get(key);
          if (this.isObject(mapValue)) {
            if (existingValue) {
              map.set(key, this.readJson(mapValue, existingValue.constructor));
            } else {
              map.set(key, mapValue);
            }
          } else {
            map.set(key, mapValue);
          }
        }
      }
      return map;
    }
    static isObject(value) {
      return value !== null && typeof value === "object";
    }
static readString(jsonString, cls) {
      const json = JSON.parse(jsonString);
      return this.readJson(json, cls);
    }
  }
  const countyInfos = Jsons.readJson(countyObjs, Array).sort((a, b) => a.name.localeCompare(b.name));
  const countyCode2Info = new Map(countyInfos.map((v) => [v.code, v]));
  function sourceCountryInfo(code) {
    const country = String(code || '').trim().toUpperCase();
    const direct = countyCode2Info.get(country);
    if (direct) return direct;
    const region = REGIONS.find(region => region.ccCandidates.includes(country));
    return region && countyInfos.find(info => info.currencyCode === region.currency);
  }
  const { SettingManager, storage: GmUtils } = createConversionSettings({ Jsons, countyCode2Info });
  class Attrs {
    static STATUS_KEY = "data-spc-status";
  }
  var _GM_cookie = (() => typeof GM_cookie != "undefined" ? GM_cookie : void 0)();
  var _GM_xmlhttpRequest = (() => typeof GM_xmlhttpRequest != "undefined" ? GM_xmlhttpRequest : void 0)();
  var _unsafeWindow = (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
  const log = diagnostics.scope('conversion');
  class SpcContext {
    _setting;
    _targetCountyInfo;
    _currentCountyInfo;
    constructor(setting, targetCountyInfo, targetCountyCode) {
      this._setting = setting;
      this._targetCountyInfo = targetCountyInfo;
      this._currentCountyInfo = targetCountyCode;
    }
    static getContext() {
      return _unsafeWindow.spcContext;
    }
    get setting() {
      return this._setting;
    }
    get targetCountyInfo() {
      return this._targetCountyInfo;
    }
    get currentCountyInfo() {
      return this._currentCountyInfo;
    }
  }
  class CookieCountyInfoProvider {
    name() {
      return "cookie";
    }
    match() {
      return true;
    }
    async getCountyCode() {
      return new Promise((resolve, reject) => {
        _GM_cookie.list({ name: "steamCountry" }, (cookies) => {
          if (cookies && cookies.length > 0) {
            const match = cookies[0].value.match(/^[a-zA-Z][a-zA-Z]/);
            if (match) {
              resolve(match[0].toUpperCase());
            }
          }
          reject();
        });
      });
    }
  }
  class Http {
    static get(cls, url, details) {
      if (!details) {
        details = { url };
      }
      details.method = "GET";
      return this.request(cls, details);
    }
    static post(url, cls, details) {
      if (!details) {
        details = { url };
      }
      details.method = "POST";
      return this.request(cls, details);
    }
    static request(cls, details) {
      return gmRequest(details.url, { signal: conversionScope?.signal, ...details }).then(response => {
        if (cls === String) return response.responseText;
        try { return Jsons.readJson(JSON.parse(response.responseText), cls); }
        catch (_) { throw invalidResponse('转换接口返回了无效 JSON'); }
      });
    }
  }
  class StorePageCountyCodeProvider {
    name() {
      return "商店页面";
    }
    match() {
      return window.location.href.includes("store.steampowered.com");
    }
    async getStoreDocument() {
      return document;
    }
    async getCountyCode() {
      const storeDom = await this.getStoreDocument();
      const sessionGlobals = storeDom === document ? _unsafeWindow : {};
      const sessionCountry = readStoreSession(storeDom, sessionGlobals).country;
      if (sessionCountry && /^[A-Z]{2}$/i.test(sessionCountry)) return sessionCountry.toUpperCase();
      try {
        let countyCode = (storeDom === document ? _unsafeWindow.GStoreItemData?.rgNavParams?.__page_default_obj?.countrycode : null);
        if (countyCode) {
          return countyCode;
        }
      } catch (e) {
        log.warn('country.page', '读取商店页面区域代码变量失败', { error: e });
      }
      const dataConfig = storeDom.querySelector("div#application_config")?.getAttribute("data-config");
      if (dataConfig) {
        const countyCode = JSON.parse(dataConfig)?.COUNTRY;
        if (countyCode) {
          return countyCode;
        }
      }
      const scripts = storeDom.querySelectorAll('script');
      for (const script of scripts) {
        const match = script.textContent.match(/"countrycode"\s*:\s*"([A-Z]{2})"/i);
        if (match) return match[1].toUpperCase();
      }
      throw new Error("无法从商店页面获取国家代码");
    }
  }
  class RequestStorePageCountyCodeProvider extends StorePageCountyCodeProvider {
    name() {
      return "请求商店页面";
    }
    match() {
      const href = window.location.href;
      return !href.includes("store.steampowered.com") || href.includes("store.steampowered.com/wishlist");
    }
    async getStoreDocument() {
      const storeHtml = await Http.get(String, "https://store.steampowered.com/");
      const parser = new DOMParser();
      return parser.parseFromString(storeHtml, "text/html");
    }
  }
  class MarketPageCountyCodeProvider {
    name() {
      return "市场页面";
    }
    match() {
      return window.location.href.includes("steamcommunity.com");
    }
    getCountyCode() {
      return new Promise((resolve, reject) => {
        try {
          const code = _unsafeWindow.g_strCountryCode;
          if (code) return resolve(code);
        } catch (err) {
          log.debug('country.market', '读取市场区域失败', { error: err });
        }
        reject();
      });
    }
  }
  class CountyCodeProviderManager {
    static instance = new CountyCodeProviderManager();
    providers;
    constructor() {
      this.providers = [
        new StorePageCountyCodeProvider(),
        new MarketPageCountyCodeProvider(),
        new RequestStorePageCountyCodeProvider(),
        new CookieCountyInfoProvider()
      ];
    }
    async getCountyCode() {
      const task = log.begin('country.resolve');
      for (let provider of this.providers) {
        if (!provider.match()) {
          continue;
        }
        task.debug('provider', '尝试区域来源', { provider: provider.name() });
        try {
          const countyCode = await provider.getCountyCode();
          task.end('区域读取成功', { provider: provider.name(), country: countyCode });
          return countyCode.toUpperCase();
        } catch (e) {
          task.debug('fallback', '尝试下一个区域来源', { provider: provider.name(), error: e });
        }
      }
      const error = new Error("所有获取区域代码策略都获取失败");
      task.fail(error);
      throw error;
    }
  }
  const RateManager = { instance: createRateService({ storage: GmUtils,
    getSetting: () => SettingManager.instance.setting,
    getContext: () => SpcContext.getContext(),
    fetchRates: from => {
      const url = `https://api.augmentedsteam.com/rates/v1?to=${encodeURIComponent(from)}`;
      return Http.get(Map, url, { url, signal: featureScopes.get('runtime')?.signal });
    }
  }) };
  class SpcManager {
    static instance = new SpcManager();
    constructor() {
    }
    setCountyCode(code) {
      SettingManager.instance.setCountyCode(code);
    }
    setCurrencySymbol(symbol) {
      SettingManager.instance.setCurrencySymbol(symbol);
    }
    setCurrencySymbolBeforeValue(isCurrencySymbolBeforeValue) {
      SettingManager.instance.setCurrencySymbolBeforeValue(isCurrencySymbolBeforeValue);
    }
    setRateCacheExpired(expired) {
      SettingManager.instance.setRateCacheExpired(expired);
    }
    resetSetting() {
      SettingManager.instance.reset();
    }
    clearCache() {
      RateManager.instance.clear();
    }
    setUseCustomRate(isUseCustomRate) {
      SettingManager.instance.setUseCustomRate(isUseCustomRate);
    }
    setCustomRate(customRate) {
      SettingManager.instance.setCustomRate(customRate);
    }
  }
  class AbstractConverter {
    selectorCache;
    selectorCacheCartMode;
    combinedSelectorCache;
    getCachedSelectors() {
      const cartMode = isCartPage();
      if (!this.selectorCache || this.selectorCacheCartMode !== cartMode) {
        this.selectorCache = this.getCssSelectors();
        this.selectorCacheCartMode = cartMode;
        this.combinedSelectorCache = this.selectorCache.join(', ');
      }
      return this.selectorCache;
    }
    findSelector(element) {
      for (const selector of this.getCachedSelectors()) if (element.matches(selector)) return selector;
      return null;
    }
match(elementSnap) {
      if (!elementSnap || !elementSnap.element) {
        return false;
      }
      if (elementSnap.element.closest(".sapx-extra-price, #sapx-cart-summary, #sapx-ui-root")) return false;
      const status = elementSnap.element.getAttribute(Attrs.STATUS_KEY);
      if (status && elementSnap.element.textContent.indexOf(status) !== -1) {
        return false;
      }
      const content = elementSnap.textContext;
      if (!content) {
        return false;
      }
      if (content.match(/\d/) === null) {
        return false;
      }
      if (/^[,.\d\s]+$/.test(content)) {
        return false;
      }
      const selector = this.findSelector(elementSnap.element);
      if (!selector) return false;
      elementSnap.selector = selector === true ? '' : selector;
      return true;
    }

afterConvert(elementSnap, result) {
      if (result.converted) {
        elementSnap.element.setAttribute(Attrs.STATUS_KEY, result.convertText);
      }
    }
  }
  const PriceProcessor = createPriceProcessor({ countries: countyInfos, countryMap: countyCode2Info,
    getSetting: () => SettingManager.instance.setting, getContext: () => SpcContext.getContext(),
    getRate: code => RateManager.instance.getRate(code), isCart: isCartPage
  });
  class ElementConverter extends AbstractConverter {
    getCssSelectors() {
      return getConversionSelectors();
    }
    findSelector(element) {
      this.getCachedSelectors();
      return element.matches(this.combinedSelectorCache) || null;
    }
    async convert(elementSnap) {
      await convertPriceTextNodes(elementSnap.element);
      return { converted: true, convertText: elementSnap.element.textContent };
    }
  }
  class TextNodeConverter extends AbstractConverter {
parseFirstChildTextNodeFn = (el) => el.firstChild;
cart = new Map([
[".Panel.Focusable ._18eO4-XadW5jmTpgdATkSz", [(el) => el.childNodes[1]]]
    ]);
wishlist = new Map([
["div.stat.svelte-1epviyc", [this.parseFirstChildTextNodeFn]]
    ]);
targets = new Map([
      [
        ".col.search_price.responsive_secondrow",
        [
(el) => el.firstChild.nextSibling.nextSibling.nextSibling,
          this.parseFirstChildTextNodeFn
        ]
      ],
      ["#header_wallet_balance", [this.parseFirstChildTextNodeFn]],
[".game_purchase_price.price", [this.parseFirstChildTextNodeFn]],
[".home_page_content_title", [this.parseFirstChildTextNodeFn]],
[".game_area_dlc_row > .game_area_dlc_price", [
        (el) => el,
        this.parseFirstChildTextNodeFn
      ]],
      ...this.cart,
      ...this.wishlist
    ]);
    getCssSelectors() {
      return [...this.targets.keys()];
    }
    async convert(elementSnap) {
      const selector = elementSnap.selector;
      const parseNodeFns = this.targets.get(selector) || [];
      if (!parseNodeFns.length) {
        return { converted: false };
      }
      const textNode = this.safeParseNode(selector, elementSnap.element, parseNodeFns);
      if (!textNode) {
        return { converted: false };
      }
      const content = textNode.nodeValue;
      if (!content || content.trim().length === 0) {
        return { converted: false };
      }
      await convertPriceTextNodes(textNode);
      return { converted: true, convertText: textNode.nodeValue };
    }
    safeParseNode(selector, el, fns) {
      for (let fn of fns) {
        try {
          const node = fn(el);
          if (node && node.nodeName === "#text" && node.nodeValue && node.nodeValue.length > 0) {
            return node;
          }
        } catch (e) {
          log.debug('nodes.fallback', '文本节点路径不适用，尝试其他路径', { selector });
        }
      }
      return null;
    }
  }
  class ConverterManager {
    static instance = new ConverterManager();
    converters;
    constructor() {
      this.converters = [
        new ElementConverter(),
        new TextNodeConverter()
      ];
    }
    getSelector() {
      return this.converters.flatMap(exchanger => exchanger.getCssSelectors()).join(', ');
    }
    async convert(elements) {
      if (!elements) {
        return;
      }
      await forEachConcurrent(elements, 8, async element => {
        const elementSnap = {
          element,
          textContext: element.textContent,
          classList: element.classList,
          attributes: element.attributes
        };
        const matched = this.converters.filter(converter => converter.match(elementSnap));
        await Promise.all(matched.map(async converter => {
          try {
            const elementConverted = await converter.convert(elementSnap);
            if (elementConverted) {
              converter.afterConvert(elementSnap, elementConverted);
            }
          } catch (e) {
            log.error('nodes.convert-failed', '价格转换失败', { error: e, element });
          }
        }));
      });
    }
  }
  let conversionScope;
  async function initializeConversion() {
    if (!GM_getValue("sse_convert_enabled", true)) { log.debug('initialize.skip', '价格转换已关闭'); return; }
    const scope = conversionScope = createFeatureScope('conversion');
    RateManager.instance.resetBreaker();
    scope.own(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const state = convertedOriginals.get(node);
        if (state && node.nodeValue === state.result) node.nodeValue = state.original;
      }
      document.querySelectorAll('[' + Attrs.STATUS_KEY + ']').forEach(node => node.removeAttribute(Attrs.STATUS_KEY));
    });
    const task = log.begin('initialize', undefined, 'info');
    try {
      // A timeout is not proof that React has adopted the server-rendered text.
      if (!isStorePageReady()) {
        task.debug('hydrate.wait', '等待商店页面接管服务端内容');
        while (scope.active && !isStorePageReady()) {
          if (!await scope.wait(100)) return;
        }
        task.debug('hydrate.ready', '页面已接管服务端内容');
      }
      await initContext();
      if (!scope.active) return;
      await start();
      task.end('价格转换初始化完成');
    }
    catch (error) { task.fail(error); }
  }
  async function start() {
    const context = SpcContext.getContext();
    if (context.setting.disableOnMarket && window.location.href === "https://steamcommunity.com/market/") {
      log.info('start.skip', '已开启市场首页禁用，跳过转换');
      return;
    }
    if (context.currentCountyInfo.code === context.targetCountyInfo.code && !isCartPage()) {
      log.info('start.skip', '当前区域与目标一致，无需转换', { country: context.currentCountyInfo.code });
      return;
    }
    log.info('start.ready', '开始价格转换', { target: context.targetCountyInfo.code });
    await convert();
  }
  async function convert() {
    const exchangerManager = ConverterManager.instance;
    const selector = exchangerManager.getSelector();
    const scope = conversionScope || (conversionScope = createFeatureScope('conversion'));
    const scanner = createDomScanner({ scope, selector, name: 'conversion', initial: false,
      process: nodes => exchangerManager.convert(nodes) });
    scanner.scan();
    await scanner.flush();
    return scanner;
    log.debug('observer.ready', '价格变化监听已启用');
  }
  async function initContext() {
    const setting = SettingManager.instance.setting;
    let targetCountyInfo = countyCode2Info.get(setting.countyCode);
    if (!targetCountyInfo) {
      log.warn('context.target-fallback', '目标区域未知，使用美国', { country: setting.countyCode });
      targetCountyInfo = countyCode2Info.get("US");
    }
    log.debug('context.target', '目标区域已就绪', targetCountyInfo);
    let currCountyCode;
    try {
      currCountyCode = await CountyCodeProviderManager.instance.getCountyCode();
    } catch (error) {
      if (!isCartPage()) throw error;
      currCountyCode = 'US';
      log.warn('context.cart-fallback', '账号地区不可用，按商品币种符号识别', { error });
    }
    if (currCountyCode) {
      log.debug('context.country', '账号区域已就绪', { country: currCountyCode });
    }
    let currCountInfo = sourceCountryInfo(currCountyCode);
    if (!currCountInfo) {
      log.warn('context.source-fallback', '当前区域缺少映射，使用美国', { country: currCountyCode });
      currCountInfo = countyCode2Info.get("US");
    }
    log.debug('context.source', '原币种区域已就绪', currCountInfo);
    _unsafeWindow.SpcManager = SpcManager.instance;
    _unsafeWindow.spcContext = new SpcContext(setting, targetCountyInfo, currCountInfo);
  }


  const convertedNodes = new WeakMap();
  const convertingNodes = new WeakSet();
  const convertedOriginals = new WeakMap();
  async function convertPriceTextNodes(root) {
    const scope = conversionScope;
    function* textNodes() {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) yield walker.currentNode;
    }
    await forEachConcurrent(root.nodeType === 3 ? [root] : textNodes(), 12, async node => {
      if (node.parentElement?.closest('.sapx-extra-price, #sapx-cart-summary, #sapx-ui-root') ||
          convertedNodes.get(node) === node.nodeValue || convertingNodes.has(node)) return;
      const original = node.nodeValue;
      if (!original || !/\d/.test(original)) return;
      convertingNodes.add(node);
      try {
        const result = await PriceProcessor.convertContent(original);
        if (scope?.active !== false && node.isConnected && node.nodeValue === original) {
          convertedNodes.set(node, result);
          if (result !== original) {
            convertedOriginals.set(node, { original, result });
            node.nodeValue = result;
          }
        }
      } finally { convertingNodes.delete(node); }
    });
  }
  return {
    get setting() { return SettingManager.instance.setting; },
    countries: countyInfos,
    getRate: (source, target) => RateManager.instance.getRate(source, target),
    save: setting => SettingManager.instance.saveSetting(setting),
    start: initializeConversion
  };

  })();

  // ---- family-library.js ----
  function initializeFamilyLibrary() {
    const scope = createFeatureScope('family');
    const log = diagnostics.scope('family');
    const KEY = 'sse_family_cache_v1';
    const DAY = 86400000;
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    const onStore = location.hostname === 'store.steampowered.com';
    const enabled = GM_getValue('sse_family_enabled', true);
    log.info('initialize', enabled ? '家庭库标记已启用' : '家庭库标记已关闭');
    let cache = GM_getValue(KEY, null);
    log.debug('cache.load', '读取家庭库缓存', { cached: Boolean(cache), updated: cache?.updated });
    let scanPromise = null;
    let accountId = '';
    let root = null;
    let notice = '';
    const style = document.createElement('style');
    style.textContent = `
      .sse-family-badge{display:inline-block!important;background:#086b68;color:#c4fff4!important;padding:3px 7px;margin:4px;border-radius:3px;font-size:11px;line-height:1.4;white-space:normal;pointer-events:none;text-decoration:none}
      .sse-family-banner{box-sizing:border-box;margin:12px 0;padding:14px;color:#c4fff4;background:linear-gradient(90deg,#145b59,#1b2838);border:1px solid #287c75;border-radius:4px}
      .sse-family-banner a{color:#a4f5e6;margin-left:12px}.sse-family-banner button{margin-left:12px;cursor:pointer}
      #sse-family-dialog{position:fixed;inset:0;z-index:2147483646;background:#000b;display:grid;place-items:center;padding:12px;box-sizing:border-box;color:#c6d4df;font-family:Arial,sans-serif}
      #sse-family-dialog .sse-family-window{box-sizing:border-box;width:min(850px,100%);max-height:90vh;overflow:auto;background:linear-gradient(#1b2838,#171a21);border:1px solid #34465a;border-radius:6px;padding:18px}
      #sse-family-dialog h2{font-size:18px;color:#e5e5e5;margin:0 0 12px}#sse-family-dialog h3{font-size:14px;color:#67c1f5;margin:18px 0 10px}
      #sse-family-dialog button{background:#27465c;color:#c6e7ff;border:0;border-radius:3px;padding:8px 10px;margin:4px;cursor:pointer}#sse-family-dialog button:disabled{opacity:.5;cursor:default}
      #sse-family-dialog .sse-family-status{margin:10px 0;white-space:pre-wrap;font-size:12px;color:#acb2b8}
      #sse-family-dialog table{width:100%;border-collapse:collapse;font-size:12px}#sse-family-dialog td,#sse-family-dialog th{padding:8px;text-align:left;border-bottom:1px solid #34465a;overflow-wrap:anywhere}
      #sse-family-dialog a{color:#67c1f5}#sse-family-dialog .sse-family-recent{background:#164337}
      .sse-family-chart-row{display:grid;grid-template-columns:minmax(70px,140px) minmax(0,1fr) 60px;gap:8px;align-items:center;margin:8px 0;font-size:12px}
      .sse-family-chart-bar{display:flex;height:18px;background:#0f141b;border-radius:3px;overflow:hidden}.sse-family-chart-bar span{display:block;height:100%}
      #sse-family-nav{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;white-space:nowrap;cursor:pointer;flex-shrink:0}
      #sse-family-nav>svg,#sse-family-nav>span{align-self:center}
      #sse-family-chart-tooltip{position:fixed;z-index:2147483647;max-width:min(360px,calc(100vw - 24px));box-sizing:border-box;padding:10px 12px;border:1px solid #67c1f5;border-radius:4px;background:#101923;color:#c6d4df;box-shadow:0 4px 18px #0008;font:12px/1.6 Arial,sans-serif;white-space:pre-wrap;pointer-events:none}
      #sse-family-dialog .sse-family-scroll{overflow:auto;max-height:350px}#sse-family-dialog input{box-sizing:border-box;padding:8px;background:#0f141b;color:#c6d4df;border:1px solid #34465a;width:100%;margin:8px 0}
    `;
    document.head.appendChild(style);
    scope.own(() => {
      style.remove(); close();
      document.querySelectorAll('.sse-family-badge, .sse-family-banner, #sse-family-nav').forEach(node => node.remove());
      document.querySelectorAll('[data-sse-family-app]').forEach(node => node.removeAttribute('data-sse-family-app'));
    });

    function readIdentity() {
      const session = readStoreSession(document, page);
      return { steamid: session.steamid, token: session.token };
    }
    try { if (onStore) accountId = readIdentity().steamid; }
    catch (error) { notice = '暂时无法读取登录信息，请刷新 Steam 商店页面。'; log.warn('session.read', notice, { error }); }
    let validatedCache;
    let cacheShapeValid = false;
    function validCache() {
      if (validatedCache !== cache) {
        validatedCache = cache;
        cacheShapeValid = Boolean(cache && cache.apps && typeof cache.apps === 'object' && !Array.isArray(cache.apps) &&
        Array.isArray(cache.members) && cache.members.length > 0 && /^\d{17}$/.test(String(cache.steamid)) &&
        cache.members.every(id => /^\d{17}$/.test(String(id))) &&
        Object.entries(cache.apps).every(([id, game]) => itemRef('app', id) && game && typeof game.name === 'string' &&
          Array.isArray(game.owners) && game.owners.every(owner => /^\d{17}$/.test(String(owner)))));
      }
      return cacheShapeValid && (!onStore || (accountId && cache.steamid === accountId));
    }
    function ownerName(id) { return cache?.names?.[String(id)] || String(id); }
    function gameDescription(game) {
      const owners = game.owners.map(ownerName).join('、');
      return '家庭库贡献者：' + owners + (game.time ? '\n记录的最早购入时间：' + new Date(game.time * 1000).toLocaleString() : '');
    }
    async function api(method, token, params) {
      const task = log.begin('api.' + method);
      try {
      const url = new URL('https://api.steampowered.com/' + method + '/v1/');
      url.searchParams.set('access_token', token);
      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
      const parsed = JSON.parse(await gmGet(url.href, { signal: scope.signal }));
      if (!parsed.response || typeof parsed.response !== 'object') throw invalidResponse('Steam 返回了无效的家庭库数据。');
      task.end('家庭库接口请求完成');
      return parsed.response;
      } catch (error) { task.fail(error); throw error; }
    }
    function refreshNotice() {
      if (root) renderDialog();
    }
    function scan() {
      if (scanPromise) { log.debug('scan.join', '复用当前家庭库扫描'); return scanPromise; }
      const task = log.begin('scan', undefined, 'info');
      scanPromise = (async () => {
        if (!onStore) throw new Error('请在已登录的 Steam 商店页面中扫描家庭库。');
        const identity = readIdentity();
        if (!identity.token) throw new Error('无法读取登录凭据，请登录 Steam 商店后刷新页面。');
        notice = '正在读取家庭组……'; refreshNotice();
        const family = await api('IFamilyGroupsService/GetFamilyGroupForUser', identity.token, { include_family_group_response: true });
        if (!family.family_groupid || !family.family_group) throw new Error('当前账号没有可读取的 Steam 家庭组。');
        const members = family.family_group.members;
        if (!Array.isArray(members) || !members.length || members.some(member => !/^\d{17}$/.test(String(member?.steamid)))) throw invalidResponse('家庭成员列表无效，原缓存已保留。');
        task.debug('members', '家庭成员已读取', { count: members.length });
        // The API identifies the signed-in member even when the SSR page omits its SteamID.
        const self = identity.steamid || String(family.steamid || '');
        if (!/^\d{17}$/.test(self)) throw new Error('无法确认当前账号 SteamID，未覆盖已保存的家庭库。');
        notice = '正在扫描家庭库游戏……'; refreshNotice();
        const library = await api('IFamilyGroupsService/GetSharedLibraryApps', identity.token, {
          family_groupid: family.family_groupid, include_own: true, include_excluded: false, include_non_games: false
        });
        if (!Array.isArray(library.apps) || library.apps.some(app => !itemRef('app', app?.appid) ||
            !Array.isArray(app.owner_steamids) || app.owner_steamids.some(id => !/^\d{17}$/.test(String(id))))) throw invalidResponse('家庭库游戏列表无效，原缓存已保留。');
        task.debug('library', '共享游戏列表已读取', { count: library.apps.length });
        const names = Object.fromEntries(members.map(member => [String(member.steamid), String(member.steamid)]));
        try {
          const params = Object.fromEntries(members.map((member, index) => ['steamids[' + index + ']', member.steamid]));
          const players = await api('IPlayerService/GetPlayerLinkDetails', identity.token, params);
          for (const player of players.accounts || []) {
            if (player.public_data?.steamid) names[String(player.public_data.steamid)] = player.public_data.persona_name || String(player.public_data.steamid);
          }
        } catch (error) { notice = '游戏已读取，部分成员昵称暂时无法获取，将显示 SteamID。'; task.warn('names.fallback', notice, { error }); }
        const apps = {};
        for (const app of library.apps) {
          if (Number(app.exclude_reason || 0) !== 0 || !Number.isSafeInteger(Number(app.appid))) continue;
          apps[app.appid] = { name: app.name || String(app.appid), owners: [...new Set((app.owner_steamids || []).map(String))], time: Number(app.rt_time_acquired) || 0 };
        }
        if (!scope.active || (readIdentity().steamid && readIdentity().steamid !== self)) return;
        cache = { steamid: self, familyId: String(family.family_groupid), name: family.family_group.name || 'Steam 家庭', members: members.map(member => String(member.steamid)), names, apps, updated: Date.now() };
        validatedCache = undefined;
        accountId = self;
        GM_setValue(KEY, cache);
        task.debug('cache.save', '家庭库缓存已保存', { count: Object.keys(apps).length });
        notice = '扫描完成，已缓存 ' + Object.keys(apps).length + ' 个家庭库游戏。';
        updateMarks();
        updateBanner();
        task.end(notice, { games: Object.keys(apps).length, members: members.length });
      })().catch(error => { notice = error.message || '家庭库扫描失败，原缓存已保留。'; task.fail(error); })
        .finally(() => { scanPromise = null; refreshNotice(); });
      refreshNotice();
      return scanPromise;
    }

    function action(label, handler) {
      const control = createElement('button', label);
      control.type = 'button';
      control.addEventListener('click', handler);
      return control;
    }
    function open() {
      if (!scope.active) return;
      log.debug('panel.open', '打开家庭库管理');
      if (!root) {
        root = createElement('div');
        root.id = 'sse-family-dialog';
        root.addEventListener('click', event => { if (event.target === root) close(); });
        document.documentElement.appendChild(root);
      }
      renderDialog();
    }
    function close() { if (root) log.debug('panel.close', '关闭家庭库管理'); hideChartTooltip(); root?.remove(); root = null; }
    let chartTooltip = null;
    let tooltipSize;
    let tooltipContent;
    let tooltipFrame;
    function hideChartTooltip() {
      if (tooltipFrame) cancelAnimationFrame(tooltipFrame);
      tooltipFrame = null; tooltipSize = null; tooltipContent = null;
      chartTooltip?.remove(); chartTooltip = null;
    }
    function showChartTooltip(content, x, y) {
      if (!chartTooltip) {
        chartTooltip = createElement('div'); chartTooltip.id = 'sse-family-chart-tooltip'; chartTooltip.setAttribute('role', 'tooltip');
        document.documentElement.appendChild(chartTooltip);
      }
      if (tooltipContent !== content || !tooltipSize) {
        chartTooltip.textContent = content;
        tooltipContent = content;
        tooltipSize = chartTooltip.getBoundingClientRect();
      }
      if (tooltipFrame) cancelAnimationFrame(tooltipFrame);
      tooltipFrame = requestAnimationFrame(() => {
        tooltipFrame = null;
        if (!chartTooltip || !scope.active) return;
        chartTooltip.style.left = Math.max(12, Math.min(x + 14, window.innerWidth - tooltipSize.width - 12)) + 'px';
        chartTooltip.style.top = Math.max(12, Math.min(y + 14, window.innerHeight - tooltipSize.height - 12)) + 'px';
      });
    }
    function ensureFamilyNav() {
      if (!onStore || !enabled) return;
      const candidates = [...document.querySelectorAll('#wishlist_link, #store_nav_wishlist_link, a[href*="/wishlist"]')].filter(link => {
        if (link.closest('dialog, [popover], #sse-family-dialog, #sapx-ui-root')) return false;
        return link.matches('#wishlist_link, #store_nav_wishlist_link, .u5g6D3cfJ40-') ||
          Boolean(link.closest('#store_nav_area, #store_header, .store_nav, .store_header, [role="navigation"], ._5LVptMyFAZw-'));
      });
      const wishlist = candidates.find(link => link.getClientRects().length > 0) || candidates[0];
      if (!wishlist) return;
      let control = document.getElementById('sse-family-nav');
      if (!control) {
        const template = wishlist.matches('a, button') ? wishlist : wishlist.querySelector('a, button');
        if (!template) return;
        control = template.cloneNode(true);
        control.id = 'sse-family-nav';
        control.removeAttribute('onclick');
        control.removeAttribute('aria-current');
        control.removeAttribute('aria-disabled');
        if (control.tagName === 'A') control.setAttribute('href', '#sse-family-library');
        else control.type = 'button';
        control.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
        const nativeCount = control.querySelector('.oWSo9BvK7oY-, .wishlist_count, .count');
        let count = nativeCount;
        if (!count) {
          count = [...control.querySelectorAll('span')].find(element => /^\s*\d+\s*$/.test(element.textContent));
        }
        if (!count) { count = createElement('span'); control.appendChild(count); }
        count.classList.add('sse-family-count');
        const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
        const labels = [];
        while (walker.nextNode()) {
          const current = walker.currentNode;
          if (current.textContent.trim() && !current.parentElement.closest('svg, .sse-family-count')) labels.push(current);
        }
        labels.forEach((label, index) => { label.textContent = index === 0 ? '我的家庭库' : ''; });
        if (!labels.length) control.insertBefore(document.createTextNode('我的家庭库'), count);
        const icon = control.querySelector('svg');
        if (icon) {
          icon.setAttribute('viewBox', '0 0 24 24');
          icon.removeAttribute('aria-label');
          icon.innerHTML = '<path fill="currentColor" d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 13c-4 0-7 2-7 5v3h14v-3c0-3-3-5-7-5Zm8-1c-1 0-2 .2-3 .6 2.5 1.2 4 3 4 5.4v3h6v-4c0-3-3-5-7-5Z"/>';
        }
        control.setAttribute('aria-label', '我的家庭库');
        control.addEventListener('click', event => { event.preventDefault(); open(); });
      }
      // Older store headers float the wishlist container; use its parent for a stable left-hand slot.
      const slot = wishlist.closest('#wishlist_link') || wishlist;
      if (slot.previousElementSibling !== control) slot.before(control);
      const count = validCache() ? String(Object.keys(cache.apps).length) : '0';
      const label = control.querySelector('.sse-family-count');
      if (label.textContent !== count) label.textContent = count;
      control.title = '查看家庭库贡献统计、最近购入与扫描管理';
    }
    scope.listen(window, 'keydown', event => { if (event.key === 'Escape') close(); });
    function renderDialog() {
      if (!root) return;
      hideChartTooltip();
      const panel = createElement('div', undefined, 'sse-family-window');
      panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', 'Steam 家庭库');
      panel.append(createElement('h2', 'Steam 家庭库'));
      const scanButton = action(scanPromise ? '扫描中……' : '现在扫描家庭库', scan);
      scanButton.disabled = !onStore || Boolean(scanPromise);
      panel.append(scanButton, action('清空缓存', () => {
        if (scanPromise) { notice = '请等待扫描完成后再清空缓存。'; refreshNotice(); return; }
        if (!window.confirm('确定清空本脚本保存的家庭库记录？')) return;
        GM_deleteValue(KEY); cache = null; validatedCache = undefined; notice = '家庭库缓存已清空。'; updateMarks(); updateBanner(); renderDialog();
        log.info('cache.clear', '家庭库缓存已清空');
      }), action('关闭', close));
      const summary = validCache() ? cache.name + ' · ' + Object.keys(cache.apps).length + ' 个游戏 · 上次扫描：' + new Date(cache.updated).toLocaleString() : '暂无当前账号的家庭库缓存。';
      panel.append(createElement('div', summary + '\n' + (notice || (!onStore ? '请前往 Steam 商店扫描，本站使用已保存的缓存。' : '')), 'sse-family-status'));
      if (validCache()) {
        log.debug('panel.statistics', '渲染家庭库统计', { games: Object.keys(cache.apps).length, members: cache.members.length });
        panel.append(createElement('h3', '家庭成员贡献统计'));
        const games = Object.values(cache.apps);
        const totalsById = new Map(cache.members.map(id => [id, 0]));
        const ownershipBands = new Map(cache.members.map(id => [id, Array(cache.members.length).fill(0)]));
        for (const game of games) {
          const band = Math.min(cache.members.length, game.owners.length) - 1;
          if (band < 0) continue;
          for (const owner of game.owners) {
            if (!totalsById.has(owner)) continue;
            totalsById.set(owner, totalsById.get(owner) + 1);
            ownershipBands.get(owner)[band]++;
          }
        }
        const totals = cache.members.map(id => totalsById.get(id));
        const maximum = Math.max(1, ...totals);
        const colors = ['#67c1f5', '#06cfbe', '#a0c85a', '#d7a64c', '#bb83db', '#e18484'];
        cache.members.forEach((id, index) => {
          const row = createElement('div', undefined, 'sse-family-chart-row');
          const bar = createElement('div', undefined, 'sse-family-chart-bar');
          const counts = ownershipBands.get(id);
          counts.forEach((count, group) => {
            const segment = createElement('span'); segment.style.width = count / maximum * 100 + '%'; segment.style.background = colors[group % colors.length];
            const category = group === 0 ? '单独贡献' : (group + 1) + ' 人共同拥有';
            const details = ownerName(id) + '\n' + category + '：' + count + ' 个游戏\n该成员拥有总数：' + totals[index] + ' 个\n占该成员游戏的比例：' + (totals[index] ? (count / totals[index] * 100).toFixed(1) : '0') + '%';
            segment.setAttribute('aria-label', details);
            if (count) segment.tabIndex = 0;
            segment.addEventListener('mouseenter', event => showChartTooltip(details, event.clientX, event.clientY));
            segment.addEventListener('mousemove', event => showChartTooltip(details, event.clientX, event.clientY));
            segment.addEventListener('mouseleave', hideChartTooltip);
            segment.addEventListener('focus', () => { const bounds = segment.getBoundingClientRect(); showChartTooltip(details, bounds.left, bounds.bottom); });
            segment.addEventListener('blur', hideChartTooltip);
            bar.appendChild(segment);
          });
          row.append(createElement('span', ownerName(id)), bar, createElement('span', String(totals[index]))); panel.appendChild(row);
        });
        panel.append(createElement('div', '柱条按拥有同一游戏的成员人数分段；悬停查看数量。统计包含当前账号，不代表家庭实际可用的同时游玩份数。', 'sse-family-status'));
        panel.append(createElement('h3', '最近购入的游戏'));
        panel.append(createElement('div', '按接口记录的最早购入时间排序；绿色表示最近 30 天购入且仅一位成员拥有。', 'sse-family-status'));
        const search = createElement('input'); search.placeholder = '搜索游戏或贡献者'; search.setAttribute('aria-label', '搜索家庭库游戏'); panel.appendChild(search);
        const scroll = createElement('div', undefined, 'sse-family-scroll');
        const table = createElement('table'); const header = createElement('tr');
        ['游戏名称', '记录的最早购入时间', '贡献者'].forEach(value => header.appendChild(createElement('th', value)));
        const head = createElement('thead'); head.appendChild(header); table.appendChild(head);
        const body = createElement('tbody');
        Object.entries(cache.apps).sort((a, b) => b[1].time - a[1].time).forEach(([id, game]) => {
          const row = createElement('tr');
          if (game.time * 1000 >= Date.now() - 30 * DAY && game.owners.length === 1) row.className = 'sse-family-recent';
          const cell = createElement('td'); const link = createElement('a', game.name); link.href = 'https://store.steampowered.com/app/' + id; link.target = '_blank'; link.rel = 'noopener noreferrer'; cell.appendChild(link);
          row.append(cell, createElement('td', game.time ? new Date(game.time * 1000).toLocaleDateString() : '未知'), createElement('td', game.owners.map(ownerName).join('、'))); body.appendChild(row);
        });
        search.addEventListener('input', () => { const value = search.value.toLocaleLowerCase(); [...body.rows].forEach(row => { row.hidden = !row.textContent.toLocaleLowerCase().includes(value); }); });
        table.appendChild(body); scroll.appendChild(table); panel.appendChild(scroll);
      }
      root.replaceChildren(panel);
      log.debug('panel.render', '家庭库面板已更新', { cacheValid: Boolean(validCache()), scanning: Boolean(scanPromise) });
    }

    const targets = PAGE_ADAPTERS.family.rows;
    const marked = new Set();
    function appId(element) {
      const value = element.getAttribute('data-ds-appid') || element.getAttribute('data-app-id');
      if (value && /^\d+$/.test(value)) return value;
      const wishlist = element.getAttribute('data-rfd-draggable-id')?.match(/^WishlistItem-(\d+)/);
      if (wishlist) return wishlist[1];
      const href = element.getAttribute('href') || '';
      const match = href.match(/^(?:https?:\/\/(?:store\.steampowered\.com|steamcommunity\.com))?\/app\/(\d+)/);
      return match?.[1] || null;
    }
    function updateMarks(elements) {
      if (!scope.active) return;
      const active = enabled && validCache();
      for (const element of marked) {
        const id = element.getAttribute('data-sse-family-app');
        const game = active ? cache.apps[id] : null;
        if (!element.isConnected || !game || game.owners.includes(cache.steamid) || appId(element) !== id) {
          element.querySelector(':scope > .sse-family-badge')?.remove(); element.removeAttribute('data-sse-family-app');
          marked.delete(element);
        }
      }
      if (!elements) ensureFamilyNav();
      if (!active) return;
      let added = 0;
      (elements || document.querySelectorAll(targets)).forEach(element => {
        if (element.closest('#sse-family-dialog, #sapx-ui-root, #sse-cart-tools, .sse-family-banner, .sse-family-badge')) return;
        const id = appId(element); const game = cache.apps[id];
        if (!game || game.owners.includes(cache.steamid) || element.classList.contains('ds_owned') || element.querySelector('.ds_owned_flag:not(.sse-family-badge)')) return;
        const owner = element.parentElement?.closest(targets);
        if (owner && appId(owner) === id) return;
        element.setAttribute('data-sse-family-app', id);
        marked.add(element);
        let badge = element.querySelector(':scope > .sse-family-badge');
        if (!badge) { badge = createElement('span', '在家庭库中', 'sse-family-badge'); element.appendChild(badge); added++; }
        const title = gameDescription(game);
        if (badge.title !== title) badge.title = title;
      });
      if (added) log.debug('marks.render', '家庭库标记已添加', { count: added });
    }
    function updateBanner() {
      if (!enabled || !validCache()) { document.querySelectorAll('.sse-family-banner').forEach(node => node.remove()); return; }
      const detailId = location.pathname.match(/^\/app\/(\d+)/)?.[1];
      const detail = cache.apps[detailId];
      if (onStore && detail) {
        const host = document.querySelector('.queue_and_playtime, #game_area_purchase, .game_area_purchase');
        if (host && !host.querySelector('.sse-family-banner')) {
          const banner = createElement('div', detail.owners.includes(cache.steamid) ? '您和家庭成员拥有此游戏' : '您的 Steam 家庭库中已有此游戏', 'sse-family-banner');
          banner.title = gameDescription(detail);
          banner.appendChild(action('查看贡献者（' + detail.owners.length + '）', () => window.alert(gameDescription(detail))));
          const launch = createElement('a', '马上开玩'); launch.href = 'steam://launch/' + detailId + '/Dialog'; banner.appendChild(launch);
          host.prepend(banner);
        }
      }
      if (location.hostname === 'steamdb.keylol.com') {
        const id = location.hash.match(/app\/(\d+)/)?.[1]; const game = cache.apps[id]; const host = document.querySelector('#game_score');
        if (game && !game.owners.includes(cache.steamid) && host && !document.querySelector('.sse-family-banner')) host.after(createElement('div', '家庭组：' + gameDescription(game), 'sse-family-banner'));
      }
    }
    if (enabled) {
      createDomScanner({ scope, name: 'family', selector: targets + ',' + PAGE_ADAPTERS.family.anchors, process: nodes => {
        if (nodes.some(node => node.matches(PAGE_ADAPTERS.family.anchors))) { ensureFamilyNav(); updateBanner(); }
        updateMarks(nodes.filter(node => node.matches(targets)));
      }, attributes: ITEM_ATTRIBUTES,
        removed: nodes => {
          for (const removed of nodes) {
            const candidates = [removed, ...(removed.querySelectorAll?.('[data-sse-family-app]') || [])];
            for (const node of candidates) if (marked.delete(node)) node.removeAttribute('data-sse-family-app');
          }
        } });
      log.debug('observer.ready', '家庭库标记动态监听已启用');
      scope.listen(window, 'hashchange', () => updateMarks());
      ensureFamilyNav();
      updateMarks();
      updateBanner();
      if (onStore && GM_getValue('sse_family_auto', true) && (!validCache() || Date.now() - cache.updated >= DAY)) {
        log.debug('scan.auto', '缓存缺失或过期，触发自动扫描'); scan();
      } else log.debug('scan.skip', '无需自动扫描');
    }
    return { open, dispose: scope.dispose };
  }

  // ---- cart-tools.js ----
  function findWishlistCartButton(row) {
    const nativeButton = row.querySelector('.E4PXslhR-fI- > button:not(.sse-quick-add), button.LrqeL6o22aQ-:not(.sse-quick-add), .purchase_area .btnv6_green_white_innerfade:not(.sse-quick-add), .purchase_area .btn_addtocart:not(.sse-quick-add)');
    if (nativeButton) return nativeButton;
    return Array.from(row.querySelectorAll('a, button')).find(element => {
      if (element.classList?.contains?.('sse-quick-add')) return false;
      const label = [element.getAttribute('aria-label'), element.getAttribute('title'), element.getAttribute('data-tooltip-text'), element.textContent]
        .filter(Boolean).join(' ');
      return /加入购物车|在购物车中|已在购物车|已加入购物车|购物车中|add(?:ed)?\s+to\s+cart|in\s+cart|view\s+cart/i.test(label);
    }) || null;
  }

  function isInCartButton(element) {
    if (!element) return false;
    const label = [element.getAttribute('aria-label'), element.getAttribute('title'), element.getAttribute('data-tooltip-text'), element.textContent]
      .filter(Boolean).join(' ');
    return /在购物车中|已在购物车|已加入购物车|购物车中|added\s+to\s+cart|in\s+cart|view\s+cart/i.test(label);
  }

  function placeWishlistCartButton(row, control) {
    // Keep React-owned controls in place; hide them only while our replacement is adjacent.
    const nativeButton = findWishlistCartButton(row);
    if (!nativeButton) return false;
    control.classList.add('sse-wishlist-cart');
    nativeButton.classList.add('sse-wishlist-native-cart');
    if (nativeButton.previousElementSibling !== control) nativeButton.before(control);
    return true;
  }

  function initializeCartTools() {
    const scope = createFeatureScope('cart');
    const initialHost = location.hostname;
    const log = diagnostics.scope('cart');
    log.info('initialize', '快速加购与购物车管理已启用');
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    const english = GM_getValue('sse_cart_language', 'ZH') === 'EN';
    const text = (zh, en) => english ? en : zh;
    const style = document.createElement('style');
    style.textContent = `
      .sse-cart-panel{box-sizing:border-box;width:100%;max-width:100%;min-width:0;flex-shrink:0;align-self:flex-start;margin:16px 0;padding:16px;background:#1b2838;border:1px solid #34465a;border-radius:6px;color:#c6d4df}
      .sse-cart-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0}
      .sse-cart-button,.sse-quick-add{cursor:pointer;border:0;border-radius:3px;padding:7px 10px;background:#27465c;color:#c6e7ff;font-size:12px}
      .sse-cart-button:hover,.sse-quick-add:hover{background:#376782}
      .sse-cart-button:disabled,.sse-quick-add:disabled{opacity:.55;cursor:default}
      .sse-cart-input{box-sizing:border-box;width:100%;min-height:160px;resize:vertical;background:#0f141b;color:#c6d4df;border:1px solid #34465a;border-radius:4px;padding:10px;line-height:1.6}
      .sse-cart-status{white-space:pre-wrap;font-size:12px;color:#67c1f5;margin-top:8px}
      .sse-cart-panel label{font-size:12px}.sse-cart-panel input{accent-color:#67c1f5}
      .sse-quick-add{position:relative;z-index:10;margin:4px;display:inline-block}
      .sse-quick-add.sse-wishlist-cart{position:static;margin:0}
      .sse-wishlist-cart + .sse-wishlist-native-cart{display:none!important}
      .game_purchase_action .sse-native-cart{position:static;margin:0;padding:0;border:0;cursor:pointer;display:inline-block}
      .sse-cart-dialog{position:fixed;inset:0;background:#000b;z-index:2147483646;display:grid;place-items:center;padding:12px}
      .sse-cart-dialog>div{width:min(500px,90vw);max-height:80vh;overflow:auto;background:#1b2838;border:1px solid #34465a;border-radius:6px;padding:18px;color:#c6d4df}
      .sse-cart-dialog h3{color:#e5e5e5;margin-top:0}.sse-cart-dialog .sse-cart-button{display:block;width:100%;margin-top:8px;text-align:left}
    `;
    document.head.appendChild(style);
    const inCartPage = () => initialHost === location.hostname && /^\/cart(?:\/|$)/i.test(location.pathname);
    const nativeReplacements = new Map();
    scope.own(() => {
      for (const [control, native] of nativeReplacements) if (control.isConnected) control.replaceWith(native);
      document.querySelectorAll('.sse-quick-add, #sse-cart-extract, #sse-cart-tools, .sse-cart-dialog, .sse-account-country').forEach(node => node.remove());
      document.querySelectorAll('.sse-wishlist-native-cart').forEach(node => node.classList.remove('sse-wishlist-native-cart'));
      style.remove();
    });
    let contextPromise;
    let busy = false;

    function readContext(doc, globals = {}) {
      const session = readStoreSession(doc, globals);
      return { token: session.token, country: session.country, language: session.language };
    }

    async function context() {
      if (!contextPromise) {
        contextPromise = (async () => {
          let result = readContext(document, page);
          log.debug('session.read', '读取当前页面账号信息', { hasToken: Boolean(result.token), country: result.country });
          if (!result.token || !result.country) {
            log.debug('session.fallback', '从购物车页面补充账号信息');
            const html = await gmGet('https://store.steampowered.com/cart/', { signal: scope.signal });
            const remote = new DOMParser().parseFromString(html, 'text/html');
            const fallback = readContext(remote);
            result = { ...result, token: result.token || fallback.token, country: result.country || fallback.country };
          }
          if (!result.token || !result.country) throw new Error(text('无法读取账号信息，请先登录 Steam 商店并刷新页面。', 'Sign in to the Steam store and refresh this page.'));
          return result;
        })().catch(error => { contextPromise = null; log.error('session.failed', '读取账号信息失败', { error }); throw error; });
      }
      return contextPromise;
    }

    async function account(method, payload) {
      const task = log.begin('api.' + method);
      try {
      const current = await context();
      const url = new URL('https://api.steampowered.com/IAccountCartService/' + method + '/v1/');
      url.searchParams.set('access_token', current.token);
      const options = { method: payload === undefined ? 'GET' : 'POST', signal: scope.signal };
      if (payload !== undefined) options.body = new URLSearchParams({ input_json: JSON.stringify({ user_country: current.country, ...payload }) });
      const { data, headers } = await fetchJson(url.href, options);
      const resultCode = headers?.get('x-eresult');
      if ((resultCode && resultCode !== '1') || (data.response?.result != null && data.response.result !== 1)) {
        throw new Error(text('Steam 拒绝了购物车操作。', 'Steam rejected the cart operation.'));
      }
      if (payload !== undefined && resultCode !== '1' && data.response?.result !== 1) throw invalidResponse('Steam 未确认购物车操作成功');
      const response = validateCartResponse(data, method);
      task.end('购物车接口操作完成');
      return response;
      } catch (error) { task.fail(error); throw error; }
    }

    const itemCache = createAsyncCache({ load: async (key, item) => {
        log.debug('item.fetch', '读取商品购买选项', { item: key });
        const current = await context();
        const field = itemField(item);
        const payload = { ids: [{ [field]: item.id }], context: { language: current.language, country_code: current.country, steam_realm: 1 }, data_request: { include_all_purchase_options: true } };
        const signal = scope.signal;
        const response = JSON.parse(await requestQueue.enqueue(() => gmGet('https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=' + encodeURIComponent(JSON.stringify(payload)), { signal }), { signal }));
        const result = validateStoreItems(response)[0];
        if (!result) throw new Error(text('无法读取商品：', 'Cannot read item: ') + key);
        log.debug('item.ready', '商品购买选项已读取', { item: key });
        return result;
      } });
    scope.own(() => itemCache.clear());
    async function storeItem(item) {
      return itemCache.get(itemKey(item), item);
    }

    function parseItems(input) {
      const items = [];
      const seen = new Set();
      const invalid = [];
      for (const line of input.split(/\r?\n/)) {
        const value = line.split('#')[0].trim();
        if (!value || /^=+/.test(value)) continue;
        const match = value.match(/^(?:https?:\/\/(?:store\.steampowered\.com|steamdb\.info)\/)?(app|a|sub|s|bundle|b)\/(\d+)(?:\/[^\s]*)?\/?(?:\?[^\s]*)?$/i) || value.match(/^()(\d+)$/);
        if (!match || !Number.isSafeInteger(Number(match[2])) || Number(match[2]) <= 0) { invalid.push(value); continue; }
        const type = { '': 'app', a: 'app', app: 'app', s: 'sub', sub: 'sub', b: 'bundle', bundle: 'bundle' }[match[1].toLowerCase()];
        const key = type + '/' + match[2];
        if (!seen.has(key)) { seen.add(key); items.push({ type, id: Number(match[2]) }); }
      }
      log.debug('import.parse', '商品列表解析完成', { valid: items.length, invalid: invalid.length });
      return { items, invalid };
    }

    function optionsFor(item, data) {
      const options = data.purchase_options?.length ? data.purchase_options : data.best_purchase_option ? [data.best_purchase_option] : [];
      return options.filter(option => (option.packageid || option.bundleid) &&
        (item.type === 'app' || (item.type === 'sub' ? Number(option.packageid) === item.id : Number(option.bundleid) === item.id)));
    }

    function chooseOption(options, title = text('选择购买版本', 'Choose an edition')) {
      log.debug('option.open', '等待选择', { options: options.length });
      return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'sse-cart-dialog';
        const panel = document.createElement('div');
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        const heading = document.createElement('h3');
        heading.textContent = title;
        panel.appendChild(heading);
        let dispose;
        const close = value => { log.debug('option.close', value ? '已选择选项' : '已取消选择'); overlay.remove(); window.removeEventListener('keydown', escape); if (dispose) scope.release(dispose); resolve(value); };
        const escape = event => { if (event.key === 'Escape') close(null); };
        for (const option of options) panel.appendChild(button((option.purchase_option_name || '') + ' · ' + (option.formatted_final_price || ''), () => close(option)));
        panel.appendChild(button(text('取消', 'Cancel'), () => close(null)));
        overlay.appendChild(panel);
        overlay.addEventListener('click', event => { if (event.target === overlay) close(null); });
        window.addEventListener('keydown', escape);
        dispose = scope.own(() => close(null));
        document.body.appendChild(overlay);
        panel.querySelector('button').focus();
      });
    }

    async function addOptions(options) {
      const items = options.map(option => ({ ...(option.packageid ? { packageid: option.packageid } : { bundleid: option.bundleid }), flags: { is_gift: false, is_private: false } }));
      if (!items.length) return;
      for (let offset = 0; offset < items.length; offset += 50) await account('AddItemsToCart', { items: items.slice(offset, offset + 50) });
      log.info('add.complete', '已提交加购', { count: items.length });
    }

    function button(label, action) {
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'sse-cart-button';
      element.textContent = label;
      element.addEventListener('click', async event => {
        event.preventDefault();
        event.stopPropagation();
        if (element.disabled) return;
        element.disabled = true;
        const task = log.begin('action', { action: label });
        try { await action(); task.end('操作回调完成', { action: label }); }
        catch (error) { task.fail(error, { action: label }); window.alert(error.message || String(error)); }
        finally { element.disabled = false; }
      });
      return element;
    }

    let cartPanel = null;
    let cartPanelAnchor = null;
    function findCartPanelAnchor() {
      const desktopSummary = document.querySelector('.NKiRqw1jQHg- .i1XZFikuzME-');
      if (desktopSummary && desktopSummary.getClientRects().length > 0 && desktopSummary.getBoundingClientRect().width > 0) return desktopSummary;
      const mobileSummary = document.querySelector('.UUuDEbOJLCU- .i1XZFikuzME-');
      if (mobileSummary && mobileSummary.getClientRects().length > 0 && mobileSummary.getBoundingClientRect().width > 0) return mobileSummary;
      const candidates = new Set();
      document.querySelectorAll('a[href*="checkout.steampowered.com/checkout"]').forEach(link => {
        let container = link.parentElement;
        while (container && container !== document.body) {
          if (container.querySelector('[role="combobox"]')) {
            candidates.add(container);
            break;
          }
          container = container.parentElement;
        }
      });
      const legacy = document.querySelector('._2DjadWLFH3keW9rGWZKxSk._1G8JdfmCwhonn-pZk-tfwP');
      if (legacy) candidates.add(legacy);
      return [...candidates].find(element => element.getClientRects().length > 0 && element.getBoundingClientRect().width > 0) || [...candidates][0] || null;
    }

    function placeCartPanel(panel, anchor) {
      // Keep the Steam right column intact and place the tool immediately below its price card.
      if (anchor.nextElementSibling !== panel) anchor.after(panel);
      cartPanelAnchor = anchor;
      if (panel.style.width !== '100%') panel.style.width = '100%';
    }

    function mountPanel() {
      if (!inCartPage()) return;
      const anchor = findCartPanelAnchor();
      if (!anchor) return;
      if (cartPanel) {
        placeCartPanel(cartPanel, anchor);
        return;
      }
      const panel = document.createElement('section');
      panel.id = 'sse-cart-tools';
      panel.className = 'sse-cart-panel';
      const title = document.createElement('strong');
      title.textContent = text('购物车工具', 'Cart tools');
      const toolbar = document.createElement('div');
      toolbar.className = 'sse-cart-toolbar';
      const input = document.createElement('textarea');
      input.className = 'sse-cart-input';
      input.setAttribute('aria-label', text('购物车导入导出列表', 'Cart import/export list'));
      input.placeholder = text('一行一条，# 后为备注，输入自动保存。\n支持商店 / SteamDB 链接、AppID、app/730、sub/123、bundle/456。', 'One item per line; # starts a comment. Automatically saved.\nStore / SteamDB links, AppIDs, app/730, sub/123, bundle/456.');
      input.value = GM_getValue('fac_cart', '');
      input.addEventListener('input', () => GM_setValue('fac_cart', input.value));
      const status = document.createElement('div');
      status.className = 'sse-cart-status';
      status.setAttribute('role', 'status');
      const save = value => { input.value = value; GM_setValue('fac_cart', value); };
      const checkbox = (label, key) => {
        const wrapper = document.createElement('label');
        const control = document.createElement('input');
        control.type = 'checkbox';
        control.checked = GM_getValue(key, false);
        control.addEventListener('change', () => GM_setValue(key, control.checked));
        wrapper.append(control, document.createTextNode(label));
        return { wrapper, control };
      };
      const importSale = checkbox(text('仅导入打折商品', 'Import discounted only'), 'fac_discount');
      const exportSale = checkbox(text('仅导出打折商品', 'Export discounted only'), 'fac_discount2');
      const run = action => async () => {
        if (busy) return;
        busy = true;
        panel.querySelectorAll('button').forEach(element => { element.disabled = true; });
        status.textContent = text('操作中……', 'Working…');
        try { await action(); }
        catch (error) { log.error('batch.failed', '批量操作失败', { error }); status.textContent = error.message || String(error); }
        finally { busy = false; panel.querySelectorAll('button').forEach(element => { element.disabled = false; }); }
      };
      toolbar.append(button(text('导入', 'Import'), run(async () => {
        log.info('import.start', '开始导入商品列表');
        const parsed = parseItems(input.value);
        if (!parsed.items.length) throw new Error(text('请输入有效的商品链接或 ID。', 'Enter valid item links or IDs.'));
        const selected = [];
        const results = parsed.invalid.map(value => '# ' + value + text('：格式有误', ': invalid format'));
        const seen = new Set();
        for (const [index, item] of parsed.items.entries()) {
          status.textContent = text('读取商品 ', 'Reading item ') + (index + 1) + '/' + parsed.items.length;
          const key = item.type + '/' + item.id;
          try {
            const data = await storeItem(item);
            const option = optionsFor(item, data)[0];
            if (!option) { log.debug('import.skip', '无可购买项目', { item: key }); results.push(key + ' # ' + text('无可购买项目', 'No purchase option')); continue; }
            if (importSale.control.checked && !(Number(option.discount_pct) > 0)) { log.debug('import.skip', '跳过未打折商品', { item: key }); results.push(key + ' # ' + text('未打折，跳过', 'Not discounted, skipped')); continue; }
            const purchaseKey = option.packageid ? 'sub/' + option.packageid : 'bundle/' + option.bundleid;
            if (!seen.has(purchaseKey)) { selected.push(option); seen.add(purchaseKey); }
            results.push(purchaseKey + ' # ' + (option.purchase_option_name || data.name || '') + ' ' + (option.formatted_final_price || ''));
          } catch (error) { log.warn('import.item-failed', '导入项目失败', { item: key, error }); results.push(key + ' # ' + error.message); }
        }
        save(results.join('\n'));
        if (!selected.length) { log.info('import.empty', '没有符合条件的商品'); status.textContent = text('没有符合条件的商品。', 'No matching items.'); return; }
        await addOptions(selected);
        status.textContent = text('已提交加购，请刷新购物车查看结果。', 'Items submitted. Refresh the cart to see the result.');
        log.info('import.complete', '导入完成', { count: selected.length });
      })), importSale.wrapper);
      toolbar.append(button(text('导出', 'Export'), run(async () => {
        log.info('export.start', '开始导出购物车');
        const { cart } = await account('GetCart');
        if (!Array.isArray(cart?.line_items)) throw invalidResponse('购物车列表无效，无法导出。');
        const lines = [];
        for (const item of cart?.line_items || []) {
          const target = { type: item.packageid ? 'sub' : 'bundle', id: Number(item.packageid || item.bundleid) };
          if (!target.id) continue;
          let data;
          try { data = await storeItem(target); }
          catch (error) { log.debug('export.fallback', '商品详情不可用，使用购物车价格', { error }); if (exportSale.control.checked) throw error; }
          const option = data ? optionsFor(target, data)[0] : null;
          if (exportSale.control.checked && !(Number(option?.discount_pct) > 0)) continue;
          lines.push(target.type + '/' + target.id + ' # ' + (option?.purchase_option_name || data?.name || '') + ' ' + (item.price_when_added?.formatted_amount || option?.formatted_final_price || ''));
        }
        if (!lines.length) { log.info('export.empty', '没有符合条件的商品'); status.textContent = text('购物车为空或没有符合条件的商品。', 'Cart is empty or no items match.'); return; }
        const output = '# ' + new Date().toLocaleString() + '\n' + lines.join('\n');
        if (input.value.trim()) {
          const choice = await chooseOption([
            { purchase_option_name: text('覆盖原有内容', 'Replace existing text'), formatted_final_price: '', mode: 'replace' },
            { purchase_option_name: text('追加到末尾', 'Append to existing text'), formatted_final_price: '', mode: 'append' }
          ], text('导出方式', 'Export mode'));
          if (!choice) { log.debug('export.cancel', '已取消导出'); status.textContent = text('已取消。', 'Cancelled.'); return; }
          save(choice.mode === 'append' ? input.value.trimEnd() + '\n' + output : output);
        } else save(output);
        status.textContent = text('导出完成。', 'Export complete.');
        log.info('export.complete', '导出完成', { count: lines.length });
      })), exportSale.wrapper);
      const edit = gift => run(async () => {
        log.info('modify.start', '开始修改购物车用途', { gift });
        let giftInfo = null;
        if (gift) {
          const value = window.prompt(text('输入接收人的 SteamID 或好友代码；留空暂不指定，取消则停止操作。', 'Recipient SteamID or friend code; leave blank to skip recipient, or cancel to stop.'));
          if (value === null) { log.debug('modify.cancel', '已取消修改'); status.textContent = text('已取消。', 'Cancelled.'); return; }
          if (value.trim()) {
            if (!/^\d+$/.test(value.trim())) throw new Error(text('接收人 ID 无效。', 'Invalid recipient ID.'));
            let id = BigInt(value.trim());
            const base = 76561197960265728n;
            if (id > base) id -= base;
            if (id <= 0n || id > 4294967295n) throw new Error(text('接收人 ID 无效。', 'Invalid recipient ID.'));
            const nickname = document.querySelector('#account_pulldown')?.textContent.trim() || '';
            giftInfo = { accountid_giftee: id.toString(), gift_message: { gifteename: id.toString(), message: '', sentiment: '', signature: nickname }, time_scheduled_send: 0 };
          }
        }
        const { cart } = await account('GetCart');
        if (!Array.isArray(cart?.line_items)) throw invalidResponse('购物车列表无效，未执行修改。');
        const items = cart?.line_items || [];
        for (const [index, item] of items.entries()) {
          await account('ModifyLineItem', { line_item_id: item.line_item_id, gift_info: giftInfo, flags: { is_gift: gift, is_private: false } });
          status.textContent = (index + 1) + '/' + items.length;
          log.debug('modify.progress', '已修改购物车项目', { index: index + 1, total: items.length });
        }
        status.textContent = text('修改完成，请刷新购物车查看结果。', 'Updated. Refresh the cart to see the result.');
        log.info('modify.complete', '购物车用途修改完成', { count: items.length, gift });
      });
      toolbar.append(button(text('转送礼', 'Set as gift'), edit(true)), button(text('转自用', 'Set for myself'), edit(false)));
      const bottom = document.createElement('div');
      bottom.className = 'sse-cart-toolbar';
      bottom.append(
        button(text('复制', 'Copy'), async () => { await GM_setClipboard(input.value, 'text'); status.textContent = text('已复制。', 'Copied.'); }),
        button(text('清除文本', 'Clear text'), () => { if (window.confirm(text('清除文本框和已保存的列表？', 'Clear the text and saved list?'))) save(''); }),
        button(text('重新读取', 'Reload saved text'), () => { if (window.confirm(text('重新读取保存的列表？', 'Reload the saved list?'))) input.value = GM_getValue('fac_cart', ''); }),
        button(text('购物车历史', 'Cart history'), () => { location.href = 'https://help.steampowered.com/accountdata/ShoppingCartHistory'; }),
        button(text('刷新购物车', 'Refresh cart'), () => location.reload()),
        button(text('清空购物车', 'Empty cart'), run(async () => {
          if (!window.confirm(text('确定移除购物车中的所有商品？', 'Remove every item from the cart?'))) { status.textContent = text('已取消。', 'Cancelled.'); return; }
          await account('DeleteCart', {});
          log.info('clear.complete', '购物车已清空');
          location.reload();
        }))
      );
      panel.append(title, toolbar, input, bottom, status);
      cartPanel = panel;
      placeCartPanel(panel, anchor);
      log.debug('panel.mount', '购物车工具面板已挂载');
    }

    const quickSelector = PAGE_ADAPTERS.quick.rows;
    function scanQuickButtons(rows = document.querySelectorAll(quickSelector)) {
      if (initialHost === location.hostname && !inCartPage() && document.querySelector(quickSelector) && !document.getElementById('sse-cart-extract')) {
        const host = document.querySelector('.wishlist_header, #search_results, .home_tabs_content, .page_content, main');
        if (host) {
          const extract = button(text('提取当前已加载商品', 'Extract loaded items'), () => {
            const keys = new Set();
            document.querySelectorAll(quickSelector).forEach(row => {
              const item = inferItemFromScope(row);
              if (item) keys.add((item.type === 'package' ? 'sub' : item.type) + '/' + item.id);
            });
            if (!keys.size) return;
            if (GM_getValue('fac_cart', '').trim() && !window.confirm(text('用当前商品列表覆盖已保存的文本？', 'Replace the saved text with these items?'))) return;
            GM_setValue('fac_cart', [...keys].join('\n'));
            log.info('extract.complete', '已提取当前页面商品', { count: keys.size });
            window.alert(text('已保存商品列表，可前往购物车批量导入。', 'List saved. Open the cart to import it.'));
          });
          extract.id = 'sse-cart-extract';
          host.prepend(extract);
        }
      }
      let mounted = 0;
      rows.forEach(row => {
        const wishlistRow = row.matches('.wishlist_row, [data-rfd-draggable-id^="WishlistItem-"]');
        const existing = row.querySelector('.sse-quick-add');
        if (existing) {
          if (wishlistRow) {
            const native = findWishlistCartButton(row);
            if (native) {
              const alreadyInCart = isInCartButton(native);
              existing.disabled = alreadyInCart;
              const label = existing.querySelector('span') || existing;
              label.textContent = alreadyInCart ? text('✓ 已在购物车中', '✓ In cart') : text('＋ 加入购物车', '＋ Add to cart');
            }
            placeWishlistCartButton(row, existing);
          }
          return;
        }
        const inferred = inferItemFromScope(row);
        if (!inferred) return;
        const item = { type: inferred.type === 'package' ? 'sub' : inferred.type, id: Number(inferred.id) };
        if (!Number.isSafeInteger(item.id) || item.id <= 0) return;
        const purchaseRow = row.matches('.game_purchase_action');
        const nativeButton = purchaseRow ? row.querySelector('a[href*="addToCart"], a[onclick*="addToCart"], button[onclick*="addToCart"], a[href*="addBundleToCart"], a[onclick*="addBundleToCart"], button[onclick*="addBundleToCart"], a.btn_addtocart, button.btn_addtocart') || findWishlistCartButton(row) : null;
        if (purchaseRow && !nativeButton) return;
        const alreadyInCart = isInCartButton(nativeButton || (wishlistRow ? findWishlistCartButton(row) : null));
        const control = button(alreadyInCart ? text('✓ 已在购物车中', '✓ In cart') : text('＋ 加入购物车', '＋ Add to cart'), async () => {
          const currentItem = inferItemFromScope(row);
          if (!currentItem) return;
          const target = { type: currentItem.type === 'package' ? 'sub' : currentItem.type, id: Number(currentItem.id) };
          const options = optionsFor(target, await storeItem(target));
          if (!options.length) throw new Error(text('未找到可购买版本，可能尚未发行、免费或受地区限制。', 'No purchase options: unreleased, free, or region restricted.'));
          const chosen = options.length === 1 ? options[0] : await chooseOption(options);
          if (!chosen) { log.debug('quick-add.cancel', '已取消加购'); return; }
          await addOptions([chosen]);
          const label = control.querySelector('span') || control;
          label.textContent = text('✓ 已提交加购', '✓ Submitted');
          const cartButton = document.getElementById('store_header_cart_btn');
          if (cartButton) cartButton.style.display = '';
        });
        control.classList.add('sse-quick-add');
        control.disabled = alreadyInCart;
        if (nativeButton) {
          control.className = nativeButton.className + ' sse-quick-add sse-native-cart';
          const label = document.createElement('span');
          label.textContent = alreadyInCart ? text('已在购物车中', 'In Cart') : text('加入购物车', 'Add to Cart');
          control.replaceChildren(label);
          // Keep purchase IDs available after replacing the native button.
          control.setAttribute(item.type === 'bundle' ? 'data-ds-bundleid' : item.type === 'sub' ? 'data-ds-packageid' : 'data-ds-appid', String(item.id));
          nativeButton.replaceWith(control);
          nativeReplacements.set(control, nativeButton);
        } else if (!wishlistRow || !placeWishlistCartButton(row, control)) {
          row.appendChild(control);
        }
        mounted++;
      });
      if (mounted) log.debug('quick-add.mount', '已挂载快速加购按钮', { count: mounted });
    }
    createDomScanner({ scope, selector: quickSelector + ',' + PAGE_ADAPTERS.cart.anchors, process: nodes => {
      if (nodes.some(node => node.matches(PAGE_ADAPTERS.cart.anchors))) mountPanel();
      scanQuickButtons(nodes.filter(node => node.matches(quickSelector)));
    }, name: 'cart', attributes: ITEM_ATTRIBUTES,
      removed: nodes => {
        for (const node of nodes) {
          const candidates = [node, ...(node.querySelectorAll?.('.sse-native-cart') || [])];
          for (const control of candidates) {
            const native = nativeReplacements.get(control);
            if (native && !control.isConnected && control.parentNode) {
              control.replaceWith(native);
              nativeReplacements.delete(control);
            } else if (native && !control.isConnected) nativeReplacements.delete(control);
          }
        }
      } });
    log.debug('observer.ready', '购物车动态节点监听已启用');
    let resizePending = false;
    scope.listen(window, 'resize', () => {
      if (resizePending) return;
      resizePending = true;
      scope.timeout(() => { resizePending = false; mountPanel(); }, 150);
    }, { passive: true });
    mountPanel();
    if (GM_getValue('sse_cart_country', false)) context().then(current => {
      const host = document.querySelector('#header_wallet_ctn');
      if (host && !host.querySelector('.sse-account-country')) {
        const label = document.createElement('span');
        label.className = 'sse-account-country';
        label.textContent = ' [' + current.country + ']';
        host.appendChild(label);
      }
    }).catch(error => log.warn('country.failed', '读取账号地区失败', { error }));
  }

  // ---- friend-tools.js ----
  function initializeFriendTools() {
    const log = diagnostics.scope('friends');
    if (location.hostname !== 'steamcommunity.com' || !/\/friends\/?$/i.test(location.pathname)) {
      log.debug('initialize.skip', '当前页面不启用好友工具'); return;
    }
    log.info('initialize', '留言、分组与统计已启用');
    const scope = createFeatureScope('friends');

    const ROOT_ID = 'sse-friend-tools';
    const style = document.createElement('style');
    style.textContent = `
      #${ROOT_ID}{box-sizing:border-box;clear:both;width:100%;margin:12px 0;padding:16px;background:#171a21;border:1px solid #456078;border-radius:6px;color:#c6d4df;font:13px/1.5 Arial,sans-serif}
      #${ROOT_ID} .sse-friend-tabs{display:flex;gap:8px;border-bottom:1px solid #34465a;margin-bottom:14px;padding-bottom:8px}#${ROOT_ID} [role=tab][aria-selected=true]{color:#fff;background:#356583}#${ROOT_ID} [hidden]{display:none!important}
      #search_results .sse-friend-select{position:absolute;right:8px;top:8px;z-index:5;width:18px;height:18px;accent-color:#67c1f5;cursor:pointer}
      #${ROOT_ID} h2{flex:none;font-size:15px;margin:0 0 6px;color:#fff}#${ROOT_ID} .sse-friend-description{flex:none;margin-bottom:8px;color:#acb2b8}#${ROOT_ID} textarea{box-sizing:border-box;width:100%;min-height:72px;resize:vertical;padding:8px;background:#0f141b;border:1px solid #34465a;border-radius:3px;color:#fff;font:inherit}
      #${ROOT_ID} .sse-friend-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}#${ROOT_ID} button{border:0;border-radius:3px;padding:7px 10px;background:#27465c;color:#d8efff;cursor:pointer}#${ROOT_ID} button:disabled{opacity:.5;cursor:default}
      #${ROOT_ID} .sse-friend-groups{flex:none;padding:8px;border-top:1px solid #34465a;border-bottom:1px solid #34465a}#${ROOT_ID} .sse-friend-groups strong{display:block;margin-bottom:4px;color:#fff}#${ROOT_ID} .sse-friend-groups input,#${ROOT_ID} .sse-friend-groups select{box-sizing:border-box;max-width:100%;min-width:0;padding:6px;background:#0f141b;border:1px solid #34465a;color:#d7e8f2}#${ROOT_ID} .sse-friend-groups [role=status]{margin-top:4px}
      #${ROOT_ID} .sse-friend-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:8px 0;padding:8px 0;border-block:1px solid #34465a}#${ROOT_ID} .sse-friend-stat{min-width:0;color:#acb2b8;font-size:11px}#${ROOT_ID} .sse-friend-stat strong{display:block;color:#d7e8f2;font-size:16px}
      #${ROOT_ID} [role=status]{flex:none;display:block;min-height:24px;max-height:120px;overflow:auto;margin-top:8px;padding:7px;background:#0f141b;border-left:3px solid #67c1f5;white-space:pre-wrap;color:#d7e8f2;font-size:12px}
      #manage_friends.manage_friends_panel{box-sizing:border-box;width:100%;margin:12px 0;padding:16px;background:#171a21;border:1px solid #456078;border-radius:6px;color:#c6d4df;font:13px/1.5 Arial,sans-serif}
      #manage_friends.manage_friends_panel>.row{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:0;padding:6px 0}#manage_friends.manage_friends_panel .row>.row{display:inline-flex;align-items:center;flex-wrap:wrap;gap:8px}
      #manage_friends .dimmed{color:#acb2b8}#manage_friends .selection_type{display:inline-block;margin:0;padding:4px 9px;background:#27465c;border-radius:3px;color:#d8efff;cursor:pointer}#manage_friends .selection_type a{color:inherit;text-decoration:none}#manage_friends .selection_type:hover{background:#356583;color:#fff}
      #manage_friends .manage_friend_actions_ctn{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:0}#manage_friends .manage_action.btnv6_lightblue_blue{box-sizing:border-box;display:inline-flex;align-items:center;margin:0;padding:7px 10px;border:0;border-radius:3px;background:#27465c;color:#d8efff!important;font:13px/1.5 Arial,sans-serif;text-transform:none;box-shadow:none;cursor:pointer}#manage_friends .manage_action.btnv6_lightblue_blue>span{padding:0;background:none;color:inherit;font:inherit}#manage_friends .manage_action.btnv6_lightblue_blue:hover{background:#356583;color:#fff!important}#manage_friends .manage_action .ttip{color:#9ed8f5}
      #manage_friends .selected_msg{margin:0;padding:5px 8px;border-radius:3px;background:#0f141b;color:#d7e8f2}#manage_friends .selected_msg.error{color:#f29b9b}#manage_friends #selected_count{font-weight:bold;color:#67c1f5}#manage_friends .hidden{display:none!important}
    `;
    document.head.appendChild(style);
    scope.own(() => style.remove());

    const root = createElement('section');
    root.id = ROOT_ID;
    root.setAttribute('aria-label', '好友批量留言');
    const title = createElement('h2', '好友批量留言');
    const description = createElement('div', '勾选下方已加载的好友，向其个人主页发送评论。', 'sse-friend-description');
    const stats = createElement('div', undefined, 'sse-friend-stats');
    const statItems = ['已加载好友', '在线好友', '自定义分组'];
    const statValues = statItems.map(label => {
      const item = createElement('div', undefined, 'sse-friend-stat');
      item.append(createElement('span', label), createElement('strong', '0'));
      stats.appendChild(item);
      return item.lastElementChild;
    });
    const groupSection = createElement('div', undefined, 'sse-friend-groups');
    const groupHeading = createElement('strong', '自定义好友分组');
    const groupControls = createElement('div', undefined, 'sse-friend-actions');
    const groupName = createElement('input');
    groupName.type = 'text';
    groupName.maxLength = 40;
    groupName.placeholder = '新分组名称';
    groupName.setAttribute('aria-label', '新分组名称');
    const createGroup = createElement('button', '创建分组');
    createGroup.type = 'button';
    const groupSelect = createElement('select');
    groupSelect.setAttribute('aria-label', '选择分组');
    const addToGroup = createElement('button', '将已选好友加入分组');
    addToGroup.type = 'button';
    const removeFromGroup = createElement('button', '从分组移除已选好友');
    removeFromGroup.type = 'button';
    const deleteGroup = createElement('button', '删除分组');
    deleteGroup.type = 'button';
    groupControls.append(groupName, createGroup, groupSelect, addToGroup, removeFromGroup, deleteGroup);
    const groupList = createElement('div', undefined, 'sse-friend-actions');
    const groupStatus = createElement('div');
    groupStatus.setAttribute('role', 'status');
    groupSection.append(groupHeading, groupControls, groupList, groupStatus);
    const message = createElement('textarea');
    message.placeholder = '输入要发送的评论';
    message.setAttribute('aria-label', '评论内容');
    const selectionCount = createElement('span', '已选 0 位');
    const actions = createElement('div', undefined, 'sse-friend-actions');
    const send = createElement('button', '发送给已选好友');
    send.type = 'button';
    const status = createElement('div');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = '就绪。勾选好友并填写评论后发送。';
    actions.append(send);
    const tabs = createElement('div', undefined, 'sse-friend-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', '好友工具');
    const commentPanel = createElement('div');
    commentPanel.append(message, actions, status);
    const statsPanel = createElement('div');
    statsPanel.append(createElement('div', '仅统计当前页面已加载的好友。'), stats);
    const panels = [commentPanel, groupSection, statsPanel];
    const labels = ['留言', '留言设置', '数据分析'];
    for (let index = 0; index < panels.length; index++) {
      const panel = panels[index];
      const tab = createElement('button', labels[index]);
      tab.type = 'button';
      tab.id = `${ROOT_ID}-tab-${index}`;
      panel.id = `${ROOT_ID}-panel-${index}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      tab.setAttribute('aria-selected', String(index === 0));
      panel.hidden = index !== 0;
      tab.addEventListener('click', () => {
        log.debug('tabs.select', '切换好友工具标签', { tab: labels[index] });
        panels.forEach((item, position) => {
          item.hidden = position !== index;
          tabs.children[position].setAttribute('aria-selected', String(position === index));
        });
      });
      tabs.appendChild(tab);
    }
    root.append(title, description, selectionCount, tabs, ...panels);
    const managePanel = document.querySelector('#manage_friends');
    const nativeList = document.querySelector('#search_results');
    if (managePanel) managePanel.after(root);
    else if (nativeList) nativeList.before(root);
    else { log.warn('panel.missing', '未找到好友管理面板或好友列表'); return; }
    log.debug('panel.mount', '好友工具已挂载', { nativeManagement: Boolean(managePanel) });
    scope.own(() => root.remove());

    // Steam only adds `.selectable` while its native management mode is active.
    // Scan stable identity-bearing friend cards so normal mode remains selectable too.
    const getFriendRows = () => [...document.querySelectorAll('#search_results [data-steamid]')]
      .filter(row => /^\d{17}$/.test(row.dataset.steamid || ''));
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    const accountId = String(page.g_steamID || page.UserConfig?.steamid || 'anonymous');
    const GROUP_STORAGE_KEY = `sse_friend_groups_v1_${accountId}`;
    let groups = GM_getValue(GROUP_STORAGE_KEY, {});
    if (!groups || typeof groups !== 'object' || Array.isArray(groups)) groups = {};
    log.debug('groups.load', '本地分组已加载', { count: Object.keys(groups).length });

    function saveGroups() { GM_setValue(GROUP_STORAGE_KEY, groups); log.debug('groups.save', '本地分组已保存', { count: Object.keys(groups).length }); }
    function renderGroups() {
      const selectedGroup = groupSelect.value;
      groupSelect.replaceChildren(createElement('option', '选择分组'));
      for (const name of Object.keys(groups)) {
        const option = createElement('option', name);
        option.value = name;
        groupSelect.appendChild(option);
      }
      if (groups[selectedGroup]) groupSelect.value = selectedGroup;
      groupList.replaceChildren();
      for (const [name, members] of Object.entries(groups)) {
        const item = createElement('div', `${name} (${members.length})`);
        item.title = members.join(', ');
        groupList.appendChild(item);
      }
    }
    function renderFriends() {
      const friends = getFriendRows();
      log.debug('friends.scan', '扫描已加载好友', { count: friends.length });
      for (const friend of friends) {
        const steamId = friend.dataset.steamid;
        const name = friend.querySelector('.friend_block_content')?.textContent.trim().split('\n')[0] || steamId;
        const nativeCheckbox = friend.querySelector('.select_friend_checkbox');
        let checkbox = friend.querySelector('.sse-friend-select');
        if (isCheckboxVisible(nativeCheckbox)) {
          checkbox?.remove();
          checkbox = nativeCheckbox;
        } else if (!checkbox) {
          checkbox = createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'sse-friend-select';
          if (window.getComputedStyle?.(friend).position === 'static') friend.style.position = 'relative';
          checkbox.addEventListener('click', event => event.stopPropagation());
          friend.appendChild(checkbox);
        }
        checkbox.setAttribute('aria-label', `选择 ${name}`);
      }
      description.textContent = '勾选要发送评论的好友。';
      updateSelectionCount();
      updateFriendStats();
    }
    function updateFriendStats() {
      const friends = getFriendRows();
      const online = friends.filter(friend => /online|state_online/i.test(`${friend.className} ${friend.querySelector('.friend_block_status')?.className || ''}`)).length;
      statValues[0].textContent = String(friends.length);
      statValues[1].textContent = String(online);
      statValues[2].textContent = String(Object.keys(groups).length);
      log.debug('statistics.update', '好友统计已更新', { loaded: friends.length, online, groups: Object.keys(groups).length });
    }
    function updateSelectionCount() {
      selectionCount.textContent = `已选 ${getSelectedFriends().length} 位`;
      log.debug('selection.update', '好友选择已更新', { selected: getSelectedFriends().length });
    }
    function isCheckboxVisible(checkbox) {
      if (!checkbox || checkbox.hidden) return false;
      const style = window.getComputedStyle?.(checkbox);
      if (style && (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0)) return false;
      return typeof checkbox.getClientRects !== 'function' || checkbox.getClientRects().length > 0;
    }
    function checkboxFor(friend) {
      const nativeCheckbox = friend.querySelector('.select_friend_checkbox');
      return isCheckboxVisible(nativeCheckbox) ? nativeCheckbox : friend.querySelector('.sse-friend-select');
    }
    const getSelectedFriends = () => {
      return getFriendRows().filter(row => checkboxFor(row)?.checked);
    };
    const getSessionId = () => {
      const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
      return page.g_sessionID || document.querySelector('input[name="sessionid"]')?.value || '';
    };

    renderFriends();
    renderGroups();
    const friendList = document.querySelector('#search_results');
    if (friendList) {
      scope.listen(friendList, 'change', updateSelectionCount);
      let refreshTimer = null;
      const observer = new MutationObserver(() => {
        if (refreshTimer) return;
        refreshTimer = scope.timeout(() => {
          refreshTimer = null;
          renderFriends();
        }, 250);
      });
      observer.observe(friendList, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-steamid'] });
      scope.own(() => observer.disconnect());
      log.debug('observer.ready', '好友列表动态监听已启用');
    }
    createGroup.addEventListener('click', () => {
      const name = groupName.value.trim();
      if (!name) { groupStatus.textContent = '请输入分组名称。'; groupName.focus(); return; }
      if (groups[name]) { groupStatus.textContent = '该分组已存在。'; return; }
      groups[name] = [];
      groupName.value = '';
      saveGroups();
      renderGroups();
      updateFriendStats();
      groupSelect.value = name;
      groupStatus.textContent = `已创建分组“${name}”。`;
      log.info('groups.create', '已创建本地分组');
    });
    addToGroup.addEventListener('click', () => {
      const name = groupSelect.value;
      const friends = getSelectedFriends();
      if (!groups[name]) { groupStatus.textContent = '请先选择一个分组。'; return; }
      if (!friends.length) { groupStatus.textContent = '请先勾选要加入分组的好友。'; return; }
      const members = new Set(groups[name]);
      for (const friend of friends) members.add(friend.dataset.steamid);
      groups[name] = [...members];
      saveGroups();
      renderGroups();
      updateFriendStats();
      groupSelect.value = name;
      groupStatus.textContent = `已将 ${friends.length} 位好友加入“${name}”。`;
      log.info('groups.add', '已加入本地分组', { count: friends.length });
    });
    removeFromGroup.addEventListener('click', () => {
      const name = groupSelect.value;
      const friends = getSelectedFriends();
      if (!groups[name]) { groupStatus.textContent = '请先选择一个分组。'; return; }
      if (!friends.length) { groupStatus.textContent = '请先勾选要移出分组的好友。'; return; }
      const selectedIds = new Set(friends.map(friend => friend.dataset.steamid));
      const before = groups[name].length;
      groups[name] = groups[name].filter(id => !selectedIds.has(id));
      saveGroups();
      renderGroups();
      updateFriendStats();
      groupSelect.value = name;
      groupStatus.textContent = `已从“${name}”移除 ${before - groups[name].length} 位好友。`;
      log.info('groups.remove', '已从本地分组移除好友', { count: before - groups[name].length });
    });
    deleteGroup.addEventListener('click', () => {
      const name = groupSelect.value;
      if (!groups[name]) { groupStatus.textContent = '请先选择一个分组。'; return; }
      if (!window.confirm(`确定删除好友分组“${name}”？`)) return;
      delete groups[name];
      saveGroups();
      renderGroups();
      updateFriendStats();
      groupStatus.textContent = `已删除分组“${name}”。`;
      log.info('groups.delete', '已删除本地分组');
    });

    send.addEventListener('click', async () => {
      const friends = getSelectedFriends();
      const comment = message.value.trim();
      const sessionId = getSessionId();
      if (!friends.length) { log.debug('comments.validate', '未选择好友'); status.textContent = '请先在 Steam 好友列表中选择至少一位好友。'; return; }
      if (!comment) { log.debug('comments.validate', '未填写评论'); status.textContent = '请输入评论内容。'; message.focus(); return; }
      if (new TextEncoder().encode(comment).length > 1000) { log.warn('comments.validate', '评论超出字节限制'); status.textContent = '评论超过 Steam 的 1000 字节限制。'; return; }
      if (!sessionId) { log.warn('comments.validate', '未读取到 Steam 会话'); status.textContent = '未能读取 Steam 会话，请刷新好友页面后重试。'; return; }
      if (!window.confirm(`将向 ${friends.length} 位已选好友的个人主页发送相同评论。此操作无法撤回，继续吗？`)) { log.debug('comments.cancel', '用户取消批量留言'); return; }

      send.disabled = true;
      const task = log.begin('comments.send', { count: friends.length }, 'info');
      status.textContent = `已确认，准备向 ${friends.length} 位好友发送……`;
      const results = [];
      try {
        for (let index = 0; index < friends.length; index++) {
          if (!scope.active) break;
          const friend = friends[index];
          const steamId = friend.dataset.steamid;
          const name = friend.querySelector('.friend_block_content')?.textContent.trim().split('\n')[0] || steamId;
          status.textContent = `正在处理 ${index + 1}/${friends.length}：${name}`;
          try {
          task.debug('request', '开始发送留言', { index: index + 1, total: friends.length });
          const body = new URLSearchParams({ comment, count: '6', sessionid: sessionId });
          const { data: result } = await fetchJson(`/comment/Profile/post/${steamId}/-1/`, {
            method: 'POST', credentials: 'same-origin',
            signal: scope.signal,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body
          });
          if (![true, 1, '1'].includes(result?.success)) throw new Error(result?.error || 'Steam 未确认留言成功');
          results.push(`已发送 ${name}`);
          task.debug('sent', '留言发送成功', { index: index + 1, total: friends.length });
          } catch (error) {
            if (!scope.active) break;
            task.warn('failed', '留言发送失败', { index: index + 1, error });
            results.push(`发送失败 ${name}：${error.message || '请求失败'}`);
          }
          status.textContent = `${index + 1}/${friends.length}\n${results.slice(-5).join('\n')}`;
          if (scope.active && index + 1 < friends.length) {
            task.debug('interval', '等待下一次发送', { delayMs: 4000 });
            if (!await scope.wait(4000)) break;
          }
        }
        status.textContent = `处理完成：${results.filter(result => result.startsWith('已发送')).length} 成功，${results.filter(result => result.startsWith('发送失败')).length} 失败。\n${results.join('\n')}`;
        task.end('批量留言处理完成', { success: results.filter(result => result.startsWith('已发送')).length, failed: results.filter(result => result.startsWith('发送失败')).length });
      } catch (error) {
        task.fail(error);
        status.textContent = `批量发送中断：${error.message || String(error)}`;
      } finally {
        send.disabled = false;
      }
    });
  }

  // ---- restrictions/database.js ----
  const RESTRICTION_SOURCES = [
    { id: 'github', url: ref => `https://raw.githubusercontent.com/F1NN1ER/getSteamRestrictedGameLIst/${ref}/data/fulllist.json` },
    { id: 'jsdelivr', url: ref => `https://cdn.jsdelivr.net/gh/F1NN1ER/getSteamRestrictedGameLIst@${ref}/data/fulllist.json` },
    { id: 'jsdelivr-fastly', url: ref => `https://fastly.jsdelivr.net/gh/F1NN1ER/getSteamRestrictedGameLIst@${ref}/data/fulllist.json` }
  ];

  async function restrictionRequest(url, { probe = false, timeout = probe ? 6000 : 60000, signal } = {}) {
    const started = Date.now();
    const response = await gmRequest(url, { anonymous: true, probe, timeout, signal });
    return { text: response.responseText, ms: Date.now() - started };
  }

  function parseRestrictionDatabase(text) {
    const rows = JSON.parse(text);
    if (!Array.isArray(rows) || !rows.length) throw new Error('受限数据库为空或格式错误');
    const result = new Map();
    for (const row of rows) {
      if (!Number.isSafeInteger(row?.appid) || row.appid <= 0 ||
          !Number.isInteger(row.status) || row.status < 0 || row.status > 3 || result.has(row.appid)) {
        throw new Error('受限数据库存在无效记录');
      }
      result.set(row.appid, row.status);
    }
    return result;
  }

  function createRestrictionDatabase({ read, write, request = restrictionRequest, now = () => Date.now(), sources = RESTRICTION_SOURCES, signal }) {
    const log = diagnostics.scope('restrictions.database');
    const key = 'sse_restrictions_database_v1';
    const ttl = 24 * 60 * 60 * 1000;
    let pending;
    let memory;
    let hydrated = false;
    let updated = 0;
    let retryAt = 0;
    const listeners = new Set();

    async function load() {
      if (signal?.aborted) return memory;
      if (!hydrated) {
        hydrated = true;
        let cached;
        try {
          cached = read(key);
          if (cached?.version === 1 && Array.isArray(cached.rows)) {
            memory = parseRestrictionDatabase(JSON.stringify(cached.rows.map(([appid, status]) => ({ appid, status }))));
            updated = Number.isFinite(cached.updated) && cached.updated <= now() ? cached.updated : 0;
          }
        } catch (error) { log.warn('cache.invalid', '受限数据库缓存不可用', { error }); memory = undefined; }
      }
      if (memory && now() - updated < ttl) return memory;
      if (now() < retryAt) return memory;
      if (!pending) pending = refresh().finally(() => { pending = null; });
      // Keep titles usable while an expired database is refreshed in the background.
      return memory || pending;
    }

    async function refresh() {
        // Pin mirrors to the latest commit so CDN branch-cache latency cannot select older data.
        let ref = 'main';
        try {
          const response = await request('https://api.github.com/repos/F1NN1ER/getSteamRestrictedGameLIst/commits?path=data/fulllist.json&per_page=1', { timeout: 8000, signal });
          const commits = JSON.parse(response.text);
          if (/^[a-f0-9]{40}$/.test(commits?.[0]?.sha || '')) ref = commits[0].sha;
        } catch (error) { log.debug('revision.fallback', '无法确认最新提交，使用主分支', { error }); }
        if (signal?.aborted) return memory;
        const task = log.begin('refresh', { revision: ref }, 'info');
        const measured = await Promise.all(sources.map(async source => {
          const url = source.url(ref);
          try {
            const probe = await request(url, { probe: true, signal });
            log.debug('source.probe', '数据源测速完成', { source: source.id, ms: probe.ms });
            return { source, url, ms: probe.ms };
          } catch (error) {
            log.debug('source.unavailable', '数据源测速失败', { source: source.id, error });
            return { source, url, ms: Infinity };
          }
        }));
        measured.sort((a, b) => a.ms - b.ms);
        for (const candidate of measured) {
          try {
            if (signal?.aborted) { task.end('数据库刷新已取消'); return memory; }
            task.debug('download', '下载受限数据库', { source: candidate.source.id, probeMs: candidate.ms });
            const response = await request(candidate.url, { signal });
            if (signal?.aborted) { task.end('数据库刷新已取消'); return memory; }
            const data = parseRestrictionDatabase(response.text);
            memory = data;
            updated = now();
            retryAt = 0;
            // One fixed storage key replaces the whole snapshot, including removed AppIDs.
            try { write(key, { version: 1, updated, source: candidate.source.id, revision: ref, rows: [...data] }); }
            catch (error) { task.warn('cache.write', '数据库已加载，但无法保存本地缓存', { error }); }
            task.end('受限数据库已更新', { source: candidate.source.id, count: data.size, downloadMs: response.ms });
            for (const listener of listeners) {
              try { listener(); } catch (error) { log.warn('refresh.notify', '数据库更新通知失败', { error }); }
            }
            return data;
          } catch (error) { task.warn('download.failed', '数据源失败，尝试下一个来源', { source: candidate.source.id, error }); }
        }
        task.fail(new Error('所有受限数据库来源均不可用'));
        if (memory) log.warn('cache.stale', '暂用上次成功下载的数据库');
        retryAt = now() + 15 * 60 * 1000;
        return memory;
    }
    return { load, subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); } };
  }

  // ---- restrictions/steam.js ----
  function parseSteamRestriction(doc, appid) {
    // Age checks, redirects, regional error pages and partial responses are not proof of normality.
    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
      doc.querySelector('meta[property="og:url"]')?.getAttribute('content');
    if (canonical && !new RegExp(`/app/${appid}(?:/|$|\\?)`).test(canonical)) return null;
    if (!doc.querySelector('#appHubAppName') || !doc.querySelector('#game_area_features, .game_area_details_specs')) return null;
    const limited = doc.querySelectorAll('.game_area_details_specs_ctn.learning_about');
    for (const element of limited) {
      const label = element.querySelector('.label')?.textContent || element.textContent;
      if (/Profile Features Limited|个人资料功能受限|個人檔案功能受限|个人资料受限/i.test(label)) return 2;
    }
    if (limited.length) return 1;
    return 0;
  }

  function createSteamRestrictionLookup({ read, write, signal, request = url => gmGet(url, { signal }), parse = (html, id) =>
    parseSteamRestriction(new DOMParser().parseFromString(html, 'text/html'), id), now = () => Date.now(),
    wait = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
    const log = diagnostics.scope('restrictions.steam');
    const key = 'sse_restrictions_steam_v1';
    const controlKey = 'sse_restrictions_steam_requests_v1';
    const queue = new RequestQueue(1);
    const pending = new Map();
    const attempted = new Map();
    let cache;
    try { cache = read(key); } catch (_) {}
    if (!cache || typeof cache !== 'object' || Array.isArray(cache)) cache = {};
    let control = {};
    function readControl() {
      try { control = { ...control, ...read(controlKey) }; } catch (_) {}
      return control;
    }
    function saveControl(value) {
      control = value;
      try { write(controlKey, control); } catch (error) { log.warn('throttle.save', '请求限速状态保存失败', { error }); }
    }
    function failed(blocked = false) {
      const failures = (Number(readControl().failures) || 0) + 1;
      const delay = blocked || failures >= 3 ? Math.min(60, 15 * Math.pow(2, Math.min(failures - 1, 2))) * 60 * 1000 : 0;
      saveControl({ ...control, failures, cooldownUntil: now() + delay });
      if (delay) log.warn('throttle.cooldown', 'Steam 补查暂停，等待冷却', { failures, retryAt: control.cooldownUntil });
    }
    async function lookup(appid) {
      if (!Number.isSafeInteger(appid) || appid <= 0) return null;
      // Merge other tabs' successful lookups; confirmed results have no expiry or size cap.
      try { cache = { ...cache, ...read(key) }; } catch (_) {}
      const saved = cache[appid];
      if ([0, 1, 2].includes(saved?.status)) return saved.status;
      if (pending.has(appid)) return pending.get(appid);
      const attempt = attempted.get(appid);
      if (attempt && now() < attempt.retryAt) return null;
      const run = async () => {
        if (signal?.aborted) return null;
        try { cache = { ...cache, ...read(key) }; } catch (_) {}
        if ([0, 1, 2].includes(cache[appid]?.status)) return cache[appid].status;
        if (now() < (readControl().cooldownUntil || 0)) return null;
        const delay = Math.max(0, (control.nextAt || 0) - now());
        if (delay) await wait(delay);
        if (signal?.aborted) return null;
        if (now() < (readControl().cooldownUntil || 0)) return null;
        saveControl({ ...control, nextAt: now() + 4000 });
        const task = log.begin('lookup', { appid });
        try {
          const html = await request(`https://store.steampowered.com/app/${appid}/?l=english`);
          const status = parse(html, appid);
          if (![0, 1, 2].includes(status)) {
            task.cancel('Steam 页面无法确认状态', { appid });
            attempted.set(appid, { retryAt: now() + 15 * 60 * 1000 });
            failed();
            return null;
          }
          try { cache = { ...cache, ...read(key) }; } catch (_) {}
          cache[appid] = { status, updated: now() };
          try { write(key, cache); } catch (error) { task.warn('cache.write', 'Steam 状态缓存保存失败', { error }); }
          saveControl({ ...control, failures: 0, cooldownUntil: 0 });
          attempted.delete(appid);
          task.end('Steam 状态读取完成', { appid, status });
          return status;
        } catch (error) {
          if (signal?.aborted) { task.cancel('页面已离开'); return null; }
          task.fail(error);
          failed([403, 429].includes(error?.status) || /HTTP (403|429)\b/.test(error?.message || ''));
          attempted.set(appid, { retryAt: now() + 15 * 60 * 1000 });
          return null;
        }
      };
      // Coordinate same-origin tabs where Web Locks are available.
      const promise = queue.enqueue(() => typeof navigator !== 'undefined' && navigator.locks?.request
        ? navigator.locks.request('sse-steam-restriction-lookup', { ...(signal ? { signal } : {}) }, run) : run(), { signal })
        .finally(() => pending.delete(appid));
      pending.set(appid, promise);
      return promise;
    }
    return { lookup };
  }

  // ---- restrictions/index.js ----
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
    const database = createRestrictionDatabase({ read, write, signal: scope.signal });
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
    const trackedTitles = new Set();
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
      trackedTitles.add(title);
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
    const scanner = createDomScanner({ scope, selector, name: 'restrictions', attributes: ITEM_ATTRIBUTES, initial: false, process: titles => {
      log.debug('scan', '扫描游戏标题', { count: titles.length });
      titles.forEach(title => { enhance(title).catch(error => log.error('badge.failed', '游戏受限标记失败', { error })); });
    }, removed: nodes => {
      for (const node of nodes) {
        if (!node.isConnected && node.matches?.(selector)) { trackedTitles.delete(node); states.delete(node); }
        node.querySelectorAll?.(selector).forEach(title => {
          if (!title.isConnected) { trackedTitles.delete(title); states.delete(title); }
        });
      }
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
      for (const title of trackedTitles) {
        if (!title.isConnected) { trackedTitles.delete(title); continue; }
        const state = states.get(title);
        if (state?.retryAt && Date.now() >= state.retryAt) enhance(title).catch(error => log.debug('retry.failed', '标签重试失败', { error }));
      }
    };
    scope.own(() => trackedTitles.clear());
    scope.interval(() => { if (!document.hidden) refresh(); }, 60 * 1000);
    scope.listen(window, 'pageshow', () => { refresh(); scan(); });
    scope.listen(document, 'visibilitychange', () => { if (!document.hidden) { refresh(); scan(); } });
    log.info('initialize', '游戏受限状态标记已启用');
    scan();
  }

  // ---- wishlist-sale.js ----
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

  // ---- game-hover.js ----
  const GAME_HOVER_ROWS = '.search_result_row, .tab_item, .tab_row_item, .recommendation_link, .store_main_capsule, .store_capsule, .small_cap, .large_cap, .wishlist_row, .wishlistRowItem, [data-rfd-draggable-id^="WishlistItem-"]';
  const GAME_HOVER_ITEMS = `${GAME_HOVER_ROWS}, a[href*="/app/"], [data-ds-appid], [data-app-id], #appHubAppName`;

  function findGameHoverItem(target) {
    const closest = target?.closest?.(GAME_HOVER_ITEMS);
    if (!closest) return null;
    if (closest.id === 'appHubAppName') {
      const id = /^\/app\/(\d+)(?:\/|$)/.exec(location.pathname)?.[1];
      return id ? { row: closest, id } : null;
    }
    const row = closest.closest(GAME_HOVER_ROWS);
    const link = target.closest('a[href]');
    let linkId;
    if (link) {
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || /^\/(sub|bundle)\//.test(url.pathname)) return null;
      linkId = /^\/app\/(\d+)(?:\/|$)/.exec(url.pathname)?.[1];
    }
    if (row && !row.matches('[data-ds-bundleid], [data-ds-packageid]')) {
      const id = itemRef('app', row === link ? linkId : storeSaleAppId(row))?.id;
      if (id && (!linkId || id === linkId)) return { row, id };
    }
    if (linkId) return { row: link, id: linkId };
    if (row || closest.matches('[data-ds-bundleid], [data-ds-packageid]')) return null;
    const id = itemRef('app', storeSaleAppId(closest))?.id;
    return id ? { row: closest, id } : null;
  }

  function parseGameHoverPage(doc, id) {
    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
    const name = doc.querySelector('#appHubAppName, .apphub_AppName')?.textContent.trim() ||
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();
    if (!name || (canonical && itemFromLink(canonical)?.id !== id)) return null;
    if (!doc.querySelector('.game_description_snippet, #appHubAppName, .apphub_AppName')) return null;

    const texts = selector => [...new Set([...doc.querySelectorAll(selector)].map(node => node.textContent.trim()).filter(Boolean))];
    const company = type => texts(`#${type}_row .summary a, .dev_row .summary a[href*="/${type}/"], .dev_row .summary a[href*="?${type}="], .dev_row .summary a[href*="&${type}="]`).join('、');
    const languages = [[], [], []];
    const languageRows = doc.querySelectorAll('table.game_language_options tr');
    for (const row of languageRows) {
      const cells = row.querySelectorAll('td');
      if (cells.length < 4) continue;
      const name = cells[0].textContent.trim();
      if (!name) continue;
      languages.forEach((list, index) => {
        if (cells[index + 1].querySelector('.checkmark') || /[✔✓]/.test(cells[index + 1].textContent)) list.push(name);
      });
    }
    return {
      name,
      publishers: company('publisher'),
      developers: company('developer') || texts('#developers_list a').join('、'),
      franchises: company('franchise'),
      earlyAccess: Boolean(doc.querySelector('.early_access_header, .early_access_banner, #earlyAccessHeader')),
      languages: languageRows.length ? languages : null,
      tags: texts('.glance_tags a.app_tag').slice(0, 5),
      description: doc.querySelector('.game_description_snippet')?.textContent.trim(),
      reviews: parseGameHoverStoreReviews(doc)
    };
  }

  function formatGameHoverReviews(percent, total) {
    if (!total) return '暂无评测（0 条）';
    return `${percent}% 好评（${total.toLocaleString('zh-CN')} 条）`;
  }

  function gameHoverReviews(data) {
    const { total_positive: positive, total_reviews: total } = (data?.response || data)?.query_summary || {};
    if (data?.success === 0 || !Number.isSafeInteger(total) || !Number.isSafeInteger(positive) || positive < 0 || total < positive) return null;
    return formatGameHoverReviews(total ? Math.round(positive * 100 / total) : 0, total);
  }

  function parseGameHoverStoreReviews(doc) {
    const row = doc.querySelector('#userReviews [itemprop="aggregateRating"]') ||
      doc.querySelector('#userReviews [data-tooltip-html].user_reviews_summary_row:last-child, #userReviews [data-store-tooltip].user_reviews_summary_row:last-child');
    const summary = row?.getAttribute('data-tooltip-html') || row?.getAttribute('data-store-tooltip');
    const normalized = summary?.normalize('NFKC');
    const percent = normalized?.match(/(\d+)\s*%/)?.[1];
    if (percent == null || Number(percent) > 100) return null;
    const count = row.querySelector('[itemprop="reviewCount"]')?.getAttribute('content') ||
      normalized.replace(/\d+\s*%/, '').match(/\d[\d,. ]*/)?.[0];
    const total = Number(count?.replace(/[^0-9]/g, ''));
    return Number.isSafeInteger(total) && total > 0 ? `${formatGameHoverReviews(Number(percent), total)} · 商店摘要` : null;
  }

  function gameHoverAppDetails(data, id) {
    const entry = data?.[id];
    const app = entry?.data;
    if (!entry?.success || String(app?.steam_appid) !== id || typeof app.name !== 'string') return null;
    const list = value => Array.isArray(value) ? value.filter(name => typeof name === 'string').join('、') : '';
    const text = value => {
      const template = document.createElement('template');
      template.innerHTML = typeof value === 'string' ? value : '';
      return template.content.textContent.trim();
    };
    return {
      name: app.name, publishers: list(app.publishers), developers: list(app.developers),
      earlyAccess: Array.isArray(app.genres) ? app.genres.some(genre => Number(genre?.id) === 70) : null,
      languageSummary: text(app.supported_languages), tags: [], description: text(app.short_description)
    };
  }

  async function loadGameHoverReviews(id, options) {
    const url = new URL('https://api.steampowered.com/IUserReviewsService/GetAppReviews/v1/');
    url.searchParams.set('input_json', JSON.stringify({
      appid: Number(id), languages: ['all'], filter: 0, cursor: '*', review_type: 0, purchase_type: 1, num_per_page: 1
    }));
    return gameHoverReviews(JSON.parse(await gmGet(url.href, { ...options, anonymous: true })));
  }

  function gameHoverPlacement(rect, viewport) {
    const preferredWidth = 324;
    const gap = 8;
    const margin = 8;
    const leftSpace = rect.left - gap - margin;
    if (leftSpace >= 216) {
      const width = Math.min(preferredWidth, leftSpace);
      return { side: 'left', width, left: rect.left - gap - width, maxHeight: viewport.height - 2 * margin };
    }

    const above = Math.max(0, rect.top - gap - margin);
    const below = Math.max(0, viewport.height - rect.bottom - gap - margin);
    const width = Math.min(preferredWidth, viewport.width - 2 * margin);
    const x = Math.max(margin, Math.min(rect.left, viewport.width - margin - width));
    if (Math.max(above, below) < 96) return { side: 'overlay', width, left: x, maxHeight: viewport.height - 2 * margin };
    return { side: above > below ? 'above' : 'below', width, left: x, maxHeight: Math.max(above, below) };
  }

  function initializeGameHover() {
    const scope = createFeatureScope('game-hover');
    const log = diagnostics.scope('game-hover');
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    const { language } = readStoreSession(document, page);
    const options = { signal: scope.signal, timeout: 8000 };
    const queue = new RequestQueue(2);
    const reviewCache = createAsyncCache({ ttl: 10 * 60000, load: async id => {
      return queue.enqueue(() => loadGameHoverReviews(id, options), options);
    } });
    const detailsCache = createAsyncCache({ ttl: 30 * 60000, load: async id => {
      return queue.enqueue(async () => {
        if (itemFromLink(location.pathname)?.id === id && location.pathname.startsWith('/app/')) {
          const details = parseGameHoverPage(document, id);
          if (details) return details;
        }
        const url = new URL(`/app/${id}/`, location.origin);
        url.searchParams.set('l', language);
        try {
          // Template contents stay inert, including images and inline handlers from Steam's HTML.
          const template = document.createElement('template');
          template.innerHTML = await gmGet(url.href, options);
          const details = parseGameHoverPage(template.content, id);
          if (details) return details;
        } catch (error) {
          if (scope.signal.aborted || error.status === 429) throw error;
        }
        const fallback = new URL('/api/appdetails', location.origin);
        fallback.searchParams.set('appids', id);
        fallback.searchParams.set('l', language);
        return gameHoverAppDetails(JSON.parse(await gmGet(fallback.href, options)), id);
      }, options);
    } });
    log.info('initialize', '游戏悬停详情已启用');

    const tooltip = createElement('div');
    tooltip.id = 'sse-game-hover';
    tooltip.hidden = true;
    tooltip.setAttribute('role', 'tooltip');
    const body = createElement('div', undefined, 'sse-game-hover-body');
    tooltip.appendChild(body);
    document.body.appendChild(tooltip);

    let current, cancelOpen, cancelClose;
    const hide = () => {
      cancelOpen?.();
      cancelClose?.();
      cancelOpen = cancelClose = null;
      current = null;
      tooltip.hidden = true;
    };
    scope.own(hide);
    scope.own(() => tooltip.remove());

    function place() {
      if (tooltip.hidden) return;
      const row = current.row;
      if (!row.isConnected) { hide(); return; }
      const rect = row.getBoundingClientRect();
      const viewport = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
      if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= viewport.height) { hide(); return; }
      const placement = gameHoverPlacement(rect, viewport);
      tooltip.dataset.side = placement.side;
      tooltip.style.left = `${placement.left}px`;
      tooltip.style.width = `${placement.width}px`;
      body.style.maxHeight = `${placement.maxHeight}px`;
      const height = tooltip.offsetHeight;
      const top = placement.side === 'above' ? rect.top - 8 - height : placement.side === 'below' ? rect.bottom + 8 : rect.top;
      const y = Math.max(8, Math.min(top, viewport.height - height - 8));
      tooltip.style.top = `${y}px`;
      tooltip.style.setProperty('--sse-game-hover-arrow', `${Math.max(12, Math.min(rect.top + rect.height / 2 - y, height - 12))}px`);
    }

    function render(item) {
      if (current !== item || !scope.active) return;
      const { details, reviews } = item;
      const field = (label, value) => {
        const line = createElement('div');
        line.append(createElement('strong', `${label} · `), value || '—');
        body.appendChild(line);
      };
      body.replaceChildren();
      if (details?.name) body.appendChild(createElement('div', details.name, 'sse-game-hover-title'));
      if (details) {
        field('发行商', details.publishers);
        field('开发者', details.developers);
        field('系列', details.franchises);
      }
      field('评测', reviews || details?.reviews || (reviews === undefined || details === undefined ? '正在读取…' : '暂不可用'));
      if (details) {
        field('抢先体验', details.earlyAccess == null ? '暂不可用' : details.earlyAccess ? '是' : '否');
        if (details.languages) {
          ['界面', '完整音频', '字幕'].forEach((label, index) => field(label, details.languages[index].join('、')));
        } else field('语言支持', details.languageSummary || '暂不可用');
        if (details.tags.length) {
          const tags = createElement('div', undefined, 'sse-game-hover-tags');
          tags.append(...details.tags.map(tag => createElement('span', tag)));
          body.append(createElement('strong', '标签'), tags);
        } else field('标签', '');
        field('简介', details.description);
      } else {
        body.appendChild(createElement('div', details === undefined ? '正在读取游戏详情…' : '商店详情暂不可用。'));
      }
      place();
    }

    function open(item) {
      tooltip.hidden = false;
      body.scrollTop = 0;
      render(item);
      if (current !== item) return;
      detailsCache.get(item.id).then(details => { item.details = details; }, () => { item.details = null; }).then(() => render(item));
      reviewCache.get(item.id).then(reviews => { item.reviews = reviews; }, () => { item.reviews = null; }).then(() => render(item));
    }

    function closeSoon() {
      if (!cancelClose) cancelClose = scope.timeout(hide, 180);
    }

    scope.listen(document, 'pointerover', event => {
      if (event.pointerType === 'touch') return;
      if (tooltip.contains(event.target) || current?.row.contains(event.target)) {
        cancelClose?.();
        cancelClose = null;
        return;
      }
      // Allow the pointer to travel over the gap between the row and the tooltip.
      const item = findGameHoverItem(event.target);
      if (!item) return;
      hide();
      current = item;
      cancelOpen = scope.timeout(() => open(item), 420);
    }, true);
    scope.listen(document, 'pointerout', event => {
      if (!current || event.pointerType === 'touch') return;
      const contains = target => tooltip.contains(target) || current.row.contains(target);
      const next = event.relatedTarget?.nodeType ? event.relatedTarget : null;
      if (!contains(event.target) || contains(next)) return;
      if (tooltip.hidden) hide();
      else closeSoon();
    }, true);
    scope.listen(window, 'scroll', event => {
      if (!event.target?.nodeType || !tooltip.contains(event.target)) hide();
    }, { capture: true, passive: true });
    scope.listen(window, 'resize', place, { passive: true });
    scope.listen(window, 'blur', hide);
    scope.listen(document, 'keydown', event => { if (event.key === 'Escape') hide(); });
    const observer = new MutationObserver(() => { if (current && !current.row.isConnected) hide(); });
    observer.observe(document.body, { childList: true, subtree: true });
    scope.own(() => observer.disconnect());
  }

  // ---- main.js ----
  function initialize() {
    const log = diagnostics.scope('core');
    const boot = log.begin('initialize', { host: location.hostname, level: diagnostics.getLevel() }, 'info');
    addStyle();
    boot.debug('styles', '基础样式已加载');
    GM_registerMenuCommand('设置', openSettingsUI);
    GM_registerMenuCommand('清除缓存', clearScriptCaches);
    boot.debug('settings', '设置菜单已注册');
    startFeatureRuntime();
    boot.end('功能启动已调度，异步任务由各模块记录结果');
  }

  let familyLibrary;
  const FEATURE_DEFINITIONS = [
    { name: 'regional-prices', key: 'sse_extra_enabled', match: () => location.hostname === 'store.steampowered.com', start: startObserver },
    { name: 'conversion', key: 'sse_convert_enabled', match: () => /^(store\.steampowered\.com|steamcommunity\.com|checkout\.steampowered\.com)$/.test(location.hostname), start: () => conversion.start() },
    { name: 'family', match: () => true, start: () => { familyLibrary = initializeFamilyLibrary(); } },
    { name: 'cart', key: 'sse_cart_enabled', match: () => /^(store\.steampowered\.com|steamcommunity\.com)$/.test(location.hostname), start: initializeCartTools },
    { name: 'friends', match: () => location.hostname === 'steamcommunity.com' && /\/friends\/?$/i.test(location.pathname), start: initializeFriendTools },
    { name: 'restrictions', key: 'sse_restrictions_enabled', match: () => /^(store\.steampowered\.com|steamcommunity\.com)$/.test(location.hostname), start: initializeRestrictionBadges },
    { name: 'wishlist-sale', key: 'sse_wishlist_sale_enabled', match: () => location.hostname === 'store.steampowered.com', start: initializeStoreSaleCountdown },
    { name: 'game-hover', key: 'sse_game_hover_enabled', match: () => location.hostname === 'store.steampowered.com', start: initializeGameHover }
  ];
  function startFeatureRuntime() {
    const runtime = createFeatureScope('runtime');
    const settingKeys = ['sse_extra_enabled', 'sse_convert_enabled', 'sse_cart_enabled',
      'sse_family_enabled', 'sse_family_auto', 'sse_restrictions_enabled', 'sse_wishlist_sale_enabled', 'sse_game_hover_enabled'];
    const settingListenersAvailable = typeof GM_addValueChangeListener === 'function';
    const featureSignatures = new Map();
    let settings = null;
    let settingsDirty = true;
    function reconcile() {
      try { reconcileFeatures(); }
      catch (error) { diagnostics.scope('core').error('runtime.failed', '页面功能协调失败', { error }); }
    }
    function reconcileFeatures() {
      const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
      const user = page.UserConfig?.steamid || page.g_steamID || page.g_AccountID || '';
      if (!settings || settingsDirty || !settingListenersAvailable) {
        settings = Object.fromEntries(settingKeys.map(key => [key, GM_getValue(key, true)]));
        settingsDirty = false;
      }
      const pageSignature = JSON.stringify([location.hostname, location.pathname, location.search, user]);
      const changes = [];
      for (const feature of FEATURE_DEFINITIONS) {
        const enabled = !feature.key || settings[feature.key];
        // Do not modify server HTML before Steam's React root has adopted it.
        const active = feature.match() && enabled && isStorePageReady();
        // Family initialization also owns its management UI, so its switches restart it
        // without preventing initialization when marking is disabled.
        const familySettings = feature.name === 'family'
          ? `${settings.sse_family_enabled}|${settings.sse_family_auto}` : '';
        const next = `${pageSignature}|${feature.name}|${active}|${familySettings}`;
        if (featureSignatures.get(feature.name) !== next) changes.push({ feature, active, next });
      }
      for (const { feature } of changes) featureScopes.get(feature.name)?.dispose();
      for (const { feature, active, next } of changes) {
        featureSignatures.set(feature.name, next);
        if (!active) continue;
        try {
          const result = feature.start();
          if (result?.catch) result.catch(error => diagnostics.scope('core').error('feature.failed', '功能初始化失败', { name: feature.name, error }));
        } catch (error) { diagnostics.scope('core').error('feature.failed', '功能初始化失败', { name: feature.name, error }); }
      }
    }
    runtime.interval(reconcile, 1000);
    if (settingListenersAvailable) {
      for (const key of settingKeys) {
        const id = GM_addValueChangeListener(key, () => { settingsDirty = true; reconcile(); });
        runtime.own(() => { if (typeof GM_removeValueChangeListener === 'function') GM_removeValueChangeListener(id); });
      }
    }
    runtime.listen(window, 'popstate', reconcile);
    runtime.listen(window, 'pageshow', reconcile);
    runtime.listen(window, 'pagehide', event => {
      if (event.persisted) return;
      for (const [name, scope] of featureScopes) if (name !== 'runtime') scope.dispose();
      runtime.dispose();
    });
    reconcile();
  }
  initialize();
})();
