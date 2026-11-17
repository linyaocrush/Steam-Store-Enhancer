import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

test('all logger methods respect persisted levels, including startup off and live changes', async () => {
  const source = await readFile(new URL('../src/shared.js', import.meta.url), 'utf8');
  const calls = [];
  let stored = JSON.stringify({ logLevel: 'off' });
  const context = vm.createContext({
    GM_getValue: () => stored,
    console: Object.fromEntries(['debug', 'info', 'warn', 'error'].map(level => [level, (...args) => calls.push({ level, args })]))
  });
  vm.runInContext(source, context);
  const logger = context.createLogger('测试功能');
  const levels = ['debug', 'info', 'warn', 'error', 'off'];
  for (let threshold = 0; threshold < levels.length; threshold++) {
    calls.length = 0;
    stored = JSON.stringify({ logLevel: levels[threshold] });
    for (const level of levels.slice(0, 4)) logger[level]('message', { count: 2 });
    assert.deepEqual(calls.map(call => call.level), levels.slice(threshold, 4));
    for (const call of calls) {
      assert.match(call.args[0], /Steam Store Enhancer.*测试功能/);
      assert.equal(call.args.at(-1).count, 2);
    }
  }
  stored = '{invalid';
  calls.length = 0;
  logger.debug('hidden');
  logger.info('default');
  assert.deepEqual(calls.map(call => call.level), ['info']);
});
