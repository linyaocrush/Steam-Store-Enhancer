import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { harness, settle } from './helpers/runtime.mjs';

function element(tag) {
  const listeners = new Map();
  return {
    tag, children: [], value: '', disabled: false, scrollTop: 0, scrollLeft: 0,
    get rows() { return this.children; },
    get textContent() { return this.text ?? this.children.map(child => child.textContent).join(''); },
    set textContent(text) { this.text = text; },
    appendChild(child) { this.append(child); },
    append(...children) {
      for (const child of children) {
        if (child.tag === 'fragment') this.append(...child.children);
        else { this.children.push(child); child.parentElement = this; }
      }
    },
    replaceChildren(...children) { this.children = []; this.append(...children); },
    remove() {
      const parent = this.parentElement;
      if (parent) parent.children = parent.children.filter(child => child !== this);
    },
    setAttribute() {}, style: {},
    addEventListener(type, callback) { listeners.set(type, callback); },
    emit(type) { return listeners.get(type)?.(); }
  };
}

function find(root, predicate) {
  if (predicate(root)) return root;
  for (const child of root.children) {
    const match = find(child, predicate);
    if (match) return match;
  }
}

test('family scan updates progress in place and reapplies the current filter to refreshed games', async () => {
  const steamid = '76561198000000000';
  const cache = { steamid, name: 'Family', updated: 1, members: [steamid], apps: { 10: { name: 'Alpha', owners: [steamid] } } };
  const requests = [];
  const { context, document, window } = await harness(['family-library.js'], {
    GM_getValue: (key, fallback) => key === 'sse_family_cache_v1' ? cache : key === 'sse_family_enabled' ? false : fallback,
    GM_deleteValue() {},
    gmGet: () => new Promise((resolve, reject) => requests.push({ resolve: response => resolve(JSON.stringify({ response })), reject }))
  });
  context.session = () => ({ steamid, token: 'test' });
  vm.runInContext('readStoreSession = session', context);
  document.head = element('head');
  document.documentElement = element('html');
  document.createElement = element;
  document.createDocumentFragment = () => element('fragment');
  window.confirm = () => true;

  const feature = context.initializeFamilyLibrary();
  feature.open();
  const panel = find(document.documentElement, node => node.className === 'sse-family-window');
  const search = find(panel, node => node.tag === 'input');
  const scroll = find(panel, node => node.className === 'sse-family-scroll');
  const body = find(panel, node => node.tag === 'tbody');
  const scanButton = find(panel, node => node.textContent === '现在扫描家庭库');
  const clearButton = find(panel, node => node.textContent === '清空缓存');
  const oldRow = body.rows[0];
  search.value = 'alpha';
  search.emit('input');
  panel.scrollTop = 45;
  scroll.scrollTop = 32;

  const scanning = scanButton.emit('click');
  assert.equal(scanButton.disabled, true);
  assert.match(panel.textContent, /正在读取家庭组/);
  assert.equal(body.rows[0], oldRow);
  requests[0].resolve({ family_groupid: '25', family_group: { members: [{ steamid }] } });
  await settle();
  assert.match(panel.textContent, /正在扫描家庭库游戏/);
  clearButton.emit('click');
  assert.match(panel.textContent, /请等待扫描完成/);
  assert.equal(body.rows[0], oldRow);
  assert.equal(scroll.scrollTop, 32);

  requests[1].resolve({ apps: [
    { appid: 10, name: 'Alpha 2', owner_steamids: [steamid] },
    { appid: 11, name: 'Beta', owner_steamids: [steamid] }
  ] });
  await settle();
  requests[2].resolve({ accounts: [] });
  await scanning;
  assert.match(panel.textContent, /扫描完成，已缓存 2 个家庭库游戏/);
  assert.equal(scanButton.disabled, false);
  assert.equal(find(document.documentElement, node => node.tag === 'input'), search);
  assert.equal(search.value, 'alpha');
  assert.equal(panel.scrollTop, 45);
  assert.equal(scroll.scrollTop, 32);
  assert.deepEqual(body.rows.map(row => row.hidden), [false, true]);

  const rows = body.rows;
  const failedScan = scanButton.emit('click');
  requests[3].reject(new Error('offline'));
  await failedScan;
  assert.match(panel.textContent, /offline/);
  assert.equal(body.rows, rows);
  assert.equal(search.value, 'alpha');
  clearButton.emit('click');
  assert.match(panel.textContent, /家庭库缓存已清空/);
  assert.equal(body.rows.length, 0);
  feature.dispose();
});
