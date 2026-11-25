/**
 * @file lib/dom.js
 * A tiny element builder so admin views read like markup without a framework.
 *
 *   h('button.btn.btn--primary', { onclick: save, disabled: busy }, icon('check'), 'Save')
 *
 * - Tag strings accept ".class" suffixes (and "#id").
 * - Props: `class`, `style` (string or object), `dataset`, `on*` listeners,
 *   `attrs` for raw attributes; anything else is set as a property or attribute.
 * - Children may be nodes, strings, numbers, arrays, or null/false (skipped).
 */
import { icon as iconHtml } from '../../../engine/core/icons.js';

export function h(tag, props, ...children) {
  if (props instanceof Node || typeof props !== 'object' || props === null || Array.isArray(props)) {
    children.unshift(props);
    props = {};
  }
  const [, name = 'div', rest = ''] = tag.match(/^([a-z0-9-]*)(.*)$/i);
  const el = name === 'svg' ? document.createElementNS('http://www.w3.org/2000/svg', 'svg') : document.createElement(name || 'div');
  for (const part of rest.match(/[.#][^.#]+/g) || []) {
    if (part[0] === '.') el.classList.add(part.slice(1));
    else el.id = part.slice(1);
  }

  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') String(value).split(/\s+/).filter(Boolean).forEach((c) => el.classList.add(c));
    else if (key === 'style') typeof value === 'string' ? (el.style.cssText = value) : Object.assign(el.style, value);
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key === 'attrs') for (const [a, v] of Object.entries(value)) v != null && v !== false && el.setAttribute(a, v === true ? '' : v);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'ref' && typeof value === 'function') value(el);
    else if (key in el && !key.includes('-')) el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }

  append(el, children);
  return el;
}

/** Append children (flattening arrays, skipping empties). */
export function append(el, children) {
  for (const child of [children].flat(Infinity)) {
    if (child == null || child === false || child === true) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

/** Replace an element's children. */
export function replace(el, ...children) {
  el.replaceChildren();
  return append(el, children);
}

/** Inline SVG icon element (shares the public site's icon set). */
export function icon(name, size = 18) {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(iconHtml(name, { size })).trim();
  return tpl.content.firstElementChild;
}

/** Parse trusted HTML into a fragment (used for Markdown previews). */
export function fragment(htmlString) {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(htmlString);
  return tpl.content;
}

/** Debounce a function. */
export function debounce(fn, ms = 200) {
  let t;
  const wrapped = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  wrapped.flush = (...args) => {
    clearTimeout(t);
    fn(...args);
  };
  return wrapped;
}

/** Auto-grow a textarea to fit its content. */
export function autosize(textarea) {
  const fit = () => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + 2}px`;
  };
  textarea.addEventListener('input', fit);
  requestAnimationFrame(fit);
  return textarea;
}
