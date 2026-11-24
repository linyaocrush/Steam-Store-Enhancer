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

  const mutationHubs = new WeakMap();
  const isScriptOwned = node => Boolean(node?.closest?.(SCRIPT_OWNED_SELECTOR) || node?.matches?.(SCRIPT_OWNED_SELECTOR));

  function dispatchDomMutations(records, subscriptions, direct = false) {
    if (!subscriptions.length) return;
    const shallow = new Map();
    const subtrees = new Map();
    const removals = new Set();
    const textTargets = new Set();
    const batches = new Map(subscriptions.map(sub => [sub, { targets: new Set(), removals: [] }]));
    const ownership = new Map();
    const owned = node => {
      if (!ownership.has(node)) ownership.set(node, isScriptOwned(node));
      return ownership.get(node);
    };
    const external = node => node.nodeType === 3 || (node.nodeType === 1 && !owned(node));
    function collect(map, node, interested) {
      if (!node || owned(node) || !interested.length) return;
      if (!map.has(node)) map.set(node, new Set());
      for (const sub of interested) map.get(node).add(sub);
    }
    for (const record of records) {
      const target = record.target.nodeType === 3 ? record.target.parentElement : record.target;
      if (!target || owned(target)) continue;
      if (record.type === 'childList') {
        const added = Array.from(record.addedNodes || []);
        const removed = Array.from(record.removedNodes || []);
        const additions = added.filter(external);
        const detached = removed.filter(external);
        if ((added.length || removed.length) && !additions.length && !detached.length) continue;
        collect(shallow, target, subscriptions);
        for (const node of additions) {
          collect(node.nodeType === 3 ? shallow : subtrees, node.nodeType === 3 ? target : node, subscriptions);
        }
        for (const node of detached) removals.add(node);
      } else if (record.type === 'attributes') {
        collect(subtrees, target, direct ? subscriptions : subscriptions.filter(sub => sub.attributes.includes(record.attributeName)));
      } else if (record.type === 'characterData') {
        textTargets.add(target);
      }
    }

    const textSubscriptions = subscriptions.filter(sub => sub.characterData);
    for (const target of textTargets) {
      collect(shallow, target, textSubscriptions.filter(sub => sub.characterData === true || target.closest?.(sub.characterData)));
    }
    for (const [node, interested] of subtrees) collect(shallow, node, [...interested]);
    for (const [node, interested] of shallow) for (const sub of interested) {
      const { targets } = batches.get(sub);
      if (node.matches?.(sub.selector)) targets.add(node);
      const ancestor = node.parentElement?.closest?.(sub.selector);
      if (ancestor && !owned(ancestor)) targets.add(ancestor);
    }
    // Search each changed subtree once with the union of interested selectors.
    for (const [node, interested] of subtrees) {
      const selector = [...new Set([...interested].map(sub => sub.selector))].join(',');
      for (const match of node.querySelectorAll?.(selector) || []) {
        if (owned(match)) continue;
        for (const sub of interested) {
          if (interested.size === 1 || match.matches(sub.selector)) {
            batches.get(sub).targets.add(match);
          }
        }
      }
    }
    const detached = [...removals].some(node => node.nodeType === 1 && node.isConnected === false);
    for (const [sub, batch] of batches) {
      if (sub.removalSelector) for (const node of removals) {
        if (node.matches?.(sub.removalSelector) || node.querySelector?.(sub.removalSelector)) batch.removals.push(node);
      }
      const pruneVisibility = sub.trackVisibility && detached;
      if (batch.targets.size || batch.removals.length || pruneVisibility) sub.receive(batch, pruneVisibility);
    }
  }

  function subscribeDomMutations(root, subscription) {
    let hub = mutationHubs.get(root);
    if (!hub) {
      const subscriptions = new Set();
      const dispatch = records => dispatchDomMutations(records, [...subscriptions].filter(sub => sub.scope.active));
      const observer = new MutationObserver(dispatch);
      hub = { subscriptions, observer, dispatch, optionsKey: null };
      mutationHubs.set(root, hub);
    }
    function updateOptions() {
      const subscriptions = [...hub.subscriptions];
      const attributes = [...new Set(subscriptions.flatMap(sub => sub.attributes))].sort();
      const characterData = subscriptions.some(sub => sub.characterData);
      const key = JSON.stringify([characterData, attributes]);
      if (key === hub.optionsKey) return;
      hub.optionsKey = key;
      hub.observer.observe(root, { childList: true, subtree: true, characterData,
        ...(attributes.length ? { attributes: true, attributeFilter: attributes } : {}) });
    }
    const drain = () => {
      const records = hub.observer.takeRecords?.();
      if (records?.length) hub.dispatch(records);
    };
    if (hub.subscriptions.size) drain();
    hub.subscriptions.add(subscription);
    updateOptions();
    return () => {
      hub.subscriptions.delete(subscription);
      if (hub.subscriptions.size) { drain(); updateOptions(); }
      else { hub.observer.disconnect(); mutationHubs.delete(root); }
    };
  }

  function createDomScanner({ scope, selector, process, changed, removed, delay = 200,
    attributes = [], characterData = false, removalSelector = selector, root = document.body,
    name = 'dom', initial = true, intersection }) {
    const log = diagnostics.scope(name);
    const pending = new Set();
    const metrics = { fullScans: 0, batches: 0, candidates: 0, durationMs: 0 };
    let cancelTimer;
    let dirty = false;
    const removedNodes = new Set();
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
    async function flush() {
      const cancel = cancelTimer;
      cancelTimer = null;
      cancel?.();
      if (!scope.active) return;
      const targets = [...pending].filter(node => node.isConnected !== false);
      pending.clear();
      const hadChanges = dirty;
      const detachedNodes = [...removedNodes];
      removedNodes.clear();
      dirty = false;
      const start = Date.now();
      try {
        if (detachedNodes.length) removed?.(detachedNodes);
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
    const subscription = { scope, selector, attributes, characterData,
      removalSelector: removed || changed ? removalSelector : null, trackVisibility: Boolean(viewport),
      receive({ targets, removals }, detached) {
        if (detached) {
          for (const node of visibility.keys()) if (node.isConnected === false) unobserve(node);
        }
        if (!targets.size && !removals.length) return;
        for (const node of targets) pending.add(node);
        for (const node of removals) removedNodes.add(node);
        dirty = true;
        schedule();
      } };
    const unsubscribe = subscribeDomMutations(root, subscription);
    const notify = records => { if (scope.active) dispatchDomMutations(records, [subscription], true); };
    scope.own(() => { unsubscribe(); cancelTimer?.(); pending.clear(); removedNodes.clear(); });
    if (viewport) scope.own(() => {
      viewport.disconnect();
      for (const controller of visibility.values()) controller?.abort();
      visibility.clear();
    });
    const scan = () => {
      metrics.fullScans++;
      if (root === document.body && document.querySelectorAll) {
        for (const match of document.querySelectorAll(selector)) if (!isScriptOwned(match)) pending.add(match);
      } else for (const match of queryIncluding(root, selector)) if (!isScriptOwned(match)) pending.add(match);
      dirty = true;
      schedule();
    };
    if (initial) scan();
    return { scan, notify, flush, metrics };
  }
