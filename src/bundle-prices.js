  function regionalBundleSession() {
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    return readStoreSession(document, page);
  }

  function readBundleOwnedIds(data, key, optional = false) {
    const value = data?.[key];
    // Steam's subscription/auto-grant fields are optional. PHP-backed
    // responses can also encode an empty collection as {} instead of [].
    if (optional && value == null) return new Set();
    const validId = id => (key === 'rgOwnedPackages' && (id === 0 || id === '0')) || Boolean(itemRef('app', id));
    const fail = reason => {
      regionalLog.debug('bundle.ownership.invalid', '所有权字段无法识别', {
        field: key, reason, format: value == null ? String(value) : Array.isArray(value) ? 'array' : typeof value,
        count: value && typeof value === 'object' ? Object.keys(value).length : undefined,
        invalidEntryType: Array.isArray(value) ? typeof value.find(id => !validId(id)) : undefined
      });
      throw invalidResponse('已拥有游戏数据不完整：' + key + ' (' + reason + ')');
    };
    let ids;
    if (Array.isArray(value)) ids = value;
    else if (Object.prototype.toString.call(value) === '[object Object]') {
      const entries = Object.entries(value);
      if (entries.some(([id, owned]) => !validId(id) || ![true, false, 1, 0].includes(owned))) fail('ID 映射无效');
      ids = entries.filter(([, owned]) => owned === true || owned === 1).map(([id]) => id);
    }
    if (!ids) fail('缺少列表');
    if (ids.some(id => !validId(id))) fail('列表中存在无效 ID');
    // Package 0 is a system subscription, not a purchasable bundle component.
    // Keep real package IDs strict without rejecting the entire library.
    return new Set(ids.filter(id => id !== 0 && id !== '0').map(id => itemRef('app', id).id));
  }

  const bundleOwnershipCache = createAsyncCache({ ttl: 300000, retryDelay: 10000, maxEntries: 4,
    load: async (steamid, signal) => {
      const accountid = BigInt(steamid) - 76561197960265728n;
      if (accountid <= 0n || accountid > 4294967295n) throw invalidResponse('无法确认当前账号');
      const { data } = await fetchJson('https://store.steampowered.com/dynamicstore/userdata/?id=' + accountid,
        { credentials: 'include', signal });
      const sets = { packagesKnown: data?.rgOwnedPackages != null };
      for (const key of ['rgOwnedApps', 'rgOwnedPackages', 'rgMasterSubApps', 'rgAutoGrantApps']) {
        sets[key] = readBundleOwnedIds(data, key, key !== 'rgOwnedApps');
      }
      return sets;
    }
  });

  const bundleCartCache = createAsyncCache({ ttl: 5000, retryDelay: 1000, maxEntries: 4,
    load: async (steamid, session, signal) => {
      if (!session.token) throw invalidResponse('无法确认购物车捆绑包的购买用途');
      const url = new URL('https://api.steampowered.com/IAccountCartService/GetCart/v1/');
      url.searchParams.set('access_token', session.token);
      const { data, headers } = await fetchJson(url.href, { signal });
      const result = headers?.get('x-eresult');
      if ((result && result !== '1') || (data?.response?.result != null && data.response.result !== 1)) {
        throw invalidResponse('无法读取购物车购买用途');
      }
      return validateCartResponse(data, 'GetCart').cart.line_items;
    }
  });

  async function bundlePurchaseMode(bundleid, session, signal) {
    if (!isCartPage()) return 'self';
    // Cart capsules have no line-item ID. When the same bundle is both a gift
    // and a self purchase, do not guess which recipient belongs to a row.
    const lines = (await bundleCartCache.get(session.steamid, session, signal))
      .filter(line => String(line.bundleid) === String(bundleid));
    if (!lines.length) throw invalidResponse('购物车捆绑包已变更');
    const gifts = lines.filter(line => line.flags?.is_gift === true);
    if (gifts.length && gifts.length !== lines.length) throw invalidResponse('同一捆绑包有不同收礼人，无法确认补齐价');
    return gifts.length ? 'gift' : 'self';
  }

  async function readRegionalBundleDetails(bundleid, cc, signal) {
    // An anonymous request keeps account-country cookies from overriding cc.
    const html = await requestQueue.enqueue(() => gmGet('https://store.steampowered.com/bundle/' + bundleid + '/?cc=' + cc + '&l=english',
      { signal, anonymous: true, retries: 2 }), { signal });
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (readStoreSession(doc).country !== cc) throw invalidResponse('捆绑包页面返回的地区不符');
    const holder = doc.querySelector('[data-ds-bundleid="' + bundleid + '"][data-ds-bundle-data]');
    let data;
    try { data = JSON.parse(holder?.getAttribute('data-ds-bundle-data') || 'null'); }
    catch (_) { throw invalidResponse('捆绑包组成数据不可解析'); }
    const increment = Number(html.match(/SetCurrencyMinPriceIncrement\(\s*(\d+)\s*\)/)?.[1]);
    if (!data || !Number.isSafeInteger(increment) || increment < 1) throw invalidResponse('缺少捆绑包组成或币种舍入规则');
    return { data, increment };
  }

  const bundleDetailsCache = createAsyncCache({ ttl: 300000, retryDelay: 10000, maxEntries: 100,
    load: (key, bundleid, cc, signal) => readRegionalBundleDetails(bundleid, cc, signal)
  });

  function selectBundleCompletionItems(details, ownership) {
    const { data, increment } = details;
    if (![false, 0].includes(data.m_bMustPurchaseAsSet) || data.m_bIsCommercial ||
        !Array.isArray(data.m_rgItems) || !data.m_rgItems.length ||
        !Number.isSafeInteger(increment) || increment < 1) throw invalidResponse('无法确认捆绑包补齐规则');
    const remaining = [];
    const seen = new Set();
    for (const item of data.m_rgItems) {
      const ref = itemRef('package', item.m_nPackageID);
      const apps = item.m_rgIncludedAppIDs;
      if (!ref || seen.has(ref.id) || !Array.isArray(apps) || apps.some(id => !itemRef('app', id))) {
        throw invalidResponse('捆绑包套餐组成不完整');
      }
      seen.add(ref.id);
      const owned = ownership.rgOwnedPackages.has(ref.id) || (apps.length > 0 && apps.every(id =>
        ownership.rgOwnedApps.has(String(id)) && !ownership.rgMasterSubApps.has(String(id)) &&
        !ownership.rgAutoGrantApps?.has(String(id))));
      if (owned) continue;
      if (!apps.length && ownership.packagesKnown === false) throw invalidResponse('该套餐缺少游戏列表，无法确认所有权');
      remaining.push(item);
    }
    return remaining;
  }

  function calculateBundleCompletion(details, ownership, currency) {
    const { data, increment } = details;
    const remaining = selectBundleCompletionItems(details, ownership);
    let initialCents = 0, finalCents = 0;
    for (const item of remaining) {
      // Steam supplies each package's bundle-discounted amount. Reusing it
      // preserves package discounts and per-package rounding.
      const base = item.m_nBasePriceInCents;
      const final = item.m_nFinalPriceWithBundleDiscount;
      if (!Number.isSafeInteger(base) || base < 0 || !Number.isSafeInteger(final) || final < 0 || final > base) {
        throw invalidResponse('缺少未拥有套餐的地区价格');
      }
      initialCents += base;
      finalCents += final;
      if (!Number.isSafeInteger(initialCents) || !Number.isSafeInteger(finalCents)) throw invalidResponse('捆绑包价格超出有效范围');
    }
    finalCents = Math.round(finalCents / increment) * increment;
    // Steam's *_in_cents uses hundredths even for JPY/KRW. Regional prices
    // and the cart summary use the currency's actual minor-unit scale.
    const scale = Math.pow(10, getCurrencyFractionDigits(currency)) / 100;
    const initial = Math.round(initialCents * scale), final = Math.round(finalCents * scale);
    return { ...normalizePrice({ currency, initial, final,
      initialFormatted: formatMinorToCurrency(initial, currency), finalFormatted: formatMinorToCurrency(final, currency) }),
      completion: true, excluded: data.m_rgItems.length - remaining.length, remaining: remaining.length };
  }

  async function personalizeRegionalBundle(bundleid, cc, currency, option, fullPrice) {
    if (option.must_purchase_as_set === true) return fullPrice;
    const session = regionalBundleSession();
    if (!session.steamid || session.steamid === '0') return fullPrice;
    if (option.must_purchase_as_set !== false) throw invalidResponse('捆绑包未返回补齐类型');
    const signal = regionalScope?.signal;
    if (await bundlePurchaseMode(bundleid, session, signal) === 'gift') {
      // A recipient's library is not the buyer's library.
      return { ...fullPrice, fullBundle: true };
    }
    const [details, ownership] = await Promise.all([
      bundleDetailsCache.get(bundleid + ':' + cc, bundleid, cc, signal), bundleOwnershipCache.get(session.steamid, signal)
    ]);
    if (regionalBundleSession().steamid !== session.steamid) throw invalidResponse('计算期间账号已变更');
    if (selectBundleCompletionItems(details, ownership).length === details.data.m_rgItems.length) {
      regionalLog.debug('bundle.full', '无已拥有套餐，使用接口整包价格', { bundleid, cc });
      return fullPrice;
    }
    const price = calculateBundleCompletion(details, ownership, currency);
    regionalLog.debug('bundle.completion', '目标地区补齐价格已计算', {
      bundleid, cc, excluded: price.excluded, remaining: price.remaining, final: price.finalFormatted
    });
    return price;
  }
