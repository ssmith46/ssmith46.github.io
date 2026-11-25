/**
 * Unit tests for the engine's core helpers. Run: node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, raw, attrs, escapeHtml } from '../engine/core/html.js';
import { markdown } from '../engine/core/markdown.js';
import { classifyPath, normalizeBasePath, buildBundles } from '../engine/core/bundle.js';
import { slugify, formatRange, dateKey } from '../engine/core/utils.js';
import { contrast, ensureContrast } from '../engine/core/color.js';
import { themeCss } from '../engine/themes/css.js';

test('html escapes interpolations but not nested html', () => {
  const name = '<script>alert(1)</script>';
  assert.equal(String(html`<p>${name}</p>`), '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  assert.equal(String(html`<div>${html`<b>${'x'}</b>`}</div>`), '<div><b>x</b></div>');
  assert.equal(String(html`${[1, 2, 3]}`), '123');
  assert.equal(String(html`${null}${false}${undefined}${true}`), '');
  assert.equal(String(raw('<i>ok</i>')), '<i>ok</i>');
  assert.equal(escapeHtml(`"'&`), '&quot;&#39;&amp;');
});

test('attrs skips empty values and renders boolean attributes', () => {
  assert.equal(String(attrs({ href: '/a"b', hidden: true, target: false, rel: null, title: '' })), ' href="/a&quot;b" hidden');
});

test('markdown renders common syntax', () => {
  const out = String(markdown('# Title\n\nSome **bold** and *italic* with `code`.\n\n- one\n- two\n\n1. first\n2. second\n\n> quoted'));
  assert.match(out, /<h2>Title<\/h2>/);
  assert.match(out, /<strong>bold<\/strong>/);
  assert.match(out, /<em>italic<\/em>/);
  assert.match(out, /<code>code<\/code>/);
  assert.match(out, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
  assert.match(out, /<ol><li>first<\/li><li>second<\/li><\/ol>/);
  assert.match(out, /<blockquote><p>quoted<\/p><\/blockquote>/);
});

test('markdown is safe: raw HTML is escaped and dangerous links neutralised', () => {
  const out = String(markdown('<img src=x onerror=alert(1)>\n\n[click](javascript:alert(1)) [ok](https://example.com)'));
  assert.doesNotMatch(out, /<img src=x/);
  assert.match(out, /href="#"/);
  assert.match(out, /href="https:\/\/example.com" target="_blank" rel="noopener noreferrer"/);
});

test('markdown resolves media references and builds figures', () => {
  const out = String(markdown('![A ship](media/ship.webp "Caption")', { resolveUrl: (u) => `/base/${u}` }));
  assert.match(out, /<figure><img src="\/base\/media\/ship.webp" alt="A ship" loading="lazy"><figcaption>Caption<\/figcaption><\/figure>/);
});

test('code fences keep their content verbatim', () => {
  const out = String(markdown('```js\nconst a = "<b>";\n```'));
  assert.equal(out, '<pre><code class="language-js">const a = &quot;&lt;b&gt;&quot;;</code></pre>');
});

test('classifyPath understands the content layout', () => {
  assert.deepEqual(classifyPath('content/sites/main/site.json'), { kind: 'site', siteId: 'main' });
  assert.deepEqual(classifyPath('content/sites/main/pages/about.json'), { kind: 'page', siteId: 'main', pageId: 'about' });
  assert.deepEqual(classifyPath('content/sites/main/collections/projects/x.json'), { kind: 'item', siteId: 'main', collectionId: 'projects', itemId: 'x' });
  assert.deepEqual(classifyPath('content/sites/main/media/a/b.webp'), { kind: 'media', siteId: 'main', ref: 'media/a/b.webp' });
  assert.equal(classifyPath('README.md').kind, 'other');
});

test('normalizeBasePath', () => {
  assert.equal(normalizeBasePath(''), '/');
  assert.equal(normalizeBasePath('running'), '/running/');
  assert.equal(normalizeBasePath('/a//b/'), '/a/b/');
});

test('buildBundles reports invalid JSON without failing the site', () => {
  const sites = buildBundles([
    ['content/sites/s/site.json', '{"title":"S"}'],
    ['content/sites/s/pages/home.json', '{"title":"Home"}'],
    ['content/sites/s/pages/broken.json', '{nope'],
  ]);
  assert.equal(sites.s.site.title, 'S');
  assert.equal(sites.s.pages.home.$id, 'home');
  assert.equal(sites.s.errors.length, 1);
  assert.match(sites.s.errors[0].path, /broken/);
});

test('utils: slugify, date ranges and sort keys', () => {
  assert.equal(slugify('Ship CNN (2024) — Café!'), 'ship-cnn-2024-cafe');
  assert.equal(formatRange('2025-06', ''), 'Jun 2025 – Present');
  assert.equal(formatRange('2023-05', '2025-06'), 'May 2023 – Jun 2025');
  assert.ok(dateKey('2025-06') > dateKey('2025-05-31'));
});

test('custom accents are adjusted for contrast in both modes', () => {
  const light = ensureContrast('#ffee00', '#ffffff', 4.5);
  assert.ok(contrast(light, '#ffffff') >= 4.5);
  const css = themeCss({ preset: 'graphite', accent: '#ff0000' });
  assert.match(css, /--accent:#ff0000/);
  assert.match(css, /prefers-color-scheme: dark/);
  assert.match(css, /\[data-theme="dark"\]/);
});
