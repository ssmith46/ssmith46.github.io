/**
 * @file stats.js
 * Block: Highlights — a row of big numbers or short facts ("4.0 GPA").
 */
import { html } from '../../core/html.js';
import { sectionHeading } from '../../core/ui.js';

export default {
  type: 'stats',
  label: 'Highlights',
  icon: 'chart',
  description: 'Big numbers or short facts in a row.',

  fields: [
    { key: 'eyebrow', type: 'text', label: 'Small heading' },
    { key: 'heading', type: 'text', label: 'Heading' },
    {
      key: 'items',
      type: 'list',
      label: 'Highlights',
      addLabel: 'Add highlight',
      itemLabel: (i) => [i.value, i.label].filter(Boolean).join(' · '),
      fields: [
        { key: 'value', type: 'text', label: 'Value', placeholder: '4.0', width: 'half' },
        { key: 'label', type: 'text', label: 'Label', placeholder: 'GPA', width: 'half' },
        { key: 'detail', type: 'text', label: 'Detail', placeholder: 'University of Mary Washington' },
      ],
    },
  ],

  defaults: () => ({ items: [] }),

  render(p, ctx) {
    const items = (p.items || []).filter((i) => i.value || i.label);
    return html`<div class="container stats-block">
      ${sectionHeading(p, ctx)}
      <dl class="stats" style="--count:${Math.min(items.length, 4) || 1}" data-reveal>
        ${items.map(
          (i) => html`<div class="stat">
            <dt class="stat__label">${i.label}</dt>
            <dd class="stat__value">${i.value}</dd>
            ${i.detail ? html`<dd class="stat__detail">${i.detail}</dd>` : ''}
          </div>`,
        )}
      </dl>
    </div>`;
  },
};
