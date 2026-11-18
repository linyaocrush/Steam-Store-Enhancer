  function initialize() {
    const log = diagnostics.scope('core');
    const boot = log.begin('initialize', { host: location.hostname, level: diagnostics.getLevel() }, 'info');
    addStyle();
    boot.debug('styles', '基础样式已加载');
    GM_registerMenuCommand('设置', openSettingsUI);
    GM_registerMenuCommand('清除缓存', clearScriptCaches);
    boot.debug('settings', '设置菜单已注册');
    if (location.hostname === 'store.steampowered.com' && GM_getValue('sse_extra_enabled', true)) {
      scheduleScan();
      startObserver();
    } else boot.debug('regional-prices.skip', '跳过地区价格', { host: location.hostname });
    if (/^(store\.steampowered\.com|steamcommunity\.com|checkout\.steampowered\.com)$/.test(location.hostname)) {
      conversion.start();
    } else boot.debug('conversion.skip', '当前站点不启用价格转换');
    const family = initializeFamilyLibrary();
    boot.debug('family', '家庭库初始化完成');
    if (GM_getValue('sse_cart_enabled', true) && /^(store\.steampowered\.com|steamcommunity\.com)$/.test(location.hostname)) {
      initializeCartTools();
    } else boot.debug('cart.skip', '跳过购物车工具', { host: location.hostname });
    initializeFriendTools();
    initializeRestrictionBadges();
    boot.end('功能启动已调度，异步任务由各模块记录结果');
    return family;
  }

  const familyLibrary = initialize();
