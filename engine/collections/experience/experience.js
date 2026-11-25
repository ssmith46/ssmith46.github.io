/**
 * @file experience.js
 * Collection type: Experience — jobs, internships, volunteering.
 */
import { html } from '../../core/html.js';
import { formatRange } from '../../core/utils.js';
import { timeline, compactList } from '../shared/timeline.js';

function toEntry(item) {
  return {
    title: item.role,
    org: item.organization,
    orgUrl: item.url,
    location: item.location,
    period: formatRange(item.start, item.end),
    current: !item.end,
    summary: item.summary,
    bullets: item.highlights,
    tags: item.tags,
    logo: item.logo,
  };
}

export default {
  type: 'experience',
  label: 'Experience',
  plural: 'Experience',
  icon: 'briefcase',
  description: 'Jobs, internships and roles, shown as a timeline.',
  detailPage: false,
  defaultSort: 'newest',

  fields: [
    { key: 'role', type: 'text', label: 'Role', required: true, placeholder: 'Computer Scientist' },
    { key: 'organization', type: 'text', label: 'Organization', placeholder: 'Naval Surface Warfare Center' },
    { key: 'location', type: 'text', label: 'Location', placeholder: 'Dahlgren, VA', width: 'half' },
    { key: 'url', type: 'url', label: 'Organization website', width: 'half' },
    { key: 'start', type: 'date', label: 'Started', precision: 'month', width: 'half' },
    { key: 'end', type: 'date', label: 'Ended', precision: 'month', width: 'half', help: 'Leave empty if this is your current role.' },
    { key: 'summary', type: 'markdown', label: 'Summary', rows: 3 },
    { key: 'highlights', type: 'lines', label: 'Highlights', placeholder: 'What you did or achieved' },
    { key: 'tags', type: 'tags', label: 'Skills used' },
    { key: 'logo', type: 'image', label: 'Logo' },
    { key: 'hidden', type: 'toggle', label: 'Hide from the site' },
  ],

  defaults: () => ({ role: '', organization: '', highlights: [], tags: [] }),

  titleOf: (item) => item.role,
  subtitleOf: (item) => [item.organization, formatRange(item.start, item.end)].filter(Boolean).join(' · '),
  // Used for "newest first" sorting: current roles first, then by start date.
  dateOf: (item) => (item.end ? item.start : '9999'),

  layouts: {
    timeline: { label: 'Timeline', render: (items, ctx) => timeline(items.map(toEntry), ctx) },
    compact: { label: 'Compact list', render: (items) => compactList(items.map(toEntry)) },
    cards: {
      label: 'Cards',
      render: (items, ctx) => html`<div class="mini-cards">${items.map((i) => {
        const e = toEntry(i);
        return html`<div class="mini-card"><p class="mini-card__meta">${e.period}</p><h3 class="mini-card__title">${e.title}</h3><p class="mini-card__sub">${e.org}</p>${e.summary ? html`<div class="prose">${ctx.md(e.summary)}</div>` : ''}</div>`;
      })}</div>`,
    },
  },
};
