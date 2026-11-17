  function placeWishlistCartButton(row, control) {
    // Keep React-owned controls in place; hide them only while our replacement is adjacent.
    const nativeButton = row.querySelector('.E4PXslhR-fI- > button:not(.sse-quick-add), button.LrqeL6o22aQ-:not(.sse-quick-add), .purchase_area .btnv6_green_white_innerfade:not(.sse-quick-add), .purchase_area .btn_addtocart:not(.sse-quick-add)');
    if (!nativeButton) return false;
    control.classList.add('sse-wishlist-cart');
    nativeButton.classList.add('sse-wishlist-native-cart');
    if (nativeButton.previousElementSibling !== control) nativeButton.before(control);
    return true;
  }

  function initializeCartTools() {
    const log = createLogger('购物车');
    log.info('快速加购与购物车管理已启用');
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    const english = GM_getValue('sse_cart_language', 'ZH') === 'EN';
    const text = (zh, en) => english ? en : zh;
    const style = document.createElement('style');
    style.textContent = `
      .sse-cart-panel{box-sizing:border-box;width:100%;max-width:100%;min-width:0;flex-shrink:0;align-self:flex-start;margin:16px 0;padding:16px;background:#1b2838;border:1px solid #34465a;border-radius:6px;color:#c6d4df}
      .sse-cart-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0}
      .sse-cart-button,.sse-quick-add{cursor:pointer;border:0;border-radius:3px;padding:7px 10px;background:#27465c;color:#c6e7ff;font-size:12px}
      .sse-cart-button:hover,.sse-quick-add:hover{background:#376782}
      .sse-cart-button:disabled,.sse-quick-add:disabled{opacity:.55;cursor:default}
      .sse-cart-input{box-sizing:border-box;width:100%;min-height:160px;resize:vertical;background:#0f141b;color:#c6d4df;border:1px solid #34465a;border-radius:4px;padding:10px;line-height:1.6}
      .sse-cart-status{white-space:pre-wrap;font-size:12px;color:#67c1f5;margin-top:8px}
      .sse-cart-panel label{font-size:12px}.sse-cart-panel input{accent-color:#67c1f5}
      .sse-quick-add{position:relative;z-index:10;margin:4px;display:inline-block}
      .sse-quick-add.sse-wishlist-cart{position:static;margin:0}
      .sse-wishlist-cart + .sse-wishlist-native-cart{display:none!important}
      .game_purchase_action .sse-native-cart{position:static;margin:0;padding:0;border:0;cursor:pointer;display:inline-block}
      .sse-cart-dialog{position:fixed;inset:0;background:#000b;z-index:2147483646;display:grid;place-items:center;padding:12px}
      .sse-cart-dialog>div{width:min(500px,90vw);max-height:80vh;overflow:auto;background:#1b2838;border:1px solid #34465a;border-radius:6px;padding:18px;color:#c6d4df}
      .sse-cart-dialog h3{color:#e5e5e5;margin-top:0}.sse-cart-dialog .sse-cart-button{display:block;width:100%;margin-top:8px;text-align:left}
    `;
    document.head.appendChild(style);
    let contextPromise;
    let busy = false;
    const itemRequests = new Map();

    function readContext(doc, globals = {}) {
      const session = readStoreSession(doc, globals);
      return { token: session.token, country: session.country, language: session.language };
    }

    async function context() {
      if (!contextPromise) {
        contextPromise = (async () => {
          let result = readContext(document, page);
          if (!result.token || !result.country) {
            const html = await gmGet('https://store.steampowered.com/cart/');
            const remote = new DOMParser().parseFromString(html, 'text/html');
            const fallback = readContext(remote);
            result = { ...result, token: result.token || fallback.token, country: result.country || fallback.country };
          }
          if (!result.token || !result.country) throw new Error(text('无法读取账号信息，请先登录 Steam 商店并刷新页面。', 'Sign in to the Steam store and refresh this page.'));
          return result;
        })().catch(error => { contextPromise = null; throw error; });
      }
      return contextPromise;
    }

    async function account(method, payload) {
      log.debug('请求购物车操作', { method });
      const current = await context();
      const url = new URL('https://api.steampowered.com/IAccountCartService/' + method + '/v1/');
      url.searchParams.set('access_token', current.token);
      const options = { method: payload === undefined ? 'GET' : 'POST', signal: AbortSignal.timeout(20000) };
      if (payload !== undefined) options.body = new URLSearchParams({ input_json: JSON.stringify({ user_country: current.country, ...payload }) });
      const response = await fetch(url.href, options);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      const resultCode = response.headers?.get('x-eresult');
      if ((resultCode && resultCode !== '1') || (data.response?.result != null && data.response.result !== 1)) {
        throw new Error(text('Steam 拒绝了购物车操作。', 'Steam rejected the cart operation.'));
      }
      if (!data.response) throw new Error(text('Steam 返回了无效结果。', 'Invalid Steam response.'));
      log.debug('购物车操作完成', { method });
      return data.response;
    }

    async function storeItem(item) {
      const key = item.type + '/' + item.id;
      if (!itemRequests.has(key)) itemRequests.set(key, (async () => {
        const current = await context();
        const field = { app: 'appid', sub: 'packageid', bundle: 'bundleid' }[item.type];
        const payload = { ids: [{ [field]: item.id }], context: { language: current.language, country_code: current.country, steam_realm: 1 }, data_request: { include_all_purchase_options: true } };
        const response = JSON.parse(await requestQueue.enqueue(() => gmGet('https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=' + encodeURIComponent(JSON.stringify(payload)))));
        const result = response.response?.store_items?.[0];
        if (!result) throw new Error(text('无法读取商品：', 'Cannot read item: ') + key);
        return result;
      })().catch(error => { itemRequests.delete(key); throw error; }));
      return itemRequests.get(key);
    }

    function parseItems(input) {
      const items = [];
      const seen = new Set();
      const invalid = [];
      for (const line of input.split(/\r?\n/)) {
        const value = line.split('#')[0].trim();
        if (!value || /^=+/.test(value)) continue;
        const match = value.match(/^(?:https?:\/\/(?:store\.steampowered\.com|steamdb\.info)\/)?(app|a|sub|s|bundle|b)\/(\d+)(?:\/[^\s]*)?\/?(?:\?[^\s]*)?$/i) || value.match(/^()(\d+)$/);
        if (!match || !Number.isSafeInteger(Number(match[2])) || Number(match[2]) <= 0) { invalid.push(value); continue; }
        const type = { '': 'app', a: 'app', app: 'app', s: 'sub', sub: 'sub', b: 'bundle', bundle: 'bundle' }[match[1].toLowerCase()];
        const key = type + '/' + match[2];
        if (!seen.has(key)) { seen.add(key); items.push({ type, id: Number(match[2]) }); }
      }
      return { items, invalid };
    }

    function optionsFor(item, data) {
      const options = data.purchase_options?.length ? data.purchase_options : data.best_purchase_option ? [data.best_purchase_option] : [];
      return options.filter(option => (option.packageid || option.bundleid) &&
        (item.type === 'app' || (item.type === 'sub' ? Number(option.packageid) === item.id : Number(option.bundleid) === item.id)));
    }

    function chooseOption(options, title = text('选择购买版本', 'Choose an edition')) {
      return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'sse-cart-dialog';
        const panel = document.createElement('div');
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        const heading = document.createElement('h3');
        heading.textContent = title;
        panel.appendChild(heading);
        const close = value => { overlay.remove(); window.removeEventListener('keydown', escape); resolve(value); };
        const escape = event => { if (event.key === 'Escape') close(null); };
        for (const option of options) panel.appendChild(button((option.purchase_option_name || '') + ' · ' + (option.formatted_final_price || ''), () => close(option)));
        panel.appendChild(button(text('取消', 'Cancel'), () => close(null)));
        overlay.appendChild(panel);
        overlay.addEventListener('click', event => { if (event.target === overlay) close(null); });
        window.addEventListener('keydown', escape);
        document.body.appendChild(overlay);
        panel.querySelector('button').focus();
      });
    }

    async function addOptions(options) {
      const items = options.map(option => ({ ...(option.packageid ? { packageid: option.packageid } : { bundleid: option.bundleid }), flags: { is_gift: false, is_private: false } }));
      if (!items.length) return;
      for (let offset = 0; offset < items.length; offset += 50) await account('AddItemsToCart', { items: items.slice(offset, offset + 50) });
      log.info('已提交加购', { count: items.length });
    }

    function button(label, action) {
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'sse-cart-button';
      element.textContent = label;
      element.addEventListener('click', async event => {
        event.preventDefault();
        event.stopPropagation();
        if (element.disabled) return;
        element.disabled = true;
        try { log.debug('执行操作', { action: label }); await action(); }
        catch (error) { log.error('操作失败', { action: label, message: error.message }); window.alert(error.message || String(error)); }
        finally { element.disabled = false; }
      });
      return element;
    }

    let cartPanel = null;
    let cartPanelAnchor = null;
    function findCartPanelAnchor() {
      const desktopSummary = document.querySelector('.NKiRqw1jQHg- .i1XZFikuzME-');
      if (desktopSummary && desktopSummary.getClientRects().length > 0 && desktopSummary.getBoundingClientRect().width > 0) return desktopSummary;
      const mobileSummary = document.querySelector('.UUuDEbOJLCU- .i1XZFikuzME-');
      if (mobileSummary && mobileSummary.getClientRects().length > 0 && mobileSummary.getBoundingClientRect().width > 0) return mobileSummary;
      const candidates = new Set();
      document.querySelectorAll('a[href*="checkout.steampowered.com/checkout"]').forEach(link => {
        let container = link.parentElement;
        while (container && container !== document.body) {
          if (container.querySelector('[role="combobox"]')) {
            candidates.add(container);
            break;
          }
          container = container.parentElement;
        }
      });
      const legacy = document.querySelector('._2DjadWLFH3keW9rGWZKxSk._1G8JdfmCwhonn-pZk-tfwP');
      if (legacy) candidates.add(legacy);
      return [...candidates].find(element => element.getClientRects().length > 0 && element.getBoundingClientRect().width > 0) || [...candidates][0] || null;
    }

    function placeCartPanel(panel, anchor) {
      // Keep the Steam right column intact and place the tool immediately below its price card.
      if (anchor.nextElementSibling !== panel) anchor.after(panel);
      cartPanelAnchor = anchor;
      panel.style.width = '100%';
    }

    function mountPanel() {
      if (!isCartPage()) return;
      const anchor = findCartPanelAnchor();
      if (!anchor) return;
      if (cartPanel) {
        placeCartPanel(cartPanel, anchor);
        return;
      }
      const panel = document.createElement('section');
      panel.id = 'sse-cart-tools';
      panel.className = 'sse-cart-panel';
      const title = document.createElement('strong');
      title.textContent = text('购物车工具', 'Cart tools');
      const toolbar = document.createElement('div');
      toolbar.className = 'sse-cart-toolbar';
      const input = document.createElement('textarea');
      input.className = 'sse-cart-input';
      input.setAttribute('aria-label', text('购物车导入导出列表', 'Cart import/export list'));
      input.placeholder = text('一行一条，# 后为备注，输入自动保存。\n支持商店 / SteamDB 链接、AppID、app/730、sub/123、bundle/456。', 'One item per line; # starts a comment. Automatically saved.\nStore / SteamDB links, AppIDs, app/730, sub/123, bundle/456.');
      input.value = GM_getValue('fac_cart', '');
      input.addEventListener('input', () => GM_setValue('fac_cart', input.value));
      const status = document.createElement('div');
      status.className = 'sse-cart-status';
      status.setAttribute('role', 'status');
      const save = value => { input.value = value; GM_setValue('fac_cart', value); };
      const checkbox = (label, key) => {
        const wrapper = document.createElement('label');
        const control = document.createElement('input');
        control.type = 'checkbox';
        control.checked = GM_getValue(key, false);
        control.addEventListener('change', () => GM_setValue(key, control.checked));
        wrapper.append(control, document.createTextNode(label));
        return { wrapper, control };
      };
      const importSale = checkbox(text('仅导入打折商品', 'Import discounted only'), 'fac_discount');
      const exportSale = checkbox(text('仅导出打折商品', 'Export discounted only'), 'fac_discount2');
      const run = action => async () => {
        if (busy) return;
        busy = true;
        panel.querySelectorAll('button').forEach(element => { element.disabled = true; });
        status.textContent = text('操作中……', 'Working…');
        try { await action(); }
        catch (error) { log.error('批量操作失败', error.message); status.textContent = error.message || String(error); }
        finally { busy = false; panel.querySelectorAll('button').forEach(element => { element.disabled = false; }); }
      };
      toolbar.append(button(text('导入', 'Import'), run(async () => {
        const parsed = parseItems(input.value);
        if (!parsed.items.length) throw new Error(text('请输入有效的商品链接或 ID。', 'Enter valid item links or IDs.'));
        const selected = [];
        const results = parsed.invalid.map(value => '# ' + value + text('：格式有误', ': invalid format'));
        const seen = new Set();
        for (const [index, item] of parsed.items.entries()) {
          status.textContent = text('读取商品 ', 'Reading item ') + (index + 1) + '/' + parsed.items.length;
          const key = item.type + '/' + item.id;
          try {
            const data = await storeItem(item);
            const option = optionsFor(item, data)[0];
            if (!option) { results.push(key + ' # ' + text('无可购买项目', 'No purchase option')); continue; }
            if (importSale.control.checked && !(Number(option.discount_pct) > 0)) { results.push(key + ' # ' + text('未打折，跳过', 'Not discounted, skipped')); continue; }
            const purchaseKey = option.packageid ? 'sub/' + option.packageid : 'bundle/' + option.bundleid;
            if (!seen.has(purchaseKey)) { selected.push(option); seen.add(purchaseKey); }
            results.push(purchaseKey + ' # ' + (option.purchase_option_name || data.name || '') + ' ' + (option.formatted_final_price || ''));
          } catch (error) { log.warn('导入项目失败', { item: key, message: error.message }); results.push(key + ' # ' + error.message); }
        }
        save(results.join('\n'));
        if (!selected.length) { status.textContent = text('没有符合条件的商品。', 'No matching items.'); return; }
        await addOptions(selected);
        status.textContent = text('已提交加购，请刷新购物车查看结果。', 'Items submitted. Refresh the cart to see the result.');
      })), importSale.wrapper);
      toolbar.append(button(text('导出', 'Export'), run(async () => {
        const { cart } = await account('GetCart');
        const lines = [];
        for (const item of cart?.line_items || []) {
          const target = { type: item.packageid ? 'sub' : 'bundle', id: Number(item.packageid || item.bundleid) };
          if (!target.id) continue;
          let data;
          try { data = await storeItem(target); }
          catch (error) { if (exportSale.control.checked) throw error; }
          const option = data ? optionsFor(target, data)[0] : null;
          if (exportSale.control.checked && !(Number(option?.discount_pct) > 0)) continue;
          lines.push(target.type + '/' + target.id + ' # ' + (option?.purchase_option_name || data?.name || '') + ' ' + (item.price_when_added?.formatted_amount || option?.formatted_final_price || ''));
        }
        if (!lines.length) { status.textContent = text('购物车为空或没有符合条件的商品。', 'Cart is empty or no items match.'); return; }
        const output = '# ' + new Date().toLocaleString() + '\n' + lines.join('\n');
        if (input.value.trim()) {
          const choice = await chooseOption([
            { purchase_option_name: text('覆盖原有内容', 'Replace existing text'), formatted_final_price: '', mode: 'replace' },
            { purchase_option_name: text('追加到末尾', 'Append to existing text'), formatted_final_price: '', mode: 'append' }
          ], text('导出方式', 'Export mode'));
          if (!choice) { status.textContent = text('已取消。', 'Cancelled.'); return; }
          save(choice.mode === 'append' ? input.value.trimEnd() + '\n' + output : output);
        } else save(output);
        status.textContent = text('导出完成。', 'Export complete.');
      })), exportSale.wrapper);
      const edit = gift => run(async () => {
        let giftInfo = null;
        if (gift) {
          const value = window.prompt(text('输入接收人的 SteamID 或好友代码；留空暂不指定，取消则停止操作。', 'Recipient SteamID or friend code; leave blank to skip recipient, or cancel to stop.'));
          if (value === null) { status.textContent = text('已取消。', 'Cancelled.'); return; }
          if (value.trim()) {
            if (!/^\d+$/.test(value.trim())) throw new Error(text('接收人 ID 无效。', 'Invalid recipient ID.'));
            let id = BigInt(value.trim());
            const base = 76561197960265728n;
            if (id > base) id -= base;
            if (id <= 0n || id > 4294967295n) throw new Error(text('接收人 ID 无效。', 'Invalid recipient ID.'));
            const nickname = document.querySelector('#account_pulldown')?.textContent.trim() || '';
            giftInfo = { accountid_giftee: id.toString(), gift_message: { gifteename: id.toString(), message: '', sentiment: '', signature: nickname }, time_scheduled_send: 0 };
          }
        }
        const { cart } = await account('GetCart');
        const items = cart?.line_items || [];
        for (const [index, item] of items.entries()) {
          await account('ModifyLineItem', { line_item_id: item.line_item_id, gift_info: giftInfo, flags: { is_gift: gift, is_private: false } });
          status.textContent = (index + 1) + '/' + items.length;
        }
        status.textContent = text('修改完成，请刷新购物车查看结果。', 'Updated. Refresh the cart to see the result.');
      });
      toolbar.append(button(text('转送礼', 'Set as gift'), edit(true)), button(text('转自用', 'Set for myself'), edit(false)));
      const bottom = document.createElement('div');
      bottom.className = 'sse-cart-toolbar';
      bottom.append(
        button(text('复制', 'Copy'), async () => { await GM_setClipboard(input.value, 'text'); status.textContent = text('已复制。', 'Copied.'); }),
        button(text('清除文本', 'Clear text'), () => { if (window.confirm(text('清除文本框和已保存的列表？', 'Clear the text and saved list?'))) save(''); }),
        button(text('重新读取', 'Reload saved text'), () => { if (window.confirm(text('重新读取保存的列表？', 'Reload the saved list?'))) input.value = GM_getValue('fac_cart', ''); }),
        button(text('购物车历史', 'Cart history'), () => { location.href = 'https://help.steampowered.com/accountdata/ShoppingCartHistory'; }),
        button(text('刷新购物车', 'Refresh cart'), () => location.reload()),
        button(text('清空购物车', 'Empty cart'), run(async () => {
          if (!window.confirm(text('确定移除购物车中的所有商品？', 'Remove every item from the cart?'))) { status.textContent = text('已取消。', 'Cancelled.'); return; }
          await account('DeleteCart', {});
          location.reload();
        }))
      );
      panel.append(title, toolbar, input, bottom, status);
      cartPanel = panel;
      placeCartPanel(panel, anchor);
    }

    const quickSelector = 'a.search_result_row, a.tab_item, a.recommendation_link, .wishlist_row, [data-rfd-draggable-id^="WishlistItem-"], .game_purchase_action';
    function scanQuickButtons() {
      mountPanel();
      if (!isCartPage() && document.querySelector(quickSelector) && !document.getElementById('sse-cart-extract')) {
        const host = document.querySelector('.wishlist_header, #search_results, .home_tabs_content, .page_content, main');
        if (host) {
          const extract = button(text('提取当前已加载商品', 'Extract loaded items'), () => {
            const keys = new Set();
            document.querySelectorAll(quickSelector).forEach(row => {
              const item = inferItemFromScope(row);
              if (item) keys.add((item.type === 'package' ? 'sub' : item.type) + '/' + item.id);
            });
            if (!keys.size) return;
            if (GM_getValue('fac_cart', '').trim() && !window.confirm(text('用当前商品列表覆盖已保存的文本？', 'Replace the saved text with these items?'))) return;
            GM_setValue('fac_cart', [...keys].join('\n'));
            window.alert(text('已保存商品列表，可前往购物车批量导入。', 'List saved. Open the cart to import it.'));
          });
          extract.id = 'sse-cart-extract';
          host.prepend(extract);
        }
      }
      document.querySelectorAll(quickSelector).forEach(row => {
        const wishlistRow = row.matches('.wishlist_row, [data-rfd-draggable-id^="WishlistItem-"]');
        const existing = row.querySelector('.sse-quick-add');
        if (existing) {
          if (wishlistRow) placeWishlistCartButton(row, existing);
          return;
        }
        const inferred = inferItemFromScope(row);
        if (!inferred) return;
        const item = { type: inferred.type === 'package' ? 'sub' : inferred.type, id: Number(inferred.id) };
        if (!Number.isSafeInteger(item.id) || item.id <= 0) return;
        const purchaseRow = row.matches('.game_purchase_action');
        const nativeButton = purchaseRow ? row.querySelector('a[href*="addToCart"], a[onclick*="addToCart"], button[onclick*="addToCart"], a[href*="addBundleToCart"], a[onclick*="addBundleToCart"], button[onclick*="addBundleToCart"], a.btn_addtocart, button.btn_addtocart') : null;
        if (purchaseRow && !nativeButton) return;
        const control = button(text('＋ 加入购物车', '＋ Add to cart'), async () => {
          const currentItem = inferItemFromScope(row);
          if (!currentItem) return;
          const target = { type: currentItem.type === 'package' ? 'sub' : currentItem.type, id: Number(currentItem.id) };
          const options = optionsFor(target, await storeItem(target));
          if (!options.length) throw new Error(text('未找到可购买版本，可能尚未发行、免费或受地区限制。', 'No purchase options: unreleased, free, or region restricted.'));
          const chosen = options.length === 1 ? options[0] : await chooseOption(options);
          if (!chosen) return;
          await addOptions([chosen]);
          const label = control.querySelector('span') || control;
          label.textContent = text('✓ 已提交加购', '✓ Submitted');
          const cartButton = document.getElementById('store_header_cart_btn');
          if (cartButton) cartButton.style.display = '';
        });
        control.classList.add('sse-quick-add');
        if (nativeButton) {
          control.className = nativeButton.className + ' sse-quick-add sse-native-cart';
          const label = document.createElement('span');
          label.textContent = text('加入购物车', 'Add to Cart');
          control.replaceChildren(label);
          // Keep purchase IDs available after replacing the native button.
          control.setAttribute(item.type === 'bundle' ? 'data-ds-bundleid' : item.type === 'sub' ? 'data-ds-packageid' : 'data-ds-appid', String(item.id));
          nativeButton.replaceWith(control);
        } else if (!wishlistRow || !placeWishlistCartButton(row, control)) {
          row.appendChild(control);
        }
      });
    }
    let timer = null;
    const observer = new MutationObserver(mutations => {
      if (timer || !mutations.some(mutation => !mutation.target.parentElement?.closest('#sse-cart-tools, .sse-cart-dialog, #sapx-ui-root'))) return;
      timer = setTimeout(() => { timer = null; scanQuickButtons(); }, 400);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', () => mountPanel(), { passive: true });
    scanQuickButtons();
    if (GM_getValue('sse_cart_country', false)) context().then(current => {
      const host = document.querySelector('#header_wallet_ctn');
      if (host && !host.querySelector('.sse-account-country')) {
        const label = document.createElement('span');
        label.className = 'sse-account-country';
        label.textContent = ' [' + current.country + ']';
        host.appendChild(label);
      }
    }).catch(error => log.warn('读取账号地区失败', error.message));
  }
