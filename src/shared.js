  function createElement(tag, content, className) {
    const element = document.createElement(tag);
    if (content !== undefined) element.textContent = content;
    if (className) element.className = className;
    return element;
  }

  // Coalesce repeated requests without postponing the first scheduled scan.
  function createScheduledTask(task, delay) {
    let timer = null;
    return () => {
      if (timer !== null) return;
      timer = setTimeout(() => {
        timer = null;
        task();
      }, delay);
    };
  }

  function readStoreSession(doc, globals = {}) {
    const config = doc.querySelector('#application_config');
    const read = name => {
      try {
        const value = JSON.parse(config?.getAttribute(name) || '{}');
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      } catch (_) {
        diagnostics.scope('session').debug('config.invalid', '页面配置不可解析，尝试其他来源', { attribute: name });
        return {};
      }
    };
    const settings = { ...globals.Config, ...read('data-config') };
    const user = read('data-store_user_config');
    const info = read('data-userinfo');
    let steamid = String(info.steamid || globals.UserConfig?.steamid || globals.g_steamID || '');
    let token = user.webapi_token;
    for (const entry of globals.SSR?.loaderData || []) {
      try {
        const data = typeof entry === 'string' ? JSON.parse(entry) : entry;
        token ||= data?.strWebAPIToken;
        steamid ||= String(data?.steamid || '');
      } catch (_) {}
    }
    const account = globals.g_AccountID || globals.UserConfig?.accountid;
    if (!steamid && account) {
      const accountId = Number(account);
      if (Number.isInteger(accountId) && accountId > 0 && accountId <= 4294967295) steamid = String(76561197960265728n + BigInt(accountId));
    }
    const country = settings.COUNTRY || settings.COUNTRY_CODE || settings.country_code || globals.UserConfig?.country || '';
    return { steamid, token, country: String(country).toUpperCase(), language: settings.LANGUAGE || 'schinese' };
  }
