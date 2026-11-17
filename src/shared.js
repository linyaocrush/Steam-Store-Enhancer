  function createLogger(feature) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3, off: 4 };
    const colors = { debug: '#8f98a0', info: '#67c1f5', warn: '#ffc857', error: '#ff8585' };
    const logger = {};
    for (const level of ['debug', 'info', 'warn', 'error']) {
      logger[level] = (...args) => {
        let configured = 'info';
        try {
          const stored = GM_getValue('Storage:Setting', null);
          const settings = typeof stored === 'string' ? JSON.parse(stored) : stored;
          configured = settings?.logLevel || 'info';
        } catch (_) {}
        if (levels[level] < (levels[configured] ?? levels.info)) return;
        console[level](
          `%cSteam Store Enhancer%c ${feature} %c${level.toUpperCase()}%c`,
          'background:#1b2838;color:#67c1f5;padding:3px 7px;border-radius:4px;font-weight:bold',
          'color:#c6d4df;font-weight:bold',
          `color:${colors[level]};font-weight:bold`,
          'color:inherit;font-weight:normal', ...args
        );
      };
    }
    return logger;
  }

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
