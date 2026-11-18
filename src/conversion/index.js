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
      return gmRequest(details.url, { ...details, signal: conversionScope?.signal }).then(response => {
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
    getContext: () => SpcContext.getContext(),
    fetchRates: from => Http.get(Map, `https://api.augmentedsteam.com/rates/v1?to=${from}`)
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
      for (const selector of this.getCssSelectors()) {
        if (elementSnap.element.matches(selector)) {
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
  const PriceProcessor = createPriceProcessor({ countries: countyInfos, countryMap: countyCode2Info,
    getSetting: () => SettingManager.instance.setting, getContext: () => SpcContext.getContext(),
    getRate: code => RateManager.instance.getRate(code), isCart: isCartPage
  });
  class ElementConverter extends AbstractConverter {
    getCssSelectors() {
      return getConversionSelectors();
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
              log.error('nodes.convert-failed', '价格转换失败', { error: e, element });
            }
          })();
          tasks.push(task);
        });
      });
      await Promise.all(tasks);
    }
  }
  let conversionScope;
  async function initializeConversion() {
    if (!GM_getValue("sse_convert_enabled", true)) { log.debug('initialize.skip', '价格转换已关闭'); return; }
    const scope = conversionScope = createFeatureScope('conversion');
    scope.own(() => {
      for (const [node, state] of convertedOriginals) {
        if (node.isConnected && node.nodeValue === state.result) node.nodeValue = state.original;
      }
      convertedOriginals.clear();
      document.querySelectorAll('[' + Attrs.STATUS_KEY + ']').forEach(node => node.removeAttribute(Attrs.STATUS_KEY));
    });
    const task = log.begin('initialize', undefined, 'info');
    try {
      // SSR text must stay intact until React has adopted the server-rendered cart.
      if (isCartPage() && _unsafeWindow.SSR) {
        task.debug('hydrate.wait', '等待购物车页面接管服务端内容');
        const deadline = Date.now() + 15000;
        while (scope.active && !_unsafeWindow.SSR.hydrated && Date.now() < deadline) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        task.debug('hydrate.ready', '结束页面就绪等待', { hydrated: Boolean(_unsafeWindow.SSR.hydrated) });
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
    let currCountInfo = countyCode2Info.get(currCountyCode);
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
  const convertedOriginals = new Map();
  async function convertPriceTextNodes(root) {
    const scope = conversionScope;
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
        if (scope?.active !== false && node.isConnected && node.nodeValue === original) {
          convertedNodes.set(node, result);
          if (result !== original) {
            convertedOriginals.set(node, { original, result });
            node.nodeValue = result;
          }
        }
      } finally { convertingNodes.delete(node); }
    }));
    for (const node of convertedOriginals.keys()) if (!node.isConnected) convertedOriginals.delete(node);
  }
  return {
    get setting() { return SettingManager.instance.setting; },
    countries: countyInfos,
    save: setting => SettingManager.instance.saveSetting(setting),
    start: initializeConversion
  };

  })();
