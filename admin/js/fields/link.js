/**
 * @file fields/link.js
 * "Link to…" field. Lets people point a button or menu item at a page, a
 * project, their résumé, an uploaded file, a web address or an email —
 * without knowing any URL syntax. Stored as a reference string understood by
 * engine/core/context.js → resolveLink():
 *   "page:about" · "item:projects/ship-cnn" · "resume" · "media/x.pdf" ·
 *   "https://…" · "mailto:…"
 */
import { h, icon } from '../lib/dom.js';
import { openMediaPicker } from '../components/media.js';

const KINDS = [
  { value: 'page', label: 'A page' },
  { value: 'item', label: 'A project or post' },
  { value: 'resume', label: 'My résumé' },
  { value: 'file', label: 'An uploaded file' },
  { value: 'url', label: 'Web address' },
  { value: 'email', label: 'Email address' },
];

/** Work out which kind of link a stored value is. */
export function linkKind(value = '') {
  if (!value) return 'page';
  if (value.startsWith('page:')) return 'page';
  if (value.startsWith('item:')) return 'item';
  if (value === 'resume') return 'resume';
  if (value.startsWith('media/')) return 'file';
  if (value.startsWith('mailto:')) return 'email';
  return 'url';
}

export const link = {
  render: ({ value, set, id, fctx }) => {
    const { app } = fctx;
    let kind = linkKind(value);
    const detail = h('div.link-field__detail');

    const kindSelect = h(
      'select.input.select',
      {
        id,
        onchange: (e) => {
          kind = e.target.value;
          value = kind === 'resume' ? 'resume' : '';
          set(value);
          drawDetail();
        },
      },
      KINDS.map((k) => h('option', { value: k.value }, k.label)),
    );
    kindSelect.value = kind;

    const drawDetail = () => {
      const bundle = app.bundle;
      if (kind === 'page') {
        const sel = h(
          'select.input.select',
          { onchange: (e) => set((value = e.target.value ? `page:${e.target.value}` : '')) },
          h('option', { value: '' }, 'Choose a page…'),
          Object.values(bundle.pages)
            .filter((p) => p.$id !== '404')
            .sort((a, b) => (a.$id === 'home' ? -1 : b.$id === 'home' ? 1 : String(a.title).localeCompare(String(b.title))))
            .map((p) => h('option', { value: p.$id }, p.title || p.$id)),
        );
        sel.value = value?.startsWith('page:') ? value.slice(5) : '';
        detail.replaceChildren(sel);
      } else if (kind === 'item') {
        const groups = bundle.site.collections
          .filter((c) => app.registry.collections.get(c.type)?.detailPage)
          .map((c) => {
            const type = app.registry.collections.get(c.type);
            const items = Object.values(bundle.collections[c.id] || {});
            return h('optgroup', { label: c.label || c.id }, items.map((it) => h('option', { value: `${c.id}/${it.$id}` }, type.titleOf?.(it) || it.$id)));
          });
        const sel = h('select.input.select', { onchange: (e) => set((value = e.target.value ? `item:${e.target.value}` : '')) }, h('option', { value: '' }, 'Choose…'), groups);
        sel.value = value?.startsWith('item:') ? value.slice(5) : '';
        detail.replaceChildren(sel);
      } else if (kind === 'resume') {
        detail.replaceChildren(
          h('p.link-field__note', icon('check-circle', 14), app.site.resume ? 'Always opens your current résumé.' : 'Upload your résumé in Settings to activate this link.'),
        );
      } else if (kind === 'file') {
        const btn = h(
          'button.btn.btn--field',
          {
            type: 'button',
            onclick: async () => {
              const ref = await openMediaPicker(app, { kind: 'file' });
              if (ref) {
                value = ref;
                set(ref);
                drawDetail();
              }
            },
          },
          icon('file', 16),
          h('span', value?.startsWith('media/') ? value.split('/').pop() : 'Choose a file…'),
        );
        detail.replaceChildren(btn);
      } else if (kind === 'email') {
        detail.replaceChildren(
          h('input.input', {
            type: 'email',
            placeholder: 'you@example.com',
            value: value?.replace(/^mailto:/, '') || '',
            oninput: (e) => set((value = e.target.value.trim() ? `mailto:${e.target.value.trim()}` : '')),
          }),
        );
      } else {
        detail.replaceChildren(
          h('input.input', {
            type: 'url',
            placeholder: 'https://…',
            value: value || '',
            oninput: (e) => set((value = e.target.value.trim())),
          }),
        );
      }
    };
    drawDetail();
    return h('div.link-field', kindSelect, detail);
  },
};
