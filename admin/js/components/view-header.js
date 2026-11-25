/**
 * @file components/view-header.js
 * Consistent title bar at the top of every admin screen.
 */
import { h, icon } from '../lib/dom.js';

/**
 * @param {{ title: string|Node, subtitle?: string|Node, back?: { href: string, label: string }, actions?: Node[], badge?: Node }} opts
 */
export function viewHeader({ title, subtitle, back, actions = [], badge }) {
  return h(
    'header.view-header',
    h(
      'div.view-header__text',
      back && h('a.view-header__back', { href: back.href }, icon('arrow-left', 14), back.label),
      h('h1.view-header__title', title, badge),
      subtitle && h('p.view-header__subtitle', subtitle),
    ),
    actions.length ? h('div.view-header__actions', actions) : null,
  );
}
