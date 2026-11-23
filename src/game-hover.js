  const GAME_HOVER_ROWS = '.search_result_row, .tab_item, .tab_row_item, .recommendation_link, .store_main_capsule, .store_capsule, .small_cap, .large_cap, .wishlist_row, .wishlistRowItem, [data-rfd-draggable-id^="WishlistItem-"]';
  const GAME_HOVER_ITEMS = `${GAME_HOVER_ROWS}, a[href*="/app/"], [data-ds-appid], [data-app-id], #appHubAppName`;
  const GAME_HOVER_APP_PATH = /^\/app\/(\d+)(?:\/|$)/;
  const GAME_HOVER_STORE_ORIGIN = 'https://store.steampowered.com';
  const GAME_HOVER_ACTIVITY = '#blotter_content, .blotter_block';
  const GAME_HOVER_NON_APP = '[data-ds-bundleid], [data-ds-packageid]';
  const GAME_HOVER_GAP = 8;
  const GAME_HOVER_MARGIN = 8;

  /**
   * @typedef {Object} GameHoverDetails
   * @property {string} name
   * @property {string} publishers
   * @property {string} developers
   * @property {string} [franchises]
   * @property {boolean | null} earlyAccess
   * @property {string[][] | null} [languages]
   * @property {string} [languageSummary]
   * @property {string[]} tags
   * @property {string} [description]
   * @property {string | null} [reviews]
   */

  function isGameHoverPage() {
    return location.hostname === 'store.steampowered.com' ||
      (location.hostname === 'steamcommunity.com' && /^\/(?:my|(?:id|profiles)\/[^/]+)\/home\/?$/i.test(location.pathname));
  }

  /** @returns {{row: Element, id: string} | null} */
  function findActivityGameHoverItem(target) {
    const link = target?.closest?.('a[href]');
    if (!link?.textContent.trim() || !link.closest(GAME_HOVER_ACTIVITY)) return null;

    const url = new URL(link.href, location.href);
    if (url.origin !== GAME_HOVER_STORE_ORIGIN && url.origin !== 'https://steamcommunity.com') return null;
    const id = itemRef('app', GAME_HOVER_APP_PATH.exec(url.pathname)?.[1])?.id;
    return id ? { row: link, id } : null;
  }

  /** @returns {{row: Element, id: string} | null} */
  function findGameHoverItem(target) {
    if (location.hostname === 'steamcommunity.com') return findActivityGameHoverItem(target);
    const closest = target?.closest?.(GAME_HOVER_ITEMS);
    if (!closest) return null;
    if (closest.id === 'appHubAppName') {
      const id = GAME_HOVER_APP_PATH.exec(location.pathname)?.[1];
      return id ? { row: closest, id } : null;
    }
    const row = closest.closest(GAME_HOVER_ROWS);
    const link = target.closest('a[href]');
    let linkId;
    if (link) {
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || /^\/(sub|bundle)\//.test(url.pathname)) return null;
      linkId = GAME_HOVER_APP_PATH.exec(url.pathname)?.[1];
    }
    if (row && !row.matches(GAME_HOVER_NON_APP)) {
      const id = itemRef('app', row === link ? linkId : storeSaleAppId(row))?.id;
      if (id && (!linkId || id === linkId)) return { row, id };
    }
    if (linkId) return { row: link, id: linkId };
    if (row || closest.matches(GAME_HOVER_NON_APP)) return null;
    const id = itemRef('app', storeSaleAppId(closest))?.id;
    return id ? { row: closest, id } : null;
  }

  /** @returns {GameHoverDetails | null} */
  function parseGameHoverPage(doc, id) {
    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
    const name = doc.querySelector('#appHubAppName, .apphub_AppName')?.textContent.trim() ||
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();
    if (!name || (canonical && itemFromLink(canonical)?.id !== id)) return null;
    if (!doc.querySelector('.game_description_snippet, #appHubAppName, .apphub_AppName')) return null;

    function uniqueTexts(selector) {
      const texts = Array.from(doc.querySelectorAll(selector), node => node.textContent.trim());
      return [...new Set(texts.filter(Boolean))];
    }

    function companyNames(type) {
      const selectors = [
        `#${type}_row .summary a`,
        `.dev_row .summary a[href*="/${type}/"]`,
        `.dev_row .summary a[href*="?${type}="]`,
        `.dev_row .summary a[href*="&${type}="]`
      ];
      return uniqueTexts(selectors.join(', ')).join('、');
    }

    return {
      name,
      publishers: companyNames('publisher'),
      developers: companyNames('developer') || uniqueTexts('#developers_list a').join('、'),
      franchises: uniqueTexts('#franchise_row a').join('、') || companyNames('franchise'),
      earlyAccess: Boolean(doc.querySelector('.early_access_header, .early_access_banner, #earlyAccessHeader')),
      languages: parseGameHoverLanguages(doc),
      tags: uniqueTexts('.glance_tags a.app_tag').slice(0, 5),
      description: doc.querySelector('.game_description_snippet')?.textContent.trim(),
      reviews: parseGameHoverStoreReviews(doc)
    };
  }

  /** @returns {string[][] | null} */
  function parseGameHoverLanguages(doc) {
    const rows = doc.querySelectorAll('table.game_language_options tr');
    if (!rows.length) return null;

    const languages = [[], [], []];
    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      if (cells.length < 4) continue;
      const language = cells[0].textContent.trim();
      if (!language) continue;

      for (const [index, supportedLanguages] of languages.entries()) {
        const supportCell = cells[index + 1];
        if (supportCell.querySelector('.checkmark') || /[✔✓]/.test(supportCell.textContent)) {
          supportedLanguages.push(language);
        }
      }
    }
    return languages;
  }

  /** @returns {string} */
  function formatGameHoverReviews(percent, total) {
    if (!total) return '暂无评测（0 条）';
    return `${percent}% 好评（${total.toLocaleString('zh-CN')} 条）`;
  }

  /** @returns {string | null} */
  function gameHoverReviews(data) {
    const { total_positive: positive, total_reviews: total } = (data?.response || data)?.query_summary || {};
    if (data?.success === 0 || !Number.isSafeInteger(total) || !Number.isSafeInteger(positive) || positive < 0 || total < positive) return null;
    return formatGameHoverReviews(total ? Math.round(positive * 100 / total) : 0, total);
  }

  /** @returns {string | null} */
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

  /** @returns {GameHoverDetails | null} */
  function gameHoverAppDetails(data, id) {
    const entry = data?.[id];
    const app = entry?.data;
    if (!entry?.success || String(app?.steam_appid) !== id || typeof app.name !== 'string') return null;
    function names(value) {
      return Array.isArray(value) ? value.filter(name => typeof name === 'string').join('、') : '';
    }
    function plainText(value) {
      return parseGameHoverHtml(typeof value === 'string' ? value : '').textContent.trim();
    }
    return {
      name: app.name,
      publishers: names(app.publishers),
      developers: names(app.developers),
      earlyAccess: Array.isArray(app.genres) ? app.genres.some(genre => Number(genre?.id) === 70) : null,
      languageSummary: plainText(app.supported_languages),
      tags: [],
      description: plainText(app.short_description)
    };
  }

  /** @returns {DocumentFragment} */
  function parseGameHoverHtml(html) {
    // Template contents stay inert, including images and inline handlers from Steam's HTML.
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content;
  }

  /** @returns {Promise<GameHoverDetails | null>} */
  async function loadGameHoverDetails(id, language, options) {
    if (location.origin === GAME_HOVER_STORE_ORIGIN && GAME_HOVER_APP_PATH.exec(location.pathname)?.[1] === id) {
      const details = parseGameHoverPage(document, id);
      if (details) return details;
    }

    const storePage = new URL(`/app/${id}/`, GAME_HOVER_STORE_ORIGIN);
    storePage.searchParams.set('l', language);
    try {
      const html = await gmGet(storePage.href, options);
      const details = parseGameHoverPage(parseGameHoverHtml(html), id);
      if (details) return details;
    } catch (error) {
      if (options.signal.aborted || error.status === 429) throw error;
    }

    const fallback = new URL('/api/appdetails', GAME_HOVER_STORE_ORIGIN);
    fallback.searchParams.set('appids', id);
    fallback.searchParams.set('l', language);
    const json = await gmGet(fallback.href, options);
    return gameHoverAppDetails(JSON.parse(json), id);
  }

  async function loadGameHoverTagNames(language, options) {
    const url = new URL('https://api.steampowered.com/IStoreService/GetTagList/v1/');
    url.searchParams.set('language', language);
    const { response } = JSON.parse(await gmGet(url.href, { ...options, anonymous: true }));
    if (!Array.isArray(response?.tags)) throw invalidResponse('缺少 Steam 标签名称列表');
    const names = new Map();
    for (const tag of response.tags) {
      if (typeof tag?.name === 'string' && tag.name.trim()) names.set(tag.tagid, tag.name.trim());
    }
    return names;
  }

  async function fillGameHoverMetadata(details, id, session, options, tagNames) {
    if (!details || (details.franchises && details.tags.length >= 5)) return details;

    const url = new URL('https://api.steampowered.com/IStoreBrowseService/GetItems/v1/');
    url.searchParams.set('input_json', JSON.stringify({
      ids: [{ appid: Number(id) }],
      context: { language: session.language, country_code: session.country || 'US', steam_realm: 1 },
      data_request: { include_basic_info: true, include_tag_count: 5 }
    }));
    const { response } = JSON.parse(await gmGet(url.href, { ...options, anonymous: true }));
    if (!Array.isArray(response?.store_items)) throw invalidResponse('缺少 Steam 商品列表');
    const item = response.store_items.find(entry => String(entry?.appid) === id);
    if (!item) return details;

    const enriched = { ...details };
    if (!enriched.franchises && item.basic_info) {
      const franchises = item.basic_info.franchises;
      if (franchises == null || Array.isArray(franchises)) {
        const names = (franchises || []).map(entry => entry?.name).filter(name => typeof name === 'string');
        enriched.franchises = [...new Set(names.map(name => name.trim()).filter(Boolean))].join('、');
      }
    }
    if (enriched.tags.length < 5 && Array.isArray(item.tags) && item.tags.length) {
      try {
        const names = await tagNames.get(session.language);
        const tags = item.tags.slice(0, 5).map(tag => names.get(tag?.tagid)).filter(Boolean);
        if (tags.length > enriched.tags.length) enriched.tags = tags;
      } catch (error) {
        if (!options.signal.aborted) diagnostics.scope('game-hover').debug('tags.unavailable', 'Steam 标签名称暂不可用', { id, error });
      }
    }
    return enriched;
  }

  /** @returns {Promise<string | null>} */
  async function loadGameHoverReviews(id, options) {
    const url = new URL('https://api.steampowered.com/IUserReviewsService/GetAppReviews/v1/');
    url.searchParams.set('input_json', JSON.stringify({
      appid: Number(id), languages: ['all'], filter: 0, cursor: '*', review_type: 0, purchase_type: 1, num_per_page: 1
    }));
    return gameHoverReviews(JSON.parse(await gmGet(url.href, { ...options, anonymous: true })));
  }

  /** @returns {{side: 'left' | 'above' | 'below' | 'overlay', width: number, left: number, maxHeight: number}} */
  function gameHoverPlacement(rect, viewport) {
    const preferredWidth = 324;
    const gap = GAME_HOVER_GAP;
    const margin = GAME_HOVER_MARGIN;
    const leftSpace = rect.left - gap - margin;
    if (leftSpace >= 216) {
      const width = Math.min(preferredWidth, leftSpace);
      return { side: 'left', width, left: rect.left - gap - width, maxHeight: viewport.height - 2 * margin };
    }

    const above = Math.max(0, rect.top - gap - margin);
    const below = Math.max(0, viewport.height - rect.bottom - gap - margin);
    const width = Math.min(preferredWidth, viewport.width - 2 * margin);
    const left = Math.max(margin, Math.min(rect.left, viewport.width - margin - width));
    const verticalSpace = Math.max(above, below);
    if (verticalSpace < 96) return { side: 'overlay', width, left, maxHeight: viewport.height - 2 * margin };
    return { side: above > below ? 'above' : 'below', width, left, maxHeight: verticalSpace };
  }

  /** @returns {void} */
  function initializeGameHover() {
    const scope = createFeatureScope('game-hover');
    const log = diagnostics.scope('game-hover');
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    const session = readStoreSession(document, page);
    const options = { signal: scope.signal, timeout: 8000 };
    const queue = new RequestQueue(2);
    const tagNames = createAsyncCache({ ttl: 24 * 3600000, load: language => loadGameHoverTagNames(language, options) });
    const reviewCache = createAsyncCache({
      ttl: 10 * 60000,
      async load(id) { return queue.enqueue(() => loadGameHoverReviews(id, options), options); }
    });
    const detailsCache = createAsyncCache({
      ttl: 30 * 60000,
      async load(id) { return queue.enqueue(() => loadGameHoverDetails(id, session.language, options), options); }
    });
    log.info('initialize', '游戏悬停详情已启用');

    const tooltip = createElement('div');
    tooltip.id = 'sse-game-hover';
    tooltip.hidden = true;
    tooltip.setAttribute('role', 'tooltip');
    const body = createElement('div', undefined, 'sse-game-hover-body');
    tooltip.appendChild(body);
    document.body.appendChild(tooltip);

    let current;
    let cancelOpen;
    let cancelClose;

    function hide() {
      cancelOpen?.();
      cancelClose?.();
      cancelOpen = null;
      cancelClose = null;
      current = null;
      tooltip.hidden = true;
    }
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
      let top = rect.top;
      if (placement.side === 'above') top = rect.top - GAME_HOVER_GAP - height;
      else if (placement.side === 'below') top = rect.bottom + GAME_HOVER_GAP;
      const margin = GAME_HOVER_MARGIN;
      const y = Math.max(margin, Math.min(top, viewport.height - height - margin));
      tooltip.style.top = `${y}px`;
      const rowCenter = rect.top + rect.height / 2;
      const arrowOffset = Math.max(12, Math.min(rowCenter - y, height - 12));
      tooltip.style.setProperty('--sse-game-hover-arrow', `${arrowOffset}px`);
    }

    function appendField(label, value) {
      const line = createElement('div');
      line.append(createElement('strong', `${label} · `), value || '—');
      body.appendChild(line);
    }

    function render(item) {
      if (current !== item || !scope.active) return;
      const { details, reviews } = item;
      body.replaceChildren();
      if (details?.name) body.appendChild(createElement('div', details.name, 'sse-game-hover-title'));
      if (details) {
        appendField('发行商', details.publishers);
        appendField('开发者', details.developers);
        let series = details.franchises;
        if (!series) {
          if (item.metadataPending) series = '正在读取…';
          else series = details.franchises === '' ? 'Steam 未列出' : '暂不可用';
        }
        appendField('系列', series);
      }
      const loadingReviews = reviews === undefined || details === undefined;
      appendField('评测', reviews || details?.reviews || (loadingReviews ? '正在读取…' : '暂不可用'));
      if (details) {
        let earlyAccess = '暂不可用';
        if (details.earlyAccess != null) earlyAccess = details.earlyAccess ? '是' : '否';
        appendField('抢先体验', earlyAccess);
        if (details.languages) {
          ['界面', '完整音频', '字幕'].forEach((label, index) => appendField(label, details.languages[index].join('、')));
        } else appendField('语言支持', details.languageSummary || '暂不可用');
        if (details.tags.length) {
          const tags = createElement('div', undefined, 'sse-game-hover-tags');
          tags.append(...details.tags.map(tag => createElement('span', tag)));
          body.append(createElement('strong', '标签'), tags);
        } else appendField('标签', item.metadataPending ? '正在读取…' : '暂不可用');
        appendField('简介', details.description);
      } else {
        body.appendChild(createElement('div', details === undefined ? '正在读取游戏详情…' : '商店详情暂不可用。'));
      }
      place();
    }

    function renderWhenLoaded(item, field, cache) {
      cache.get(item.id).then(
        value => { item[field] = value; },
        () => { item[field] = null; }
      ).then(() => render(item));
    }

    const metadataCache = createAsyncCache({
      ttl: 30 * 60000,
      load: (id, details) => queue.enqueue(() => fillGameHoverMetadata(details, id, session, options, tagNames), options)
    });

    async function renderDetails(item) {
      item.details = await detailsCache.get(item.id).catch(() => null);
      if (current !== item || !scope.active) return;
      if (item.details && (!item.details.franchises || item.details.tags.length < 5)) {
        item.metadataPending = true;
        render(item);
        try {
          item.details = await metadataCache.get(item.id, item.details);
        } catch (error) {
          if (scope.active) log.debug('metadata.unavailable', 'Steam 系列及标签暂不可用', { id: item.id, error });
        }
        item.metadataPending = false;
      }
      render(item);
    }

    function open(item) {
      tooltip.hidden = false;
      body.scrollTop = 0;
      render(item);
      if (current !== item) return;
      renderDetails(item);
      renderWhenLoaded(item, 'reviews', reviewCache);
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
