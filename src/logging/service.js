  function createDiagnostics({ read, write, sink, now = () => Date.now(), capacity = 200 }) {
    const policy = createLogPolicy(read, write);
    const history = [];
    let sequence = 0;
    let operation = 0;
    const enabled = level => isLogLevel(level) && level !== 'off' && LOG_LEVELS[level] >= LOG_LEVELS[policy.getLevel()];

    function emit(module, level, step, message, data, extra = {}) {
      if (!enabled(level)) return;
      try {
        const record = {
          sequence: ++sequence, time: new Date(now()).toISOString(), level, module, step,
          message: snapshotLogData(String(message)), ...extra,
          data: snapshotLogData(typeof data === 'function' ? data() : data)
        };
        history.push(record);
        if (history.length > capacity) history.shift();
        renderLogRecord(sink, record);
      } catch (_) { /* Logging must never interrupt the feature being observed. */ }
    }

    function scope(module) {
      const logger = { enabled };
      for (const level of ['debug', 'info', 'warn', 'error']) {
        logger[level] = (step, message, data) => emit(module, level, step, message, data);
      }
      logger.begin = (step, data, level = 'debug') => {
        const id = ++operation;
        const started = now();
        let settled = false;
        emit(module, level, step, '开始', data, { operation: id, status: 'start' });
        const finish = (severity, status, message, details) => {
          if (settled) return;
          settled = true;
          emit(module, severity, step, message, details, { operation: id, status,
            durationMs: Math.max(0, now() - started) });
        };
        const span = {
          end: (message = '完成', details) => finish(level, 'success', message, details),
          fail: (error, details) => finish('error', 'failure', '失败', { error, details }),
          cancel: (message = '已取消', details) => finish(level, 'cancelled', message, details)
        };
        for (const severity of ['debug', 'info', 'warn', 'error']) {
          span[severity] = (childStep, message, details) => {
            if (!settled) emit(module, severity, `${step}.${childStep}`, message, details, { operation: id });
          };
        }
        return span;
      };
      return Object.freeze(logger);
    }
    return Object.freeze({ scope, enabled, getLevel: policy.getLevel, setLevel: policy.setLevel,
      records: () => JSON.parse(JSON.stringify(history)), clear: () => { history.length = 0; } });
  }
