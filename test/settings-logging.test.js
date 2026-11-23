import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { loggingSource } from './helpers/logging.mjs';

test('settings save and reopen use the same independent level as diagnostics, including off', async () => {
  const fields = new Map();
  const element = id => {
    if (!fields.has(id)) fields.set(id, { value: '', checked: false, textContent: '',
      classList: { add() {} }, removeAttribute() {}, replaceChildren() {}, focus() {} });
    return fields.get(id);
  };
  const root = { querySelector: element, classList: { add() {} } };
  const stored = new Map();
  const calls = [];
  let reloads = 0;
  const context = vm.createContext({
    document: { getElementById: () => root, createElement: () => ({}) },
    location: { reload() { reloads++; } }, UI_ROOT_ID: 'settings',
    REGIONS: [{ id: 'CNY', label: 'China' }],
    getTargetRegion: () => ({ id: 'CNY' }), getShowRegionCode: () => true,
    STORAGE_KEY_REGION_ID: 'region', STORAGE_KEY_SHOW_CODE: 'code',
    conversion: { setting: { countyCode: 'CN', currencySymbol: '￥', rateCacheExpired: 3600000,
      currencySymbolBeforeValue: true, customRate: 1 }, countries: [{ code: 'JP', currencyCode: 'JPY' }], save(value) { this.setting = value; } },
    GM_getValue: (key, fallback) => stored.has(key) ? stored.get(key) : fallback,
    GM_setValue: (key, value) => stored.set(key, value),
    console: Object.fromEntries(['log', 'info', 'warn', 'error'].map(method => [method, (...args) => calls.push(args.at(-1))]))
  });
  vm.runInContext(await loggingSource() + '\n' + await readFile(new URL('../src/settings.js', import.meta.url), 'utf8'), context);
  for (const level of ['debug', 'warn', 'error', 'off', 'info']) {
    vm.runInContext('openSettingsUI()', context);
    element('#sse-log').value = level;
    element('#sse-extra-currency').value = level === 'off' ? '' : 'JPY';
    element('#sapx-save').onclick();
    assert.equal(stored.get('sse_log_level'), level);
    assert.equal(vm.runInContext('diagnostics.getLevel()', context), level);
    vm.runInContext('openSettingsUI()', context);
    assert.equal(element('#sse-log').value, level);
    assert.equal(element('#sse-extra-currency').value, level === 'off' ? '' : 'JPY');
    assert.equal(Object.hasOwn(context.conversion.setting, 'logLevel'), false);
    const next = vm.createContext({ GM_getValue: context.GM_getValue, GM_setValue: context.GM_setValue, console: context.console });
    vm.runInContext(await loggingSource(), next);
    assert.equal(vm.runInContext('diagnostics.getLevel()', next), level);
  }
  assert.equal(reloads, 5);
  assert.ok(calls.some(record => record.level === 'debug' && record.step === 'save.logging'));
});
