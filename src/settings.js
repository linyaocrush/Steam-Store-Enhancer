  function ensureSettingsUI() {
    let root = document.getElementById(UI_ROOT_ID);
    if (root) return root;
    root = document.createElement('div');
    root.id = UI_ROOT_ID;
    root.innerHTML =
      '<div class="sapx-backdrop"></div>' +
      '<div class="sapx-panel" role="dialog" aria-modal="true" aria-label="Steam Store Enhancer 设置">' +
      '<div class="sapx-header">' +
      '<div class="sapx-title">Steam Store Enhancer 设置</div>' +
      '<button class="sapx-close" type="button" aria-label="Close">×</button>' +
      '</div>' +
      '<div class="sapx-body">' +
      '<div class="sapx-field">' +
      '<div class="sapx-label">额外显示的地区</div>' +
      '<select class="sapx-select" id="sapx-region-select"></select>' +
      '</div>' +
      
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-extra-enabled" type="checkbox" />启用额外地区价格</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-convert-enabled" type="checkbox" />启用价格转换</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-cart-enabled" type="checkbox" />启用快速加购与购物车管理</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-family-enabled" type="checkbox" />启用家庭库游戏标记</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-restrictions-enabled" type="checkbox" />显示游戏受限状态</label></div>' +
      '<div class="sapx-field"><label class="sapx-check"><input class="sapx-checkbox" id="sse-family-auto" type="checkbox" />每隔 24 小时自动扫描家庭库</label></div>' +
      '<div class="sapx-field"><button class="sapx-btn sapx-btn-ghost" type="button" id="sse-family-open">管理家庭库：扫描、贡献统计与最近购入</button></div>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-convert-region">价格转换目标地区</label><select class="sapx-select" id="sse-convert-region"></select></div>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-log">日志等级</label><select class="sapx-select" id="sse-log"><option value="debug">debug · 全部步骤</option><option value="info">info · 运行概况</option><option value="warn">warn · 警告和错误</option><option value="error">error · 仅错误</option><option value="off">off · 关闭</option></select></div>' +
      '<div class="sapx-field"><button class="sapx-btn sapx-btn-ghost" type="button" id="sse-copy-logs">复制诊断日志</button></div>' +
      '<details class="sapx-details" id="sapx-adv">' +
      '<summary>更多设置</summary>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-cart-language">购物车工具语言</label><select class="sapx-select" id="sse-cart-language"><option value="ZH">中文</option><option value="EN">English</option></select></div>' +
      '<div class="sapx-row"><label class="sapx-check"><input class="sapx-checkbox" id="sse-cart-country" type="checkbox" />显示账号地区</label></div>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-symbol">转换后的货币符号</label><input class="sapx-input" id="sse-symbol" type="text" maxlength="20" /></div>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-position">货币符号位置</label><select class="sapx-select" id="sse-position"><option value="before">价格之前</option><option value="after">价格之后</option></select></div>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-cache-hours">汇率缓存有效期（小时）</label><input class="sapx-input" id="sse-cache-hours" type="number" min="0.01" step="any" /></div>' +
      '<div class="sapx-row"><label class="sapx-check"><input class="sapx-checkbox" id="sse-custom-enabled" type="checkbox" />使用自定义汇率</label></div>' +
      '<div class="sapx-field"><label class="sapx-label" for="sse-rate">自定义汇率（1 单位目标货币可兑换的原货币数量）</label><input class="sapx-input" id="sse-rate" type="number" min="0.000001" step="any" /></div>' +
      '<div class="sapx-row"><label class="sapx-check"><input class="sapx-checkbox" id="sse-disable-market" type="checkbox" />在市场首页禁用价格转换</label></div>' +
      '<div class="sapx-error" id="sse-error" role="alert"></div>' +
      '<div class="sapx-row">' +
      '<label class="sapx-check">' +
      '<input class="sapx-checkbox" id="sapx-show-code" type="checkbox" />' +
      '<span>显示地区代码（例如 CN / US）</span>' +
      '</label>' +
      '</div>' +
      '</details>' +
      '</div>' +
      '<div class="sapx-footer">' +
      '<button class="sapx-btn sapx-btn-ghost" type="button" id="sapx-cancel">取消</button>' +
      '<button class="sapx-btn sapx-btn-primary" type="button" id="sapx-save">保存并刷新</button>' +
      '</div>' +
      '</div>';
    document.documentElement.appendChild(root);
    const close = () => { root.classList.remove('sapx-open'); };
    root.querySelector('.sapx-backdrop').addEventListener('click', close);
    root.querySelector('.sapx-close').addEventListener('click', close);
    root.querySelector('#sapx-cancel').addEventListener('click', close);
    root.querySelector('#sse-family-open').addEventListener('click', () => { close(); familyLibrary.open(); });
    root.querySelector('#sse-copy-logs').addEventListener('click', async () => {
      const log = diagnostics.scope('settings');
      try {
        await GM_setClipboard(JSON.stringify({ level: diagnostics.getLevel(), records: diagnostics.records() }, null, 2), 'text');
        log.info('diagnostics.copy', '已复制当前页面最近的诊断日志');
        root.querySelector('#sse-copy-logs').textContent = '已复制';
      } catch (error) {
        log.error('diagnostics.copy', '复制诊断日志失败', { error });
        root.querySelector('#sapx-adv').open = true;
        root.querySelector('#sse-error').textContent = '日志复制失败，请重试。';
      }
    });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('sapx-open')) close(); }, { passive: true });
    return root;
  }

  function openSettingsUI() {
    const log = diagnostics.scope('settings');
    log.debug('panel.open', '打开设置', { level: diagnostics.getLevel() });
    const root = ensureSettingsUI();
    const select = root.querySelector('#sapx-region-select');
    const showCode = root.querySelector('#sapx-show-code');
    const adv = root.querySelector('#sapx-adv');
    adv.removeAttribute('open');
    const cur = getTargetRegion();
    select.innerHTML = REGIONS.map(r => '<option value="' + r.id + '">' + r.label + '</option>').join('');
    select.value = cur.id;
    showCode.checked = getShowRegionCode();
    const field = id => root.querySelector('#sse-' + id);
    const settings = conversion.setting;
    field('extra-enabled').checked = GM_getValue('sse_extra_enabled', true);
    field('convert-enabled').checked = GM_getValue('sse_convert_enabled', true);
    field('cart-enabled').checked = GM_getValue('sse_cart_enabled', true);
    field('family-enabled').checked = GM_getValue('sse_family_enabled', true);
    field('restrictions-enabled').checked = GM_getValue('sse_restrictions_enabled', true);
    field('family-auto').checked = GM_getValue('sse_family_auto', true);
    field('cart-language').value = GM_getValue('sse_cart_language', 'ZH');
    field('cart-country').checked = GM_getValue('sse_cart_country', false);
    field('convert-region').replaceChildren(...conversion.countries.map(country => {
      const option = document.createElement('option');
      option.value = country.code;
      option.textContent = country.name + ' (' + country.currencyCode + ')';
      return option;
    }));
    field('convert-region').value = settings.countyCode;
    field('symbol').value = settings.currencySymbol;
    field('position').value = settings.currencySymbolBeforeValue ? 'before' : 'after';
    field('cache-hours').value = settings.rateCacheExpired / 3600000;
    field('custom-enabled').checked = settings.useCustomRate;
    field('rate').value = settings.customRate;
    field('disable-market').checked = settings.disableOnMarket;
    field('log').value = diagnostics.getLevel();
    field('copy-logs').textContent = '复制诊断日志';
    field('error').textContent = '';
    field('rate').disabled = !field('custom-enabled').checked;
    field('custom-enabled').onchange = () => { field('rate').disabled = !field('custom-enabled').checked; };
    root.querySelector('#sapx-save').onclick = () => {
      const hours = Number(field('cache-hours').value);
      const rate = Number(field('rate').value);
      if (!Number.isFinite(hours) || hours <= 0 || (field('custom-enabled').checked && (!Number.isFinite(rate) || rate <= 0))) {
        log.warn('save.validate', '设置校验失败', { hours, customRateEnabled: field('custom-enabled').checked, rate });
        adv.open = true;
        field('error').textContent = '缓存有效期和启用后的自定义汇率必须为大于 0 的数字。';
        return;
      }
      const logLevel = field('log').value;
      try {
        diagnostics.setLevel(logLevel);
        conversion.save({ ...settings,
          countyCode: field('convert-region').value,
          currencySymbol: field('symbol').value,
          currencySymbolBeforeValue: field('position').value === 'before',
          rateCacheExpired: hours * 3600000,
          useCustomRate: field('custom-enabled').checked,
          customRate: Number.isFinite(rate) && rate > 0 ? rate : settings.customRate,
          disableOnMarket: field('disable-market').checked
        });
        GM_setValue('sse_extra_enabled', field('extra-enabled').checked);
        GM_setValue('sse_convert_enabled', field('convert-enabled').checked);
        GM_setValue('sse_cart_enabled', field('cart-enabled').checked);
        GM_setValue('sse_family_enabled', field('family-enabled').checked);
        GM_setValue('sse_restrictions_enabled', field('restrictions-enabled').checked);
        GM_setValue('sse_family_auto', field('family-auto').checked);
        GM_setValue('sse_cart_language', field('cart-language').value);
        GM_setValue('sse_cart_country', field('cart-country').checked);
        GM_setValue(STORAGE_KEY_REGION_ID, select.value);
        GM_setValue(STORAGE_KEY_SHOW_CODE, Boolean(showCode.checked));
        log.info('save.complete', '设置已保存，准备刷新页面', { level: diagnostics.getLevel() });
        log.debug('save.logging', '调试日志已启用');
        location.reload();
      } catch (error) {
        log.error('save.failed', '保存设置失败', { error });
        adv.open = true;
        field('error').textContent = '保存失败，请重试。';
      }
    };
    root.classList.add('sapx-open');
    select.focus();
  }
