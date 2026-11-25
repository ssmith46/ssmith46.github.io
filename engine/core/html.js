/**
 * @file html.js
 * Tiny, dependency-free HTML templating used by every renderer in the engine.
 *
 * Renderers return `SafeHtml` objects built with the `html` tagged template:
 *
 *   html`<h2 class="title">${item.title}</h2>`
 *
 * Every interpolated value is HTML-escaped unless it is already `SafeHtml`
 * (e.g. the result of another `html` call, `raw()` or the markdown renderer).
 * Arrays are flattened and joined, and `null`, `undefined`, `true` and `false`
 * render as nothing — which makes conditional markup easy:
 *
 *   html`${item.image && html`<img src="${ctx.media(item.image)}" alt="">`}`
 *
 * Works identically in Node (static build) and the browser (admin preview).
 */

/** Wrapper marking a string as trusted, already-escaped HTML. */
export class SafeHtml {
  /** @param {string} value */
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Escape a value for safe use in HTML text or a quoted attribute.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/**
 * Mark a string as trusted HTML. Only use for markup you generated yourself.
 * @param {unknown} value
 * @returns {SafeHtml}
 */
export function raw(value) {
  if (value instanceof SafeHtml) return value;
  return new SafeHtml(value == null ? '' : String(value));
}

/** Convert any interpolated value into an HTML string. */
function stringify(value) {
  if (value == null || value === false || value === true) return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(stringify).join('');
  return escapeHtml(value);
}

/**
 * Tagged template that escapes interpolations.
 * @returns {SafeHtml}
 */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += stringify(values[i]) + strings[i + 1];
  return new SafeHtml(out);
}

/**
 * Build an attribute string from an object. `false`/`null`/`undefined` values
 * are skipped and `true` renders a boolean attribute.
 *
 *   html`<a${attrs({ href: url, target: external && '_blank' })}>`
 *
 * @param {Record<string, unknown>} map
 * @returns {SafeHtml}
 */
export function attrs(map) {
  const parts = [];
  for (const [key, value] of Object.entries(map)) {
    if (value == null || value === false || value === '') continue;
    parts.push(value === true ? key : `${key}="${escapeHtml(value)}"`);
  }
  return raw(parts.length ? ` ${parts.join(' ')}` : '');
}

/**
 * Join class names, ignoring falsy values. Accepts nested arrays.
 * @param {...unknown} names
 * @returns {string}
 */
export function cx(...names) {
  return names.flat(Infinity).filter(Boolean).join(' ');
}

/**
 * Render a list with a renderer, returning nothing for empty lists.
 * @template T
 * @param {T[] | undefined} list
 * @param {(item: T, index: number) => unknown} render
 */
export function each(list, render) {
  if (!Array.isArray(list) || list.length === 0) return '';
  return list.map(render);
}
