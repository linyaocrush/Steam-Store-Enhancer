  const featureScopes = new Map();
  const SCRIPT_OWNED_SELECTOR = '#sapx-ui-root, #sapx-cart-summary, #sse-cart-tools, .sse-cart-dialog, #sse-family-dialog, #sse-family-chart-tooltip, #sse-family-nav, #sse-cart-extract, #sse-friend-tools, #sse-game-hover, .sapx-extra-price, .sapx-region-locked, .sse-family-badge, .sse-family-banner, .sse-quick-add, .sse-restriction-badge, .sse-wishlist-sale-expiration';

  function isStorePageReady() {
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    return location.hostname !== 'store.steampowered.com' || !page.SSR || Boolean(page.SSR.hydrated);
  }

  function createFeatureScope(name) {
    featureScopes.get(name)?.dispose();
    const disposers = new Set();
    const controller = typeof AbortController === 'function' ? new AbortController() : {
      signal: { aborted: false, addEventListener() {}, removeEventListener() {} },
      abort() { this.signal.aborted = true; }
    };
    const scope = {
      signal: controller.signal,
      get active() { return !controller.signal.aborted; },
      own(dispose) { disposers.add(dispose); return dispose; },
      release(dispose) { disposers.delete(dispose); },
      listen(target, event, callback, options) {
        target.addEventListener(event, callback, options);
        scope.own(() => target.removeEventListener(event, callback, options));
      },
      timeout(callback, delay) {
        let id;
        const cancel = () => { clearTimeout(id); disposers.delete(cancel); };
        id = setTimeout(() => { disposers.delete(cancel); if (scope.active) callback(); }, delay);
        scope.own(cancel);
        return cancel;
      },
      interval(callback, delay) {
        const id = setInterval(() => { if (scope.active) callback(); }, delay);
        return scope.own(() => clearInterval(id));
      },
      wait(delay) {
        return new Promise(resolve => {
          const finish = value => { controller.signal.removeEventListener('abort', abort); resolve(value); };
          const abort = () => { cancel(); finish(false); };
          const cancel = scope.timeout(() => finish(true), delay);
          if (!scope.active) abort();
          else controller.signal.addEventListener('abort', abort, { once: true });
        });
      },
      dispose() {
        if (!scope.active) return;
        controller.abort();
        for (const dispose of disposers) {
          try { dispose(); } catch (error) { diagnostics.scope('core').warn('dispose.failed', '功能清理失败', { name, error }); }
        }
        disposers.clear();
        if (featureScopes.get(name) === scope) featureScopes.delete(name);
      }
    };
    featureScopes.set(name, scope);
    return scope;
  }

  function queryIncluding(root, selector) {
    const result = root.matches?.(selector) ? [root] : [];
    return result.concat(Array.from(root.querySelectorAll?.(selector) || []));
  }

  // One observer per feature, bounded to changed subtrees. Ancestors are only
  // matched, never searched recursively for each mutation.
  function createDomScanner({ scope, selector, process, changed, removed, delay = 200,
    attributes = [], root = document.body, name = 'dom', initial = true, intersection }) {
    const log = diagnostics.scope(name);
    const pending = new Set();
    const metrics = { fullScans: 0, batches: 0, candidates: 0, mutations: 0, durationMs: 0 };
    let cancelTimer;
    let dirty = false;
    let lost = false;
    const removedNodes = new Set();
    const owned = node => Boolean(node?.matches?.(SCRIPT_OWNED_SELECTOR) || node?.closest?.(SCRIPT_OWNED_SELECTOR));
    const visibility = new Map();
    const visibilitySignal = node => visibility.get(node)?.signal;
    const viewport = intersection && typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(onIntersection, intersection) : null;
    function unobserve(node) {
      visibility.get(node)?.abort();
      visibility.delete(node);
      viewport.unobserve(node);
    }
    async function processTargets(targets) {
      try { await process(targets, viewport ? visibilitySignal : undefined); }
      catch (error) { if (scope.active) log.error('scan.failed', '动态节点处理失败', { error }); }
    }
    function onIntersection(entries) {
      if (!scope.active) return;
      const states = new Map(entries.map(entry => [entry.target, entry.isIntersecting]));
      const entered = [];
      for (const [node, isIntersecting] of states) {
        if (!visibility.has(node)) continue;
        if (node.isConnected === false) { unobserve(node); continue; }
        const controller = visibility.get(node);
        if (isIntersecting && !controller) {
          visibility.set(node, new AbortController());
          entered.push(node);
        } else if (!isIntersecting && controller) {
          controller.abort();
          visibility.set(node, null);
        }
      }
      if (entered.length) processTargets(entered);
    }
    function collect(node, descendants = true) {
      if (!node || owned(node)) return;
      if (node.nodeType === 3) node = node.parentElement;
      if (!node) return;
      if (node.matches?.(selector)) pending.add(node);
      const parent = node.parentElement?.closest?.(selector);
      if (parent && !owned(parent)) pending.add(parent);
      if (descendants) for (const match of node.querySelectorAll?.(selector) || []) {
        if (!owned(match)) pending.add(match);
      }
    }
    async function flush() {
      const cancel = cancelTimer;
      cancelTimer = null;
      cancel?.();
      if (!scope.active) return;
      const targets = [...pending].filter(node => node.isConnected !== false);
      pending.clear();
      const hadChanges = dirty, hadRemovals = lost;
      const detachedNodes = [...removedNodes];
      removedNodes.clear();
      dirty = lost = false;
      const start = Date.now();
      try {
        if (hadRemovals) removed?.(detachedNodes);
        if (hadChanges) changed?.();
        const ready = viewport ? targets.filter(node => {
          if (visibility.has(node)) return Boolean(visibility.get(node));
          visibility.set(node, null);
          viewport.observe(node);
          return false;
        }) : targets;
        if (ready.length) await processTargets(ready);
      } catch (error) { if (scope.active) log.error('scan.failed', '动态节点处理失败', { error }); }
      metrics.batches++;
      metrics.candidates += targets.length;
      metrics.durationMs += Date.now() - start;
      log.debug('scan.batch', '局部扫描完成', { ...metrics, targets: targets.length });
    }
    function schedule() { if (!cancelTimer) cancelTimer = scope.timeout(flush, delay); }
    function notify(mutations) {
      const visited = new Set();
      let detachedElements = false;
      const collectOnce = (node, descendants) => {
        if (!node) return;
        const key = descendants ? node : null;
        if (key && visited.has(key)) return;
        if (key) visited.add(key);
        collect(node, descendants);
      };
      for (const mutation of mutations) {
        if (owned(mutation.target.nodeType === 3 ? mutation.target.parentElement : mutation.target)) continue;
        metrics.mutations++;
        if (mutation.type === 'childList') {
          const additions = Array.from(mutation.addedNodes || []);
          const removals = Array.from(mutation.removedNodes || []);
          const external = node => node.nodeType === 3 || (node.nodeType === 1 && !owned(node));
          const externalChange = [...additions, ...removals].some(external);
          if (!externalChange && (additions.length || removals.length)) continue;
          collect(mutation.target, false);
          additions.filter(external).forEach(node => collectOnce(node, true));
          if (removals.some(external)) {
            lost = true;
            for (const node of removals.filter(external)) {
              removedNodes.add(node);
              if (node.nodeType === 1 && node.isConnected === false) detachedElements = true;
            }
          }
        } else collectOnce(mutation.target, mutation.type === 'attributes');
        dirty = true;
      }
      if (viewport && detachedElements) {
        for (const node of visibility.keys()) if (node.isConnected === false) unobserve(node);
      }
      if (dirty) schedule();
    }
    const observer = new MutationObserver(notify);
    observer.observe(root, { childList: true, subtree: true, characterData: true,
      ...(attributes.length ? { attributes: true, attributeFilter: attributes } : {}) });
    scope.own(() => { observer.disconnect(); cancelTimer?.(); pending.clear(); removedNodes.clear(); });
    if (viewport) scope.own(() => {
      viewport.disconnect();
      for (const controller of visibility.values()) controller?.abort();
      visibility.clear();
    });
    const scan = () => {
      metrics.fullScans++;
      if (root === document.body && document.querySelectorAll) {
        for (const match of document.querySelectorAll(selector)) if (!owned(match)) pending.add(match);
      } else collect(root);
      dirty = true;
      schedule();
    };
    if (initial) scan();
    return { scan, notify, flush, metrics };
  }
