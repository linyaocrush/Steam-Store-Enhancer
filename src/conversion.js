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
  const Logger = createLogger('汇率转换');
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
      const sessionGlobals = storeDom === document ? _unsafeWindow : {};
      const sessionCountry = readStoreSession(storeDom, sessionGlobals).country;
      if (sessionCountry && /^[A-Z]{2}$/i.test(sessionCountry)) return sessionCountry.toUpperCase();
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
          Logger.debug(`通过[${provider.name()}]获取区域代码失败`, e?.message || e);
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
      const isCart = isCartPage();
      const otherRules = SORTED_RULES_TEMPLATE.filter((c) => {
        return c.code !== targetCode && (isCart || (c.code !== countryCode && c.currencyCode !== countyCode2Info.get(countryCode)?.currencyCode));
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
      if (isCartPage()) {
        selectors.push(
          '.StoreOriginalPrice',
          '.j3jr1YqpBGk- > .-nS4ZC0Bruo-',
          '.i1XZFikuzME- .n9HLAjXXhvI-',
          'main [class*="price" i]',
          'main [class*="Price"]',
          '[role="main"] [class*="price" i]',
          '[class*="cart" i] [class*="price" i]',
          '[data-testid*="price" i]'
        );
      }
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
          Logger.debug("获取文本节点失败，但不确定该节点是否一定会出现。selector：" + selector);
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
              Logger.error('价格转换失败', e.message, element);
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
    try {
      // SSR text must stay intact until React has adopted the server-rendered cart.
      if (isCartPage() && _unsafeWindow.SSR) {
        const deadline = Date.now() + 15000;
        while (!_unsafeWindow.SSR.hydrated && Date.now() < deadline) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      await initContext();
      await start();
    }
    catch (error) { Logger.error("价格转换初始化失败", error); }
  }
  async function start() {
    const context = SpcContext.getContext();
    if (context.setting.disableOnMarket && window.location.href === "https://steamcommunity.com/market/") {
      Logger.info("已开启市场首页禁用，跳过转换");
      return;
    }
    if (context.currentCountyInfo.code === context.targetCountyInfo.code && !isCartPage()) {
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
          if (target.matches?.(selector)) uniqueTargets.add(target);
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
    let targetCountyInfo = countyCode2Info.get(setting.countyCode);
    if (!targetCountyInfo) {
      Logger.warn(`获取转换后的国家(${setting.countyCode})信息失败，默认为美国：` + setting.countyCode);
      targetCountyInfo = countyCode2Info.get("US");
    }
    Logger.info("目标区域：", targetCountyInfo);
    let currCountyCode;
    try {
      currCountyCode = await CountyCodeProviderManager.instance.getCountyCode();
    } catch (error) {
      if (!isCartPage()) throw error;
      currCountyCode = 'US';
      Logger.warn('购物车无法读取账号地区，改按商品价格中的币种符号识别原币种', error.message);
    }
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
