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
