/**
 * @file links.js
 * Block: Links — a tidy list of links (talks, papers, profiles, demos…).
 */
import { html, attrs, cx } from '../../core/html.js';
import { sectionHeading } from '../../core/ui.js';

export default {
  type: 'links',
  label: 'Links',
  icon: 'link',
  description: 'A list of links with optional descriptions and icons.',

  fields: [
    { key: 'eyebrow', type: 'text', label: 'Small heading' },
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'intro', type: 'markdown', label: 'Introduction', rows: 2 },
    {
      key: 'style',
      type: 'select',
      label: 'Style',
      options: [
        { value: 'cards', label: 'Cards' },
        { value: 'list', label: 'List' },
        { value: 'pills', label: 'Pills' },
      ],
    },
    {
      key: 'items',
      type: 'list',
      label: 'Links',
      itemLabel: 'label',
      addLabel: 'Add link',
      fields: [
        { key: 'label', type: 'text', label: 'Label', required: true },
        { key: 'link', type: 'link', label: 'Link to' },
        { key: 'description', type: 'text', label: 'Description' },
        { key: 'icon', type: 'icon', label: 'Icon' },
      ],
    },
  ],

  defaults: () => ({ style: 'cards', items: [] }),

  render(p, ctx) {
    const items = (p.items || []).filter((i) => i.label);
    return html`<div class="container links-block">
      ${sectionHeading(p, ctx)}
      <ul class="${cx('link-list', `link-list--${p.style || 'cards'}`)}" data-reveal>
        ${items.map((item) => {
          const external = ctx.isExternal(item.link);
          return html`<li><a${attrs({ class: 'link-list__item', href: ctx.link(item.link), target: external && '_blank', rel: external && 'noopener noreferrer' })}>
            ${item.icon ? html`<span class="link-list__icon">${ctx.icon(item.icon)}</span>` : ''}
            <span class="link-list__text"><span class="link-list__label">${item.label}</span>${item.description ? html`<span class="link-list__desc">${item.description}</span>` : ''}</span>
            <span class="link-list__arrow">${ctx.icon(external ? 'arrow-up-right' : 'arrow-right', { size: 18 })}</span>
          </a></li>`;
        })}
      </ul>
    </div>`;
  },
};
