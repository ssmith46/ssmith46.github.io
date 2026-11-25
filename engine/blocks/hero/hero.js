/**
 * @file hero.js
 * Block: Hero — the big introduction at the top of a page.
 * Layouts: "split" (text beside a portrait), "centered", "minimal" (text only).
 */
import { html, cx } from '../../core/html.js';
import { buttons, BUTTON_FIELDS } from '../../core/ui.js';
import { renderSocials } from '../../layout/socials.js';

export default {
  type: 'hero',
  label: 'Hero',
  icon: 'sparkles',
  description: 'Big introduction with your name, a photo and buttons.',

  fields: [
    {
      key: 'layout',
      type: 'select',
      label: 'Layout',
      options: [
        { value: 'split', label: 'Photo beside text' },
        { value: 'centered', label: 'Centered' },
        { value: 'minimal', label: 'Text only' },
      ],
    },
    { key: 'badge', type: 'text', label: 'Status badge', placeholder: 'Open to aerospace software roles', help: 'Optional pill with a soft pulsing dot.' },
    { key: 'eyebrow', type: 'text', label: 'Small heading', placeholder: 'Hi, I’m' },
    { key: 'title', type: 'text', label: 'Headline', required: true, placeholder: 'Your name' },
    { key: 'subtitle', type: 'text', label: 'Subheading', placeholder: 'Computer Scientist' },
    { key: 'intro', type: 'markdown', label: 'Introduction', rows: 4 },
    { key: 'image', type: 'image', label: 'Photo', when: (v) => v.layout !== 'minimal' },
    { key: 'imageAlt', type: 'text', label: 'Photo description', help: 'Describes the photo for screen readers.', when: (v) => v.layout !== 'minimal' && v.image },
    { key: 'actions', type: 'list', label: 'Buttons', fields: BUTTON_FIELDS, itemLabel: 'label', addLabel: 'Add button' },
    { key: 'showSocials', type: 'toggle', label: 'Show social links' },
  ],

  defaults: () => ({ layout: 'split', title: '', actions: [], showSocials: true }),

  render(p, ctx) {
    const layout = p.layout || 'split';
    const hasImage = layout !== 'minimal' && p.image;
    return html`<div class="${cx('container hero', `hero--${layout}`, hasImage && 'hero--has-media')}">
      <div class="hero__content" data-reveal>
        ${p.badge ? html`<p class="hero__badge"><span class="pulse-dot" aria-hidden="true"></span>${p.badge}</p>` : ''}
        ${p.eyebrow ? html`<p class="eyebrow hero__eyebrow">${p.eyebrow}</p>` : ''}
        <h1 class="hero__title">${p.title || ctx.site.title}</h1>
        ${p.subtitle ? html`<p class="hero__subtitle">${p.subtitle}</p>` : ''}
        ${p.intro ? html`<div class="hero__intro prose">${ctx.md(p.intro)}</div>` : ''}
        ${buttons(p.actions, ctx, 'button-row hero__actions')}
        ${p.showSocials ? renderSocials(ctx.site.socials, ctx, { className: 'socials hero__socials', size: 20 }) : ''}
      </div>
      ${hasImage
        ? html`<div class="hero__media" data-reveal>
            <div class="portrait">
              <img src="${ctx.media(p.image)}" alt="${p.imageAlt || ''}" fetchpriority="high" decoding="async">
            </div>
            <div class="portrait__orbit" aria-hidden="true"><span></span></div>
            <div class="portrait__glow" aria-hidden="true"></div>
          </div>`
        : ''}
    </div>`;
  },
};
