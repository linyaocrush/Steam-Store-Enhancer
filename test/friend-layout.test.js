import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { loggingSource } from './helpers/logging.mjs';

test('friend tools mount after native management and use native card selection', async () => {
  function element(tag) {
    return {
      tag, children: [], attributes: {}, events: {}, style: {}, value: '',
      append(...items) { this.children.push(...items); },
      appendChild(item) { this.append(item); return item; },
      replaceChildren(...items) { this.children = items; },
      get lastElementChild() { return this.children.at(-1); },
      setAttribute(key, value) { this.attributes[key] = value; },
      addEventListener(name, handler) { this.events[name] = handler; },
      after(item) { this.next = item; }
    };
  }
  const checkbox = element('input');
  checkbox.checked = false;
  const friend = {
    dataset: { steamid: '76561198000000001' }, className: 'online',
    querySelector(selector) {
      if (selector.includes('select_friend_checkbox')) return checkbox;
      if (selector === '.friend_block_content') return { textContent: 'Friend' };
      return null;
    }
  };
  const manage = element('div');
  const nativeList = element('div');
  const doc = {
    head: element('head'),
    createElement: element,
    querySelector(selector) { return selector === '#manage_friends' ? manage : selector === '#search_results' ? nativeList : null; },
    querySelectorAll() { return [friend]; }
  };
  let opened = false;
  const context = vm.createContext({
    document: doc, location: { hostname: 'steamcommunity.com', pathname: '/id/test/friends' },
    window: { getComputedStyle: () => ({ display: 'none' }) },
    unsafeWindow: { g_steamID: '76561198000000002', ToggleManageFriends() { opened = true; } },
    GM_getValue: (_, fallback) => fallback, GM_setValue() {},
    MutationObserver: class { observe() {} }
  });
  const shared = await readFile(new URL('../src/shared.js', import.meta.url), 'utf8');
  const source = await readFile(new URL('../src/friend-tools.js', import.meta.url), 'utf8');
  vm.runInContext(await loggingSource() + '\n' + shared + '\n' + source + '\ninitializeFriendTools();', context);
  assert.equal(opened, true);
  const root = manage.next;
  assert.equal(root.id, 'sse-friend-tools');
  const tabs = root.children.find(item => item.attributes.role === 'tablist');
  assert.deepEqual(tabs.children.map(item => item.textContent), ['留言', '留言设置', '数据分析']);
  tabs.children[2].events.click();
  assert.equal(root.children.at(-1).hidden, false);
  checkbox.checked = true;
  nativeList.events.change();
  assert.equal(root.children[2].textContent, '已选 1 位');
});
