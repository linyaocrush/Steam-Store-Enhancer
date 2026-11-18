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
