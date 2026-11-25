/**
 * @file space.js
 * Block: Space scene — an interactive deep-space panel with a parallax
 * starfield and a sleek ship that follows the pointer. Press and hold to
 * engage warp. Animation lives in public/js/features/space.js; this file
 * only renders the markup (which also looks good without JavaScript).
 */
import { html, cx, raw } from '../../core/html.js';
import { buttons, BUTTON_FIELDS } from '../../core/ui.js';

export default {
  type: 'space',
  label: 'Space scene',
  icon: 'rocket',
  description: 'Interactive starfield with a ship — press and hold to warp.',

  fields: [
    { key: 'eyebrow', type: 'text', label: 'Small heading', placeholder: 'Mission' },
    { key: 'heading', type: 'text', label: 'Heading', placeholder: 'Building software that flies' },
    { key: 'text', type: 'markdown', label: 'Text', rows: 4 },
    { key: 'actions', type: 'list', label: 'Buttons', fields: BUTTON_FIELDS, itemLabel: 'label', addLabel: 'Add button' },
    {
      key: 'telemetry',
      type: 'list',
      label: 'Telemetry readouts',
      help: 'Small mono labels shown under the text, like a mission display.',
      itemLabel: (i) => [i.label, i.value].filter(Boolean).join(': '),
      addLabel: 'Add readout',
      fields: [
        { key: 'label', type: 'text', label: 'Label', placeholder: 'Status', width: 'half' },
        { key: 'value', type: 'text', label: 'Value', placeholder: 'Nominal', width: 'half' },
      ],
    },
    {
      key: 'height',
      type: 'select',
      label: 'Height',
      width: 'half',
      options: [
        { value: 'tall', label: 'Tall' },
        { value: 'medium', label: 'Medium' },
        { value: 'screen', label: 'Full screen' },
      ],
    },
    {
      key: 'align',
      type: 'select',
      label: 'Text position',
      width: 'half',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
      ],
    },
    { key: 'ship', type: 'toggle', label: 'Show the ship' },
    { key: 'warp', type: 'toggle', label: 'Press and hold to warp' },
  ],

  defaults: () => ({ height: 'tall', align: 'left', ship: true, warp: true, actions: [], telemetry: [] }),

  render(p, ctx, { index = 0 } = {}) {
    // Use <h1> when this scene opens a page that has no page header.
    const page = ctx.page;
    const lead = index === 0 && (!page || page.$id === 'home' || page.$id === '404' || page.showHeader === false);
    const tag = raw(lead ? 'h1' : 'h2');
    const telemetry = (p.telemetry || []).filter((t) => t.label || t.value);

    return html`<div class="${cx('space-scene', `space-scene--${p.height || 'tall'}`, `space-scene--${p.align || 'left'}`)}"
      data-feature="space" data-ship="${p.ship ? 'true' : 'false'}" data-warp="${p.warp ? 'true' : 'false'}">
      <canvas class="space-scene__canvas" aria-hidden="true"></canvas>
      <div class="space-scene__veil" aria-hidden="true"></div>
      <div class="container space-scene__content">
        ${p.eyebrow ? html`<p class="space-scene__eyebrow"><span class="space-scene__blip" aria-hidden="true"></span>${p.eyebrow}</p>` : ''}
        ${p.heading ? html`<${tag} class="space-scene__heading">${p.heading}</${tag}>` : ''}
        ${p.text ? html`<div class="prose space-scene__text">${ctx.md(p.text)}</div>` : ''}
        ${buttons(p.actions, ctx, 'button-row space-scene__actions')}
        ${telemetry.length
          ? html`<dl class="telemetry">${telemetry.map((t) => html`<div class="telemetry__item"><dt>${t.label}</dt><dd>${t.value}</dd></div>`)}</dl>`
          : ''}
      </div>
      ${p.warp ? html`<p class="space-scene__hint" aria-hidden="true">${ctx.icon('zap', { size: 14 })}<span>Press &amp; hold to warp</span></p>` : ''}
    </div>`;
  },
};
