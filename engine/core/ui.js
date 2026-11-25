/**
 * @file ui.js
 * Small rendering primitives reused by many blocks and collection types
 * (buttons, tag chips, section headings). Keeping them here guarantees the
 * whole site shares one visual language.
 */
import { html, raw, attrs, cx } from './html.js';

/** Options shared by every "button" list field in block schemas. */
export const BUTTON_FIELDS = [
  { key: 'label', type: 'text', label: 'Label', placeholder: 'Download résumé' },
  { key: 'link', type: 'link', label: 'Link to' },
  {
    key: 'style',
    type: 'select',
    label: 'Style',
    options: [
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
      { value: 'ghost', label: 'Text only' },
    ],
  },
  { key: 'icon', type: 'icon', label: 'Icon' },
];

/**
 * Render one button/link.
 * @param {{ label: string, link: string, style?: string, icon?: string }} button
 * @param {object} ctx
 */
export function button(button, ctx) {
  if (!button?.label) return '';
  const href = ctx.link(button.link);
  const external = ctx.isExternal(button.link);
  const isFile = button.link === 'resume' || String(button.link || '').startsWith('media/');
  const iconName = button.icon || (isFile ? 'download' : external ? 'arrow-up-right' : '');
  return html`<a${attrs({
    class: cx('button', `button--${button.style || 'primary'}`),
    href,
    target: (external || isFile) && '_blank',
    rel: external && 'noopener noreferrer',
  })}><span>${button.label}</span>${iconName ? ctx.icon(iconName, { size: 18 }) : ''}</a>`;
}

/** Render a row of buttons. */
export function buttons(list, ctx, className = 'button-row') {
  const items = (list || []).filter((b) => b?.label);
  if (!items.length) return '';
  return html`<div class="${className}">${items.map((b) => button(b, ctx))}</div>`;
}

/** Render tag chips. */
export function tags(list, { className = 'tags', limit } = {}) {
  const items = (list || []).filter(Boolean);
  if (!items.length) return '';
  const shown = limit ? items.slice(0, limit) : items;
  const extra = limit && items.length > limit ? items.length - limit : 0;
  return html`<ul class="${className}">${shown.map((t) => html`<li class="tag">${t}</li>`)}${extra ? html`<li class="tag tag--more">+${extra}</li>` : ''}</ul>`;
}

/**
 * Standard section heading (eyebrow, heading, intro) used by most blocks.
 * @param {{ eyebrow?: string, heading?: string, intro?: string }} props
 */
export function sectionHeading(props, ctx, { align = 'left', level = 2 } = {}) {
  if (!props.heading && !props.eyebrow && !props.intro) return '';
  const tag = raw(level === 3 ? 'h3' : 'h2');
  return html`<div class="${cx('section-heading', align === 'center' && 'section-heading--center')}">
    ${props.eyebrow ? html`<p class="eyebrow">${props.eyebrow}</p>` : ''}
    ${props.heading ? html`<${tag} class="section-heading__title">${props.heading}</${tag}>` : ''}
    ${props.intro ? html`<div class="section-heading__intro prose">${ctx.md(props.intro)}</div>` : ''}
  </div>`;
}
