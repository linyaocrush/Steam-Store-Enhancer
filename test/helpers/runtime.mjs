import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { loggingSource } from './logging.mjs';

export const settle = async () => { for (let i = 0; i < 80; i++) await Promise.resolve(); };

export function clock() {
  let now = 1000000;
  let serial = 0;
  const tasks = new Map();
  const FakeDate = class extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  };
  const api = {
    Date: FakeDate,
    setTimeout(callback, delay = 0) { const id = ++serial; tasks.set(id, { callback, at: now + delay }); return id; },
    clearTimeout(id) { tasks.delete(id); },
    setInterval(callback, delay) { const id = ++serial; tasks.set(id, { callback, at: now + delay, interval: delay }); return id; },
    clearInterval(id) { tasks.delete(id); },
    get size() { return tasks.size; },
    async advance(ms) {
      const end = now + ms;
      let iterations = 0;
      for (;;) {
        await settle();
        const next = [...tasks].filter(([, task]) => task.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        if (++iterations > 10000) throw new Error('Timer loop did not settle');
        const [id, task] = next;
        now = task.at;
        if (task.interval) task.at += task.interval;
        else tasks.delete(id);
        task.callback();
      }
      now = end;
      await settle();
    }
  };
  return api;
}

export function eventTarget() {
  const events = new Map();
  return {
    events,
    addEventListener(type, callback) { if (!events.has(type)) events.set(type, new Set()); events.get(type).add(callback); },
    removeEventListener(type, callback) { events.get(type)?.delete(callback); },
    emit(type, event = {}) { for (const callback of [...(events.get(type) || [])]) callback(event); },
    count() { return [...events.values()].reduce((sum, handlers) => sum + handlers.size, 0); }
  };
}

export async function harness(files = [], extra = {}) {
  const time = clock();
  const window = eventTarget();
  const observers = [];
  const document = { ...eventTarget(), body: { nodeType: 1, querySelectorAll: () => [] }, querySelector: () => null, querySelectorAll: () => [], hidden: false };
  const context = vm.createContext({
    AbortController, URL, URLSearchParams, TextEncoder, Intl, console: { log() {}, info() {}, warn() {}, error() {} }, ...time,
    window, document, location: { href: 'https://store.steampowered.com/wishlist/', hostname: 'store.steampowered.com', pathname: '/wishlist/', search: '' },
    GM_getValue: (_, fallback) => fallback, GM_setValue() {}, GM_deleteValue() {},
    conversion: { setting: { regionalDisplayCurrency: '' } },
    MutationObserver: class {
      constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
      observe() {}
      disconnect() { this.disconnected = true; }
    }, ...extra
  });
  const sources = await Promise.all(['shared.js', 'runtime.js', 'pages.js', 'items.js', ...files].map(name => readFile(new URL('../../src/' + name, import.meta.url), 'utf8')));
  vm.runInContext(await loggingSource() + '\n' + sources.join('\n'), context);
  return { context, time, window: context.window, document: context.document, observers };
}
