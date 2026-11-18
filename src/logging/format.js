  // Store snapshots, never live objects, DOM nodes, credentials or request bodies.
  function snapshotLogData(input) {
    const seen = new WeakSet();
    let remaining = 150;
    const privateKey = /token|authorization|cookie|sessionid|password|secret|comment|gift_message/i;
    const cleanText = value => String(value)
      .replace(/((?:access_token|sessionid|token|key)=)[^\s&#]+/gi, '$1[redacted]')
      .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').slice(0, 3000);
    function visit(value, depth) {
      if (--remaining < 0) return '[limit]';
      if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;
      if (typeof value === 'string') return cleanText(value);
      if (typeof value !== 'object') return cleanText(value);
      if (seen.has(value)) return '[circular]';
      if (depth > 5) return '[depth limit]';
      seen.add(value);
      try {
        if (value.nodeType) return { node: value.nodeName || 'DOM', id: value.id || undefined };
        if (Object.prototype.toString.call(value) === '[object Error]') {
          return { name: cleanText(value.name), message: cleanText(value.message), stack: cleanText(value.stack || ''),
            ...(value.cause === undefined ? {} : { cause: visit(value.cause, depth + 1) }) };
        }
        if (Array.isArray(value)) return value.slice(0, 40).map(item => visit(item, depth + 1));
        if (Object.prototype.toString.call(value) === '[object Map]') return visit([...value.entries()], depth + 1);
        const result = {};
        for (const key of Object.keys(value).slice(0, 40)) {
          if (privateKey.test(key)) result[key] = '[redacted]';
          else {
            const descriptor = Object.getOwnPropertyDescriptor(value, key);
            Object.defineProperty(result, key, { enumerable: true, configurable: true, writable: true,
              value: descriptor && 'value' in descriptor ? visit(descriptor.value, depth + 1) : '[accessor]' });
          }
        }
        return result;
      } catch (_) { return '[unavailable]'; }
    }
    return visit(input, 0);
  }

  function renderLogRecord(sink, record) {
    const palette = { debug: '#536c84', info: '#14618b', warn: '#855400', error: '#b32c30' };
    // DEBUG uses log deliberately: users need not enable DevTools' Verbose filter.
    const method = record.level === 'debug' ? 'log' : record.level;
    const output = typeof sink[method] === 'function' ? sink[method] : sink.log;
    if (typeof output !== 'function') return;
    const timing = record.durationMs === undefined ? '' : ` · ${record.durationMs}ms`;
    const trace = record.operation ? ` @${record.operation}` : '';
    output.call(sink,
      '%c SSE %c %s %c %s %c %s %c%s',
      'background:#1b2838;color:#9ed8f5;border-radius:3px;padding:2px 5px;font-weight:bold',
      'color:#77838f;font-family:monospace', record.time.slice(11, 23) + 'Z',
      `background:${palette[record.level]};color:#fff;border-radius:3px;padding:2px 5px;font-weight:bold`, record.level.toUpperCase(),
      'font-weight:bold', `${record.module} / ${record.step}`,
      'font-weight:normal', `#${record.sequence}${trace}${timing} ${record.message}`,
      record);
  }
