/**
 * @file skills.js
 * Block: Skills — grouped chips (Languages, Tools, Databases…).
 */
import { html } from '../../core/html.js';
import { sectionHeading, tags } from '../../core/ui.js';

export default {
  type: 'skills',
  label: 'Skills',
  icon: 'tag',
  description: 'Groups of skills or tools shown as chips.',

  fields: [
    { key: 'eyebrow', type: 'text', label: 'Small heading' },
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'intro', type: 'markdown', label: 'Introduction', rows: 2 },
    {
      key: 'groups',
      type: 'list',
      label: 'Groups',
      itemLabel: 'label',
      addLabel: 'Add group',
      fields: [
        { key: 'label', type: 'text', label: 'Group name', placeholder: 'Languages' },
        { key: 'items', type: 'tags', label: 'Skills', placeholder: 'Type a skill and press Enter' },
      ],
    },
  ],

  defaults: () => ({ groups: [] }),

  render(p, ctx) {
    const groups = (p.groups || []).filter((g) => g.label || g.items?.length);
    return html`<div class="container skills-block">
      ${sectionHeading(p, ctx)}
      <div class="skill-groups" data-reveal>
        ${groups.map(
          (g) => html`<div class="skill-group">
            <h3 class="skill-group__label">${g.label}</h3>
            ${tags(g.items)}
          </div>`,
        )}
      </div>
    </div>`;
  },
};
