  function parseSteamRestriction(doc, appid) {
    // Age checks, redirects, regional error pages and partial responses are not proof of normality.
    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
      doc.querySelector('meta[property="og:url"]')?.getAttribute('content');
    if (canonical && !new RegExp(`/app/${appid}(?:/|$|\\?)`).test(canonical)) return null;
    if (!doc.querySelector('#appHubAppName') || !doc.querySelector('#game_area_features, .game_area_details_specs')) return null;
    const limited = doc.querySelectorAll('.game_area_details_specs_ctn.learning_about');
    for (const element of limited) {
      const label = element.querySelector('.label')?.textContent || element.textContent;
      if (/Profile Features Limited|个人资料功能受限|個人檔案功能受限|个人资料受限/i.test(label)) return 2;
    }
    if (limited.length) return 1;
    return 0;
  }

  function createSteamRestrictionLookup({ read, write, request = url => gmGet(url), parse = (html, id) =>
    parseSteamRestriction(new DOMParser().parseFromString(html, 'text/html'), id), now = () => Date.now(),
    wait = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
    const log = diagnostics.scope('restrictions.steam');
    const key = 'sse_restrictions_steam_v1';
    const controlKey = 'sse_restrictions_steam_requests_v1';
    const queue = new RequestQueue(1);
    const pending = new Map();
    const attempted = new Map();
    let cache;
    try { cache = read(key); } catch (_) {}
    if (!cache || typeof cache !== 'object' || Array.isArray(cache)) cache = {};
    let control = {};
    function readControl() {
      try { control = { ...control, ...read(controlKey) }; } catch (_) {}
      return control;
    }
    function saveControl(value) {
      control = value;
      try { write(controlKey, control); } catch (error) { log.warn('throttle.save', '请求限速状态保存失败', { error }); }
    }
    function failed(blocked = false) {
      const failures = (Number(readControl().failures) || 0) + 1;
      const delay = blocked || failures >= 3 ? Math.min(60, 15 * Math.pow(2, Math.min(failures - 1, 2))) * 60 * 1000 : 0;
      saveControl({ ...control, failures, cooldownUntil: now() + delay });
      if (delay) log.warn('throttle.cooldown', 'Steam 补查暂停，等待冷却', { failures, retryAt: control.cooldownUntil });
    }
    async function lookup(appid) {
      if (!Number.isSafeInteger(appid) || appid <= 0) return null;
      // Merge other tabs' successful lookups; confirmed results have no expiry or size cap.
      try { cache = { ...cache, ...read(key) }; } catch (_) {}
      const saved = cache[appid];
      if ([0, 1, 2].includes(saved?.status)) return saved.status;
      if (pending.has(appid)) return pending.get(appid);
      const attempt = attempted.get(appid);
      if (attempt && now() < attempt.retryAt) return null;
      const run = async () => {
        try { cache = { ...cache, ...read(key) }; } catch (_) {}
        if ([0, 1, 2].includes(cache[appid]?.status)) return cache[appid].status;
        if (now() < (readControl().cooldownUntil || 0)) return null;
        const delay = Math.max(0, (control.nextAt || 0) - now());
        if (delay) await wait(delay);
        if (now() < (readControl().cooldownUntil || 0)) return null;
        saveControl({ ...control, nextAt: now() + 4000 });
        const task = log.begin('lookup', { appid });
        try {
          const html = await request(`https://store.steampowered.com/app/${appid}/?l=english`);
          const status = parse(html, appid);
          if (![0, 1, 2].includes(status)) {
            task.cancel('Steam 页面无法确认状态', { appid });
            attempted.set(appid, { retryAt: now() + 15 * 60 * 1000 });
            failed();
            return null;
          }
          try { cache = { ...cache, ...read(key) }; } catch (_) {}
          cache[appid] = { status, updated: now() };
          try { write(key, cache); } catch (error) { task.warn('cache.write', 'Steam 状态缓存保存失败', { error }); }
          saveControl({ ...control, failures: 0, cooldownUntil: 0 });
          attempted.delete(appid);
          task.end('Steam 状态读取完成', { appid, status });
          return status;
        } catch (error) {
          task.fail(error);
          failed([403, 429].includes(error?.status) || /HTTP (403|429)\b/.test(error?.message || ''));
          attempted.set(appid, { retryAt: now() + 15 * 60 * 1000 });
          return null;
        }
      };
      // Coordinate same-origin tabs where Web Locks are available.
      const promise = queue.enqueue(() => typeof navigator !== 'undefined' && navigator.locks?.request
        ? navigator.locks.request('sse-steam-restriction-lookup', run) : run())
        .finally(() => pending.delete(appid));
      pending.set(appid, promise);
      return promise;
    }
    return { lookup };
  }
