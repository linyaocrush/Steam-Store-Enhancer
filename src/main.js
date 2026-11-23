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
    { name: 'game-hover', key: 'sse_game_hover_enabled', match: () => isGameHoverPage(), start: initializeGameHover }
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
