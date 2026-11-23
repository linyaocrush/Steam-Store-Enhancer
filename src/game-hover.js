  const GAME_HOVER_ROWS = '.search_result_row, .tab_item, .tab_row_item, .recommendation_link, .store_main_capsule, .store_capsule, .small_cap, .large_cap, .wishlist_row, .wishlistRowItem, [data-rfd-draggable-id^="WishlistItem-"]';
  const GAME_HOVER_ITEMS = `${GAME_HOVER_ROWS}, a[href*="/app/"], [data-ds-appid], [data-app-id], #appHubAppName`;

  function findGameHoverItem(target) {
    const closest = target?.closest?.(GAME_HOVER_ITEMS);
    if (!closest) return null;
    if (closest.id === 'appHubAppName') {
      const id = /^\/app\/(\d+)(?:\/|$)/.exec(location.pathname)?.[1];
      return id ? { row: closest, id } : null;
    }
    const row = closest.closest(GAME_HOVER_ROWS);
    const link = target.closest('a[href]');
    let linkId;
    if (link) {
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || /^\/(sub|bundle)\//.test(url.pathname)) return null;
      linkId = /^\/app\/(\d+)(?:\/|$)/.exec(url.pathname)?.[1];
    }
    if (row && !row.matches('[data-ds-bundleid], [data-ds-packageid]')) {
      const id = itemRef('app', row === link ? linkId : storeSaleAppId(row))?.id;
      if (id && (!linkId || id === linkId)) return { row, id };
    }
    if (linkId) return { row: link, id: linkId };
    if (row || closest.matches('[data-ds-bundleid], [data-ds-packageid]')) return null;
    const id = itemRef('app', storeSaleAppId(closest))?.id;
    return id ? { row: closest, id } : null;
  }

  function parseGameHoverPage(doc, id) {
    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
    const name = doc.querySelector('#appHubAppName, .apphub_AppName')?.textContent.trim() ||
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();
    if (!name || (canonical && itemFromLink(canonical)?.id !== id)) return null;
    if (!doc.querySelector('.game_description_snippet, #appHubAppName, .apphub_AppName')) return null;

    const texts = selector => [...new Set([...doc.querySelectorAll(selector)].map(node => node.textContent.trim()).filter(Boolean))];
    const company = type => texts(`#${type}_row .summary a, .dev_row .summary a[href*="/${type}/"], .dev_row .summary a[href*="?${type}="], .dev_row .summary a[href*="&${type}="]`).join('、');
    const languages = [[], [], []];
    const languageRows = doc.querySelectorAll('table.game_language_options tr');
    for (const row of languageRows) {
      const cells = row.querySelectorAll('td');
      if (cells.length < 4) continue;
      const name = cells[0].textContent.trim();
      if (!name) continue;
      languages.forEach((list, index) => {
        if (cells[index + 1].querySelector('.checkmark') || /[✔✓]/.test(cells[index + 1].textContent)) list.push(name);
      });
    }
    return {
      name,
      publishers: company('publisher'),
      developers: company('developer') || texts('#developers_list a').join('、'),
      franchises: company('franchise'),
      earlyAccess: Boolean(doc.querySelector('.early_access_header, .early_access_banner, #earlyAccessHeader')),
      languages: languageRows.length ? languages : null,
      tags: texts('.glance_tags a.app_tag').slice(0, 5),
      description: doc.querySelector('.game_description_snippet')?.textContent.trim(),
      reviews: parseGameHoverStoreReviews(doc)
    };
  }

  function formatGameHoverReviews(percent, total) {
    if (!total) return '暂无评测（0 条）';
    return `${percent}% 好评（${total.toLocaleString('zh-CN')} 条）`;
  }

  function gameHoverReviews(data) {
    const { total_positive: positive, total_reviews: total } = (data?.response || data)?.query_summary || {};
    if (data?.success === 0 || !Number.isSafeInteger(total) || !Number.isSafeInteger(positive) || positive < 0 || total < positive) return null;
    return formatGameHoverReviews(total ? Math.round(positive * 100 / total) : 0, total);
  }

  function parseGameHoverStoreReviews(doc) {
    const row = doc.querySelector('#userReviews [itemprop="aggregateRating"]') ||
      doc.querySelector('#userReviews [data-tooltip-html].user_reviews_summary_row:last-child, #userReviews [data-store-tooltip].user_reviews_summary_row:last-child');
    const summary = row?.getAttribute('data-tooltip-html') || row?.getAttribute('data-store-tooltip');
    const normalized = summary?.normalize('NFKC');
    const percent = normalized?.match(/(\d+)\s*%/)?.[1];
    if (percent == null || Number(percent) > 100) return null;
    const count = row.querySelector('[itemprop="reviewCount"]')?.getAttribute('content') ||
      normalized.replace(/\d+\s*%/, '').match(/\d[\d,. ]*/)?.[0];
    const total = Number(count?.replace(/[^0-9]/g, ''));
    return Number.isSafeInteger(total) && total > 0 ? `${formatGameHoverReviews(Number(percent), total)} · 商店摘要` : null;
  }

  function gameHoverAppDetails(data, id) {
    const entry = data?.[id];
    const app = entry?.data;
    if (!entry?.success || String(app?.steam_appid) !== id || typeof app.name !== 'string') return null;
    const list = value => Array.isArray(value) ? value.filter(name => typeof name === 'string').join('、') : '';
    const text = value => {
      const template = document.createElement('template');
      template.innerHTML = typeof value === 'string' ? value : '';
      return template.content.textContent.trim();
    };
    return {
      name: app.name, publishers: list(app.publishers), developers: list(app.developers),
      earlyAccess: Array.isArray(app.genres) ? app.genres.some(genre => Number(genre?.id) === 70) : null,
      languageSummary: text(app.supported_languages), tags: [], description: text(app.short_description)
    };
  }

  async function loadGameHoverReviews(id, options) {
    const url = new URL('https://api.steampowered.com/IUserReviewsService/GetAppReviews/v1/');
    url.searchParams.set('input_json', JSON.stringify({
      appid: Number(id), languages: ['all'], filter: 0, cursor: '*', review_type: 0, purchase_type: 1, num_per_page: 1
    }));
    return gameHoverReviews(JSON.parse(await gmGet(url.href, { ...options, anonymous: true })));
  }

  function gameHoverPlacement(rect, viewport) {
    const preferredWidth = 324;
    const gap = 8;
    const margin = 8;
    const leftSpace = rect.left - gap - margin;
    if (leftSpace >= 216) {
      const width = Math.min(preferredWidth, leftSpace);
      return { side: 'left', width, left: rect.left - gap - width, maxHeight: viewport.height - 2 * margin };
    }

    const above = Math.max(0, rect.top - gap - margin);
    const below = Math.max(0, viewport.height - rect.bottom - gap - margin);
    const width = Math.min(preferredWidth, viewport.width - 2 * margin);
    const x = Math.max(margin, Math.min(rect.left, viewport.width - margin - width));
    if (Math.max(above, below) < 96) return { side: 'overlay', width, left: x, maxHeight: viewport.height - 2 * margin };
    return { side: above > below ? 'above' : 'below', width, left: x, maxHeight: Math.max(above, below) };
  }

  function initializeGameHover() {
    const scope = createFeatureScope('game-hover');
    const log = diagnostics.scope('game-hover');
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    const { language } = readStoreSession(document, page);
    const options = { signal: scope.signal, timeout: 8000 };
    const queue = new RequestQueue(2);
    const reviewCache = createAsyncCache({ ttl: 10 * 60000, load: async id => {
      return queue.enqueue(() => loadGameHoverReviews(id, options), options);
    } });
    const detailsCache = createAsyncCache({ ttl: 30 * 60000, load: async id => {
      return queue.enqueue(async () => {
        if (itemFromLink(location.pathname)?.id === id && location.pathname.startsWith('/app/')) {
          const details = parseGameHoverPage(document, id);
          if (details) return details;
        }
        const url = new URL(`/app/${id}/`, location.origin);
        url.searchParams.set('l', language);
        try {
          // Template contents stay inert, including images and inline handlers from Steam's HTML.
          const template = document.createElement('template');
          template.innerHTML = await gmGet(url.href, options);
          const details = parseGameHoverPage(template.content, id);
          if (details) return details;
        } catch (error) {
          if (scope.signal.aborted || error.status === 429) throw error;
        }
        const fallback = new URL('/api/appdetails', location.origin);
        fallback.searchParams.set('appids', id);
        fallback.searchParams.set('l', language);
        return gameHoverAppDetails(JSON.parse(await gmGet(fallback.href, options)), id);
      }, options);
    } });
    log.info('initialize', '游戏悬停详情已启用');

    const tooltip = createElement('div');
    tooltip.id = 'sse-game-hover';
    tooltip.hidden = true;
    tooltip.setAttribute('role', 'tooltip');
    const body = createElement('div', undefined, 'sse-game-hover-body');
    tooltip.appendChild(body);
    document.body.appendChild(tooltip);

    let current, cancelOpen, cancelClose;
    const hide = () => {
      cancelOpen?.();
      cancelClose?.();
      cancelOpen = cancelClose = null;
      current = null;
      tooltip.hidden = true;
    };
    scope.own(hide);
    scope.own(() => tooltip.remove());

    function place() {
      if (tooltip.hidden) return;
      const row = current.row;
      if (!row.isConnected) { hide(); return; }
      const rect = row.getBoundingClientRect();
      const viewport = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
      if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= viewport.height) { hide(); return; }
      const placement = gameHoverPlacement(rect, viewport);
      tooltip.dataset.side = placement.side;
      tooltip.style.left = `${placement.left}px`;
      tooltip.style.width = `${placement.width}px`;
      body.style.maxHeight = `${placement.maxHeight}px`;
      const height = tooltip.offsetHeight;
      const top = placement.side === 'above' ? rect.top - 8 - height : placement.side === 'below' ? rect.bottom + 8 : rect.top;
      const y = Math.max(8, Math.min(top, viewport.height - height - 8));
      tooltip.style.top = `${y}px`;
      tooltip.style.setProperty('--sse-game-hover-arrow', `${Math.max(12, Math.min(rect.top + rect.height / 2 - y, height - 12))}px`);
    }

    function render(item) {
      if (current !== item || !scope.active) return;
      const { details, reviews } = item;
      const field = (label, value) => {
        const line = createElement('div');
        line.append(createElement('strong', `${label} · `), value || '—');
        body.appendChild(line);
      };
      body.replaceChildren();
      if (details?.name) body.appendChild(createElement('div', details.name, 'sse-game-hover-title'));
      if (details) {
        field('发行商', details.publishers);
        field('开发者', details.developers);
        field('系列', details.franchises);
      }
      field('评测', reviews || details?.reviews || (reviews === undefined || details === undefined ? '正在读取…' : '暂不可用'));
      if (details) {
        field('抢先体验', details.earlyAccess == null ? '暂不可用' : details.earlyAccess ? '是' : '否');
        if (details.languages) {
          ['界面', '完整音频', '字幕'].forEach((label, index) => field(label, details.languages[index].join('、')));
        } else field('语言支持', details.languageSummary || '暂不可用');
        if (details.tags.length) {
          const tags = createElement('div', undefined, 'sse-game-hover-tags');
          tags.append(...details.tags.map(tag => createElement('span', tag)));
          body.append(createElement('strong', '标签'), tags);
        } else field('标签', '');
        field('简介', details.description);
      } else {
        body.appendChild(createElement('div', details === undefined ? '正在读取游戏详情…' : '商店详情暂不可用。'));
      }
      place();
    }

    function open(item) {
      tooltip.hidden = false;
      body.scrollTop = 0;
      render(item);
      if (current !== item) return;
      detailsCache.get(item.id).then(details => { item.details = details; }, () => { item.details = null; }).then(() => render(item));
      reviewCache.get(item.id).then(reviews => { item.reviews = reviews; }, () => { item.reviews = null; }).then(() => render(item));
    }

    function closeSoon() {
      if (!cancelClose) cancelClose = scope.timeout(hide, 180);
    }

    scope.listen(document, 'pointerover', event => {
      if (event.pointerType === 'touch') return;
      if (tooltip.contains(event.target) || current?.row.contains(event.target)) {
        cancelClose?.();
        cancelClose = null;
        return;
      }
      // Allow the pointer to travel over the gap between the row and the tooltip.
      const item = findGameHoverItem(event.target);
      if (!item) return;
      hide();
      current = item;
      cancelOpen = scope.timeout(() => open(item), 420);
    }, true);
    scope.listen(document, 'pointerout', event => {
      if (!current || event.pointerType === 'touch') return;
      const contains = target => tooltip.contains(target) || current.row.contains(target);
      const next = event.relatedTarget?.nodeType ? event.relatedTarget : null;
      if (!contains(event.target) || contains(next)) return;
      if (tooltip.hidden) hide();
      else closeSoon();
    }, true);
    scope.listen(window, 'scroll', event => {
      if (!event.target?.nodeType || !tooltip.contains(event.target)) hide();
    }, { capture: true, passive: true });
    scope.listen(window, 'resize', place, { passive: true });
    scope.listen(window, 'blur', hide);
    scope.listen(document, 'keydown', event => { if (event.key === 'Escape') hide(); });
    const observer = new MutationObserver(() => { if (current && !current.row.isConnected) hide(); });
    observer.observe(document.body, { childList: true, subtree: true });
    scope.own(() => observer.disconnect());
  }
