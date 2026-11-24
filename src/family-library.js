  function initializeFamilyLibrary() {
    const scope = createFeatureScope('family');
    const log = diagnostics.scope('family');
    const KEY = 'sse_family_cache_v1';
    const DAY = 86400000;
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    const onStore = location.hostname === 'store.steampowered.com';
    const enabled = GM_getValue('sse_family_enabled', true);
    log.info('initialize', enabled ? '家庭库标记已启用' : '家庭库标记已关闭');
    let cache = GM_getValue(KEY, null);
    log.debug('cache.load', '读取家庭库缓存', { cached: Boolean(cache), updated: cache?.updated });
    let scanPromise = null;
    let accountId = '';
    let root = null;
    let notice = '';
    const style = document.createElement('style');
    style.textContent = `
      .sse-family-badge{display:inline-block!important;background:#086b68;color:#c4fff4!important;padding:3px 7px;margin:4px;border-radius:3px;font-size:11px;line-height:1.4;white-space:normal;pointer-events:none;text-decoration:none}
      .sse-family-banner{box-sizing:border-box;margin:12px 0;padding:14px;color:#c4fff4;background:linear-gradient(90deg,#145b59,#1b2838);border:1px solid #287c75;border-radius:4px}
      .sse-family-banner a{color:#a4f5e6;margin-left:12px}.sse-family-banner button{margin-left:12px;cursor:pointer}
      #sse-family-dialog{position:fixed;inset:0;z-index:2147483646;background:#000b;display:grid;place-items:center;padding:12px;box-sizing:border-box;color:#c6d4df;font-family:Arial,sans-serif}
      #sse-family-dialog .sse-family-window{box-sizing:border-box;width:min(850px,100%);max-height:90vh;overflow:auto;background:linear-gradient(#1b2838,#171a21);border:1px solid #34465a;border-radius:6px;padding:18px}
      #sse-family-dialog h2{font-size:18px;color:#e5e5e5;margin:0 0 12px}#sse-family-dialog h3{font-size:14px;color:#67c1f5;margin:18px 0 10px}
      #sse-family-dialog button{background:#27465c;color:#c6e7ff;border:0;border-radius:3px;padding:8px 10px;margin:4px;cursor:pointer}#sse-family-dialog button:disabled{opacity:.5;cursor:default}
      #sse-family-dialog .sse-family-status{margin:10px 0;white-space:pre-wrap;font-size:12px;color:#acb2b8}
      #sse-family-dialog table{width:100%;border-collapse:collapse;font-size:12px}#sse-family-dialog td,#sse-family-dialog th{padding:8px;text-align:left;border-bottom:1px solid #34465a;overflow-wrap:anywhere}
      #sse-family-dialog a{color:#67c1f5}#sse-family-dialog .sse-family-recent{background:#164337}
      .sse-family-chart-row{display:grid;grid-template-columns:minmax(70px,140px) minmax(0,1fr) 60px;gap:8px;align-items:center;margin:8px 0;font-size:12px}
      .sse-family-chart-bar{display:flex;height:18px;background:#0f141b;border-radius:3px;overflow:hidden}.sse-family-chart-bar span{display:block;height:100%}
      #sse-family-nav{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;white-space:nowrap;cursor:pointer;flex-shrink:0}
      #sse-family-nav>svg,#sse-family-nav>span{align-self:center}
      #sse-family-chart-tooltip{position:fixed;z-index:2147483647;max-width:min(360px,calc(100vw - 24px));box-sizing:border-box;padding:10px 12px;border:1px solid #67c1f5;border-radius:4px;background:#101923;color:#c6d4df;box-shadow:0 4px 18px #0008;font:12px/1.6 Arial,sans-serif;white-space:pre-wrap;pointer-events:none}
      #sse-family-dialog .sse-family-scroll{overflow:auto;max-height:350px}#sse-family-dialog input{box-sizing:border-box;padding:8px;background:#0f141b;color:#c6d4df;border:1px solid #34465a;width:100%;margin:8px 0}
    `;
    document.head.appendChild(style);
    scope.own(() => {
      style.remove(); close();
      document.querySelectorAll('.sse-family-badge, .sse-family-banner, #sse-family-nav').forEach(node => node.remove());
      document.querySelectorAll('[data-sse-family-app]').forEach(node => node.removeAttribute('data-sse-family-app'));
    });

    function readIdentity() {
      const session = readStoreSession(document, page);
      return { steamid: session.steamid, token: session.token };
    }
    try { if (onStore) accountId = readIdentity().steamid; }
    catch (error) { notice = '暂时无法读取登录信息，请刷新 Steam 商店页面。'; log.warn('session.read', notice, { error }); }
    let validatedCache;
    let cacheShapeValid = false;
    function validCache() {
      if (validatedCache !== cache) {
        validatedCache = cache;
        cacheShapeValid = Boolean(cache && cache.apps && typeof cache.apps === 'object' && !Array.isArray(cache.apps) &&
        Array.isArray(cache.members) && cache.members.length > 0 && /^\d{17}$/.test(String(cache.steamid)) &&
        cache.members.every(id => /^\d{17}$/.test(String(id))) &&
        Object.entries(cache.apps).every(([id, game]) => itemRef('app', id) && game && typeof game.name === 'string' &&
          Array.isArray(game.owners) && game.owners.every(owner => /^\d{17}$/.test(String(owner)))));
      }
      return cacheShapeValid && (!onStore || (accountId && cache.steamid === accountId));
    }
    function ownerName(id) { return cache?.names?.[String(id)] || String(id); }
    function gameDescription(game) {
      const owners = game.owners.map(ownerName).join('、');
      return '家庭库贡献者：' + owners + (game.time ? '\n记录的最早购入时间：' + new Date(game.time * 1000).toLocaleString() : '');
    }
    async function api(method, token, params) {
      const task = log.begin('api.' + method);
      try {
      const url = new URL('https://api.steampowered.com/' + method + '/v1/');
      url.searchParams.set('access_token', token);
      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
      const parsed = JSON.parse(await gmGet(url.href, { signal: scope.signal }));
      if (!parsed.response || typeof parsed.response !== 'object') throw invalidResponse('Steam 返回了无效的家庭库数据。');
      task.end('家庭库接口请求完成');
      return parsed.response;
      } catch (error) { task.fail(error); throw error; }
    }
    function refreshNotice() {
      if (root) renderDialog();
    }
    function scan() {
      if (scanPromise) { log.debug('scan.join', '复用当前家庭库扫描'); return scanPromise; }
      const task = log.begin('scan', undefined, 'info');
      scanPromise = (async () => {
        if (!onStore) throw new Error('请在已登录的 Steam 商店页面中扫描家庭库。');
        const identity = readIdentity();
        if (!identity.token) throw new Error('无法读取登录凭据，请登录 Steam 商店后刷新页面。');
        notice = '正在读取家庭组……'; refreshNotice();
        const family = await api('IFamilyGroupsService/GetFamilyGroupForUser', identity.token, { include_family_group_response: true });
        if (!family.family_groupid || !family.family_group) throw new Error('当前账号没有可读取的 Steam 家庭组。');
        const members = family.family_group.members;
        if (!Array.isArray(members) || !members.length || members.some(member => !/^\d{17}$/.test(String(member?.steamid)))) throw invalidResponse('家庭成员列表无效，原缓存已保留。');
        task.debug('members', '家庭成员已读取', { count: members.length });
        // The API identifies the signed-in member even when the SSR page omits its SteamID.
        const self = identity.steamid || String(family.steamid || '');
        if (!/^\d{17}$/.test(self)) throw new Error('无法确认当前账号 SteamID，未覆盖已保存的家庭库。');
        notice = '正在扫描家庭库游戏……'; refreshNotice();
        const library = await api('IFamilyGroupsService/GetSharedLibraryApps', identity.token, {
          family_groupid: family.family_groupid, include_own: true, include_excluded: false, include_non_games: false
        });
        if (!Array.isArray(library.apps) || library.apps.some(app => !itemRef('app', app?.appid) ||
            !Array.isArray(app.owner_steamids) || app.owner_steamids.some(id => !/^\d{17}$/.test(String(id))))) throw invalidResponse('家庭库游戏列表无效，原缓存已保留。');
        task.debug('library', '共享游戏列表已读取', { count: library.apps.length });
        const names = Object.fromEntries(members.map(member => [String(member.steamid), String(member.steamid)]));
        try {
          const params = Object.fromEntries(members.map((member, index) => ['steamids[' + index + ']', member.steamid]));
          const players = await api('IPlayerService/GetPlayerLinkDetails', identity.token, params);
          for (const player of players.accounts || []) {
            if (player.public_data?.steamid) names[String(player.public_data.steamid)] = player.public_data.persona_name || String(player.public_data.steamid);
          }
        } catch (error) { notice = '游戏已读取，部分成员昵称暂时无法获取，将显示 SteamID。'; task.warn('names.fallback', notice, { error }); }
        const apps = {};
        for (const app of library.apps) {
          if (Number(app.exclude_reason || 0) !== 0 || !Number.isSafeInteger(Number(app.appid))) continue;
          apps[app.appid] = { name: app.name || String(app.appid), owners: [...new Set((app.owner_steamids || []).map(String))], time: Number(app.rt_time_acquired) || 0 };
        }
        if (!scope.active || (readIdentity().steamid && readIdentity().steamid !== self)) return;
        cache = { steamid: self, familyId: String(family.family_groupid), name: family.family_group.name || 'Steam 家庭', members: members.map(member => String(member.steamid)), names, apps, updated: Date.now() };
        validatedCache = undefined;
        accountId = self;
        GM_setValue(KEY, cache);
        task.debug('cache.save', '家庭库缓存已保存', { count: Object.keys(apps).length });
        notice = '扫描完成，已缓存 ' + Object.keys(apps).length + ' 个家庭库游戏。';
        updateMarks();
        updateBanner();
        task.end(notice, { games: Object.keys(apps).length, members: members.length });
      })().catch(error => { notice = error.message || '家庭库扫描失败，原缓存已保留。'; task.fail(error); })
        .finally(() => { scanPromise = null; refreshNotice(); });
      refreshNotice();
      return scanPromise;
    }

    function action(label, handler) {
      const control = createElement('button', label);
      control.type = 'button';
      control.addEventListener('click', handler);
      return control;
    }
    function open() {
      if (!scope.active) return;
      log.debug('panel.open', '打开家庭库管理');
      if (!root) {
        root = createElement('div');
        root.id = 'sse-family-dialog';
        root.addEventListener('click', event => { if (event.target === root) close(); });
        document.documentElement.appendChild(root);
      }
      renderDialog();
    }
    function close() { if (root) log.debug('panel.close', '关闭家庭库管理'); hideChartTooltip(); root?.remove(); root = null; }
    let chartTooltip = null;
    let tooltipSize;
    let tooltipContent;
    let tooltipFrame;
    function hideChartTooltip() {
      if (tooltipFrame) cancelAnimationFrame(tooltipFrame);
      tooltipFrame = null; tooltipSize = null; tooltipContent = null;
      chartTooltip?.remove(); chartTooltip = null;
    }
    function showChartTooltip(content, x, y) {
      if (!chartTooltip) {
        chartTooltip = createElement('div'); chartTooltip.id = 'sse-family-chart-tooltip'; chartTooltip.setAttribute('role', 'tooltip');
        document.documentElement.appendChild(chartTooltip);
      }
      if (tooltipContent !== content || !tooltipSize) {
        chartTooltip.textContent = content;
        tooltipContent = content;
        tooltipSize = chartTooltip.getBoundingClientRect();
      }
      if (tooltipFrame) cancelAnimationFrame(tooltipFrame);
      tooltipFrame = requestAnimationFrame(() => {
        tooltipFrame = null;
        if (!chartTooltip || !scope.active) return;
        chartTooltip.style.left = Math.max(12, Math.min(x + 14, window.innerWidth - tooltipSize.width - 12)) + 'px';
        chartTooltip.style.top = Math.max(12, Math.min(y + 14, window.innerHeight - tooltipSize.height - 12)) + 'px';
      });
    }
    function ensureFamilyNav() {
      if (!onStore || !enabled) return;
      const candidates = [...document.querySelectorAll('#wishlist_link, #store_nav_wishlist_link, a[href*="/wishlist"]')].filter(link => {
        if (link.closest('dialog, [popover], #sse-family-dialog, #sapx-ui-root')) return false;
        return link.matches('#wishlist_link, #store_nav_wishlist_link, .u5g6D3cfJ40-') ||
          Boolean(link.closest('#store_nav_area, #store_header, .store_nav, .store_header, [role="navigation"], ._5LVptMyFAZw-'));
      });
      const wishlist = candidates.find(link => link.getClientRects().length > 0) || candidates[0];
      if (!wishlist) return;
      let control = document.getElementById('sse-family-nav');
      if (!control) {
        const template = wishlist.matches('a, button') ? wishlist : wishlist.querySelector('a, button');
        if (!template) return;
        control = template.cloneNode(true);
        control.id = 'sse-family-nav';
        control.removeAttribute('onclick');
        control.removeAttribute('aria-current');
        control.removeAttribute('aria-disabled');
        if (control.tagName === 'A') control.setAttribute('href', '#sse-family-library');
        else control.type = 'button';
        control.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
        const nativeCount = control.querySelector('.oWSo9BvK7oY-, .wishlist_count, .count');
        let count = nativeCount;
        if (!count) {
          count = [...control.querySelectorAll('span')].find(element => /^\s*\d+\s*$/.test(element.textContent));
        }
        if (!count) { count = createElement('span'); control.appendChild(count); }
        count.classList.add('sse-family-count');
        const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
        const labels = [];
        while (walker.nextNode()) {
          const current = walker.currentNode;
          if (current.textContent.trim() && !current.parentElement.closest('svg, .sse-family-count')) labels.push(current);
        }
        labels.forEach((label, index) => { label.textContent = index === 0 ? '我的家庭库' : ''; });
        if (!labels.length) control.insertBefore(document.createTextNode('我的家庭库'), count);
        const icon = control.querySelector('svg');
        if (icon) {
          icon.setAttribute('viewBox', '0 0 24 24');
          icon.removeAttribute('aria-label');
          icon.innerHTML = '<path fill="currentColor" d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 13c-4 0-7 2-7 5v3h14v-3c0-3-3-5-7-5Zm8-1c-1 0-2 .2-3 .6 2.5 1.2 4 3 4 5.4v3h6v-4c0-3-3-5-7-5Z"/>';
        }
        control.setAttribute('aria-label', '我的家庭库');
        control.addEventListener('click', event => { event.preventDefault(); open(); });
      }
      // Older store headers float the wishlist container; use its parent for a stable left-hand slot.
      const slot = wishlist.closest('#wishlist_link') || wishlist;
      if (slot.previousElementSibling !== control) slot.before(control);
      const count = validCache() ? String(Object.keys(cache.apps).length) : '0';
      const label = control.querySelector('.sse-family-count');
      if (label.textContent !== count) label.textContent = count;
      control.title = '查看家庭库贡献统计、最近购入与扫描管理';
    }
    scope.listen(window, 'keydown', event => { if (event.key === 'Escape') close(); });
    function renderDialog() {
      if (!root) return;
      hideChartTooltip();
      const panel = createElement('div', undefined, 'sse-family-window');
      panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', 'Steam 家庭库');
      panel.append(createElement('h2', 'Steam 家庭库'));
      const scanButton = action(scanPromise ? '扫描中……' : '现在扫描家庭库', scan);
      scanButton.disabled = !onStore || Boolean(scanPromise);
      panel.append(scanButton, action('清空缓存', () => {
        if (scanPromise) { notice = '请等待扫描完成后再清空缓存。'; refreshNotice(); return; }
        if (!window.confirm('确定清空本脚本保存的家庭库记录？')) return;
        GM_deleteValue(KEY); cache = null; validatedCache = undefined; notice = '家庭库缓存已清空。'; updateMarks(); updateBanner(); renderDialog();
        log.info('cache.clear', '家庭库缓存已清空');
      }), action('关闭', close));
      const summary = validCache() ? cache.name + ' · ' + Object.keys(cache.apps).length + ' 个游戏 · 上次扫描：' + new Date(cache.updated).toLocaleString() : '暂无当前账号的家庭库缓存。';
      panel.append(createElement('div', summary + '\n' + (notice || (!onStore ? '请前往 Steam 商店扫描，本站使用已保存的缓存。' : '')), 'sse-family-status'));
      if (validCache()) {
        log.debug('panel.statistics', '渲染家庭库统计', { games: Object.keys(cache.apps).length, members: cache.members.length });
        panel.append(createElement('h3', '家庭成员贡献统计'));
        const games = Object.values(cache.apps);
        const totalsById = new Map(cache.members.map(id => [id, 0]));
        const ownershipBands = new Map(cache.members.map(id => [id, Array(cache.members.length).fill(0)]));
        for (const game of games) {
          const band = Math.min(cache.members.length, game.owners.length) - 1;
          if (band < 0) continue;
          for (const owner of game.owners) {
            if (!totalsById.has(owner)) continue;
            totalsById.set(owner, totalsById.get(owner) + 1);
            ownershipBands.get(owner)[band]++;
          }
        }
        const totals = cache.members.map(id => totalsById.get(id));
        const maximum = Math.max(1, ...totals);
        const colors = ['#67c1f5', '#06cfbe', '#a0c85a', '#d7a64c', '#bb83db', '#e18484'];
        cache.members.forEach((id, index) => {
          const row = createElement('div', undefined, 'sse-family-chart-row');
          const bar = createElement('div', undefined, 'sse-family-chart-bar');
          const counts = ownershipBands.get(id);
          counts.forEach((count, group) => {
            const segment = createElement('span'); segment.style.width = count / maximum * 100 + '%'; segment.style.background = colors[group % colors.length];
            const category = group === 0 ? '单独贡献' : (group + 1) + ' 人共同拥有';
            const details = ownerName(id) + '\n' + category + '：' + count + ' 个游戏\n该成员拥有总数：' + totals[index] + ' 个\n占该成员游戏的比例：' + (totals[index] ? (count / totals[index] * 100).toFixed(1) : '0') + '%';
            segment.setAttribute('aria-label', details);
            if (count) segment.tabIndex = 0;
            segment.addEventListener('mouseenter', event => showChartTooltip(details, event.clientX, event.clientY));
            segment.addEventListener('mousemove', event => showChartTooltip(details, event.clientX, event.clientY));
            segment.addEventListener('mouseleave', hideChartTooltip);
            segment.addEventListener('focus', () => { const bounds = segment.getBoundingClientRect(); showChartTooltip(details, bounds.left, bounds.bottom); });
            segment.addEventListener('blur', hideChartTooltip);
            bar.appendChild(segment);
          });
          row.append(createElement('span', ownerName(id)), bar, createElement('span', String(totals[index]))); panel.appendChild(row);
        });
        panel.append(createElement('div', '柱条按拥有同一游戏的成员人数分段；悬停查看数量。统计包含当前账号，不代表家庭实际可用的同时游玩份数。', 'sse-family-status'));
        panel.append(createElement('h3', '最近购入的游戏'));
        panel.append(createElement('div', '按接口记录的最早购入时间排序；绿色表示最近 30 天购入且仅一位成员拥有。', 'sse-family-status'));
        const search = createElement('input'); search.placeholder = '搜索游戏或贡献者'; search.setAttribute('aria-label', '搜索家庭库游戏'); panel.appendChild(search);
        const scroll = createElement('div', undefined, 'sse-family-scroll');
        const table = createElement('table'); const header = createElement('tr');
        ['游戏名称', '记录的最早购入时间', '贡献者'].forEach(value => header.appendChild(createElement('th', value)));
        const head = createElement('thead'); head.appendChild(header); table.appendChild(head);
        const body = createElement('tbody');
        Object.entries(cache.apps).sort((a, b) => b[1].time - a[1].time).forEach(([id, game]) => {
          const row = createElement('tr');
          if (game.time * 1000 >= Date.now() - 30 * DAY && game.owners.length === 1) row.className = 'sse-family-recent';
          const cell = createElement('td'); const link = createElement('a', game.name); link.href = 'https://store.steampowered.com/app/' + id; link.target = '_blank'; link.rel = 'noopener noreferrer'; cell.appendChild(link);
          row.append(cell, createElement('td', game.time ? new Date(game.time * 1000).toLocaleDateString() : '未知'), createElement('td', game.owners.map(ownerName).join('、'))); body.appendChild(row);
        });
        search.addEventListener('input', () => { const value = search.value.toLocaleLowerCase(); [...body.rows].forEach(row => { row.hidden = !row.textContent.toLocaleLowerCase().includes(value); }); });
        table.appendChild(body); scroll.appendChild(table); panel.appendChild(scroll);
      }
      root.replaceChildren(panel);
      log.debug('panel.render', '家庭库面板已更新', { cacheValid: Boolean(validCache()), scanning: Boolean(scanPromise) });
    }

    const targets = PAGE_ADAPTERS.family.rows;
    const marked = new Set();
    function appId(element) {
      const value = element.getAttribute('data-ds-appid') || element.getAttribute('data-app-id');
      if (value && /^\d+$/.test(value)) return value;
      const wishlist = element.getAttribute('data-rfd-draggable-id')?.match(/^WishlistItem-(\d+)/);
      if (wishlist) return wishlist[1];
      const href = element.getAttribute('href') || '';
      const match = href.match(/^(?:https?:\/\/(?:store\.steampowered\.com|steamcommunity\.com))?\/app\/(\d+)/);
      return match?.[1] || null;
    }
    function updateMarks(elements) {
      if (!scope.active) return;
      const active = enabled && validCache();
      for (const element of marked) {
        const id = element.getAttribute('data-sse-family-app');
        const game = active ? cache.apps[id] : null;
        if (!element.isConnected || !game || game.owners.includes(cache.steamid) || appId(element) !== id) {
          element.querySelector(':scope > .sse-family-badge')?.remove(); element.removeAttribute('data-sse-family-app');
          marked.delete(element);
        }
      }
      if (!elements) ensureFamilyNav();
      if (!active) return;
      let added = 0;
      (elements || document.querySelectorAll(targets)).forEach(element => {
        if (element.closest('#sse-family-dialog, #sapx-ui-root, #sse-cart-tools, .sse-family-banner, .sse-family-badge')) return;
        const id = appId(element); const game = cache.apps[id];
        if (!game || game.owners.includes(cache.steamid) || element.classList.contains('ds_owned') || element.querySelector('.ds_owned_flag:not(.sse-family-badge)')) return;
        const owner = element.parentElement?.closest(targets);
        if (owner && appId(owner) === id) return;
        element.setAttribute('data-sse-family-app', id);
        marked.add(element);
        let badge = element.querySelector(':scope > .sse-family-badge');
        if (!badge) { badge = createElement('span', '在家庭库中', 'sse-family-badge'); element.appendChild(badge); added++; }
        const title = gameDescription(game);
        if (badge.title !== title) badge.title = title;
      });
      if (added) log.debug('marks.render', '家庭库标记已添加', { count: added });
    }
    function updateBanner() {
      if (!enabled || !validCache()) { document.querySelectorAll('.sse-family-banner').forEach(node => node.remove()); return; }
      const detailId = location.pathname.match(/^\/app\/(\d+)/)?.[1];
      const detail = cache.apps[detailId];
      if (onStore && detail) {
        const host = document.querySelector('.queue_and_playtime, #game_area_purchase, .game_area_purchase');
        if (host && !host.querySelector('.sse-family-banner')) {
          const banner = createElement('div', detail.owners.includes(cache.steamid) ? '您和家庭成员拥有此游戏' : '您的 Steam 家庭库中已有此游戏', 'sse-family-banner');
          banner.title = gameDescription(detail);
          banner.appendChild(action('查看贡献者（' + detail.owners.length + '）', () => window.alert(gameDescription(detail))));
          const launch = createElement('a', '马上开玩'); launch.href = 'steam://launch/' + detailId + '/Dialog'; banner.appendChild(launch);
          host.prepend(banner);
        }
      }
      if (location.hostname === 'steamdb.keylol.com') {
        const id = location.hash.match(/app\/(\d+)/)?.[1]; const game = cache.apps[id]; const host = document.querySelector('#game_score');
        if (game && !game.owners.includes(cache.steamid) && host && !document.querySelector('.sse-family-banner')) host.after(createElement('div', '家庭组：' + gameDescription(game), 'sse-family-banner'));
      }
    }
    if (enabled) {
      createDomScanner({ scope, name: 'family', selector: targets + ',' + PAGE_ADAPTERS.family.anchors, process: nodes => {
        if (nodes.some(node => node.matches(PAGE_ADAPTERS.family.anchors))) { ensureFamilyNav(); updateBanner(); }
        updateMarks(nodes.filter(node => node.matches(targets)));
      }, attributes: ITEM_ATTRIBUTES, removalSelector: '[data-sse-family-app]',
        removed: nodes => {
          for (const removed of nodes) {
            const candidates = [removed, ...(removed.querySelectorAll?.('[data-sse-family-app]') || [])];
            for (const node of candidates) if (marked.delete(node)) node.removeAttribute('data-sse-family-app');
          }
        } });
      log.debug('observer.ready', '家庭库标记动态监听已启用');
      scope.listen(window, 'hashchange', () => updateMarks());
      ensureFamilyNav();
      updateMarks();
      updateBanner();
      if (onStore && GM_getValue('sse_family_auto', true) && (!validCache() || Date.now() - cache.updated >= DAY)) {
        log.debug('scan.auto', '缓存缺失或过期，触发自动扫描'); scan();
      } else log.debug('scan.skip', '无需自动扫描');
    }
    return { open, dispose: scope.dispose };
  }
