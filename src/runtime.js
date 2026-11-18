  const featureScopes = new Map();
  const SCRIPT_OWNED_SELECTOR = '#sapx-ui-root, #sapx-cart-summary, #sse-cart-tools, .sse-cart-dialog, #sse-family-dialog, #sse-family-chart-tooltip, #sse-family-nav, #sse-cart-extract, #sse-friend-tools, .sapx-extra-price, .sapx-region-locked, .sse-family-badge, .sse-family-banner, .sse-quick-add, .sse-restriction-badge, .sse-wishlist-sale-expiration';

  function createFeatureScope(name) {
    featureScopes.get(name)?.dispose();
    const disposers = new Set();
    const controller = new AbortController();
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
        const cancel = () => clearTimeout(id);
        const id = setTimeout(() => { disposers.delete(cancel); if (scope.active) callback(); }, delay);
        scope.own(cancel);
        return cancel;
      },
      interval(callback, delay) {
        const id = setInterval(() => { if (scope.active) callback(); }, delay);
        return scope.own(() => clearInterval(id));
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
    attributes = [], root = document.body, name = 'dom', initial = true }) {
    const log = diagnostics.scope(name);
    const pending = new Set();
    const metrics = { fullScans: 0, batches: 0, candidates: 0, mutations: 0, durationMs: 0 };
    let cancelTimer;
    let dirty = false;
    let lost = false;
    const owned = node => Boolean(node?.closest?.(SCRIPT_OWNED_SELECTOR));
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
      dirty = lost = false;
      const start = Date.now();
      try {
        if (hadRemovals) removed?.();
        if (hadChanges) changed?.();
        if (targets.length) await process(targets);
      } catch (error) { if (scope.active) log.error('scan.failed', '动态节点处理失败', { error }); }
      metrics.batches++;
      metrics.candidates += targets.length;
      metrics.durationMs += Date.now() - start;
      log.debug('scan.batch', '局部扫描完成', { ...metrics, targets: targets.length });
    }
    function schedule() { if (!cancelTimer) cancelTimer = scope.timeout(flush, delay); }
    function notify(mutations) {
      for (const mutation of mutations) {
        if (owned(mutation.target.nodeType === 3 ? mutation.target.parentElement : mutation.target)) continue;
        metrics.mutations++;
        if (mutation.type === 'childList') {
          const additions = Array.from(mutation.addedNodes || []);
          const removals = Array.from(mutation.removedNodes || []);
          const external = node => node.nodeType === 3 || (node.nodeType === 1 && !owned(node));
          if (![...additions, ...removals].some(external)) continue;
          collect(mutation.target, false);
          additions.filter(external).forEach(node => collect(node));
          if (removals.some(external)) lost = true;
        } else collect(mutation.target, mutation.type === 'attributes');
        dirty = true;
      }
      if (dirty) schedule();
    }
    const observer = new MutationObserver(notify);
    observer.observe(root, { childList: true, subtree: true, characterData: true,
      ...(attributes.length ? { attributes: true, attributeFilter: attributes } : {}) });
    scope.own(() => { observer.disconnect(); cancelTimer?.(); pending.clear(); });
    const scan = () => { metrics.fullScans++; collect(root); dirty = true; schedule(); };
    if (initial) scan();
    return { scan, notify, flush, metrics };
  }
