import assert from 'node:assert/strict';
import test from 'node:test';
import { createRecallCache, recallWithTimeout } from '../recall-runtime.js';
import { apply } from '../recall-inject.js';

test('fast recall clears its deadline timer', async t => {
  const clear = t.mock.method(globalThis, 'clearTimeout');
  const result = { prependContext: 'memory' };
  assert.equal(await recallWithTimeout(() => result, 1000), result);
  assert.equal(clear.mock.callCount(), 1);
  assert.ok(clear.mock.calls[0].arguments[0]);
});

test('hung recall degrades to null, and late rejection is handled', async () => {
  let reject;
  assert.equal(await recallWithTimeout(() => new Promise((_resolve, fail) => { reject = fail; }), 10), null);
  reject(new Error('late failure'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(await recallWithTimeout(() => { throw new Error('sync failure'); }), null);
});

test('cache expires, separates sessions and text, and evicts oldest entries', () => {
  let now = 0;
  const cache = createRecallCache(30, 2, () => now);
  cache.set('a', 'hello', { prependContext: 'A' });
  cache.set('b', 'hello', { prependContext: 'B' });
  assert.equal(cache.get('a', 'hello').prependContext, 'A');
  assert.equal(cache.get('a', 'different'), undefined);
  cache.set('c', 'hello', {});
  assert.equal(cache.get('a', 'hello'), undefined);
  assert.equal(cache.get('b', 'hello').prependContext, 'B');
  now = 30;
  assert.equal(cache.get('b', 'hello'), undefined);
  cache.set('d', 'hello', {});
  cache.clear();
  assert.equal(cache.get('d', 'hello'), undefined);
});

function mount(handleBeforeRecall, config = {}) {
  let listener;
  apply({ tdaiMemory: { handleBeforeRecall }, on(_event, fn) { listener = fn; } },
    { minUserTextChars: 1, cacheTtlMs: 30000, timeoutMs: 10, ...config });
  const session = { id: 's', deriveMessages: () => [{ role: 'user', content: 'remember me' }] };
  return assembly => listener(assembly, { agent: { session } });
}

test('agent assembly survives timeout and retries instead of caching failure', async () => {
  let calls = 0;
  const assemble = mount(() => {
    calls += 1;
    return calls === 1 ? new Promise(() => {}) : { prependContext: 'recovered memory' };
  });
  const assembly = { contexts: [] };
  assert.equal(await assemble(assembly), assembly);
  assert.equal((await assemble(assembly)).contexts[0].text, 'recovered memory');
  assert.equal((await assemble(assembly)).contexts[0].text, 'recovered memory');
  assert.equal(calls, 2, 'successful recall is cached, failed recall is retried');
});

test('zero cache TTL disables reuse', async () => {
  let calls = 0;
  const assemble = mount(() => { calls += 1; return {}; }, { cacheTtlMs: 0 });
  await assemble({ contexts: [] });
  await assemble({ contexts: [] });
  assert.equal(calls, 2);
});
