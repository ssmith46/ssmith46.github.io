/**
 * @file post.js
 * Collection type: Write-up — articles, notes, technical deep-dives.
 */
import { formatDate, plainText } from '../../core/utils.js';
import { cardGrid, rowList } from '../shared/cards.js';
import { article, siblingsOf, collectionHome } from '../shared/article.js';

/** Rough reading time from Markdown length (~220 wpm). */
export function readingTime(body) {
  const words = plainText(body).split(/\s+/).filter(Boolean).length;
  return words ? `${Math.max(1, Math.round(words / 220))} min read` : '';
}

function toCard(item, ctx) {
  return {
    title: item.title,
    href: ctx.itemUrl(item),
    meta: formatDate(item.date, 'full'),
    summary: item.summary,
    tags: item.tags,
    image: item.cover,
    featured: item.featured,
  };
}

export default {
  type: 'post',
  label: 'Write-up',
  plural: 'Write-ups',
  icon: 'pen',
  description: 'Articles and notes, each with its own page.',
  detailPage: true,
  defaultSort: 'newest',

  fields: [
    { key: 'title', type: 'text', label: 'Title', required: true },
    { key: 'date', type: 'date', label: 'Published', precision: 'day', width: 'half', default: () => new Date().toISOString().slice(0, 10) },
    { key: 'summary', type: 'textarea', label: 'Summary', rows: 2 },
    { key: 'cover', type: 'image', label: 'Cover image' },
    { key: 'tags', type: 'tags', label: 'Tags' },
    { key: 'body', type: 'markdown', label: 'Article', rows: 20 },
    { key: 'featured', type: 'toggle', label: 'Featured', width: 'half' },
    { key: 'hidden', type: 'toggle', label: 'Draft (hidden from the site)', width: 'half' },
    { key: 'slug', type: 'slug', label: 'Web address', group: 'Advanced', help: 'Leave empty to use the file name.' },
  ],

  defaults: () => ({ title: '', body: '', tags: [] }),

  titleOf: (item) => item.title,
  subtitleOf: (item) => [formatDate(item.date, 'full'), item.hidden && 'Draft'].filter(Boolean).join(' · '),
  imageOf: (item) => item.cover,

  layouts: {
    list: { label: 'List', render: (items, ctx) => rowList(items.map((i) => toCard(i, ctx)), ctx) },
    grid: { label: 'Cards', render: (items, ctx) => cardGrid(items.map((i) => toCard(i, ctx)), ctx) },
  },

  renderPage(item, ctx) {
    const back = collectionHome(item, ctx);
    return article(ctx, {
      backHref: back.href,
      backLabel: back.label,
      eyebrow: formatDate(item.date, 'full'),
      title: item.title,
      summary: item.summary,
      meta: [readingTime(item.body)],
      tags: item.tags,
      cover: item.cover,
      body: item.body,
      siblings: siblingsOf(item, ctx),
    });
  },
};
