/**
 * @file lib/ui.js
 * Shared admin UI primitives: toasts, modal dialogs, confirm/prompt and
 * dropdown menus. Built on the native <dialog> element for accessibility.
 */
import { h, icon } from './dom.js';

/* ── Toasts ─────────────────────────────────────────── */

let toastRoot;

/**
 * Show a short message in the corner.
 * @param {string} message
 * @param {{ type?: 'info'|'success'|'error', action?: { label: string, run: () => void }, timeout?: number }} [opts]
 */
export function toast(message, { type = 'info', action, timeout = 4200 } = {}) {
  toastRoot ??= document.body.appendChild(h('div.toasts', { attrs: { role: 'status', 'aria-live': 'polite' } }));
  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
  const el = h(
    `div.toast.toast--${type}`,
    icon(iconName, 18),
    h('span.toast__msg', message),
    action && h('button.toast__action', { type: 'button', onclick: () => (action.run(), close()) }, action.label),
    h('button.toast__close', { type: 'button', 'aria-label': 'Dismiss', onclick: () => close() }, icon('x', 16)),
  );
  const close = () => {
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 220);
  };
  toastRoot.append(el);
  if (timeout) setTimeout(close, timeout);
  return close;
}

/* ── Modal dialogs ──────────────────────────────────── */

/**
 * Open a modal. `render(close)` returns the dialog body.
 * Resolves with whatever value is passed to close(value).
 * @param {{ title?: string, size?: 'sm'|'md'|'lg', render: (close: (v?: any) => void) => Node|Node[] }} opts
 */
export function modal({ title, size = 'md', render, className = '' }) {
  return new Promise((resolve) => {
    let result;
    const dialog = h(`dialog.modal.modal--${size}`, { class: className });
    const close = (value) => {
      result = value;
      dialog.close();
    };
    dialog.append(
      h(
        'div.modal__panel',
        title && h('header.modal__header', h('h2.modal__title', title), h('button.icon-btn', { type: 'button', 'aria-label': 'Close', onclick: () => close() }, icon('x'))),
        h('div.modal__body', render(close)),
      ),
    );
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(result);
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) close();
    });
    document.body.append(dialog);
    dialog.showModal();
    dialog.querySelector('[autofocus]')?.focus();
  });
}

/**
 * Ask a yes/no question. Resolves true when confirmed.
 * @param {{ title: string, message?: string, confirmLabel?: string, danger?: boolean }} opts
 */
export function confirm({ title, message = '', confirmLabel = 'Confirm', danger = false }) {
  return modal({
    size: 'sm',
    render: (close) => [
      h('div.confirm', h('h2.confirm__title', title), message && h('p.confirm__message', message)),
      h(
        'div.modal__actions',
        h('button.btn', { type: 'button', onclick: () => close(false) }, 'Cancel'),
        h(`button.btn.${danger ? 'btn--danger' : 'btn--primary'}`, { type: 'button', autofocus: true, onclick: () => close(true) }, confirmLabel),
      ),
    ],
  }).then(Boolean);
}

/**
 * Ask for a line of text. Resolves with the text, or undefined if cancelled.
 * @param {{ title: string, label?: string, value?: string, placeholder?: string, confirmLabel?: string, help?: string, validate?: (v: string) => string|null }} opts
 */
export function prompt({ title, label = '', value = '', placeholder = '', confirmLabel = 'Create', help = '', validate }) {
  return modal({
    size: 'sm',
    title,
    render: (close) => {
      const input = h('input.input', { type: 'text', value, placeholder, autofocus: true });
      const error = h('p.field__error', { hidden: true });
      const submit = (e) => {
        e.preventDefault();
        const v = input.value.trim();
        const problem = !v ? 'Please enter something.' : validate?.(v);
        if (problem) {
          error.textContent = problem;
          error.hidden = false;
          return;
        }
        close(v);
      };
      return h(
        'form',
        { onsubmit: submit },
        h('label.field', label && h('span.field__label', label), input, help && h('span.field__help', help), error),
        h(
          'div.modal__actions',
          h('button.btn', { type: 'button', onclick: () => close() }, 'Cancel'),
          h('button.btn.btn--primary', { type: 'submit' }, confirmLabel),
        ),
      );
    },
  });
}

/* ── Dropdown menu ──────────────────────────────────── */

/**
 * Show a small menu anchored to a button.
 * @param {HTMLElement} anchor
 * @param {Array<{ label: string, icon?: string, run: () => void, danger?: boolean, disabled?: boolean } | '-'>} items
 */
export function menu(anchor, items) {
  document.querySelector('.menu')?.remove();
  const list = h(
    'div.menu',
    { attrs: { role: 'menu' } },
    items.map((item) =>
      item === '-'
        ? h('div.menu__sep')
        : h(
            'button.menu__item',
            {
              type: 'button',
              class: item.danger ? 'is-danger' : '',
              disabled: item.disabled,
              attrs: { role: 'menuitem' },
              onclick: () => {
                cleanup();
                item.run();
              },
            },
            item.icon && icon(item.icon, 16),
            item.label,
          ),
    ),
  );
  document.body.append(list);
  const r = anchor.getBoundingClientRect();
  const w = list.offsetWidth;
  list.style.top = `${Math.min(window.innerHeight - list.offsetHeight - 8, r.bottom + 6)}px`;
  list.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w))}px`;
  list.querySelector('button')?.focus();

  const onDoc = (e) => {
    if (!list.contains(e.target) && e.target !== anchor) cleanup();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') cleanup();
  };
  function cleanup() {
    list.remove();
    document.removeEventListener('pointerdown', onDoc, true);
    document.removeEventListener('keydown', onKey);
  }
  setTimeout(() => {
    document.addEventListener('pointerdown', onDoc, true);
    document.addEventListener('keydown', onKey);
  });
}

/** A simple empty-state block. */
export function emptyState({ iconName = 'sparkles', title, text, action }) {
  return h('div.empty', h('div.empty__icon', icon(iconName, 22)), h('h3.empty__title', title), text && h('p.empty__text', text), action);
}

/** Segmented control (radio buttons styled as a pill group). */
export function segmented(options, value, onChange, { label = '' } = {}) {
  const group = h('div.segmented', { attrs: { role: 'radiogroup', 'aria-label': label } });
  const render = (current) => {
    group.replaceChildren(
      ...options.map((o) =>
        h(
          'button.segmented__option',
          {
            type: 'button',
            attrs: { role: 'radio', 'aria-checked': String(o.value === current) },
            onclick: () => {
              render(o.value);
              onChange(o.value);
            },
          },
          o.icon && icon(o.icon, 15),
          o.label,
        ),
      ),
    );
  };
  render(value);
  return group;
}
