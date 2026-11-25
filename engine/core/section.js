/**
 * @file section.js
 * Every block on a page is wrapped in a <section>. The wrapper owns the
 * settings that are common to *all* blocks (background, spacing, anchor,
 * visibility) so individual blocks never re-implement them.
 */
import { html, attrs, cx } from './html.js';

/** Fields appended to every block's own fields in the admin ("Section style"). */
export const SECTION_FIELDS = [
  {
    key: 'background',
    type: 'select',
    label: 'Background',
    group: 'Section style',
    options: [
      { value: 'none', label: 'None' },
      { value: 'subtle', label: 'Subtle tint' },
      { value: 'accent', label: 'Accent wash' },
    ],
  },
  {
    key: 'spacing',
    type: 'select',
    label: 'Spacing',
    group: 'Section style',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'compact', label: 'Compact' },
      { value: 'spacious', label: 'Spacious' },
      { value: 'flush', label: 'None' },
    ],
  },
  { key: 'anchor', type: 'text', label: 'Anchor name', group: 'Section style', placeholder: 'e.g. contact', help: 'Link to this section with #anchor-name.' },
  { key: 'hidden', type: 'toggle', label: 'Hide this section', group: 'Section style' },
];

/**
 * Wrap rendered block markup in its section element.
 * @param {object} block the stored block data
 * @param {import('./html.js').SafeHtml|string} inner rendered block
 */
export function wrapSection(block, inner, { index = 0 } = {}) {
  return html`<section${attrs({
    class: cx(
      'section',
      `section--${block.type}`,
      block.background && block.background !== 'none' && `section--bg-${block.background}`,
      block.spacing && block.spacing !== 'normal' && `section--pad-${block.spacing}`,
    ),
    id: block.anchor || (block.id ? `section-${block.id}` : `section-${index + 1}`),
    'data-section-id': block.id,
  })}>${inner}</section>`;
}
