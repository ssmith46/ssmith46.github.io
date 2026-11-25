/**
 * @file cta.js
 * Block: Call to action — a short message with buttons ("Let's talk",
 * "Download my résumé", …).
 */
import { html, cx } from '../../core/html.js';
import { buttons, BUTTON_FIELDS } from '../../core/ui.js';
import { renderSocials } from '../../layout/socials.js';

export default {
  type: 'cta',
  label: 'Call to action',
  icon: 'zap',
  description: 'A short message with buttons — great for contact or résumé.',

  fields: [
    {
      key: 'style',
      type: 'select',
      label: 'Style',
      options: [
        { value: 'card', label: 'Card' },
        { value: 'banner', label: 'Bold banner' },
        { value: 'plain', label: 'Plain' },
      ],
    },
    { key: 'eyebrow', type: 'text', label: 'Small heading' },
    { key: 'heading', type: 'text', label: 'Heading', required: true },
    { key: 'text', type: 'markdown', label: 'Text', rows: 3 },
    { key: 'actions', type: 'list', label: 'Buttons', fields: BUTTON_FIELDS, itemLabel: 'label', addLabel: 'Add button' },
    { key: 'showSocials', type: 'toggle', label: 'Show social links' },
  ],

  defaults: () => ({ style: 'card', heading: '', actions: [], showSocials: false }),

  render(p, ctx) {
    return html`<div class="container">
      <div class="${cx('cta', `cta--${p.style || 'card'}`)}" data-reveal>
        <div class="cta__text">
          ${p.eyebrow ? html`<p class="eyebrow">${p.eyebrow}</p>` : ''}
          ${p.heading ? html`<h2 class="cta__heading">${p.heading}</h2>` : ''}
          ${p.text ? html`<div class="prose cta__body">${ctx.md(p.text)}</div>` : ''}
        </div>
        <div class="cta__actions">
          ${buttons(p.actions, ctx)}
          ${p.showSocials ? renderSocials(ctx.site.socials, ctx) : ''}
        </div>
      </div>
    </div>`;
  },
};
