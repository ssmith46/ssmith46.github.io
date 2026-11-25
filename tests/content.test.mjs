/**
 * Checks the real content in content/: it parses, every internal link
 * resolves, every referenced media file exists, and the full build succeeds.
 * Run: node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContent } from '../tools/lib/files.mjs';
import { buildBundles } from '../engine/core/bundle.js';
import { createContext } from '../engine/core/context.js';
import { registry } from '../engine/registry.js';
import { build } from '../tools/build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { jsonFiles, mediaPaths } = readContent(ROOT);
const sites = buildBundles(jsonFiles, mediaPaths);

test('content parses without errors', () => {
  assert.ok(Object.keys(sites).length > 0, 'at least one site');
  for (const bundle of Object.values(sites)) assert.deepEqual(bundle.errors, [], bundle.id);
});

/** Collect every string value under keys named "link" (plus the site menu). */
function linkRefs(value, out = []) {
  if (Array.isArray(value)) value.forEach((v) => linkRefs(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if ((k === 'link' || k === 'moreLink') && typeof v === 'string') out.push(v);
      else linkRefs(v, out);
    }
  }
  return out;
}

/** Collect "media/…" references anywhere in the content. */
function mediaRefs(value, out = []) {
  if (typeof value === 'string') {
    for (const m of value.matchAll(/(?:^|[("\s])(media\/[^\s)"']+)/g)) out.push(m[1]);
  } else if (Array.isArray(value)) value.forEach((v) => mediaRefs(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => mediaRefs(v, out));
  return out;
}

for (const bundle of Object.values(sites)) {
  test(`site "${bundle.id}": internal links resolve`, () => {
    const ctx = createContext({ bundle, registry });
    const refs = linkRefs([bundle.site, Object.values(bundle.pages), Object.values(bundle.collections)]);
    for (const ref of refs) {
      if (/^(https?:|mailto:|tel:|#)/.test(ref)) continue;
      assert.notEqual(ctx.link(ref), '#', `link "${ref}" does not resolve`);
    }
  });

  test(`site "${bundle.id}": referenced media files exist`, () => {
    const refs = new Set(mediaRefs([bundle.site, Object.values(bundle.pages), Object.values(bundle.collections)]));
    for (const ref of refs) assert.ok(bundle.media.includes(ref), `missing file ${ref}`);
  });

  test(`site "${bundle.id}": collections in sections exist`, () => {
    const ids = new Set(bundle.site.collections.map((c) => c.id));
    for (const page of Object.values(bundle.pages)) {
      for (const s of page.sections || []) if (s.type === 'collection') assert.ok(ids.has(s.collection), `${page.$id}: unknown collection ${s.collection}`);
    }
  });
}

test('the full build succeeds', async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'site-build-'));
  try {
    const result = await build({ root: ROOT, outDir: out, quiet: true });
    assert.ok(result.pageCount > 0);
    assert.ok(fs.existsSync(path.join(out, 'index.html')));
    assert.ok(fs.existsSync(path.join(out, 'assets/site.css')));
    assert.ok(fs.existsSync(path.join(out, 'admin/index.html')));
    assert.ok(fs.existsSync(path.join(out, 'engine/registry.js')), 'admin needs the engine for previews');
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});
