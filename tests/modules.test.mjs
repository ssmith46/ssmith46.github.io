/**
 * Contract tests for every plug-in module. If you add a block, collection
 * type or site template, these tests check it automatically:
 *   - required properties exist and every field uses a known field type
 *   - every template produces a site whose every route renders
 * Run: node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registry } from '../engine/registry.js';
import { FIELD_TYPES } from '../engine/core/fields.js';
import { SECTION_FIELDS } from '../engine/core/section.js';
import { buildBundles, paths } from '../engine/core/bundle.js';
import { listRoutes, renderRoute } from '../engine/core/render.js';
import { createContext } from '../engine/core/context.js';

/** Check fields recursively (list fields contain sub-fields). */
function checkFields(fields, where) {
  assert.ok(Array.isArray(fields), `${where}: fields must be an array`);
  const keys = new Set();
  for (const f of fields) {
    assert.ok(f.key, `${where}: a field is missing "key"`);
    assert.ok(!keys.has(f.key), `${where}: duplicate field "${f.key}"`);
    keys.add(f.key);
    assert.ok(FIELD_TYPES.includes(f.type), `${where}.${f.key}: unknown field type "${f.type}"`);
    if (f.type === 'select') assert.ok(f.options?.length || f.optionsFrom, `${where}.${f.key}: select needs options`);
    if (f.type === 'list') checkFields(f.fields, `${where}.${f.key}`);
  }
}

test('section fields are valid', () => checkFields(SECTION_FIELDS, 'section'));

for (const [type, mod] of registry.blocks) {
  test(`block "${type}" follows the module contract`, () => {
    for (const prop of ['label', 'icon', 'description']) assert.ok(mod[prop], `missing ${prop}`);
    assert.equal(typeof mod.render, 'function');
    checkFields(mod.fields, `block.${type}`);
  });
}

for (const [type, mod] of registry.collections) {
  test(`collection type "${type}" follows the module contract`, () => {
    for (const prop of ['label', 'plural', 'icon', 'description']) assert.ok(mod[prop], `missing ${prop}`);
    assert.equal(typeof mod.titleOf, 'function');
    assert.ok(Object.keys(mod.layouts || {}).length, 'needs at least one layout');
    for (const [id, layout] of Object.entries(mod.layouts)) {
      assert.ok(layout.label, `layout ${id} needs a label`);
      assert.equal(typeof layout.render, 'function');
    }
    if (mod.detailPage) assert.equal(typeof mod.renderPage, 'function', 'detailPage types need renderPage');
    checkFields(mod.fields, `collection.${type}`);
  });
}

/** Turn a template's files into a bundle. */
function bundleFromTemplate(template, siteId = 'test') {
  const files = template.create({ title: 'Test Site', basePath: '/test/' });
  const entries = Object.entries(files).map(([rel, data]) => [`${paths.siteRoot(siteId)}/${rel}`, JSON.stringify(data)]);
  return buildBundles(entries)[siteId];
}

for (const [id, template] of registry.templates) {
  test(`template "${id}" builds a site where every route renders`, () => {
    const bundle = bundleFromTemplate(template);
    assert.ok(bundle, 'template must create site.json');
    assert.deepEqual(bundle.errors, []);
    const routes = listRoutes(bundle, registry);
    assert.ok(routes.some((r) => r.path === '/test/'), 'needs a home page');
    for (const route of routes) {
      const out = renderRoute(bundle, registry, route);
      assert.match(out, /^<!doctype html>/);
      assert.doesNotMatch(out, /block-missing|Unknown section type/);
    }
  });
}

test('every block renders with only its defaults (no crash on empty content)', () => {
  const bundle = bundleFromTemplate(registry.templates.get('portfolio'));
  const ctx = createContext({ bundle, registry, mode: 'build', page: bundle.pages.home });
  for (const [type, mod] of registry.blocks) {
    assert.doesNotThrow(() => String(mod.render({ type, ...(mod.defaults ? mod.defaults() : {}) }, ctx, { index: 1 })), `block ${type}`);
  }
});

test('every collection layout renders an empty item list and a defaults-only item', () => {
  const bundle = bundleFromTemplate(registry.templates.get('portfolio'));
  const ctx = createContext({ bundle, registry, mode: 'build' });
  for (const [type, mod] of registry.collections) {
    const item = { ...(mod.defaults ? mod.defaults() : {}), $id: 'x', $collection: 'projects' };
    for (const layout of Object.values(mod.layouts)) {
      assert.doesNotThrow(() => String(layout.render([], ctx, {})), `${type} empty`);
      assert.doesNotThrow(() => String(layout.render([item], ctx, {})), `${type} one item`);
    }
  }
});
