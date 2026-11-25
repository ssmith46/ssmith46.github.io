#!/usr/bin/env node
/**
 * @file tools/scaffold.mjs
 * Generate a starter module and register it.
 *
 *   node tools/scaffold.mjs block quote          → engine/blocks/quote/{quote.js,quote.css}
 *   node tools/scaffold.mjs collection book      → engine/collections/book/{book.js,book.css}
 *
 * The new module is added to the matching index.js, so it shows up in the
 * admin right away. Run `npm test` afterwards — the contract tests will tell
 * you if anything is missing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [kind, rawName] = process.argv.slice(2);
const name = String(rawName || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const title = name.replace(/(^|-)([a-z])/g, (_, s, c) => `${s ? ' ' : ''}${c.toUpperCase()}`);

if (!['block', 'collection'].includes(kind) || !name) {
  console.log('Usage: node tools/scaffold.mjs <block|collection> <name>');
  process.exit(1);
}

const dir = path.join(ROOT, 'engine', kind === 'block' ? 'blocks' : 'collections', name);
if (fs.existsSync(dir)) {
  console.error(`${path.relative(ROOT, dir)} already exists.`);
  process.exit(1);
}

const blockTemplate = `/**
 * @file ${name}.js
 * Block: ${title} — describe what this section shows.
 */
import { html } from '../../core/html.js';
import { sectionHeading } from '../../core/ui.js';

export default {
  type: '${name}',
  label: '${title}',
  icon: 'sparkles', // any name from engine/core/icons.js
  description: 'One sentence shown in the “Add section” menu.',

  // Each field becomes an input in the admin (see engine/core/fields.js).
  fields: [
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'body', type: 'markdown', label: 'Text' },
  ],

  defaults: () => ({ heading: '', body: '' }),

  /** Return markup for the section. Use only \`ctx\` helpers (see engine/core/context.js). */
  render(p, ctx) {
    return html\`<div class="container ${name}-block" data-reveal>
      \${sectionHeading(p, ctx)}
      \${p.body ? html\`<div class="prose">\${ctx.md(p.body)}</div>\` : ''}
    </div>\`;
  },
};
`;

const collectionTemplate = `/**
 * @file ${name}.js
 * Collection type: ${title} — describe what one item is.
 */
import { html } from '../../core/html.js';
import { formatDate } from '../../core/utils.js';
import { cardGrid, rowList } from '../shared/cards.js';
import { article, siblingsOf, collectionHome } from '../shared/article.js';

const toCard = (item, ctx) => ({ title: item.title, href: ctx.itemUrl(item), meta: formatDate(item.date), summary: item.summary, image: item.image });

export default {
  type: '${name}',
  label: '${title}',
  plural: '${title}s',
  icon: 'folder',
  description: 'One sentence shown when adding a collection.',
  detailPage: true, // false = no page per item
  defaultSort: 'newest', // 'manual' | 'newest' | 'oldest' | 'title'

  fields: [
    { key: 'title', type: 'text', label: 'Title', required: true },
    { key: 'date', type: 'date', label: 'Date', precision: 'day' },
    { key: 'summary', type: 'textarea', label: 'Summary' },
    { key: 'image', type: 'image', label: 'Image' },
    { key: 'body', type: 'markdown', label: 'Details' },
    { key: 'hidden', type: 'toggle', label: 'Hide from the site' },
  ],

  defaults: () => ({ title: '' }),
  titleOf: (item) => item.title,
  subtitleOf: (item) => formatDate(item.date, 'full'),
  imageOf: (item) => item.image,

  layouts: {
    grid: { label: 'Cards', render: (items, ctx) => cardGrid(items.map((i) => toCard(i, ctx)), ctx) },
    list: { label: 'List', render: (items, ctx) => rowList(items.map((i) => toCard(i, ctx)), ctx) },
  },

  renderPage(item, ctx) {
    const back = collectionHome(item, ctx);
    return article(ctx, { backHref: back.href, backLabel: back.label, title: item.title, summary: item.summary, cover: item.image, body: item.body, siblings: siblingsOf(item, ctx) });
  },
};
`;

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `${name}.js`), kind === 'block' ? blockTemplate : collectionTemplate);
fs.writeFileSync(path.join(dir, `${name}.css`), `/* ${title} (${path.relative(ROOT, dir)}/${name}.js) */\n\n.${name}-block {\n}\n`);

// Register in index.js: add the import and append to the exported list.
const indexPath = path.join(dir, '..', 'index.js');
let index = fs.readFileSync(indexPath, 'utf8');
const imports = [...index.matchAll(/^import .*;$/gm)];
const last = imports[imports.length - 1];
index = `${index.slice(0, last.index + last[0].length)}\nimport ${camel} from './${name}/${name}.js';${index.slice(last.index + last[0].length)}`;
index = index.replace(/export default \[([^\]]*)\];/, (_, list) => `export default [${list.trim()}, ${camel}];`);
fs.writeFileSync(indexPath, index);

console.log(`Created ${path.relative(ROOT, dir)}/ and registered it in ${path.relative(ROOT, indexPath)}.`);
console.log('Next: edit the fields and render function, then run `npm test`.');
