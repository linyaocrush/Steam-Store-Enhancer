import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { loggingSource } from './helpers/logging.mjs';

async function harness(initial = {}) {
  const values = new Map(Object.entries(initial));
  const calls = [];
  let time = 0;
  const context = vm.createContext({
    GM_getValue: key => values.get(key), GM_setValue: (key, value) => values.set(key, value),
    console: Object.fromEntries(['log', 'info', 'warn', 'error'].map(method => [method, (...args) => calls.push({ method, args })]))
  });
  vm.runInContext(await loggingSource(), context);
  const diagnostics = vm.runInContext('createDiagnostics({read: key => GM_getValue(key), write: (key, value) => GM_setValue(key, value), sink: console, now: () => clock(), capacity: 3})',
    Object.assign(context, { clock: () => time }));
  return { diagnostics, calls, values, context, tick: ms => { time += ms; } };
}

test('new logging policy filters every severity and supports live stored changes including off', async () => {
  const { diagnostics, calls, values } = await harness();
  const log = diagnostics.scope('test');
  const levels = ['debug', 'info', 'warn', 'error', 'off'];
  for (const [index, threshold] of levels.entries()) {
    values.set('sse_log_level', threshold);
    calls.length = 0;
    for (const level of levels.slice(0, 4)) log[level]('step', 'message');
    assert.deepEqual(calls.map(call => call.args.at(-1).level), levels.slice(index, 4));
  }
  diagnostics.setLevel('debug');
  assert.equal(values.get('sse_log_level'), 'debug');
  assert.throws(() => diagnostics.setLevel('toString'), /无效/);
  calls.length = 0;
  log.debug('step', 'visible debug');
  assert.equal(calls[0].method, 'log');
  assert.equal(calls[0].args.at(-1).level, 'debug');
});

test('legacy configuration migrates once and never overrides the independent level', async () => {
  for (const legacy of [{ logLevel: 'debug' }, JSON.stringify({ logLevel: 'debug' })]) {
    const { diagnostics, values } = await harness({ 'Storage:Setting': legacy });
    assert.equal(diagnostics.getLevel(), 'debug');
    assert.equal(values.get('sse_log_level'), 'debug');
    diagnostics.setLevel('off');
    assert.equal(diagnostics.getLevel(), 'off');
  }
  const { diagnostics } = await harness({ 'Storage:Setting': '{bad' });
  assert.equal(diagnostics.getLevel(), 'info');
});

test('operations correlate steps, record duration and settle once', async () => {
  const { diagnostics, calls, tick } = await harness({ sse_log_level: 'debug' });
  const task = diagnostics.scope('cart').begin('import', { count: 2 }, 'info');
  task.debug('parse', 'parsed');
  tick(24);
  task.end('done');
  task.fail(new Error('late'));
  const records = calls.map(call => call.args.at(-1));
  assert.equal(records.length, 3);
  assert.equal(records[0].operation, records[2].operation);
  assert.equal(records[1].step, 'import.parse');
  assert.equal(records[2].durationMs, 24);
  assert.equal(records[2].status, 'success');
});

test('snapshots preserve errors, redact credentials and stay bounded without retaining mutable objects', async () => {
  const { diagnostics } = await harness({ sse_log_level: 'debug' });
  const log = diagnostics.scope('test');
  const payload = { count: 1, access_token: 'secret', sessionid: 'secret', comment: 'private', url: 'https://test/?access_token=secret' };
  payload.self = payload;
  log.error('failed', 'failure', { payload, error: new Error('network') });
  payload.count = 99;
  let records = diagnostics.records();
  assert.equal(records[0].data.payload.count, 1);
  assert.equal(records[0].data.payload.self, '[circular]');
  assert.equal(records[0].data.error.message, 'network');
  assert.match(records[0].data.error.stack, /Error: network/);
  assert.ok(!JSON.stringify(records).includes('secret'));
  records[0].data.payload.count = 50;
  assert.equal(diagnostics.records()[0].data.payload.count, 1);
  for (let i = 0; i < 5; i++) log.info('step', 'message');
  assert.equal(diagnostics.records().length, 3);
  diagnostics.clear();
  assert.equal(diagnostics.records().length, 0);
});

test('filtered lazy data and broken console output cannot interrupt feature code', async () => {
  const { diagnostics, context } = await harness();
  diagnostics.scope('test').debug('hidden', 'hidden', () => { throw Error('should not evaluate'); });
  const broken = vm.runInContext('createDiagnostics({read: () => { throw Error("storage"); }, write() {}, sink: {info() { throw Error("console"); }}})', context);
  assert.doesNotThrow(() => broken.scope('test').info('step', 'message'));
});
