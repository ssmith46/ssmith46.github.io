/**
 * @file fields/lists.js
 * Repeating fields:
 *   tags   short labels entered as chips (Enter or comma to add)
 *   lines  sentences, one input each (résumé bullet points)
 *   list   repeatable groups of sub-fields, each a collapsible card that can
 *          be reordered by dragging or with the arrow buttons
 */
import { h, icon, autosize } from '../lib/dom.js';
import { listItemLabel, defaultsFor } from '../../../engine/core/fields.js';
import { renderForm } from './form.js';

/* ── Tags ───────────────────────────────────────────── */

export const tags = {
  render: ({ field, value, set, id }) => {
    let list = Array.isArray(value) ? [...value] : [];
    const input = h('input.chips__input', { id, type: 'text', placeholder: list.length ? '' : field.placeholder || 'Type and press Enter' });
    const root = h('div.chips', { onclick: () => input.focus() });

    const commit = () => {
      const parts = input.value.split(',').map((s) => s.trim()).filter(Boolean);
      if (!parts.length) return;
      list.push(...parts.filter((p) => !list.includes(p)));
      input.value = '';
      set([...list]);
      draw();
    };
    const draw = () => {
      root.replaceChildren(
        ...list.map((t, i) =>
          h(
            'span.chip',
            t,
            h(
              'button.chip__remove',
              {
                type: 'button',
                'aria-label': `Remove ${t}`,
                onclick: (e) => {
                  e.stopPropagation();
                  list.splice(i, 1);
                  set([...list]);
                  draw();
                },
              },
              icon('x', 12),
            ),
          ),
        ),
        input,
      );
      input.placeholder = list.length ? '' : field.placeholder || 'Type and press Enter';
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        commit();
      } else if (e.key === 'Backspace' && !input.value && list.length) {
        list.pop();
        set([...list]);
        draw();
        input.focus();
      }
    });
    input.addEventListener('blur', commit);
    draw();
    return root;
  },
};

/* ── Lines ──────────────────────────────────────────── */

export const lines = {
  render: ({ field, value, set }) => {
    let list = Array.isArray(value) ? [...value] : [];
    const root = h('div.lines');
    const emit = () => set(list.filter((l) => l.trim() !== '').length ? [...list] : []);

    const draw = (focusIndex) => {
      root.replaceChildren(
        ...list.map((line, i) => {
          const ta = autosize(
            h('textarea.input.lines__input', {
              rows: 1,
              value: line,
              placeholder: field.placeholder || '',
              oninput: (e) => {
                list[i] = e.target.value;
                emit();
              },
              onkeydown: (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  list.splice(i + 1, 0, '');
                  draw(i + 1);
                }
              },
            }),
          );
          if (focusIndex === i) requestAnimationFrame(() => ta.focus());
          return h(
            'div.lines__row',
            h('span.lines__bullet', { 'aria-hidden': 'true' }),
            ta,
            h(
              'button.icon-btn.icon-btn--sm',
              {
                type: 'button',
                title: 'Remove',
                'aria-label': 'Remove line',
                onclick: () => {
                  list.splice(i, 1);
                  emit();
                  draw();
                },
              },
              icon('x', 14),
            ),
          );
        }),
        h(
          'button.btn.btn--sm.btn--ghost.lines__add',
          {
            type: 'button',
            onclick: () => {
              list.push('');
              draw(list.length - 1);
            },
          },
          icon('plus', 14),
          'Add line',
        ),
      );
    };
    draw();
    return root;
  },
};

/* ── List of groups ─────────────────────────────────── */

export const list = {
  ownLabel: true,
  render: ({ field, value, set, fctx }) => {
    const items = Array.isArray(value) ? value.map((v) => ({ ...v })) : [];
    const open = new Set();
    const container = h('div.list-field__items');
    const emit = () => set(items.map((i) => ({ ...i })));

    let dragFrom = null;

    const draw = () => {
      container.replaceChildren(
        ...items.map((item, index) => {
          const label = h('span.list-item__label', listItemLabel(field, item, index));
          const body = h('div.list-item__body', { hidden: !open.has(index) });
          if (open.has(index)) {
            body.append(
              renderForm(field.fields || [], item, {
                app: fctx.app,
                onChange: () => {
                  label.textContent = listItemLabel(field, item, index);
                  emit();
                },
              }),
            );
          }
          const move = (delta) => {
            const to = index + delta;
            if (to < 0 || to >= items.length) return;
            const [moved] = items.splice(index, 1);
            items.splice(to, 0, moved);
            const wasOpen = open.has(index);
            open.delete(index);
            if (wasOpen) open.add(to);
            emit();
            draw();
          };
          const card = h(
            'div.list-item',
            { class: open.has(index) ? 'is-open' : '', draggable: false },
            h(
              'div.list-item__head',
              h('span.drag-handle', { title: 'Drag to reorder', onpointerdown: () => (card.draggable = true) }, icon('grip', 16)),
              h(
                'button.list-item__toggle',
                {
                  type: 'button',
                  'aria-expanded': String(open.has(index)),
                  onclick: () => {
                    open.has(index) ? open.delete(index) : open.add(index);
                    draw();
                  },
                },
                label,
                icon(open.has(index) ? 'chevron-up' : 'chevron-down', 16),
              ),
              h('button.icon-btn.icon-btn--sm', { type: 'button', title: 'Move up', 'aria-label': 'Move up', disabled: index === 0, onclick: () => move(-1) }, icon('arrow-up', 14)),
              h('button.icon-btn.icon-btn--sm', { type: 'button', title: 'Move down', 'aria-label': 'Move down', disabled: index === items.length - 1, onclick: () => move(1) }, icon('arrow-down', 14)),
              h(
                'button.icon-btn.icon-btn--sm.icon-btn--danger',
                {
                  type: 'button',
                  title: 'Remove',
                  'aria-label': 'Remove',
                  onclick: () => {
                    items.splice(index, 1);
                    open.clear();
                    emit();
                    draw();
                  },
                },
                icon('trash', 14),
              ),
            ),
            body,
          );
          // Drag-to-reorder (desktop); the arrow buttons cover touch + keyboard.
          card.addEventListener('dragstart', (e) => {
            dragFrom = index;
            card.classList.add('is-dragging');
            e.dataTransfer.effectAllowed = 'move';
          });
          card.addEventListener('dragend', () => {
            card.draggable = false;
            card.classList.remove('is-dragging');
          });
          card.addEventListener('dragover', (e) => {
            if (dragFrom === null) return;
            e.preventDefault();
            card.classList.add('is-drop-target');
          });
          card.addEventListener('dragleave', () => card.classList.remove('is-drop-target'));
          card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('is-drop-target');
            if (dragFrom === null || dragFrom === index) return;
            const [moved] = items.splice(dragFrom, 1);
            items.splice(index, 0, moved);
            dragFrom = null;
            open.clear();
            emit();
            draw();
          });
          return card;
        }),
      );
    };

    const add = h(
      'button.btn.btn--sm.list-field__add',
      {
        type: 'button',
        onclick: () => {
          items.push(defaultsFor(field.fields));
          open.clear();
          open.add(items.length - 1);
          emit();
          draw();
        },
      },
      icon('plus', 14),
      field.addLabel || 'Add item',
    );

    draw();
    return h('div.list-field', h('div.field__label', field.label), container, add);
  },
};
