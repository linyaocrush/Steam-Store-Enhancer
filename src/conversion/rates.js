  function createRateService({ storage, getContext, fetchRates }) {
    const log = diagnostics.scope('conversion.rates');
    const cacheKey = 'Storage:RateCache';
    class RateCaches {
      caches = new Map();
      getCache(from, to) { return this.caches.get(`${from}:${to}`); }
      setCache(cache) { this.caches.set(`${cache.from}:${cache.to}`, cache); }
    }
    class RateManager {
      memoryCache = null;
      pendingRequests = new Map();
      isBroken = false;
      async getRate4Remote(from, to) {
        const task = log.begin('fetch', { from, to });
        try {
          const response = await fetchRates(from);
          const rate = response.get(to)?.[from];
          if (!Number.isFinite(Number(rate)) || Number(rate) <= 0) throw new Error(`汇率接口没有返回有效币种对：${from} -> ${to}`);
          task.end('汇率读取成功', { rate });
          return rate;
        } catch (error) { task.fail(error); throw error; }
      }
      async getRate(source, target) {
        if (this.isBroken) throw new Error('汇率服务已熔断，停止请求');
        const context = getContext();
        const from = source || context.currentCountyInfo.currencyCode;
        const to = target || context.targetCountyInfo.currencyCode;
        const key = `${from}:${to}`;
        if (this.pendingRequests.has(key)) {
          log.debug('join', '复用进行中的汇率查询', { from, to });
          return this.pendingRequests.get(key);
        }
        const request = (async () => {
          if (!this.memoryCache) {
            this.memoryCache = this.loadRateCache();
            log.debug('cache.load', '汇率缓存已加载', { size: this.memoryCache.caches.size });
          }
          let cache = this.memoryCache.getCache(from, to);
          const now = Date.now();
          if (!cache?.rate || now > cache.createdAt + context.setting.rateCacheExpired) {
            log.debug('cache.miss', '汇率缓存缺失或过期', { from, to });
            try {
              const rate = await this.getRate4Remote(from, to);
              cache = { from, to, rate, createdAt: now };
              this.memoryCache.setCache(cache);
              this.saveRateCache();
            } catch (error) {
              if (cache?.rate) {
                log.warn('cache.stale', '远程刷新失败，使用旧汇率缓存', { from, to, error });
                return cache.rate;
              }
              this.isBroken = true;
              log.error('breaker', '汇率不可用，停止后续远程请求', { from, to, error });
              throw error;
            }
          } else log.debug('cache.hit', '命中汇率缓存', { from, to });
          return cache.rate;
        })();
        this.pendingRequests.set(key, request);
        try { return await request; }
        finally { this.pendingRequests.delete(key); }
      }
      loadRateCache() {
        const setting = getContext().setting;
        if (setting.oldVersion !== setting.currVersion) {
          log.debug('cache.invalidate', '版本变化，刷新汇率缓存');
          this.clear();
          return new RateCaches();
        }
        return storage.getObjValue(RateCaches, cacheKey, new RateCaches());
      }
      saveRateCache() {
        if (!this.memoryCache) return;
        storage.setObjValue(cacheKey, this.memoryCache);
        log.debug('cache.save', '汇率缓存已保存', { size: this.memoryCache.caches.size });
      }
      clear() {
        this.memoryCache = null;
        storage.deleteValue(cacheKey);
        log.info('cache.clear', '汇率缓存已清除');
      }
    }
    return new RateManager();
  }
