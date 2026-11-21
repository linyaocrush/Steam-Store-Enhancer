  function requestError(kind, message, status) { return Object.assign(new Error(message), { kind, ...(status == null ? {} : { status }) }); }
  async function gmRequest(url, { signal, retries = 0, ...options } = {}) {
    const address = new URL(url);
    const task = diagnostics.scope('network').begin('request', { method: options.method || 'GET', endpoint: address.origin + address.pathname });
    const retryLimit = (options.method || 'GET').toUpperCase() === 'GET' && Number.isInteger(retries) ? Math.max(0, Math.min(retries, 2)) : 0;
    try {
      for (let attempt = 0; ; attempt++) {
        try {
          const response = await gmRequestAttempt(url, { ...options, signal });
          task.end('请求完成', { status: response.status });
          return response;
        } catch (error) {
          const transient = error.kind === 'network' || error.kind === 'timeout' ||
            (error.kind === 'http' && [408, 429, 500, 502, 503, 504].includes(error.status));
          if (!transient || attempt >= retryLimit || signal?.aborted) throw error;
          task.warn('retry', '读取暂时失败，稍后重试', { attempt: attempt + 1, kind: error.kind, status: error.status });
          await new Promise((resolve, reject) => {
            const abort = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(requestError('aborted', '请求已取消')); };
            const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, 1000 * 2 ** attempt);
            signal?.addEventListener('abort', abort, { once: true });
            if (signal?.aborted) abort();
          });
        }
      }
    } catch (error) {
      if (error.kind === 'aborted') task.cancel();
      else task.fail(error, { kind: error.kind, status: error.status });
      throw error;
    }
  }
  function gmRequestAttempt(url, { signal, timeout = 20000, probe = false, ...options } = {}) {
    return new Promise((resolve, reject) => {
      let handle;
      let settled = false;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener('abort', abort);
        if (error) reject(error);
        else resolve(value);
      };
      const abort = () => { finish(requestError('aborted', '请求已取消')); handle?.abort(); };
      if (signal?.aborted) { abort(); return; }
      signal?.addEventListener('abort', abort, { once: true });
      try {
        handle = GM_xmlhttpRequest({
          ...options, method: options.method || 'GET', url, timeout,
          ...(probe ? { headers: { ...options.headers, Range: 'bytes=0-16383' } } : {}),
          onprogress: event => {
            if (probe && event.loaded >= 16384) {
              finish(null, { status: event.status || 206, responseText: '' });
              handle?.abort();
            }
          },
          onload: response => {
            if ((response.status >= 200 && response.status < 300) || (response.status === 0 && response.responseText)) finish(null, response);
            else finish(requestError('http', 'HTTP ' + response.status, response.status));
          },
          onerror: () => finish(requestError('network', '网络请求失败')),
          ontimeout: () => finish(requestError('timeout', '请求超时')),
          onabort: () => finish(requestError('aborted', '请求已取消'))
        });
      } catch (_) { finish(requestError('network', '网络请求无法启动')); }
    });
  }
  async function gmGet(url, options) { return (await gmRequest(url, options)).responseText; }

  // No automatic retries: writes may have succeeded even when their response was lost.
  async function fetchJson(url, { signal, timeout = 20000, ...options } = {}) {
    const address = new URL(url, location.href);
    const task = diagnostics.scope('network').begin('fetch', { method: options.method || 'GET', endpoint: address.origin + address.pathname });
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => { timedOut = true; abort(); }, timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) throw requestError('http', 'HTTP ' + response.status, response.status);
      let data;
      try { data = await response.json(); } catch (_) { throw requestError('invalid-response', '接口返回了无效 JSON'); }
      task.end('请求完成', { status: response.status });
      return { data, headers: response.headers };
    } catch (cause) {
      const error = controller.signal.aborted ? requestError(timedOut ? 'timeout' : 'aborted', timedOut ? '请求超时' : '请求已取消')
        : cause.kind ? cause : requestError('network', '网络请求失败');
      task.fail(error);
      throw error;
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }

  class RequestQueue {
    constructor(concurrency = 4) { this.concurrency = concurrency; this.running = 0; this.queue = []; }
    enqueue(task, { signal } = {}) {
      return new Promise((resolve, reject) => {
        if (signal?.aborted) { reject(requestError('aborted', '排队任务已取消')); return; }
        const job = { task, resolve, reject, signal };
        job.abort = () => {
          const index = this.queue.indexOf(job);
          if (index >= 0) this.queue.splice(index, 1);
          reject(requestError('aborted', '排队任务已取消'));
        };
        signal?.addEventListener('abort', job.abort, { once: true });
        this.queue.push(job);
        diagnostics.scope('network').debug('queue.add', '请求进入队列', { waiting: this.queue.length, running: this.running });
        this._deq();
      });
    }
    _deq() {
      if (this.running >= this.concurrency) return;
      const job = this.queue.shift();
      if (!job) return;
      job.signal?.removeEventListener('abort', job.abort);
      this.running++;
      Promise.resolve().then(() => {
        if (job.signal?.aborted) throw requestError('aborted', '排队任务已取消');
        return job.task();
      }).then(job.resolve).catch(job.reject).finally(() => { this.running--; this._deq(); });
    }
  }
  const requestQueue = new RequestQueue(4);
