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
