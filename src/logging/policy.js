  // Logging owns its settings. The legacy field is read only once for migration.
  const LOG_LEVELS = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40, off: Infinity });
  const LOG_LEVEL_KEY = 'sse_log_level';

  function isLogLevel(value) {
    return typeof value === 'string' && Object.hasOwn(LOG_LEVELS, value);
  }

  function createLogPolicy(read, write) {
    let current = 'info';
    try {
      const saved = read(LOG_LEVEL_KEY);
      if (isLogLevel(saved)) current = saved;
      else if (saved == null) {
        const legacy = read('Storage:Setting');
        const value = typeof legacy === 'string' ? JSON.parse(legacy) : legacy;
        if (isLogLevel(value?.logLevel)) {
          current = value.logLevel;
          write(LOG_LEVEL_KEY, current);
        }
      }
    } catch (_) { /* Diagnostics must also work when storage is unavailable. */ }
    return {
      getLevel() {
        try {
          const saved = read(LOG_LEVEL_KEY);
          if (isLogLevel(saved)) current = saved;
        } catch (_) {}
        return current;
      },
      setLevel(value) {
        if (!isLogLevel(value)) throw new TypeError('无效的日志等级：' + value);
        write(LOG_LEVEL_KEY, value);
        current = value;
      }
    };
  }
