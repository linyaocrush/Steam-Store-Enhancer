import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { harness, settle } from './helpers/runtime.mjs';

test('GM requests classify HTTP, timeout, network and abort failures and settle once', async () => {
  let details, aborts = 0;
  const { context } = await harness(['network.js'], { GM_xmlhttpRequest: options => {
    details = options;
    return { abort() { aborts++; options.onabort(); } };
  } });
  const failure = async (trigger, kind) => {
    const promise = context.gmGet('https://example.com/private?access_token=hidden');
    trigger(details);
    await assert.rejects(promise, error => error.kind === kind);
  };
  await failure(options => options.onload({ status: 429 }), 'http');
  await failure(options => options.ontimeout(), 'timeout');
  await failure(options => options.onerror(), 'network');
  const controller = new AbortController();
  const cancelled = context.gmGet('https://example.com/', { signal: controller.signal });
  controller.abort();
  details.onload({ status: 200, responseText: 'late' });
  await assert.rejects(cancelled, error => error.kind === 'aborted');
  assert.equal(aborts, 1);
});

test('fetch writes have timeout and cancellation, never retry and never expose a token-bearing native error', async () => {
  let calls = 0;
  const { context, time } = await harness(['network.js'], {
    fetch: (url, options) => {
      calls++;
      return new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(Error('leaked ' + url)));
      });
    }
  });
  const result = context.fetchJson('https://example.com/?access_token=private', { method: 'POST', timeout: 100 });
  const checked = assert.rejects(result, error => error.kind === 'timeout' && !error.message.includes('private'));
  await time.advance(100);
  await checked;
  assert.equal(calls, 1);
  assert.equal(time.size, 0);
});

test('invalid JSON differs from HTTP rejection and successful headers are preserved', async () => {
  const headers = { get: () => '1' };
  let response = { ok: true, status: 200, headers, json: async () => { throw Error('bad'); } };
  const { context } = await harness(['network.js'], { fetch: async () => response });
  await assert.rejects(context.fetchJson('https://example.com'), error => error.kind === 'invalid-response');
  response = { ok: false, status: 403 };
  await assert.rejects(context.fetchJson('https://example.com'), error => error.status === 403);
  response = { ok: true, status: 200, headers, json: async () => ({ response: {} }) };
  assert.equal((await context.fetchJson('https://example.com')).headers, headers);
});

test('request queue cancels waiting work without starting it and honors concurrency', async () => {
  const { context } = await harness(['network.js']);
  const queue = vm.runInContext('new RequestQueue(1)', context);
  let release, starts = 0;
  const first = queue.enqueue(() => { starts++; return new Promise(resolve => { release = resolve; }); });
  const controller = new AbortController();
  const cancelled = queue.enqueue(() => { starts++; }, { signal: controller.signal });
  const checked = assert.rejects(cancelled, error => error.kind === 'aborted');
  controller.abort();
  await checked;
  await settle();
  release('done');
  await first;
  await settle();
  assert.equal(starts, 1);
  assert.equal(queue.queue.length, 0);
  assert.equal(queue.running, 0);
});

test('range probes stop after 16 KiB even when the server ignores Range', async () => {
  let details, aborts = 0;
  const { context } = await harness(['network.js', 'restrictions/database.js'], { GM_xmlhttpRequest: options => {
    details = options;
    return { abort() { aborts++; options.onabort(); } };
  } });
  const probe = context.restrictionRequest('https://example.com/list.json', { probe: true });
  assert.equal(details.headers.Range, 'bytes=0-16383');
  details.onprogress({ loaded: 18000 });
  assert.ok((await probe).ms >= 0);
  assert.equal(aborts, 1);
});
