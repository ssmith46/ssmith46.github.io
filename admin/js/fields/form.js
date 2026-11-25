/**
 * @file fields/form.js
 * Turns a list of field definitions (see engine/core/fields.js) into a form.
 *
 *   const form = renderForm(type.fields, item, { app, onChange: () => save(item) });
 *
 * The form edits `values` in place and calls `onChange` after every edit.
 * Field types are looked up in fields/index.js, so new types plug in there.
 */
import { h } from '../lib/dom.js';
import { FIELD_RENDERERS } from './index.js';

let uid = 0;

/** True for values that should be removed from JSON rather than stored. */
const isEmpty = (v) => v === '' || v === null || v === undefined;

/**
 * @param {object[]} fields
 * @param {object} values the object being edited (mutated in place)
 * @param {{ app: object, onChange?: (values: object) => void }} options
 * @returns {HTMLElement}
 */
export function renderForm(fields, values, { app, onChange }) {
  const listeners = new Set();
  const rows = [];
  const fctx = {
    app,
    values,
    /** Let a field react to edits elsewhere in the same form. */
    onFormChange: (fn) => listeners.add(fn),
  };

  const updateVisibility = () => {
    for (const { field, wrap } of rows) {
      wrap.hidden = typeof field.when === 'function' ? !field.when(values) : false;
    }
  };

  const changed = () => {
    updateVisibility();
    listeners.forEach((fn) => fn(values));
    onChange?.(values);
  };

  const main = h('div.form-grid');
  const groups = new Map();

  for (const field of fields) {
    const wrap = renderField(field, values, changed, fctx);
    rows.push({ field, wrap });
    if (field.group) {
      if (!groups.has(field.group)) groups.set(field.group, h('div.form-grid'));
      groups.get(field.group).append(wrap);
    } else {
      main.append(wrap);
    }
  }

  updateVisibility();
  return h(
    'div.form',
    main,
    [...groups].map(([label, grid]) => h('details.form-group', h('summary.form-group__summary', label), grid)),
  );
}

/** Render one field with its label, help text and control. */
export function renderField(field, values, changed, fctx) {
  const renderer = FIELD_RENDERERS[field.type] || FIELD_RENDERERS.text;
  const id = `f${++uid}`;
  const set = (value) => {
    if (isEmpty(value)) delete values[field.key];
    else values[field.key] = value;
    changed();
  };
  const control = renderer.render({ field, value: values[field.key], set, id, fctx });

  const cls = ['field', `field--${field.type}`, field.width === 'half' ? 'field--half' : ''].filter(Boolean).join(' ');
  if (renderer.ownLabel) return h('div', { class: cls }, control, field.help && h('p.field__help', field.help));

  return h(
    'div',
    { class: cls },
    field.label && h('label.field__label', { htmlFor: id }, field.label, field.required && h('span.field__req', { title: 'Required' }, ' *')),
    control,
    field.help && h('p.field__help', field.help),
  );
}
