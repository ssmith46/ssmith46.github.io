/**
 * @file fields/basic.js
 * Simple field types: text, url, textarea, number, date, color, toggle,
 * select, collection and icon.
 *
 * Every renderer receives { field, value, set, id, fctx } and returns the
 * control element. Call set(newValue) on every edit.
 */
import { h, icon, autosize } from '../lib/dom.js';
import { modal, segmented } from '../lib/ui.js';
import { ICON_NAMES } from '../../../engine/core/icons.js';
import { slugify } from '../../../engine/core/utils.js';

export const text = {
  render: ({ field, value, set, id }) =>
    h('input.input', { id, type: 'text', value: value ?? '', placeholder: field.placeholder || '', oninput: (e) => set(e.target.value) }),
};

/** Web-address segment: cleaned up (lowercase, dashes) when you leave the field. */
export const slug = {
  render: ({ field, value, set, id }) => {
    const input = h('input.input', {
      id,
      type: 'text',
      value: value ?? '',
      placeholder: field.placeholder || 'my-page',
      oninput: (e) => set(e.target.value),
      onblur: (e) => {
        const clean = slugify(e.target.value);
        if (clean !== e.target.value) {
          e.target.value = clean;
          set(clean);
        }
      },
    });
    return field.prefix ? h('div.input-affix.input-affix--prefix', h('span.input-affix__text', field.prefix), input) : input;
  },
};

export const url = {
  render: ({ field, value, set, id }) =>
    h('input.input', { id, type: 'url', value: value ?? '', placeholder: field.placeholder || 'https://', oninput: (e) => set(e.target.value.trim()) }),
};

export const textarea = {
  render: ({ field, value, set, id }) =>
    autosize(h('textarea.input', { id, rows: field.rows || 3, value: value ?? '', placeholder: field.placeholder || '', oninput: (e) => set(e.target.value) })),
};

export const number = {
  render: ({ field, value, set, id }) =>
    h(
      'div.input-affix',
      h('input.input', {
        id,
        type: 'number',
        value: value ?? '',
        min: field.min,
        max: field.max,
        step: field.step ?? 'any',
        placeholder: field.placeholder || '',
        oninput: (e) => set(e.target.value === '' ? null : Number(e.target.value)),
      }),
      field.suffix && h('span.input-affix__text', field.suffix),
    ),
};

export const date = {
  render: ({ field, value, set, id }) => {
    const input = h('input.input', {
      id,
      type: field.precision === 'day' ? 'date' : 'month',
      value: value ?? '',
      oninput: (e) => {
        set(e.target.value);
        clear.hidden = !e.target.value;
      },
    });
    const clear = h(
      'button.input-clear',
      {
        type: 'button',
        title: 'Clear',
        'aria-label': 'Clear date',
        hidden: !value,
        onclick: () => {
          input.value = '';
          clear.hidden = true;
          set('');
        },
      },
      icon('x', 14),
    );
    return h('div.input-wrap', input, clear);
  },
};

export const color = {
  render: ({ value, set, id }) => {
    const hex = h('input.input.input--mono', { type: 'text', value: value || '', placeholder: '#c8641e', maxLength: 7 });
    const picker = h('input.color-swatch', { id, type: 'color', value: /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#c8641e' });
    picker.addEventListener('input', () => {
      hex.value = picker.value;
      set(picker.value);
    });
    hex.addEventListener('input', () => {
      if (/^#[0-9a-f]{6}$/i.test(hex.value)) picker.value = hex.value;
      set(hex.value.trim());
    });
    return h('div.color-field', picker, hex);
  },
};

export const toggle = {
  ownLabel: true,
  render: ({ field, value, set, id }) =>
    h(
      'label.switch',
      { htmlFor: id },
      h('input', { id, type: 'checkbox', checked: Boolean(value), onchange: (e) => set(e.target.checked) }),
      h('span.switch__track', h('span.switch__thumb')),
      h('span.switch__label', field.label),
    ),
};

/** Resolve options, including dynamic ones (e.g. layouts of the chosen collection). */
function optionsFor(field, fctx) {
  if (field.optionsFrom === 'collectionLayouts') {
    const type = fctx.app.collectionType(fctx.values.collection);
    return Object.entries(type?.layouts || {}).map(([value, l]) => ({ value, label: l.label }));
  }
  return field.options || [];
}

export const select = {
  render: ({ field, value, set, id, fctx }) => {
    const wrap = h('div.select-host');
    const draw = () => {
      const options = optionsFor(field, fctx);
      const current = options.some((o) => o.value === value) ? value : options[0]?.value;
      const compact = options.length <= 3 && options.reduce((n, o) => n + o.label.length, 0) <= 30;
      if (compact && options.length) {
        wrap.replaceChildren(segmented(options, current, (v) => ((value = v), set(v)), { label: field.label }));
      } else {
        const el = h(
          'select.input.select',
          { id, onchange: (e) => ((value = e.target.value), set(e.target.value)) },
          options.length ? options.map((o) => h('option', { value: o.value }, o.label)) : h('option', { value: '' }, '—'),
        );
        el.value = current ?? '';
        wrap.replaceChildren(el);
      }
    };
    draw();
    if (field.optionsFrom) {
      let last = fctx.values.collection;
      fctx.onFormChange((values) => {
        if (values.collection !== last) {
          last = values.collection;
          value = undefined;
          draw();
          const first = optionsFor(field, fctx)[0]?.value;
          if (first) set(first);
        }
      });
    }
    return wrap;
  },
};

export const collection = {
  render: ({ value, set, id, fctx }) => {
    const list = fctx.app.site.collections || [];
    const el = h(
      'select.input.select',
      { id, onchange: (e) => set(e.target.value) },
      h('option', { value: '' }, 'Choose a collection…'),
      list.map((c) => h('option', { value: c.id }, c.label || c.id)),
    );
    el.value = value || '';
    return el;
  },
};

export const iconField = {
  render: ({ value, set, id }) => {
    const button = h('button.btn.btn--field', { id, type: 'button' });
    const draw = (v) => button.replaceChildren(...(v ? [icon(v, 16), h('span', v)] : [h('span.muted', 'Automatic')]), icon('chevron-down', 14));
    draw(value);
    button.addEventListener('click', async () => {
      const chosen = await pickIcon(value);
      if (chosen === undefined) return;
      value = chosen;
      draw(chosen);
      set(chosen);
    });
    return button;
  },
};

/** Icon chooser dialog. Resolves with a name, '' for none, or undefined. */
function pickIcon(current) {
  return modal({
    title: 'Choose an icon',
    size: 'md',
    render: (close) => {
      const grid = h('div.icon-grid');
      const search = h('input.input', { type: 'search', placeholder: 'Search icons…', autofocus: true });
      const draw = () => {
        const q = search.value.trim().toLowerCase();
        grid.replaceChildren(
          h('button.icon-grid__item', { type: 'button', class: !current ? 'is-selected' : '', onclick: () => close('') }, h('span.muted', 'None'), h('span.icon-grid__name', 'automatic')),
          ...ICON_NAMES.filter((n) => n.includes(q)).map((n) =>
            h('button.icon-grid__item', { type: 'button', title: n, class: n === current ? 'is-selected' : '', onclick: () => close(n) }, icon(n, 20), h('span.icon-grid__name', n)),
          ),
        );
      };
      search.addEventListener('input', draw);
      draw();
      return [search, grid];
    },
  });
}
