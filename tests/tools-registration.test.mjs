/**
 * Regression tests for issue #3 — the search tools silently stopped being
 * registered.
 *
 * Root cause: the row schema ends in `.volatile()`, and cordis validates config
 * through the standard-schema path, which hands `apply` a cosmokit `Volatile`
 * wrapper (`{ get() }`). `if (config.toolsEnabled)` therefore read a property
 * that does not exist on the wrapper — always `undefined` — so BOTH tools were
 * skipped no matter what the user configured (v0.3.4 → v0.4.0).
 *
 * The static half runs anywhere (no dependencies). The behavioural half imports
 * the real plugin, real schema and real `defineTool`, so it needs the plugin's
 * dependencies (`npm test` from an installed profile dir) and skips with a
 * reason in a clean checkout.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../index.js', import.meta.url), 'utf8');
// Scan code only: the doc comments above legitimately name the buggy reads.
const code = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

test('the tools guard resolves the volatile row config instead of reading it', () => {
  assert.match(code, /function runtimeConfigOf\(config\)/,
    'apply() must resolve the row config through the volatile-aware helper');
  // The exact bug: a property read off the Volatile wrapper is always undefined.
  assert.doesNotMatch(code, /config\.toolsEnabled/,
    'config.toolsEnabled reads the Volatile wrapper, never the validated value');
  // Scope the scan to apply(): module-level import specifiers are not config reads.
  const applyBody = code.slice(code.indexOf('function apply('));
  assert.match(applyBody, /runtimeConfigOf\(config\)\?\.toolsEnabled === false/,
    'only an explicit false may disable the tools (schema default is true)');
  // Every other `config.<property>` read in apply() would be the same bug class;
  // `get()` is the resolver itself.
  const reads = [...applyBody.matchAll(/(?<![.\w])config\.(\w+)/g)]
    .map((match) => match[1])
    .filter((name) => name !== 'get');
  assert.deepEqual(reads, [], `raw config property reads: ${reads.join(', ')}`);
});

test('registration is observable and survives a late tools service', () => {
  assert.match(code, /tools registered: tdai_memory_search, tdai_conversation_search/,
    'registration must log its outcome — the original failure was completely silent');
  assert.match(code, /ctx\.inject\(\["tools"\]/, 'a late tools service must be awaited, not ignored');
  assert.match(code, /loader\/volatile-update/, 'a volatile toolsEnabled flip must re-sync registration');
});

// ── behavioural half (needs the plugin's runtime dependencies) ──────────────
let plugin = null;
let importError = null;
try {
  plugin = await import('../index.js');
} catch (error) {
  importError = error;
}

const behaviorTest = importError ? test.skip : test;
if (importError) {
  console.log(`# tools-registration behavioural tests skipped: ${importError.code ?? importError.message}`);
}

/** Minimal cordis-shaped ctx: only what apply() touches before a turn runs. */
function makeCtx(tools) {
  const handlers = new Map();
  const deferred = [];
  return {
    logger: { debug() {}, info() {}, warn() {}, error() {} },
    tools,
    handlers,
    deferred,
    on(event, handler) {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
    },
    emit(event) {
      for (const handler of handlers.get(event) ?? []) handler();
    },
    effect() {},
    inject(names, callback) {
      deferred.push({ names, callback });
    },
    get(name) {
      return name === 'tools' ? tools : undefined;
    },
  };
}

/** Run apply() without letting its 500ms fallback build reach TdaiCore. */
function applyPlugin(ctx, config) {
  const realSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = () => 0;
  try {
    plugin.apply(ctx, config);
  } finally {
    globalThis.setTimeout = realSetTimeout;
  }
}

/** A validating tools service double that records registrations and disposals. */
function makeTools() {
  const registered = [];
  const disposed = [];
  return {
    registered,
    disposed,
    register(definition) {
      registered.push(definition.name);
      return () => disposed.push(definition.name);
    },
  };
}

behaviorTest('registers both tools for a config that never mentions toolsEnabled', () => {
  // Validate through the REAL schema: this is what the host passes to apply,
  // and it is a `{ get() }` wrapper — the whole point of the regression.
  const validated = plugin.Config['~standard'].validate({}).value;
  assert.equal(typeof validated.get, 'function', 'a volatile row config is a Volatile wrapper');
  assert.equal(validated.toolsEnabled, undefined, 'the wrapper exposes no config properties');
  assert.equal(validated.get().toolsEnabled, true, 'the validated value defaults toolsEnabled to true');

  const tools = makeTools();
  applyPlugin(makeCtx(tools), validated);
  assert.deepEqual(tools.registered, ['tdai_memory_search', 'tdai_conversation_search']);
});

behaviorTest('registers both tools when toolsEnabled is explicitly true', () => {
  const validated = plugin.Config['~standard'].validate({ toolsEnabled: true }).value;
  const tools = makeTools();
  applyPlugin(makeCtx(tools), validated);
  assert.deepEqual(tools.registered, ['tdai_memory_search', 'tdai_conversation_search']);
});

behaviorTest('honors an explicit toolsEnabled: false', () => {
  const validated = plugin.Config['~standard'].validate({ toolsEnabled: false }).value;
  const tools = makeTools();
  applyPlugin(makeCtx(tools), validated);
  assert.deepEqual(tools.registered, []);
});

behaviorTest('still works when the host hands over a plain config object', () => {
  const tools = makeTools();
  applyPlugin(makeCtx(tools), { ...plugin.Config['~standard'].validate({}).value.get() });
  assert.deepEqual(tools.registered, ['tdai_memory_search', 'tdai_conversation_search']);
});

behaviorTest('defers registration until a late tools service appears', () => {
  const ctx = makeCtx(undefined);
  applyPlugin(ctx, plugin.Config['~standard'].validate({}).value);
  assert.deepEqual(ctx.deferred.map((entry) => entry.names), [['tools']],
    'a missing tools service must schedule registration instead of silently doing nothing');

  const late = makeTools();
  ctx.deferred[0].callback(makeCtx(late));
  assert.deepEqual(late.registered, ['tdai_memory_search', 'tdai_conversation_search']);
});

behaviorTest('a volatile toolsEnabled flip unregisters and re-registers in place', () => {
  // The loader's volatile update swaps the wrapper's inner value
  // (`updateVolatile(ref, source)` → `ref[write](source.get())`), so the live
  // read in apply() must see the new value. The validated payload itself is
  // frozen, so the swap is what a test double has to reproduce.
  const payload = plugin.Config['~standard'].validate({}).value.get();
  let current = payload;
  const wrapper = { get: () => current };

  const tools = makeTools();
  const ctx = makeCtx(tools);
  applyPlugin(ctx, wrapper);
  assert.deepEqual(tools.registered, ['tdai_memory_search', 'tdai_conversation_search']);

  current = { ...payload, toolsEnabled: false };
  ctx.emit('loader/volatile-update');
  assert.deepEqual(tools.disposed, ['tdai_memory_search', 'tdai_conversation_search']);

  current = { ...payload, toolsEnabled: true };
  ctx.emit('loader/volatile-update');
  assert.deepEqual(tools.registered, ['tdai_memory_search', 'tdai_conversation_search', 'tdai_memory_search', 'tdai_conversation_search']);
});
