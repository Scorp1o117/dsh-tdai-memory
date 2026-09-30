import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../client.js', import.meta.url), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));
function mount({ accepted = true, throws = false } = {}) {
  let bundle, page, cursor = 0;
  const states = [], effects = [], dependencies = [], writes = [];
  let snapshot = { status: 'ready', writable: true, revision: 7, user: {}, value: {
    llm: { model: 'old-model', baseUrl: 'https://example.test/v1' },
    embedding: { model: 'old-embedding' }, captureEnabled: true,
    extraction: { enabled: true }, recall: { enabled: true }
  } };
  const scope = {
    getSnapshot: () => snapshot, subscribe: () => () => {},
    mutate(ops, revision) {
      writes.push({ ops: JSON.parse(JSON.stringify(ops)), revision });
      if (throws) throw new Error('transport failed');
      if (accepted) {
        const value = structuredClone(snapshot.value), user = structuredClone(snapshot.user);
        for (const op of ops) for (const root of [value, user]) {
          let parent = root;
          for (const key of op.path.slice(0, -1)) parent = parent[key] ??= {};
          if (op.op === 'set') parent[op.path.at(-1)] = op.value;
          else delete parent[op.path.at(-1)];
        }
        snapshot = { ...snapshot, value, user, revision: revision + 1 };
      }
      return Promise.resolve(accepted);
    }
  };
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat() }),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
    },
    useEffect(fn, deps) {
      const index = cursor++;
      if (!dependencies[index] || deps.some((item, i) => item !== dependencies[index][i])) effects.push(fn);
      dependencies[index] = deps;
    }
  };
  vm.runInNewContext(source, { window: { __ModuleLoader__: { load(value) { bundle = value; } } } });
  const plugin = bundle.factory(() => react);
  plugin.apply({ locale: { bind: () => key => key, register: () => () => {} }, effect: fn => fn(),
    configForms: { get: () => scope }, slots: { inject: (_name, fn) => fn(), register(options, render) { page = render; return () => {}; } } });
  const element = page({ view: 'page' });
  function render() { cursor = 0; const tree = element.type(element.props); for (const fn of effects.splice(0)) fn(); return tree; }
  render();
  return { render, writes, snapshot: () => snapshot };
}
function find(tree, predicate) {
  if (tree && typeof tree === 'object' && predicate(tree)) return tree;
  for (const child of tree?.children ?? []) { const match = find(child, predicate); if (match) return match; }
}
const field = (tree, key) => find(find(tree, node => node.props.key === key), node => node.type === 'input');
const button = (tree, label) => find(tree, node => node.type === 'button' && node.children.includes(label));
const text = tree => typeof tree === 'string' ? tree : (tree?.children ?? []).map(text).join(' ');

test('new extraction and embedding models save through the form without legacy connection.api', async () => {
  const ui = mount();
  field(ui.render(), 'llm.model').props.onChange({ target: { value: 'new-model' } });
  field(ui.render(), 'embedding.model').props.onChange({ target: { value: 'new-embedding' } });
  button(ui.render(), 'save').props.onClick(); await settle();
  assert.equal(ui.snapshot().value.llm.model, 'new-model');
  assert.equal(ui.snapshot().value.embedding.model, 'new-embedding');
  assert.equal(ui.writes[0].revision, 7);
  assert.equal(ui.writes[0].ops.some(op => op.path.includes('apiKey')), false);
  assert.match(text(ui.render()), /saved/);
  assert.equal(field(ui.render(), 'llm.model').props.value, 'new-model');
  field(ui.render(), 'llm.model').props.onChange({ target: { value: 'second-model' } });
  button(ui.render(), 'save').props.onClick(); await settle();
  assert.equal(ui.writes[1].revision, 8, 'the next save uses the refreshed revision');
});

test('a refused write reports failure and retains the typed model for retry', async () => {
  const ui = mount({ accepted: false });
  field(ui.render(), 'llm.model').props.onChange({ target: { value: 'retry-model' } });
  button(ui.render(), 'save').props.onClick(); await settle();
  assert.equal(ui.snapshot().value.llm.model, 'old-model');
  assert.equal(field(ui.render(), 'llm.model').props.value, 'retry-model');
  assert.match(text(ui.render()), /notApplied/);
  assert.doesNotMatch(text(ui.render()), /saved/);
  assert.equal(button(ui.render(), 'save').props.disabled, false);
});

test('disabling a default-on switch explicitly stores false', async () => {
  const ui = mount();
  field(ui.render(), 'captureEnabled').props.onChange({ target: { checked: false } });
  button(ui.render(), 'save').props.onClick(); await settle();
  assert.deepEqual(ui.writes[0].ops, [{ op: 'set', path: ['captureEnabled'], value: false }]);
  assert.equal(ui.snapshot().value.captureEnabled, false);
});

test('reset uses the form and clears the draft; synchronous transport errors release the save button', async () => {
  const reset = mount(); button(reset.render(), 'reset').props.onClick(); await settle();
  assert.equal(reset.writes[0].ops.every(op => op.op === 'unset'), true);
  assert.equal(field(reset.render(), 'llm.model').props.value, '');
  const failed = mount({ throws: true });
  field(failed.render(), 'llm.model').props.onChange({ target: { value: 'new-model' } });
  button(failed.render(), 'save').props.onClick(); await settle();
  assert.match(text(failed.render()), /transport failed/);
  assert.equal(button(failed.render(), 'save').props.disabled, false);
});
