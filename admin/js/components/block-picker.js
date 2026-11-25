/**
 * @file components/block-picker.js
 * "Add a section" dialog listing every block in the engine registry.
 */
import { h, icon } from '../lib/dom.js';
import { modal } from '../lib/ui.js';

/** Resolves with a block type, or undefined. */
export function pickBlock(app) {
  return modal({
    title: 'Add a section',
    size: 'lg',
    render: (close) =>
      h(
        'div.block-grid',
        [...app.registry.blocks.values()].map((mod) =>
          h(
            'button.block-option',
            { type: 'button', onclick: () => close(mod.type) },
            h('span.block-option__icon', icon(mod.icon || 'layers', 22)),
            h('span.block-option__text', h('strong', mod.label), h('small', mod.description || '')),
          ),
        ),
      ),
  });
}
