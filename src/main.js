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
    { name: 'wishlist-sale', key: 'sse_wishlist_sale_enabled', match: () => location.hostname === 'store.steampowered.com' && isWishlistPage(), start: initializeWishlistSaleCountdown }
  ];
  function startFeatureRuntime() {
    const runtime = createFeatureScope('runtime');
    let signature;
    function reconcile() {
      const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
      const user = page.UserConfig?.steamid || page.g_steamID || page.g_AccountID || '';
      const next = JSON.stringify([location.pathname, location.search, user,
        ...FEATURE_DEFINITIONS.map(feature => feature.key ? GM_getValue(feature.key, true) : null),
        GM_getValue('sse_family_enabled', true), GM_getValue('sse_family_auto', true)]);
      if (next === signature) return;
      signature = next;
      for (const feature of FEATURE_DEFINITIONS) featureScopes.get(feature.name)?.dispose();
      for (const feature of FEATURE_DEFINITIONS) {
        if (!feature.match() || (feature.key && !GM_getValue(feature.key, true))) continue;
        try {
          const result = feature.start();
          if (result?.catch) result.catch(error => diagnostics.scope('core').error('feature.failed', '功能初始化失败', { name: feature.name, error }));
        } catch (error) { diagnostics.scope('core').error('feature.failed', '功能初始化失败', { name: feature.name, error }); }
      }
    }
    runtime.interval(reconcile, 1000);
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
