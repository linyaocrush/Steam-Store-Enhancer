import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { loggingSource } from './helpers/logging.mjs';

async function harness() {
  const source = (await Promise.all(['settings', 'rates', 'price-processor', 'index'].map(name => readFile(new URL(`../src/conversion/${name}.js`, import.meta.url), 'utf8')))).join('\n');
  const pageSources = await Promise.all(['shared.js', 'pages.js', 'items.js', 'runtime.js'].map(name => readFile(new URL(`../src/${name}`, import.meta.url), 'utf8')));
  const page = {};
  let observer;
  const timers = new Map();
  let nextTimer = 0;
  const document = {
    body: {},
    querySelectorAll: () => [],
    createTreeWalker(root) {
      let done = false;
      return { currentNode: root.text, nextNode() { if (done) return false; done = true; return true; } };
    }
  };
  const context = vm.createContext({
    unsafeWindow: page, document, NodeFilter: { SHOW_TEXT: 4 }, AbortController,
    setTimeout(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    isCartPage: () => true,
    GM_getValue: () => undefined, GM_setValue() {}, GM_info: { script: { version: '1.3.1' } },
    MutationObserver: class { constructor(callback) { observer = callback; } observe() {} }
  });
  vm.runInContext(await loggingSource() + '\n' + pageSources.join('\n'), context);
  vm.runInContext(source.replace('get setting() { return SettingManager.instance.setting; },',
    'get setting() { return SettingManager.instance.setting; }, ElementConverter, SpcContext, countyCode2Info, convert,'), context);
  const api = vm.runInContext('conversion', context);
  api.setting.useCustomRate = true;
  api.setting.customRate = 0.125;
  page.spcContext = new api.SpcContext(api.setting, api.countyCode2Info.get('CN'), api.countyCode2Info.get('US'));
  const converter = new api.ElementConverter();
  function price(className, value) {
    const attributes = new Map();
    const selectors = converter.getCssSelectors();
    const element = {
      nodeType: 1, classList: [], attributes,
      matches: selector => selector.split(', ').some(part => selectors.includes(part) && part.endsWith(`.${className}`)),
      closest: () => null,
      getAttribute: key => attributes.get(key), setAttribute: (key, value) => attributes.set(key, value),
      querySelectorAll: () => [],
      get textContent() { return this.text.nodeValue; }
    };
    element.parentElement = { querySelector: selector => element.matches(selector) ? element : null };
    element.text = { nodeType: 3, nodeValue: value, parentElement: element, isConnected: true };
    return element;
  }
  return { api, document, price, notify: async mutations => {
    observer(mutations);
    for (const [id, callback] of [...timers]) { timers.delete(id); callback(); }
    for (let i = 0; i < 30; i++) await Promise.resolve();
  } };
}

test('SSR cart original, final and both summary prices are converted with the USD source used for PK', async () => {
  const { api, document, price } = await harness();
  const elements = [price('StoreOriginalPrice', '$1.29'), price('-nS4ZC0Bruo-', '$1.09'),
    price('n9HLAjXXhvI-', '$1.09'), price('n9HLAjXXhvI-', '$1.09')];
  document.querySelectorAll = selector => elements.filter(element => element.matches(selector));
  await api.convert();
  assert.deepEqual(elements.map(element => element.textContent), ['$1.29(￥10.32)', '$1.09(￥8.72)', '$1.09(￥8.72)', '$1.09(￥8.72)']);
});

test('replacing a cart price text node triggers conversion again without duplicating annotations', async () => {
  const { api, document, price, notify } = await harness();
  const element = price('-nS4ZC0Bruo-', '$1.09');
  document.querySelectorAll = () => [element];
  await api.convert();
  element.text = { nodeType: 3, nodeValue: '$2.09', parentElement: element, isConnected: true };
  await notify([{ type: 'childList', target: element }]);
  assert.equal(element.textContent, '$2.09(￥16.72)');
  await notify([{ type: 'characterData', target: element.text }]);
  assert.equal(element.textContent, '$2.09(￥16.72)');
});
