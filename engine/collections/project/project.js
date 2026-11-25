/**
 * @file project.js
 * Collection type: Project — things you built, each with its own write-up page.
 */
import { formatDate } from '../../core/utils.js';
import { cardGrid, rowList } from '../shared/cards.js';
import { article, siblingsOf, collectionHome } from '../shared/article.js';

/** Label like "Fall 2024 · Team lead". */
function metaLine(item) {
  return [item.dateLabel || formatDate(item.date, 'year'), item.role].filter(Boolean).join(' · ');
}

function toCard(item, ctx) {
  return {
    title: item.title,
    href: ctx.itemUrl(item),
    meta: metaLine(item),
    summary: item.summary,
    tags: item.tags,
    image: item.cover,
    imageAlt: item.coverAlt,
    featured: item.featured,
  };
}

export default {
  type: 'project',
  label: 'Project',
  plural: 'Projects',
  icon: 'folder',
  description: 'Things you built — each gets its own write-up page.',
  detailPage: true,
  defaultSort: 'manual',

  fields: [
    { key: 'title', type: 'text', label: 'Title', required: true },
    { key: 'summary', type: 'textarea', label: 'One-line summary', rows: 2, help: 'Shown on cards and in search results.' },
    { key: 'cover', type: 'image', label: 'Cover image', help: 'Optional — a tasteful pattern is generated if empty.' },
    { key: 'coverAlt', type: 'text', label: 'Cover description', when: (v) => v.cover },
    { key: 'date', type: 'date', label: 'Date', precision: 'month', width: 'half' },
    { key: 'dateLabel', type: 'text', label: 'Date label', placeholder: 'Fall 2024', width: 'half' },
    { key: 'role', type: 'text', label: 'Your role', placeholder: 'Team lead' },
    { key: 'tags', type: 'tags', label: 'Tech & topics', placeholder: 'Python, Keras…' },
    {
      key: 'links',
      type: 'list',
      label: 'Links',
      itemLabel: 'label',
      addLabel: 'Add link',
      fields: [
        { key: 'label', type: 'text', label: 'Label', placeholder: 'Source code', width: 'half' },
        { key: 'link', type: 'link', label: 'Link to', width: 'half' },
      ],
    },
    { key: 'body', type: 'markdown', label: 'Write-up', rows: 14 },
    { key: 'featured', type: 'toggle', label: 'Feature on the home page', width: 'half' },
    { key: 'hidden', type: 'toggle', label: 'Hide from the site', width: 'half' },
    { key: 'slug', type: 'slug', label: 'Web address', group: 'Advanced', help: 'Leave empty to use the file name.' },
  ],

  defaults: () => ({ title: '', summary: '', tags: [], links: [], body: '', featured: false }),

  titleOf: (item) => item.title,
  subtitleOf: (item) => metaLine(item) || item.summary,
  imageOf: (item) => item.cover,

  layouts: {
    grid: { label: 'Cards', render: (items, ctx) => cardGrid(items.map((i) => toCard(i, ctx)), ctx) },
    list: { label: 'List', render: (items, ctx) => rowList(items.map((i) => toCard(i, ctx)), ctx) },
  },

  renderPage(item, ctx) {
    const back = collectionHome(item, ctx);
    return article(ctx, {
      backHref: back.href,
      backLabel: back.label,
      eyebrow: metaLine(item),
      title: item.title,
      summary: item.summary,
      tags: item.tags,
      actions: (item.links || []).map((l, i) => ({ label: l.label, link: l.link, style: i === 0 ? 'primary' : 'secondary' })),
      cover: item.cover,
      coverAlt: item.coverAlt,
      generatedCover: true,
      body: item.body,
      siblings: siblingsOf(item, ctx),
    });
  },
};
