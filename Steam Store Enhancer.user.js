// ==UserScript==
// @name         Steam Store Enhancer
// @namespace   https://github.com/linyaocrush/Steam-Store-Enhancer
// @homepageURL  https://greasyfork.org/zh-CN/scripts/605911-steam-store-enhancer
// @homepageURL  https://github.com/linyaocrush/Steam-Store-Enhancer
// @downloadURL  https://raw.githubusercontent.com/linyaocrush/Steam-Store-Enhancer/main/Steam%20Store%20Enhancer.user.js
// @updateURL    https://raw.githubusercontent.com/linyaocrush/Steam-Store-Enhancer/main/Steam%20Store%20Enhancer.user.js
// @version      1.2.0
// @description  Steam 额外地区价格、汇率转换、快速加购、购物车批量管理与家庭库游戏标记。
// @author       linyaocrush, marioplus, Chr_, Cliencer Goge
// @license      AGPL-3.0
// @match        https://store.steampowered.com/*
// @match        https://steamcommunity.com/*
// @match        https://checkout.steampowered.com/checkout/*
// @match        https://keylol.com/*
// @match        https://steamdb.keylol.com/tooltip*
// @run-at       document-idle
// @grant        GM_getValue
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
  function isCartPage() { return location.pathname === '/cart/' || location.pathname.startsWith('/cart'); }
  function isWishlistPage() { return /\/wishlist/i.test(location.pathname); }

  const STYLE_ID = 'sapx-style';
  const EXTRA_CLASS = 'sapx-extra-price';
  const CART_SUMMARY_ID = 'sapx-cart-summary';
  const MARK_ATTR = 'data-sapx-region';

  const UI_STYLE_ID = 'sapx-ui-style';
  const UI_ROOT_ID = 'sapx-ui-root';

  // ---- shared.js ----
  function createElement(tag, content, className) {
    const element = document.createElement(tag);
    if (content !== undefined) element.textContent = content;
    if (className) element.className = className;
    return element;
  }

  // Coalesce repeated requests without postponing the first scheduled scan.
  function createScheduledTask(task, delay) {
    let timer = null;
    return () => {
      if (timer !== null) return;
      timer = setTimeout(() => {
        timer = null;
        task();
      }, delay);
    };
  }

  function readStoreSession(doc, globals = {}) {
    const config = doc.querySelector('#application_config');
    const settings = JSON.parse(config?.getAttribute('data-config') || 'null') || globals.Config || {};
    const user = JSON.parse(config?.getAttribute('data-store_user_config') || '{}');
    const info = JSON.parse(config?.getAttribute('data-userinfo') || '{}');
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
    if (!steamid && account) steamid = (76561197960265728n + BigInt(account)).toString();
    return { steamid, token, country: settings.COUNTRY, language: settings.LANGUAGE || 'schinese' };
  }

  // ---- styles.js ----
  function addStyle() {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent =
        '.sapx-extra-price{margin-left:6px;font-size:0.9em;opacity:1;white-space:nowrap;pointer-events:none;color:#67c1f5;display:inline-block;font-weight:normal;text-decoration:none!important}' +
        '.sapx-extra-price::before,.sapx-extra-price::after{content:none!important;display:none!important}' +
        'strike .sapx-extra-price,.discount_original_price .sapx-extra-price,.StoreOriginalPrice .sapx-extra-price{opacity:0.65;font-size:0.85em;color:#acb2b8;text-decoration:none!important}' +
        '#sapx-cart-summary{margin-top:8px;margin-bottom:8px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.1);color:#c6d4df;font-size:12px;line-height:1.4}' +
        '#sapx-cart-summary .sapx-row{display:flex;justify-content:space-between;gap:8px;align-items:center}' +
        '#sapx-cart-summary .sapx-label{font-size:11px;opacity:0.8;color:#acb2b8}' +
        '#sapx-cart-summary .sapx-value{font-weight:700;white-space:nowrap;color:#67c1f5;font-size:14px}' +
        '#sapx-cart-summary .sapx-warn{margin-top:4px;color:#e46767;font-size:10px;opacity:0.9}' +
        '.game_purchase_action_bg .discount_prices .discount_original_price{text-decoration:none!important}' +
        '.game_purchase_action_bg .discount_prices .discount_original_price::before,.game_purchase_action_bg .discount_prices .discount_original_price::after{content:none!important;display:none!important}' +
        '.game_purchase_action_bg .discount_prices .discount_original_price .sapx-extra-price{text-decoration:none!important}';
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
      
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-extra-enabled" type="checkbox" />启用额外地区价格</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-convert-enabled" type="checkbox" />启用价格转换</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-cart-enabled" type="checkbox" />启用快速加购与购物车管理</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-family-enabled" type="checkbox" />启用家庭库游戏标记</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-family-auto" type="checkbox" />每隔 24 小时自动扫描家庭库</label></div>' +
      '<div class="sapx-field"><button class="sapx-btn sapx-btn-ghost" type="button" id="sse-family-open">管理家庭库：扫描、贡献统计与最近购入</button></div>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-convert-region">价格转换目标地区</label><select class="sapx-select" id="sse-convert-region"></select></div>' +
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
      '<div class="sapx-field"><label class="sapx-label" for="sse-log">日志等级</label><select class="sapx-select" id="sse-log"><option>debug</option><option>info</option><option>warn</option><option>error</option><option>off</option></select></div>' +
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
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('sapx-open')) close(); }, { passive: true });
    return root;
  }

  function openSettingsUI() {
    const root = ensureSettingsUI();
    const select = root.querySelector('#sapx-region-select');
    const showCode = root.querySelector('#sapx-show-code');
    const adv = root.querySelector('#sapx-adv');
    adv.removeAttribute('open');
    const cur = getTargetRegion();
    select.innerHTML = REGIONS.map(r => '<option value="' + r.id + '">' + r.label + '</option>').join('');
    select.value = cur.id;
    showCode.checked = getShowRegionCode();
    const field = id => root.querySelector('#sse-' + id);
    const settings = conversion.setting;
    field('extra-enabled').checked = GM_getValue('sse_extra_enabled', true);
    field('convert-enabled').checked = GM_getValue('sse_convert_enabled', true);
    field('cart-enabled').checked = GM_getValue('sse_cart_enabled', true);
    field('family-enabled').checked = GM_getValue('sse_family_enabled', true);
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
    field('log').value = settings.logLevel;
    field('error').textContent = '';
    field('rate').disabled = !field('custom-enabled').checked;
    field('custom-enabled').onchange = () => { field('rate').disabled = !field('custom-enabled').checked; };
    root.querySelector('#sapx-save').onclick = () => {
      const hours = Number(field('cache-hours').value);
      const rate = Number(field('rate').value);
      if (!Number.isFinite(hours) || hours <= 0 || (field('custom-enabled').checked && (!Number.isFinite(rate) || rate <= 0))) {
        adv.open = true;
        field('error').textContent = '缓存有效期和启用后的自定义汇率必须为大于 0 的数字。';
        return;
      }
      conversion.save({ ...settings,
        countyCode: field('convert-region').value,
        currencySymbol: field('symbol').value,
        currencySymbolBeforeValue: field('position').value === 'before',
        rateCacheExpired: hours * 3600000,
        useCustomRate: field('custom-enabled').checked,
        customRate: Number.isFinite(rate) && rate > 0 ? rate : settings.customRate,
        disableOnMarket: field('disable-market').checked,
        logLevel: field('log').value
      });
      GM_setValue('sse_extra_enabled', field('extra-enabled').checked);
      GM_setValue('sse_convert_enabled', field('convert-enabled').checked);
      GM_setValue('sse_cart_enabled', field('cart-enabled').checked);
      GM_setValue('sse_family_enabled', field('family-enabled').checked);
      GM_setValue('sse_family_auto', field('family-auto').checked);
      GM_setValue('sse_cart_language', field('cart-language').value);
      GM_setValue('sse_cart_country', field('cart-country').checked);
      GM_setValue(STORAGE_KEY_REGION_ID, select.value);
      GM_setValue(STORAGE_KEY_SHOW_CODE, Boolean(showCode.checked));
      location.reload();
    };
    root.classList.add('sapx-open');
    select.focus();
  }

  // ---- regional-prices.js ----
  function gmGet(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        timeout: 20000,
        onload: (res) => {
          if ((res.status >= 200 && res.status < 300) || (res.status === 0 && res.responseText)) resolve(res.responseText);
          else reject(new Error('HTTP ' + res.status));
        },
        onerror: reject,
        ontimeout: () => reject(new Error('Timeout'))
      });
    });
  }

  class RequestQueue {
    constructor(concurrency = 4) { this.concurrency = concurrency; this.running = 0; this.queue = []; }
    enqueue(task) {
      return new Promise((resolve, reject) => {
        this.queue.push({ task, resolve, reject });
        this._deq();
      });
    }
    _deq() {
      if (this.running >= this.concurrency) return;
      const job = this.queue.shift();
      if (!job) return;
      this.running++;
      Promise.resolve().then(job.task).then(job.resolve).catch(job.reject).finally(() => { this.running--; this._deq(); });
    }
  }

  const requestQueue = new RequestQueue(4);
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
    } catch (e) {}

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
    if (pendingPrices.has(key)) return pendingPrices.get(key);
    const pending = fetchPriceForItem(item, region).finally(() => pendingPrices.delete(key));
    pendingPrices.set(key, pending);
    return pending;
  }

  async function fetchPriceForItem(item, region) {
    const key = item.type + ':' + item.id + ':' + region.id;
    const cached = cacheGet(key);
    if (cached !== undefined) return cached;
    for (const cc of region.ccCandidates) {
      try {
        let res = null;
        if (item.type === 'app') res = await getAppPrice(item.id, cc, region.currency);
        else if (item.type === 'package') res = await getPackagePrice(item.id, cc, region.currency);
        else if (item.type === 'bundle') res = await getBundlePrice(item.id, cc, region.currency);
        if (res && res.ok) {
          if (item.type === 'bundle' || !res.currency || res.currency === region.currency) {
            cacheSet(key, res);
            return res;
          }
        }
      } catch (e) {}
    }
    cacheSet(key, null);
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

    pendingElements.add(priceEl);
    let price;
    try { price = await getPriceForItem(item, region); }
    finally { pendingElements.delete(priceEl); }
    if (!price || !priceEl.isConnected) return;

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
  }

  async function updateCartSummary() {
    if (!isCartPage()) return;
    const region = getTargetRegion();
    const items = document.querySelectorAll('._3ypRUtQoOfOrCsyHlzfGm4 > div.Panel.Focusable');
    if (!items.length) return;

    let sumMinor = 0;
    let missingCount = 0;

    for (const row of items) {
      const item = inferItemFromScope(row);
      if (!item) continue;
      const price = await getPriceForItem(item, region);
      if (price && price.ok && price.final !== null && Number.isFinite(price.final)) sumMinor += price.final;
      else missingCount++;
    }

    const cartSummaryRow = document.querySelector('._2DjadWLFH3keW9rGWZKxSk._1G8JdfmCwhonn-pZk-tfwP');
    if (!cartSummaryRow) return;

    let box = document.getElementById(CART_SUMMARY_ID);
    if (!box) {
      box = document.createElement('div');
      box.id = CART_SUMMARY_ID;
      cartSummaryRow.appendChild(box);
    }

    const totalText = formatMinorToCurrency(sumMinor, region.currency);
    const label = getShowRegionCode() ? '目标地区预计付款 (' + region.short + ')' : '目标地区预计付款';

    let html = '<div class="sapx-row"><div class="sapx-label">' + label + '：</div><div class="sapx-value">' + totalText + '</div></div>';
    if (missingCount > 0) html += '<div class="sapx-warn">注意：有 ' + missingCount + ' 项商品无法在目标地区购买（已从合计剔除）</div>';
    if (box.innerHTML !== html) box.innerHTML = html;
  }

  const PRICE_SELECTORS = [
    '.discount_final_price', '.discount_original_price', '.game_purchase_price',
    '.game_area_dlc_price', '.col.search_price.responsive_secondrow strike',
    '.col.search_price.responsive_secondrow .discount_final_price',
    '.Panel.Focusable .StoreOriginalPrice', '.Panel.Focusable .pk-LoKoNmmPK4GBiC9DR8',
    '._2WLaY5TxjBGVyuWe_6KS3N', '.game_area_purchase_game_dropdown_selection > span',
    '.game_area_purchase_game_dropdown_menu_item_text'
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
      document.querySelectorAll(PRICE_SELECTORS).forEach(el => { enhancePriceElement(el); });
      if (isWishlistPage()) scanWishlistFallback();
      if (isCartPage()) updateCartSummary();
    }, 450);
  }

  function startObserver() {
    const obs = new MutationObserver(mutations => {
      if (mutations.some(mutation => !mutation.target.parentElement?.closest('#' + UI_ROOT_ID + ', .' + EXTRA_CLASS + ', #' + CART_SUMMARY_ID) &&
          !(mutation.target.nodeType === 1 && mutation.target.closest('#' + UI_ROOT_ID + ', .' + EXTRA_CLASS + ', #' + CART_SUMMARY_ID)))) scheduleScan();
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  // ---- conversion.js ----
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
  class Setting {
countyCode = "CN";
currencySymbol = "￥";
currencySymbolBeforeValue = true;
rateCacheExpired = 1e3 * 60 * 60;
useCustomRate = false;
customRate = 1;
oldVersion = "0.0.0";
currVersion = "0.0.0";
logLevel = "info";
disableOnMarket = false;
  }
  const STORAGE_KEY_PREFIX = "Storage:";
  const STORAGE_KEY_RATE_CACHES = STORAGE_KEY_PREFIX + "RateCache";
  const STORAGE_KEY_SETTING = STORAGE_KEY_PREFIX + "Setting";
  class Attrs {
    static STATUS_KEY = "data-spc-status";
  }
  var _GM_cookie = (() => typeof GM_cookie != "undefined" ? GM_cookie : void 0)();
  var _GM_deleteValue = (() => typeof GM_deleteValue != "undefined" ? GM_deleteValue : void 0)();
  var _GM_getValue = (() => typeof GM_getValue != "undefined" ? GM_getValue : void 0)();
  var _GM_info = (() => typeof GM_info != "undefined" ? GM_info : void 0)();
  var _GM_setValue = (() => typeof GM_setValue != "undefined" ? GM_setValue : void 0)();
  var _GM_xmlhttpRequest = (() => typeof GM_xmlhttpRequest != "undefined" ? GM_xmlhttpRequest : void 0)();
  var _unsafeWindow = (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
  function initializeLogTitle() {
    const isInIFrame = window.parent !== window || window.frames.length > 0;
    return isInIFrame ? `steam-price-convertor iframe(${( new Date()).getMilliseconds()})` : "steam-price-convertor";
  }
  function createLogStyle(color) {
    return `
            background: ${color};
            color: white;
            padding: 1px 3px;
            border-radius: 2px;
        `;
  }
  function composeLogHint() {
    return `%c${initializeLogTitle()}`;
  }
  const LogDefinitions = {
    debug: {
      index: 0,
      color: "#009688",
      label: "debug",
      bindMethod: console.info
    },
    info: {
      index: 1,
      color: "#2196f3",
      label: "info",
      bindMethod: console.info
    },
    warn: {
      index: 2,
      color: "#ffc107",
      label: "warn",
      bindMethod: console.warn
    },
    error: {
      index: 3,
      color: "#e91e63",
      label: "error",
      bindMethod: console.error
    },
    off: {
      index: 4,
      color: "",
      label: "off",
      bindMethod: () => {
      }
    }
  };
  const Logger = {
    debug: noopLog.bind(null),
    info: noopLog.bind(null),
    warn: noopLog.bind(null),
    error: noopLog.bind(null)
  };
  function noopLog() {
  }
  let currLogLevel = LogDefinitions.info;
  function refreshBinding() {
    const hint = composeLogHint();
    Object.entries(LogDefinitions).forEach(([label, def]) => {
      if (def.index >= currLogLevel.index) {
        const logStyle = createLogStyle(def.color);
        Logger[label.toLowerCase()] = def.bindMethod.bind(console, hint, logStyle);
      } else {
        Logger[label.toLowerCase()] = noopLog.bind(null);
      }
    });
  }
  function setLogLevel(levelLabel) {
    const newLevel = LogDefinitions[levelLabel];
    if (newLevel) {
      currLogLevel = newLevel;
      refreshBinding();
    } else {
      console.error(`Invalid log level: ${levelLabel}`);
    }
  }
  refreshBinding();
  class Strings {
    static format(format, ...args) {
      args = args || [];
      let message = format;
      for (let arg of args) {
        message = message.replace("%s", arg);
      }
      return message;
    }
  }
  class GmUtils {
    static getSimpleValue(key, defaultValue) {
      const value = _GM_getValue(key);
      return value || defaultValue;
    }
    static getObjValue(cls, key, defaultValue) {
      const value = _GM_getValue(key);
      return value ? Jsons.readString(value, cls) : defaultValue;
    }
    static setSimpleValue(key, value) {
      _GM_setValue(key, value);
    }
    static setObjValue(key, value) {
      _GM_setValue(key, Jsons.toString(value));
    }
    static deleteValue(key) {
      _GM_deleteValue(key);
    }
  }
  class SettingManager {
    static instance = new SettingManager();
    setting;
    constructor() {
      this.setting = this.loadSetting();
    }
    loadSetting() {
      const setting = GmUtils.getObjValue(Setting, STORAGE_KEY_SETTING, new Setting());
      setting.oldVersion = setting.currVersion;
      setting.currVersion = _GM_info.script.version;
      if (setting.oldVersion === setting.currVersion) {
        Logger.info("读取设置", setting);
      } else {
        Logger.debug(Strings.format(`版本更新重置设置：%s -> %s`, setting.oldVersion, setting.currVersion));
        this.saveSetting(setting);
      }
      return setting;
    }
saveSetting(setting) {
      Logger.info("保存设置", setting);
      this.setting = setting;
      GmUtils.setObjValue(STORAGE_KEY_SETTING, setting);
    }
    setCountyCode(countyCode) {
      const county = countyCode2Info.get(countyCode);
      if (!county) {
        throw Error(`国家代码不存在：${countyCode}`);
      }
      this.setting.countyCode = countyCode;
      this.saveSetting(this.setting);
    }
    setCurrencySymbol(currencySymbol) {
      this.setting.currencySymbol = currencySymbol;
      this.saveSetting(this.setting);
    }
    setCurrencySymbolBeforeValue(isCurrencySymbolBeforeValue) {
      this.setting.currencySymbolBeforeValue = isCurrencySymbolBeforeValue;
      this.saveSetting(this.setting);
    }
    reset() {
      this.saveSetting(new Setting());
    }
    setRateCacheExpired(rateCacheExpired) {
      this.setting.rateCacheExpired = rateCacheExpired;
      this.saveSetting(this.setting);
    }
    setUseCustomRate(isUseCustomRate) {
      this.setting.useCustomRate = isUseCustomRate;
      this.saveSetting(this.setting);
    }
    setCustomRate(customRate) {
      this.setting.customRate = customRate;
      this.saveSetting(this.setting);
    }
  }
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
      return new Promise((resolve, reject) => {
        details.onload = (response) => {
          if (response.status < 200 || response.status >= 300) { reject(new Error("HTTP " + response.status)); return; }
          try {
          if (cls.name === String.name) {
            resolve(response.response);
          } else {
            const json = JSON.parse(response.response);
            resolve(Jsons.readJson(json, cls));
          }
          } catch (error) { reject(error); }
        };
        details.timeout = 20000;
        details.ontimeout = () => reject(new Error("请求超时"));
        details.onerror = (error) => reject(error);
        _GM_xmlhttpRequest(details);
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
      try {
        let countyCode = (storeDom === document ? _unsafeWindow.GStoreItemData?.rgNavParams?.__page_default_obj?.countrycode : null);
        if (countyCode) {
          return countyCode;
        }
      } catch (e) {
        Logger.warn("读取商店页面区域代码变量失败： " + e.message);
      }
      const dataConfig = storeDom.querySelector("div#application_config")?.getAttribute("data-config");
      if (dataConfig) {
        const countyCode = JSON.parse(dataConfig)?.["COUNTRY"];
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
          Logger.error(err);
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
      Logger.info("尝试获取区域代码");
      for (let provider of this.providers) {
        if (!provider.match()) {
          continue;
        }
        Logger.debug(`尝试通过[${provider.name()}]获取区域代码`);
        try {
          const countyCode = await provider.getCountyCode();
          Logger.info(`通过[${provider.name()}]获取区域代码成功`);
          return countyCode.toUpperCase();
        } catch (e) {
          Logger.error(`通过[${provider.name()}]获取区域代码失败`);
        }
      }
      throw new Error("所有获取区域代码策略都获取失败");
    }
  }
  class RateCache {
    constructor(from, to, rate, createdAt) {
      this.from = from;
      this.to = to;
      this.createdAt = createdAt || 0;
      this.rate = rate || 0;
    }
    from;
    to;
    createdAt;
    rate;
  }
  class RateCaches {
    caches = new Map();
    getCache(from, to) {
      const key = this.buildCacheKey(from, to);
      return this.caches.get(key);
    }
    setCache(cache) {
      this.caches.set(this.buildCacheKey(cache.from, cache.to), cache);
    }
    buildCacheKey(from, to) {
      return `${from}:${to}`;
    }
  }
  class RateManager {
    static instance = new RateManager();
    memoryCache = null;
    pendingRequests = new Map();
    isBroken = false;
constructor() {
    }
    getName() {
      return "RateManager";
    }
    async getRate4Remote(sourceCurrency, targetCurrency) {
      Logger.info(`[Rate] 远程获取汇率: ${sourceCurrency} -> ${targetCurrency}...`);
      let rate;
      const url = `https://api.augmentedsteam.com/rates/v1?to=${sourceCurrency}`;
      try {
        const res = await Http.get(Map, url);
        rate = res.get(targetCurrency)?.[sourceCurrency];
      } catch (e) {
        Logger.error(`[Rate] 获取汇率对(${sourceCurrency} -> ${targetCurrency})失败`, e);
      }
      if (rate) return rate;
      throw Error(`所有汇率获取实现对币种对(${sourceCurrency} -> ${targetCurrency})均失败`);
    }
    async getRate(sourceCurrencyCode, targetCurrencyCode) {
      if (this.isBroken) {
        throw new Error("[Rate] 汇率服务已熔断，停止请求");
      }
      const context = SpcContext.getContext();
      const from = sourceCurrencyCode || context.currentCountyInfo.currencyCode;
      const to = targetCurrencyCode || context.targetCountyInfo.currencyCode;
      const cacheKey = `${from}:${to}`;
      const pending = this.pendingRequests.get(cacheKey);
      if (pending) return pending;
      const requestPromise = (async () => {
        try {
          if (!this.memoryCache) {
            this.memoryCache = this.loadRateCache();
            Logger.info(`[Rate] 内存缓存加载:`, this.memoryCache);
          }
          let cache = this.memoryCache.getCache(from, to);
          const now = Date.now();
          const expired = context.setting.rateCacheExpired;
          if (!cache || !cache.rate || now > cache.createdAt + expired) {
            Logger.info(`[Rate] 缓存缺失或过期: ${from} -> ${to}`);
            try {
              const remoteRate = await this.getRate4Remote(from, to);
              cache = new RateCache(from, to, remoteRate, now);
              this.memoryCache.setCache(cache);
              this.saveRateCache();
            } catch (e) {
              if (cache && cache.rate) {
                Logger.warn(`[Rate] 远程刷新失败，回退至旧缓存: ${from} -> ${to}`);
                return cache.rate;
              }
              this.isBroken = true;
              Logger.error(`[Rate] 汇率获取彻底失败，触发全局熔断: ${from} -> ${to}`);
              throw e;
            }
          }
          return cache.rate;
        } finally {
          this.pendingRequests.delete(cacheKey);
        }
      })();
      this.pendingRequests.set(cacheKey, requestPromise);
      return requestPromise;
    }
    loadRateCache() {
      const setting = SpcContext.getContext().setting;
      if (setting.oldVersion !== setting.currVersion) {
        Logger.info(`脚本版本发生变化需要刷新汇率缓存`);
        this.clear();
        return new RateCaches();
      }
      Logger.info(`读取汇率缓存`);
      return GmUtils.getObjValue(RateCaches, STORAGE_KEY_RATE_CACHES, new RateCaches());
    }
    saveRateCache() {
      if (!this.memoryCache) return;
      Logger.info("保存汇率缓存", this.memoryCache);
      GmUtils.setObjValue(STORAGE_KEY_RATE_CACHES, this.memoryCache);
    }
    clear() {
      this.memoryCache = null;
      GmUtils.deleteValue(STORAGE_KEY_RATE_CACHES);
    }
  }
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
      const parent = elementSnap.element.parentElement;
      if (!parent) {
        return false;
      }
      for (const selector of this.getCssSelectors()) {
        const element = parent.querySelector(selector);
        if (element && element === elementSnap.element) {
          elementSnap.selector = selector;
          return true;
        }
      }
      return false;
    }

afterConvert(elementSnap, result) {
      if (result.converted) {
        elementSnap.element.setAttribute(Attrs.STATUS_KEY, result.convertText);
      }
    }
  }
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  const allSepChars = Array.from(new Set(
    countyInfos.flatMap((c) => [c.decimalSep, c.thousandsSep].filter(Boolean))
  )).map((s) => s === " " ? "\\s" : escapeRegex(s)).join("");
  const NUMBER_BLOCK_REGEX = new RegExp(`\\d[\\d${allSepChars}]*\\d|\\d`, "g");
  const SORTED_RULES_TEMPLATE = [...countyInfos].sort((a, b) => b.symbol.length - a.symbol.length || Number(a.fractionDigits === 0) - Number(b.fractionDigits === 0) || a.currencyCode.localeCompare(b.currencyCode));
  function tryMatchSymbol(text, numStart, numEnd, info) {
    if (info.symbolPos === "front") {
      const prefix = info.symbol + info.symbolGap;
      const start2 = numStart - prefix.length;
      if (start2 < 0) return null;
      const slice = text.substring(start2, numStart);
      if (slice.toUpperCase() !== prefix.toUpperCase()) return null;
      return { matchStart: start2, matchEnd: numEnd };
    } else {
      const suffix = info.symbolGap + info.symbol;
      const end = numEnd + suffix.length;
      if (end > text.length) return null;
      const slice = text.substring(numEnd, end);
      if (slice.toUpperCase() !== suffix.toUpperCase()) return null;
      return { matchStart: numStart, matchEnd: end };
    }
  }
  function tryMatchSymbolRelaxed(text, numStart, numEnd, info) {
    if (info.symbolPos === "front") {
      let cursor = numStart;
      while (cursor > 0 && /\s/.test(text[cursor - 1])) cursor--;
      const start2 = cursor - info.symbol.length;
      if (start2 < 0) return null;
      const slice = text.substring(start2, cursor);
      if (slice.toUpperCase() !== info.symbol.toUpperCase()) return null;
      return { matchStart: start2, matchEnd: numEnd };
    } else {
      let cursor = numEnd;
      while (cursor < text.length && /\s/.test(text[cursor])) cursor++;
      const end = cursor + info.symbol.length;
      if (end > text.length) return null;
      const slice = text.substring(cursor, end);
      if (slice.toUpperCase() !== info.symbol.toUpperCase()) return null;
      return { matchStart: numStart, matchEnd: end };
    }
  }
  function validateNumberDNA(numStr, info) {
    const seps = new Set(
      numStr.replace(/\d/g, "").split("").filter(Boolean).map((s) => /\s/.test(s) ? " " : s)
    );
    for (const sep of seps) {
      if (sep !== info.thousandsSep && sep !== info.decimalSep) {
        return false;
      }
    }
    if (info.fractionDigits === 0 && info.decimalSep && seps.has(info.decimalSep)) {
      return false;
    }
    return true;
  }
  function parseNumber(numStr, info) {
    let clean = numStr;
    if (info.thousandsSep) {
      clean = clean.split(info.thousandsSep).join("");
    }
    if (info.decimalSep && info.decimalSep !== ".") {
      clean = clean.replace(info.decimalSep, ".");
    }
    const val = parseFloat(clean);
    return isNaN(val) ? null : val;
  }
  class PriceProcessor {
static async convertContent(text) {
      const setting = SettingManager.instance.setting;
      const targetCode = SpcContext.getContext().currentCountyInfo.code;
      return await this.processTextAsync(
        text,
        setting.countyCode,
        setting.currencySymbol,
        setting.currencySymbolBeforeValue,
        targetCode
      );
    }
static async processTextAsync(text, countryCode, targetSymbol, isBefore, targetCode) {
      if (!/\d/.test(text)) return text;
      const currentRule = countyInfos.find((c) => c.code === targetCode);
      const otherRules = SORTED_RULES_TEMPLATE.filter((c) => {
        return c.code !== countryCode && c.code !== targetCode && c.currencyCode !== countyCode2Info.get(countryCode)?.currencyCode;
      });
      const matches = [];
      for (const numMatch of text.matchAll(NUMBER_BLOCK_REGEX)) {
        const numStr = numMatch[0];
        const numStart = numMatch.index;
        const numEnd = numStart + numStr.length;
        let matched = false;
        const relaxedOut = { candidate: null };
        if (currentRule && currentRule.code !== countryCode) {
          matched = this.tryRule(text, numStr, numStart, numEnd, currentRule, matches, relaxedOut);
        }
        if (!matched) {
          for (const rule of otherRules) {
            if (this.tryRule(text, numStr, numStart, numEnd, rule, matches, relaxedOut)) {
              matched = true;
              break;
            }
          }
        }
        if (!matched && relaxedOut.candidate) {
          matches.push(relaxedOut.candidate);
        }
      }
      if (matches.length === 0) return text;
      const uniqueCurrencies = [...new Set(matches.map((m) => m.info.currencyCode))];
      const rateMap = new Map();
      let setting = SpcContext.getContext().setting;
      if (setting.useCustomRate) {
        Logger.info(`[PriceProcessor] 使用自定义汇率，当前自定义汇率为${setting.customRate}`);
        uniqueCurrencies.forEach((code) => rateMap.set(code, setting.customRate));
      } else {
        await Promise.all(uniqueCurrencies.map(async (code) => {
          try {
            const rate = await RateManager.instance.getRate(code);
            rateMap.set(code, rate);
          } catch (e) {
            Logger.error(`[PriceProcessor] 获取币种汇率失败: ${code}`, e);
          }
        }));
      }
      let result = text;
      matches.sort((a, b) => b.index - a.index);
      for (const m of matches) {
        const rate = rateMap.get(m.info.currencyCode);
        if (!rate) continue;
        const converted = Number.parseFloat((m.value / rate).toFixed(2));
        const formatted = isBefore ? `(${targetSymbol}${converted})` : `(${converted}${targetSymbol})`;
        result = result.substring(0, m.index) + m.raw + formatted + result.substring(m.index + m.length);
      }
      Logger.debug(`[PriceProcessor] 转换成功，命中 ${matches.length} 处价格`);
      return result;
    }
static tryRule(text, numStr, numStart, numEnd, info, matches, relaxedOut) {
      const range = tryMatchSymbol(text, numStart, numEnd, info);
      if (range && validateNumberDNA(numStr, info)) {
        const value = parseNumber(numStr, info);
        if (value !== null) {
          const raw = text.substring(range.matchStart, range.matchEnd);
          matches.push({
            index: range.matchStart,
            length: raw.length,
            value,
            info,
            raw
          });
          return true;
        }
      }
      if (relaxedOut && !relaxedOut.candidate) {
        const relaxedRange = tryMatchSymbolRelaxed(text, numStart, numEnd, info);
        if (relaxedRange) {
          const value = parseNumber(numStr, info);
          if (value !== null) {
            const raw = text.substring(relaxedRange.matchStart, relaxedRange.matchEnd);
            relaxedOut.candidate = {
              index: relaxedRange.matchStart,
              length: raw.length,
              value,
              info,
              raw
            };
          }
        }
      }
      return false;
    }
  }
  class ElementConverter extends AbstractConverter {
    getCssSelectors() {
      const home = [
".discount_prices > .discount_final_price",
".Hxi-pnf9Xlw- span.HOrB6lehQpg-",
".btnv6_white_transparent > span"
      ];
      const category = [
".Wh0L8EnwsPV_8VAu8TOYr",
        "._3j4dI1yA7cRfCvK8h406OB",
"._1EKGZBnKFWOr3RqVdnLMRN",
        "._3fFFsvII7Y2KXNLDk_krOW"
      ];
      const account = [
"div.accountData.price",
".addfunds_area_purchase_game.game_area_purchase_game > h1",
".addfunds_area_purchase_game.game_area_purchase_game.es_custom_money > p"
      ];
      const wishlist = [
"div.vTro5UlZ-gU- > div.QO6CjVPSFuI-",
"a.En-WtuWIGUc- > span.nikULGV-7Q0-",
"div.-OkCLv-56oQ- > div._9Rf9BwU0xAQ-",
"div.-OkCLv-56oQ- > div.-HQzBzl6lqI-",
"label.qhUI2RnjHYw-",
"button.cDJOlrqyRq8-.n5jTCXrzS8A-.Focusable"
      ];
      const inventory = [
"div.f6hU22EA7Z8peFWZVBJU"
      ];
      const cart = [
".Panel.Focusable ._3-o3G9jt3lqcvbRXt8epsn.StoreOriginalPrice",
".Panel.Focusable .pk-LoKoNmmPK4GBiC9DR8",
"._2WLaY5TxjBGVyuWe_6KS3N"
      ];
      const cartCheckout = [
"#checkout_review_cart_area .checkout_review_item_price > .price",
"#review_subtotal_value.price",
"#review_total_value.price"
      ];
      const market = [
"#account_dropdown .account_name",
"#es_summary .es_market_summary_item",
"#marketWalletBalanceAmount",
"span.normal_price[data-price]",
"button.inqz7Zdx9Xg-.ob-nIzzquk8-.fkz-MePtKwI-.D8IENuW8Q7w-",
"span.IokSIloSPlA-",

"text.recharts-text.recharts-cartesian-axis-tick-value > tspan"
      ];
      const notify = [
".QFW0BtI4l77AFmv1xLAkx._1B1XTNsfuwOaDPAkkr8M42 ._3hEeummFKRey8l5VXxZwxz > span"
      ];
      const app = [
".game_area_purchase_game_dropdown_selection > span",
".game_area_purchase_game_dropdown_menu_items_container_background.game_area_purchase_game_dropdown_menu_items_container  td.game_area_purchase_game_dropdown_menu_item_text"
      ];
      const selectors = [

".discount_original_price",
        ".discount_final_price",
        ".col.search_price.responsive_secondrow strike",
"#header_wallet_balance > span.tooltip",
".esi-wishlist-stat > .num",
".salepreviewwidgets_StoreOriginalPrice_1EKGZ",
        ".salepreviewwidgets_StoreSalePriceBox_Wh0L8",
".contenthubshared_OriginalPrice_3hBh3",
        ".contenthubshared_FinalPrice_F_tGv",
        ".salepreviewwidgets_StoreSalePriceBox_Wh0L8:not(.salepreviewwidgets_StoreSalePrepurchaseLabel_Wxeyn)",
"tr.wallet_table_row > td.wht_total",
        "tr.wallet_table_row > td.wht_wallet_change.wallet_column",
        "tr.wallet_table_row > td.wht_wallet_balance.wallet_column",
".package_totals_row > .price:not(.bundle_discount)",
        "#package_savings_bar > .savings.bundle_savings",
".home_page_content_title a.btn_small_tall > span"
      ];
      selectors.push(...home);
      selectors.push(...category);
      selectors.push(...account);
      selectors.push(...wishlist);
      selectors.push(...inventory);
      selectors.push(...cart);
      selectors.push(...cartCheckout);
      selectors.push(...market);
      selectors.push(...notify);
      selectors.push(...app);
      return selectors;
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
      this.targets.get(selector);
      const parseNodeFns = this.targets.get(selector) || [];
      if (!parseNodeFns) {
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
          console.debug("获取文本节点失败，但不确定该节点是否一定会出现。selector：" + selector);
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
      return this.converters.map((exchanger) => exchanger.getCssSelectors()).flat(1).join(", ");
    }
    async convert(elements) {
      if (!elements) {
        return;
      }
      const tasks = [];
      elements.forEach((element) => {
        const elementSnap = {
          element,
          textContext: element.textContent,
          classList: element.classList,
          attributes: element.attributes
        };
        this.converters.filter((converter) => converter.match(elementSnap)).forEach((converter) => {
          const task = (async () => {
            try {
              const elementConverted = await converter.convert(elementSnap);
              if (elementConverted) {
                converter.afterConvert(elementSnap, elementConverted);
              }
            } catch (e) {
              console.group("转换失败");
              console.error(e);
              console.error("转换失败请将下列内容反馈给开发者，右键 > 复制(copy) > 复制元素(copy element)");
              console.error("↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓");
              console.error(element);
              console.error("↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑");
              console.groupEnd();
            }
          })();
          tasks.push(task);
        });
      });
      await Promise.all(tasks);
    }
  }
  async function initializeConversion() {
    if (!GM_getValue("sse_convert_enabled", true)) return;
    try { await initContext(); await start(); }
    catch (error) { Logger.error("价格转换初始化失败", error); }
  }
  async function start() {
    const context = SpcContext.getContext();
    if (context.setting.disableOnMarket && window.location.href === "https://steamcommunity.com/market/") {
      Logger.info("已开启市场首页禁用，跳过转换");
      return;
    }
    if (context.currentCountyInfo.code === context.targetCountyInfo.code) {
      Logger.info(`${context.currentCountyInfo.name}无需转换`);
      return;
    }
    Logger.info(` 核心启动：目标：${context.targetCountyInfo.name}`);
    await convert();
  }
  async function convert() {
    const exchangerManager = ConverterManager.instance;
    const elements = document.querySelectorAll(exchangerManager.getSelector());
    await exchangerManager.convert(elements);
    const selector = exchangerManager.getSelector();
    const priceObserver = new MutationObserver(async (mutations) => {
      const uniqueTargets = new Set();
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          const parentEl = mutation.target.parentElement;
          if (parentEl && parentEl.matches(selector)) {
            uniqueTargets.add(parentEl);
          }
          const closestEl = parentEl?.closest(selector);
          if (closestEl) {
            uniqueTargets.add(closestEl);
          }
        } else {
          const target = mutation.target;
          const priceEls = target.querySelectorAll(selector);
          priceEls.forEach((el) => uniqueTargets.add(el));
        }
      });
      if (uniqueTargets.size > 0) {
        await exchangerManager.convert(uniqueTargets);
      }
    });
    priceObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
  async function initContext() {
    const setting = SettingManager.instance.setting;
    setLogLevel(setting.logLevel);
    let targetCountyInfo = countyCode2Info.get(setting.countyCode);
    if (!targetCountyInfo) {
      Logger.warn(`获取转换后的国家(${setting.countyCode})信息失败，默认为美国：` + setting.countyCode);
      targetCountyInfo = countyCode2Info.get("US");
    }
    Logger.info("目标区域：", targetCountyInfo);
    const currCountyCode = await CountyCodeProviderManager.instance.getCountyCode();
    if (currCountyCode) {
      Logger.info("区域代码：", currCountyCode);
    }
    let currCountInfo = countyCode2Info.get(currCountyCode);
    if (!currCountInfo) {
      Logger.warn("缺少当前国家的信息映射：county: " + currCountyCode + ", 默认为美国");
      currCountInfo = countyCode2Info.get("US");
    }
    Logger.info("当前区域：", currCountInfo);
    _unsafeWindow.SpcManager = SpcManager.instance;
    _unsafeWindow.spcContext = new SpcContext(setting, targetCountyInfo, currCountInfo);
  }


  const convertedNodes = new WeakMap();
  const convertingNodes = new WeakSet();
  async function convertPriceTextNodes(root) {
    const nodes = [];
    if (root.nodeType === 3) nodes.push(root);
    else {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) nodes.push(walker.currentNode);
    }
    await Promise.all(nodes.map(async node => {
      if (node.parentElement?.closest('.sapx-extra-price, #sapx-cart-summary, #sapx-ui-root') ||
          convertedNodes.get(node) === node.nodeValue || convertingNodes.has(node)) return;
      const original = node.nodeValue;
      if (!original || !/\d/.test(original)) return;
      convertingNodes.add(node);
      try {
        const result = await PriceProcessor.convertContent(original);
        if (node.isConnected && node.nodeValue === original) {
          convertedNodes.set(node, result);
          if (result !== original) node.nodeValue = result;
        }
      } finally { convertingNodes.delete(node); }
    }));
  }
  return {
    get setting() { return SettingManager.instance.setting; },
    countries: countyInfos,
    save: setting => SettingManager.instance.saveSetting(setting),
    start: initializeConversion
  };

  })();

  // ---- family-library.js ----
  function initializeFamilyLibrary() {
    const KEY = 'sse_family_cache_v1';
    const DAY = 86400000;
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    const onStore = location.hostname === 'store.steampowered.com';
    const enabled = GM_getValue('sse_family_enabled', true);
    let cache = GM_getValue(KEY, null);
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

    function readIdentity() {
      const session = readStoreSession(document, page);
      return { steamid: session.steamid, token: session.token };
    }
    try { if (onStore) accountId = readIdentity().steamid; }
    catch (_) { notice = '暂时无法读取登录信息，请刷新 Steam 商店页面。'; }
    function validCache() {
      return cache && cache.apps && (!onStore || !accountId || cache.steamid === accountId);
    }
    function ownerName(id) { return cache?.names?.[String(id)] || String(id); }
    function gameDescription(game) {
      const owners = game.owners.map(ownerName).join('、');
      return '家庭库贡献者：' + owners + (game.time ? '\n记录的最早购入时间：' + new Date(game.time * 1000).toLocaleString() : '');
    }
    async function api(method, token, params) {
      const url = new URL('https://api.steampowered.com/' + method + '/v1/');
      url.searchParams.set('access_token', token);
      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
      const parsed = JSON.parse(await gmGet(url.href));
      if (!parsed.response) throw new Error('Steam 返回了无效的家庭库数据。');
      return parsed.response;
    }
    function refreshNotice() {
      if (root) renderDialog();
    }
    function scan() {
      if (scanPromise) return scanPromise;
      scanPromise = (async () => {
        if (!onStore) throw new Error('请在已登录的 Steam 商店页面中扫描家庭库。');
        const identity = readIdentity();
        if (!identity.token) throw new Error('无法读取登录凭据，请登录 Steam 商店后刷新页面。');
        notice = '正在读取家庭组……'; refreshNotice();
        const family = await api('IFamilyGroupsService/GetFamilyGroupForUser', identity.token, { include_family_group_response: true });
        if (!family.family_groupid || !family.family_group) throw new Error('当前账号没有可读取的 Steam 家庭组。');
        const members = family.family_group.members || [];
        // The API identifies the signed-in member even when the SSR page omits its SteamID.
        const self = identity.steamid || String(family.steamid || '');
        if (!self) throw new Error('无法确认当前账号 SteamID，未覆盖已保存的家庭库。');
        notice = '正在扫描家庭库游戏……'; refreshNotice();
        const library = await api('IFamilyGroupsService/GetSharedLibraryApps', identity.token, {
          family_groupid: family.family_groupid, include_own: true, include_excluded: false, include_non_games: false
        });
        if (!Array.isArray(library.apps)) throw new Error('家庭库接口没有返回游戏列表，原缓存已保留。');
        const names = Object.fromEntries(members.map(member => [String(member.steamid), String(member.steamid)]));
        try {
          const params = Object.fromEntries(members.map((member, index) => ['steamids[' + index + ']', member.steamid]));
          const players = await api('IPlayerService/GetPlayerLinkDetails', identity.token, params);
          for (const player of players.accounts || []) {
            if (player.public_data?.steamid) names[String(player.public_data.steamid)] = player.public_data.persona_name || String(player.public_data.steamid);
          }
        } catch (_) { notice = '游戏已读取，部分成员昵称暂时无法获取，将显示 SteamID。'; }
        const apps = {};
        for (const app of library.apps) {
          if (Number(app.exclude_reason || 0) !== 0 || !Number.isSafeInteger(Number(app.appid))) continue;
          apps[app.appid] = { name: app.name || String(app.appid), owners: [...new Set((app.owner_steamids || []).map(String))], time: Number(app.rt_time_acquired) || 0 };
        }
        cache = { steamid: self, familyId: String(family.family_groupid), name: family.family_group.name || 'Steam 家庭', members: members.map(member => String(member.steamid)), names, apps, updated: Date.now() };
        accountId = self;
        GM_setValue(KEY, cache);
        notice = '扫描完成，已缓存 ' + Object.keys(apps).length + ' 个家庭库游戏。';
        updateMarks();
      })().catch(error => { notice = error.message || '家庭库扫描失败，原缓存已保留。'; })
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
      if (!root) {
        root = createElement('div');
        root.id = 'sse-family-dialog';
        root.addEventListener('click', event => { if (event.target === root) close(); });
        document.documentElement.appendChild(root);
      }
      renderDialog();
    }
    function close() { hideChartTooltip(); root?.remove(); root = null; }
    let chartTooltip = null;
    function hideChartTooltip() { chartTooltip?.remove(); chartTooltip = null; }
    function showChartTooltip(content, x, y) {
      if (!chartTooltip) {
        chartTooltip = createElement('div'); chartTooltip.id = 'sse-family-chart-tooltip'; chartTooltip.setAttribute('role', 'tooltip');
        document.documentElement.appendChild(chartTooltip);
      }
      chartTooltip.textContent = content;
      const bounds = chartTooltip.getBoundingClientRect();
      chartTooltip.style.left = Math.max(12, Math.min(x + 14, window.innerWidth - bounds.width - 12)) + 'px';
      chartTooltip.style.top = Math.max(12, Math.min(y + 14, window.innerHeight - bounds.height - 12)) + 'px';
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
    window.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
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
        GM_deleteValue(KEY); cache = null; notice = '家庭库缓存已清空。'; updateMarks(); renderDialog();
      }), action('关闭', close));
      const summary = validCache() ? cache.name + ' · ' + Object.keys(cache.apps).length + ' 个游戏 · 上次扫描：' + new Date(cache.updated).toLocaleString() : '暂无当前账号的家庭库缓存。';
      panel.append(createElement('div', summary + '\n' + (notice || (!onStore ? '请前往 Steam 商店扫描，本站使用已保存的缓存。' : '')), 'sse-family-status'));
      if (validCache()) {
        panel.append(createElement('h3', '家庭成员贡献统计'));
        const games = Object.values(cache.apps);
        const totals = cache.members.map(id => games.filter(game => game.owners.includes(id)).length);
        const maximum = Math.max(1, ...totals);
        const colors = ['#67c1f5', '#06cfbe', '#a0c85a', '#d7a64c', '#bb83db', '#e18484'];
        cache.members.forEach((id, index) => {
          const row = createElement('div', undefined, 'sse-family-chart-row');
          const bar = createElement('div', undefined, 'sse-family-chart-bar');
          const counts = Array.from({ length: Math.max(1, cache.members.length) }, () => 0);
          for (const game of games) if (game.owners.includes(id)) counts[Math.min(counts.length, game.owners.length) - 1]++;
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
    }

    const targets = 'a[href*="/app/"], [data-ds-appid], [data-app-id], [data-rfd-draggable-id^="WishlistItem-"]';
    function appId(element) {
      const value = element.getAttribute('data-ds-appid') || element.getAttribute('data-app-id');
      if (value && /^\d+$/.test(value)) return value;
      const wishlist = element.getAttribute('data-rfd-draggable-id')?.match(/^WishlistItem-(\d+)/);
      if (wishlist) return wishlist[1];
      const href = element.getAttribute('href') || '';
      const match = href.match(/^(?:https?:\/\/(?:store\.steampowered\.com|steamcommunity\.com))?\/app\/(\d+)/);
      return match?.[1] || null;
    }
    function updateMarks() {
      ensureFamilyNav();
      const active = enabled && validCache();
      document.querySelectorAll('[data-sse-family-app]').forEach(element => {
        const id = element.getAttribute('data-sse-family-app');
        const game = active ? cache.apps[id] : null;
        if (!game || game.owners.includes(cache.steamid) || appId(element) !== id) {
          element.querySelector(':scope > .sse-family-badge')?.remove(); element.removeAttribute('data-sse-family-app');
        }
      });
      document.querySelectorAll('.sse-family-banner').forEach(element => element.remove());
      if (!active) return;
      document.querySelectorAll(targets).forEach(element => {
        if (element.closest('#sse-family-dialog, #sapx-ui-root, #sse-cart-tools, .sse-family-banner, .sse-family-badge')) return;
        const id = appId(element); const game = cache.apps[id];
        if (!game || game.owners.includes(cache.steamid) || element.classList.contains('ds_owned') || element.querySelector('.ds_owned_flag:not(.sse-family-badge)')) return;
        const owner = element.parentElement?.closest(targets);
        if (owner && appId(owner) === id) return;
        element.setAttribute('data-sse-family-app', id);
        let badge = element.querySelector(':scope > .sse-family-badge');
        if (!badge) { badge = createElement('span', '在家庭库中', 'sse-family-badge'); element.appendChild(badge); }
        const title = gameDescription(game);
        if (badge.title !== title) badge.title = title;
      });
      const detailId = location.pathname.match(/^\/app\/(\d+)/)?.[1];
      const detail = cache.apps[detailId];
      if (onStore && detail) {
        const host = document.querySelector('.queue_and_playtime, #game_area_purchase, .game_area_purchase');
        if (host) {
          const banner = createElement('div', detail.owners.includes(cache.steamid) ? '您和家庭成员拥有此游戏' : '您的 Steam 家庭库中已有此游戏', 'sse-family-banner');
          banner.title = gameDescription(detail);
          banner.appendChild(action('查看贡献者（' + detail.owners.length + '）', () => window.alert(gameDescription(detail))));
          const launch = createElement('a', '马上开玩'); launch.href = 'steam://launch/' + detailId + '/Dialog'; banner.appendChild(launch);
          host.prepend(banner);
        }
      }
      if (location.hostname === 'steamdb.keylol.com') {
        const id = location.hash.match(/app\/(\d+)/)?.[1]; const game = cache.apps[id]; const host = document.querySelector('#game_score');
        if (game && !game.owners.includes(cache.steamid) && host) host.after(createElement('div', '家庭组：' + gameDescription(game), 'sse-family-banner'));
      }
    }
    if (enabled) {
      let timer = null;
      const observer = new MutationObserver(mutations => {
        const relevant = mutations.some(mutation => {
          const element = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
          if (element?.closest('#sse-family-dialog, #sapx-ui-root, .sse-family-banner, .sse-family-badge')) return false;
          if (mutation.type === 'attributes') return true;
          return [...mutation.addedNodes, ...mutation.removedNodes].some(item => item.nodeType === 1 && !item.matches('.sse-family-badge, .sse-family-banner'));
        });
        if (timer || !relevant) return;
        timer = setTimeout(() => { timer = null; updateMarks(); }, 350);
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'data-ds-appid', 'data-app-id', 'data-rfd-draggable-id'] });
      window.addEventListener('hashchange', updateMarks);
      updateMarks();
      if (onStore && GM_getValue('sse_family_auto', true) && (!validCache() || Date.now() - cache.updated >= DAY)) scan();
    }
    return { open };
  }

  // ---- cart-tools.js ----
  function initializeCartTools() {
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
      .game_purchase_action .sse-native-cart{position:static;margin:0;padding:0;border:0;cursor:pointer;display:inline-block}
      .sse-cart-dialog{position:fixed;inset:0;background:#000b;z-index:2147483646;display:grid;place-items:center;padding:12px}
      .sse-cart-dialog>div{width:min(500px,90vw);max-height:80vh;overflow:auto;background:#1b2838;border:1px solid #34465a;border-radius:6px;padding:18px;color:#c6d4df}
      .sse-cart-dialog h3{color:#e5e5e5;margin-top:0}.sse-cart-dialog .sse-cart-button{display:block;width:100%;margin-top:8px;text-align:left}
    `;
    document.head.appendChild(style);
    let contextPromise;
    let busy = false;
    const itemRequests = new Map();

    function readContext(doc, globals = {}) {
      const session = readStoreSession(doc, globals);
      return { token: session.token, country: session.country, language: session.language };
    }

    async function context() {
      if (!contextPromise) contextPromise = (async () => {
        let result = readContext(document, page);
        if (!result.token || !result.country) {
          const html = await gmGet('https://store.steampowered.com/cart/');
          const remote = new DOMParser().parseFromString(html, 'text/html');
          const fallback = readContext(remote);
          result = { ...result, token: result.token || fallback.token, country: result.country || fallback.country };
        }
        if (!result.token || !result.country) throw new Error(text('无法读取账号信息，请先登录 Steam 商店并刷新页面。', 'Sign in to the Steam store and refresh this page.'));
        return result;
      })().catch(error => { contextPromise = null; throw error; });
      return contextPromise;
    }

    async function account(method, payload) {
      const current = await context();
      const url = new URL('https://api.steampowered.com/IAccountCartService/' + method + '/v1/');
      url.searchParams.set('access_token', current.token);
      const options = { method: payload === undefined ? 'GET' : 'POST', signal: AbortSignal.timeout(20000) };
      if (payload !== undefined) options.body = new URLSearchParams({ input_json: JSON.stringify({ user_country: current.country, ...payload }) });
      const response = await fetch(url.href, options);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      const resultCode = response.headers?.get('x-eresult');
      if ((resultCode && resultCode !== '1') || (data.response?.result != null && data.response.result !== 1)) {
        throw new Error(text('Steam 拒绝了购物车操作。', 'Steam rejected the cart operation.'));
      }
      if (!data.response) throw new Error(text('Steam 返回了无效结果。', 'Invalid Steam response.'));
      return data.response;
    }

    async function storeItem(item) {
      const key = item.type + '/' + item.id;
      if (!itemRequests.has(key)) itemRequests.set(key, (async () => {
        const current = await context();
        const field = { app: 'appid', sub: 'packageid', bundle: 'bundleid' }[item.type];
        const payload = { ids: [{ [field]: item.id }], context: { language: current.language, country_code: current.country, steam_realm: 1 }, data_request: { include_all_purchase_options: true } };
        const response = JSON.parse(await requestQueue.enqueue(() => gmGet('https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=' + encodeURIComponent(JSON.stringify(payload)))));
        const result = response.response?.store_items?.[0];
        if (!result) throw new Error(text('无法读取商品：', 'Cannot read item: ') + key);
        return result;
      })().catch(error => { itemRequests.delete(key); throw error; }));
      return itemRequests.get(key);
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
      return { items, invalid };
    }

    function optionsFor(item, data) {
      const options = data.purchase_options?.length ? data.purchase_options : data.best_purchase_option ? [data.best_purchase_option] : [];
      return options.filter(option => (option.packageid || option.bundleid) &&
        (item.type === 'app' || (item.type === 'sub' ? Number(option.packageid) === item.id : Number(option.bundleid) === item.id)));
    }

    function chooseOption(options, title = text('选择购买版本', 'Choose an edition')) {
      return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'sse-cart-dialog';
        const panel = document.createElement('div');
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        const heading = document.createElement('h3');
        heading.textContent = title;
        panel.appendChild(heading);
        const close = value => { overlay.remove(); window.removeEventListener('keydown', escape); resolve(value); };
        const escape = event => { if (event.key === 'Escape') close(null); };
        for (const option of options) panel.appendChild(button((option.purchase_option_name || '') + ' · ' + (option.formatted_final_price || ''), () => close(option)));
        panel.appendChild(button(text('取消', 'Cancel'), () => close(null)));
        overlay.appendChild(panel);
        overlay.addEventListener('click', event => { if (event.target === overlay) close(null); });
        window.addEventListener('keydown', escape);
        document.body.appendChild(overlay);
        panel.querySelector('button').focus();
      });
    }

    async function addOptions(options) {
      const items = options.map(option => ({ ...(option.packageid ? { packageid: option.packageid } : { bundleid: option.bundleid }), flags: { is_gift: false, is_private: false } }));
      if (!items.length) return;
      for (let offset = 0; offset < items.length; offset += 50) await account('AddItemsToCart', { items: items.slice(offset, offset + 50) });
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
        try { await action(); }
        catch (error) { window.alert(error.message || String(error)); }
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
      panel.style.width = '100%';
    }

    function mountPanel() {
      if (!isCartPage()) return;
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
        catch (error) { status.textContent = error.message || String(error); }
        finally { busy = false; panel.querySelectorAll('button').forEach(element => { element.disabled = false; }); }
      };
      toolbar.append(button(text('导入', 'Import'), run(async () => {
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
            if (!option) { results.push(key + ' # ' + text('无可购买项目', 'No purchase option')); continue; }
            if (importSale.control.checked && !(Number(option.discount_pct) > 0)) { results.push(key + ' # ' + text('未打折，跳过', 'Not discounted, skipped')); continue; }
            const purchaseKey = option.packageid ? 'sub/' + option.packageid : 'bundle/' + option.bundleid;
            if (!seen.has(purchaseKey)) { selected.push(option); seen.add(purchaseKey); }
            results.push(purchaseKey + ' # ' + (option.purchase_option_name || data.name || '') + ' ' + (option.formatted_final_price || ''));
          } catch (error) { results.push(key + ' # ' + error.message); }
        }
        save(results.join('\n'));
        if (!selected.length) { status.textContent = text('没有符合条件的商品。', 'No matching items.'); return; }
        await addOptions(selected);
        status.textContent = text('已提交加购，请刷新购物车查看结果。', 'Items submitted. Refresh the cart to see the result.');
      })), importSale.wrapper);
      toolbar.append(button(text('导出', 'Export'), run(async () => {
        const { cart } = await account('GetCart');
        const lines = [];
        for (const item of cart?.line_items || []) {
          const target = { type: item.packageid ? 'sub' : 'bundle', id: Number(item.packageid || item.bundleid) };
          if (!target.id) continue;
          let data;
          try { data = await storeItem(target); }
          catch (error) { if (exportSale.control.checked) throw error; }
          const option = data ? optionsFor(target, data)[0] : null;
          if (exportSale.control.checked && !(Number(option?.discount_pct) > 0)) continue;
          lines.push(target.type + '/' + target.id + ' # ' + (option?.purchase_option_name || data?.name || '') + ' ' + (item.price_when_added?.formatted_amount || option?.formatted_final_price || ''));
        }
        if (!lines.length) { status.textContent = text('购物车为空或没有符合条件的商品。', 'Cart is empty or no items match.'); return; }
        const output = '# ' + new Date().toLocaleString() + '\n' + lines.join('\n');
        if (input.value.trim()) {
          const choice = await chooseOption([
            { purchase_option_name: text('覆盖原有内容', 'Replace existing text'), formatted_final_price: '', mode: 'replace' },
            { purchase_option_name: text('追加到末尾', 'Append to existing text'), formatted_final_price: '', mode: 'append' }
          ], text('导出方式', 'Export mode'));
          if (!choice) { status.textContent = text('已取消。', 'Cancelled.'); return; }
          save(choice.mode === 'append' ? input.value.trimEnd() + '\n' + output : output);
        } else save(output);
        status.textContent = text('导出完成。', 'Export complete.');
      })), exportSale.wrapper);
      const edit = gift => run(async () => {
        let giftInfo = null;
        if (gift) {
          const value = window.prompt(text('输入接收人的 SteamID 或好友代码；留空暂不指定，取消则停止操作。', 'Recipient SteamID or friend code; leave blank to skip recipient, or cancel to stop.'));
          if (value === null) { status.textContent = text('已取消。', 'Cancelled.'); return; }
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
        const items = cart?.line_items || [];
        for (const [index, item] of items.entries()) {
          await account('ModifyLineItem', { line_item_id: item.line_item_id, gift_info: giftInfo, flags: { is_gift: gift, is_private: false } });
          status.textContent = (index + 1) + '/' + items.length;
        }
        status.textContent = text('修改完成，请刷新购物车查看结果。', 'Updated. Refresh the cart to see the result.');
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
          location.reload();
        }))
      );
      panel.append(title, toolbar, input, bottom, status);
      cartPanel = panel;
      placeCartPanel(panel, anchor);
    }

    const quickSelector = 'a.search_result_row, a.tab_item, a.recommendation_link, .wishlist_row, [data-rfd-draggable-id^="WishlistItem-"], .game_purchase_action';
    function scanQuickButtons() {
      mountPanel();
      if (!isCartPage() && document.querySelector(quickSelector) && !document.getElementById('sse-cart-extract')) {
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
            window.alert(text('已保存商品列表，可前往购物车批量导入。', 'List saved. Open the cart to import it.'));
          });
          extract.id = 'sse-cart-extract';
          host.prepend(extract);
        }
      }
      document.querySelectorAll(quickSelector).forEach(row => {
        if (row.querySelector('.sse-quick-add')) return;
        const inferred = inferItemFromScope(row);
        if (!inferred) return;
        const item = { type: inferred.type === 'package' ? 'sub' : inferred.type, id: Number(inferred.id) };
        if (!Number.isSafeInteger(item.id) || item.id <= 0) return;
        const purchaseRow = row.matches('.game_purchase_action');
        const nativeButton = purchaseRow ? row.querySelector('a[href*="addToCart"], a[onclick*="addToCart"], button[onclick*="addToCart"], a[href*="addBundleToCart"], a[onclick*="addBundleToCart"], button[onclick*="addBundleToCart"], a.btn_addtocart, button.btn_addtocart') : null;
        if (purchaseRow && !nativeButton) return;
        const control = button(text('＋ 加入购物车', '＋ Add to cart'), async () => {
          const currentItem = inferItemFromScope(row);
          if (!currentItem) return;
          const target = { type: currentItem.type === 'package' ? 'sub' : currentItem.type, id: Number(currentItem.id) };
          const options = optionsFor(target, await storeItem(target));
          if (!options.length) throw new Error(text('未找到可购买版本，可能尚未发行、免费或受地区限制。', 'No purchase options: unreleased, free, or region restricted.'));
          const chosen = options.length === 1 ? options[0] : await chooseOption(options);
          if (!chosen) return;
          await addOptions([chosen]);
          const label = control.querySelector('span') || control;
          label.textContent = text('✓ 已提交加购', '✓ Submitted');
          const cartButton = document.getElementById('store_header_cart_btn');
          if (cartButton) cartButton.style.display = '';
        });
        control.classList.add('sse-quick-add');
        if (nativeButton) {
          control.className = nativeButton.className + ' sse-quick-add sse-native-cart';
          const label = document.createElement('span');
          label.textContent = text('加入购物车', 'Add to Cart');
          control.replaceChildren(label);
          // Keep purchase IDs available after replacing the native button.
          control.setAttribute(item.type === 'bundle' ? 'data-ds-bundleid' : item.type === 'sub' ? 'data-ds-packageid' : 'data-ds-appid', String(item.id));
          nativeButton.replaceWith(control);
        } else {
          row.appendChild(control);
        }
      });
    }
    let timer = null;
    const observer = new MutationObserver(mutations => {
      if (timer || !mutations.some(mutation => !mutation.target.parentElement?.closest('#sse-cart-tools, .sse-cart-dialog, #sapx-ui-root'))) return;
      timer = setTimeout(() => { timer = null; scanQuickButtons(); }, 400);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', () => mountPanel(), { passive: true });
    scanQuickButtons();
    if (GM_getValue('sse_cart_country', false)) context().then(current => {
      const host = document.querySelector('#header_wallet_ctn');
      if (host && !host.querySelector('.sse-account-country')) {
        const label = document.createElement('span');
        label.className = 'sse-account-country';
        label.textContent = ' [' + current.country + ']';
        host.appendChild(label);
      }
    }).catch(error => console.warn('Steam Store Enhancer:', error.message));
  }

  // ---- main.js ----
  function initialize() {
    addStyle();
    GM_registerMenuCommand('设置：Steam Store Enhancer', openSettingsUI);
    if (location.hostname === 'store.steampowered.com' && GM_getValue('sse_extra_enabled', true)) {
      scheduleScan();
      startObserver();
    }
    if (/^(store\.steampowered\.com|steamcommunity\.com|checkout\.steampowered\.com)$/.test(location.hostname)) {
      conversion.start();
    }
    const family = initializeFamilyLibrary();
    if (GM_getValue('sse_cart_enabled', true) && /^(store\.steampowered\.com|steamcommunity\.com)$/.test(location.hostname)) {
      initializeCartTools();
    }
    return family;
  }

  const familyLibrary = initialize();
})();
