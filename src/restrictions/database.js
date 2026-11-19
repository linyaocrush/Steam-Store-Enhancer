  const RESTRICTION_SOURCES = [
    { id: 'github', url: ref => `https://raw.githubusercontent.com/F1NN1ER/getSteamRestrictedGameLIst/${ref}/data/fulllist.json` },
    { id: 'jsdelivr', url: ref => `https://cdn.jsdelivr.net/gh/F1NN1ER/getSteamRestrictedGameLIst@${ref}/data/fulllist.json` },
    { id: 'jsdelivr-fastly', url: ref => `https://fastly.jsdelivr.net/gh/F1NN1ER/getSteamRestrictedGameLIst@${ref}/data/fulllist.json` }
  ];

  async function restrictionRequest(url, { probe = false, timeout = probe ? 6000 : 60000, signal } = {}) {
    const started = Date.now();
    const response = await gmRequest(url, { anonymous: true, probe, timeout, signal });
    return { text: response.responseText, ms: Date.now() - started };
  }

  function parseRestrictionDatabase(text) {
    const rows = JSON.parse(text);
    if (!Array.isArray(rows) || !rows.length) throw new Error('受限数据库为空或格式错误');
    const result = new Map();
    for (const row of rows) {
      if (!Number.isSafeInteger(row?.appid) || row.appid <= 0 ||
          !Number.isInteger(row.status) || row.status < 0 || row.status > 3 || result.has(row.appid)) {
        throw new Error('受限数据库存在无效记录');
      }
      result.set(row.appid, row.status);
    }
    return result;
  }

  function createRestrictionDatabase({ read, write, request = restrictionRequest, now = () => Date.now(), sources = RESTRICTION_SOURCES, signal }) {
    const log = diagnostics.scope('restrictions.database');
    const key = 'sse_restrictions_database_v1';
    const ttl = 24 * 60 * 60 * 1000;
    let pending;
    let memory;
    let hydrated = false;
    let updated = 0;
    let retryAt = 0;
    const listeners = new Set();

    async function load() {
      if (signal?.aborted) return memory;
      if (!hydrated) {
        hydrated = true;
        let cached;
        try {
          cached = read(key);
          if (cached?.version === 1 && Array.isArray(cached.rows)) {
            memory = parseRestrictionDatabase(JSON.stringify(cached.rows.map(([appid, status]) => ({ appid, status }))));
            updated = Number.isFinite(cached.updated) && cached.updated <= now() ? cached.updated : 0;
          }
        } catch (error) { log.warn('cache.invalid', '受限数据库缓存不可用', { error }); memory = undefined; }
      }
      if (memory && now() - updated < ttl) return memory;
      if (now() < retryAt) return memory;
      if (!pending) pending = refresh().finally(() => { pending = null; });
      // Keep titles usable while an expired database is refreshed in the background.
      return memory || pending;
    }

    async function refresh() {
        // Pin mirrors to the latest commit so CDN branch-cache latency cannot select older data.
        let ref = 'main';
        try {
          const response = await request('https://api.github.com/repos/F1NN1ER/getSteamRestrictedGameLIst/commits?path=data/fulllist.json&per_page=1', { timeout: 8000, signal });
          const commits = JSON.parse(response.text);
          if (/^[a-f0-9]{40}$/.test(commits?.[0]?.sha || '')) ref = commits[0].sha;
        } catch (error) { log.debug('revision.fallback', '无法确认最新提交，使用主分支', { error }); }
        if (signal?.aborted) return memory;
        const task = log.begin('refresh', { revision: ref }, 'info');
        const measured = await Promise.all(sources.map(async source => {
          const url = source.url(ref);
          try {
            const probe = await request(url, { probe: true, signal });
            log.debug('source.probe', '数据源测速完成', { source: source.id, ms: probe.ms });
            return { source, url, ms: probe.ms };
          } catch (error) {
            log.debug('source.unavailable', '数据源测速失败', { source: source.id, error });
            return { source, url, ms: Infinity };
          }
        }));
        measured.sort((a, b) => a.ms - b.ms);
        for (const candidate of measured) {
          try {
            if (signal?.aborted) { task.end('数据库刷新已取消'); return memory; }
            task.debug('download', '下载受限数据库', { source: candidate.source.id, probeMs: candidate.ms });
            const response = await request(candidate.url, { signal });
            if (signal?.aborted) { task.end('数据库刷新已取消'); return memory; }
            const data = parseRestrictionDatabase(response.text);
            memory = data;
            updated = now();
            retryAt = 0;
            // One fixed storage key replaces the whole snapshot, including removed AppIDs.
            try { write(key, { version: 1, updated, source: candidate.source.id, revision: ref, rows: [...data] }); }
            catch (error) { task.warn('cache.write', '数据库已加载，但无法保存本地缓存', { error }); }
            task.end('受限数据库已更新', { source: candidate.source.id, count: data.size, downloadMs: response.ms });
            for (const listener of listeners) {
              try { listener(); } catch (error) { log.warn('refresh.notify', '数据库更新通知失败', { error }); }
            }
            return data;
          } catch (error) { task.warn('download.failed', '数据源失败，尝试下一个来源', { source: candidate.source.id, error }); }
        }
        task.fail(new Error('所有受限数据库来源均不可用'));
        if (memory) log.warn('cache.stale', '暂用上次成功下载的数据库');
        retryAt = now() + 15 * 60 * 1000;
        return memory;
    }
    return { load, subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); } };
  }
