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
    const settings = JSON.parse(config?.getAttribute('data-config') || 'null') || globals.Config || {};
    const user = JSON.parse(config?.getAttribute('data-store_user_config') || '{}');
    const info = JSON.parse(config?.getAttribute('data-userinfo') || '{}');
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
      const steamId64 = 76561197960265728 + accountId;
      if (Number.isSafeInteger(accountId) && accountId >= 0 && Number.isSafeInteger(steamId64)) steamid = String(steamId64);
    }
    const country = settings.COUNTRY || settings.COUNTRY_CODE || settings.country_code || globals.UserConfig?.country || '';
    return { steamid, token, country: String(country).toUpperCase(), language: settings.LANGUAGE || 'schinese' };
  }
