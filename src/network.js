  function gmGet(url) {
    // The endpoint is sufficient for diagnosis; query strings can contain tokens.
    const address = new URL(url);
    const task = diagnostics.scope('network').begin('get', { endpoint: address.origin + address.pathname });
    return new Promise((resolve, reject) => {
      const fail = error => { task.fail(error); reject(error); };
      try {
        GM_xmlhttpRequest({
          method: 'GET', url, timeout: 20000,
          onload: response => {
            if ((response.status >= 200 && response.status < 300) || (response.status === 0 && response.responseText)) {
              task.end('请求完成', { status: response.status });
              resolve(response.responseText);
            } else fail(new Error('HTTP ' + response.status));
          },
          onerror: () => fail(new Error('网络请求失败')),
          ontimeout: () => fail(new Error('Timeout'))
        });
      } catch (error) { fail(error); }
    });
  }

  class RequestQueue {
    constructor(concurrency = 4) { this.concurrency = concurrency; this.running = 0; this.queue = []; }
    enqueue(task) {
      return new Promise((resolve, reject) => {
        this.queue.push({ task, resolve, reject });
        diagnostics.scope('network').debug('queue.add', '请求进入队列', { waiting: this.queue.length, running: this.running });
        this._deq();
      });
    }
    _deq() {
      if (this.running >= this.concurrency) return;
      const job = this.queue.shift();
      if (!job) return;
      this.running++;
      Promise.resolve().then(job.task).then(job.resolve).catch(job.reject).finally(() => { this.running--; this._deq(); });
    }
  }
  const requestQueue = new RequestQueue(4);
