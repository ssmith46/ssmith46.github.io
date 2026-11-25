/**
 * @file text.js
 * Block: Text — a heading plus rich text. The workhorse for write-ups,
 * "about me" paragraphs and anything else that's mostly words.
 */
import { html, cx } from '../../core/html.js';

export default {
  type: 'text',
  label: 'Text',
  icon: 'type',
  description: 'A heading with paragraphs, lists, links and images.',

  fields: [
    { key: 'eyebrow', type: 'text', label: 'Small heading' },
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'body', type: 'markdown', label: 'Text', rows: 10 },
    {
      key: 'width',
      type: 'select',
      label: 'Width',
      width: 'half',
      options: [
        { value: 'narrow', label: 'Comfortable' },
        { value: 'wide', label: 'Wide' },
      ],
    },
    {
      key: 'align',
      type: 'select',
      label: 'Alignment',
      width: 'half',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
      ],
    },
  ],

  defaults: () => ({ heading: '', body: '', width: 'narrow', align: 'left' }),

  render(p, ctx) {
    return html`<div class="${cx('container text-block', `text-block--${p.width}`, `text-block--${p.align}`)}" data-reveal>
      ${p.eyebrow ? html`<p class="eyebrow">${p.eyebrow}</p>` : ''}
      ${p.heading ? html`<h2 class="text-block__heading">${p.heading}</h2>` : ''}
      ${p.body ? html`<div class="prose">${ctx.md(p.body)}</div>` : ''}
    </div>`;
  },
};
