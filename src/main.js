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

  function watchHistory(scope, page, onNavigate) {
    for (const method of ['pushState', 'replaceState']) {
      try {
        const history = page.history;
        const original = history?.[method];
        if (typeof original !== 'function') continue;
        const descriptor = Object.getOwnPropertyDescriptor(history, method);
        const wrapped = function (...args) {
          const result = Reflect.apply(original, this, args);
          onNavigate();
          return result;
        };
        history[method] = wrapped;
        scope.own(() => {
          if (history[method] !== wrapped) return;
          if (descriptor) Object.defineProperty(history, method, descriptor);
          else delete history[method];
        });
      } catch (error) {
        diagnostics.scope('core').debug('history.hook.failed', '无法监听历史记录方法', { method, error });
      }
    }
  }

  function startFeatureRuntime() {
    const runtime = createFeatureScope('runtime');
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    const settingKeys = ['sse_extra_enabled', 'sse_convert_enabled', 'sse_cart_enabled',
      'sse_family_enabled', 'sse_family_auto', 'sse_restrictions_enabled', 'sse_wishlist_sale_enabled', 'sse_game_hover_enabled'];
    const settingListenersAvailable = typeof GM_addValueChangeListener === 'function';
    const activeFeatures = new Set();
    let settings = null;
    let settingsDirty = true;
    let route, ready, user;
    let navigationQueued = false;
    function scheduleNavigation() {
      if (!runtime.active || navigationQueued) return;
      navigationQueued = true;
      Promise.resolve().then(() => {
        navigationQueued = false;
        if (runtime.active) reconcile();
      });
    }
    function reconcile(checkAccount = false) {
      try { reconcileFeatures(checkAccount); }
      catch (error) { diagnostics.scope('core').error('runtime.failed', '页面功能协调失败', { error }); }
    }
    function reconcileFeatures(checkAccount) {
      const nextRoute = location.href;
      const nextReady = isStorePageReady();
      const routeChanged = nextRoute !== route;
      const previousSettings = settings;
      if (!settings || settingsDirty || !settingListenersAvailable) {
        settings = Object.fromEntries(settingKeys.map(key => [key, GM_getValue(key, true)]));
        settingsDirty = false;
      }
      const settingChanged = key => settings[key] !== previousSettings?.[key];
      const contextChanged = routeChanged || nextReady !== ready || (settings !== previousSettings && settingKeys.some(settingChanged));
      if (!checkAccount && !contextChanged) return;
      const nextUser = page.UserConfig?.steamid || page.g_steamID || page.g_AccountID || '';
      const restart = routeChanged || nextUser !== user;
      if (!restart && !contextChanged) return;
      route = nextRoute;
      ready = nextReady;
      user = nextUser;
      const changes = [];
      for (const feature of FEATURE_DEFINITIONS) {
        const enabled = !feature.key || settings[feature.key];
        // Do not modify server HTML before Steam's React root has adopted it.
        const active = Boolean(ready && enabled && feature.match());
        // Family initialization also owns its management UI, so its switches restart it
        // without preventing initialization when marking is disabled.
        const familyChanged = feature.name === 'family' && (settingChanged('sse_family_enabled') || settingChanged('sse_family_auto'));
        if (active !== activeFeatures.has(feature.name) || (active && (restart || familyChanged))) changes.push({ feature, active });
      }
      for (const { feature } of changes) featureScopes.get(feature.name)?.dispose();
      for (const { feature, active } of changes) {
        if (!active) { activeFeatures.delete(feature.name); continue; }
        activeFeatures.add(feature.name);
        try {
          const result = feature.start();
          if (result?.catch) result.catch(error => diagnostics.scope('core').error('feature.failed', '功能初始化失败', { name: feature.name, error }));
        } catch (error) { diagnostics.scope('core').error('feature.failed', '功能初始化失败', { name: feature.name, error }); }
      }
    }
    watchHistory(runtime, page, scheduleNavigation);
    runtime.interval(() => reconcile(true), 5000);
    if (settingListenersAvailable) {
      for (const key of settingKeys) {
        const id = GM_addValueChangeListener(key, () => { settingsDirty = true; reconcile(); });
        runtime.own(() => { if (typeof GM_removeValueChangeListener === 'function') GM_removeValueChangeListener(id); });
      }
    }
    runtime.listen(window, 'popstate', scheduleNavigation);
    runtime.listen(window, 'hashchange', scheduleNavigation);
    runtime.listen(window, 'pageshow', () => reconcile(true));
    runtime.listen(window, 'pagehide', event => {
      if (event.persisted) return;
      for (const [name, scope] of featureScopes) if (name !== 'runtime') scope.dispose();
      runtime.dispose();
    });
    reconcile();
  }
  initialize();
