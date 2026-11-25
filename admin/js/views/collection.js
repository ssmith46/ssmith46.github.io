/**
 * @file views/collection.js
 * List of items in a collection (projects, experience, write-ups…) with
 * search, sorting and drag-to-reorder when the collection is manually sorted.
 */
import { h, icon, replace } from '../lib/dom.js';
import { viewHeader } from '../components/view-header.js';
import { emptyState } from '../lib/ui.js';
import { mediaThumb } from '../components/media.js';
import { getItems } from '../../../engine/core/context.js';
import { defaultsFor } from '../../../engine/core/fields.js';
import { slugify } from '../../../engine/core/utils.js';
import { coverArt } from '../../../engine/core/artwork.js';

/** Create a new item (draft) in a collection and open it. */
export async function createItem(app, collectionId) {
  const config = app.collectionConfig(collectionId);
  const type = app.collectionType(collectionId);
  if (!type) return;
  const titleField = type.fields.find((f) => f.type === 'text' && f.required) || type.fields.find((f) => f.type === 'text');
  const label = await app.prompt({
    title: `New ${type.label.toLowerCase()}`,
    label: titleField?.label || 'Title',
    placeholder: titleField?.placeholder || '',
  });
  if (!label) return;

  let id = slugify(label) || 'item';
  if (type.fields.some((f) => f.key === 'date' && f.precision === 'day')) id = `${new Date().toISOString().slice(0, 10)}-${id}`;
  const base = id;
  for (let i = 2; app.ws.exists(app.paths.item(collectionId, id)); i++) id = `${base}-${i}`;

  const item = { ...defaultsFor(type.fields), ...(type.defaults ? type.defaults() : {}) };
  if (titleField) item[titleField.key] = label;
  app.ws.writeJson(app.paths.item(collectionId, id), item);

  // New items go to the top of manually-sorted collections.
  if ((config.sort || type.defaultSort) === 'manual') {
    app.updateSite((s) => {
      const c = s.collections.find((x) => x.id === collectionId);
      c.order = [id, ...(c.order || []).filter((x) => x !== id)];
    });
  }
  app.go('c', collectionId, id);
}

const SORTS = [
  { value: 'manual', label: 'Custom order' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'A–Z' },
];

export default {
  render(el, app) {
    const collectionId = app.route.id;
    const config = app.collectionConfig(collectionId);
    const type = app.collectionType(collectionId);
    if (!config || !type) {
      el.append(viewHeader({ title: 'Collection not found' }));
      return;
    }

    let query = '';
    const sort = config.sort || type.defaultSort || 'newest';
    const listHost = h('div.rows');

    const setSort = (value) =>
      app.updateSite((s) => {
        const c = s.collections.find((x) => x.id === collectionId);
        c.sort = value;
        if (value === 'manual' && !c.order?.length) c.order = getItems(app.bundle, app.registry, collectionId, { includeHidden: true }).map((i) => i.$id);
      });

    const reorder = (from, to) =>
      app.updateSite((s) => {
        const c = s.collections.find((x) => x.id === collectionId);
        const ids = getItems(app.bundle, app.registry, collectionId, { includeHidden: true }).map((i) => i.$id);
        ids.splice(to, 0, ids.splice(from, 1)[0]);
        c.order = ids;
      });

    const draw = () => {
      const all = getItems(app.bundle, app.registry, collectionId, { includeHidden: true });
      const q = query.toLowerCase();
      const items = q ? all.filter((i) => JSON.stringify(i).toLowerCase().includes(q)) : all;
      const manual = (app.collectionConfig(collectionId)?.sort || type.defaultSort) === 'manual' && !q;

      if (!all.length) {
        listHost.replaceChildren(
          emptyState({
            iconName: type.icon,
            title: `No ${type.plural.toLowerCase()} yet`,
            text: type.description,
            action: h('button.btn.btn--primary', { type: 'button', onclick: () => createItem(app, collectionId) }, icon('plus', 16), `New ${type.label.toLowerCase()}`),
          }),
        );
        return;
      }

      let dragFrom = null;
      replace(
        listHost,
        ...items.map((item, index) => {
          const image = type.imageOf?.(item);
          const dirty = app.ws.isDirty(app.paths.item(collectionId, item.$id));
          const row = h(
            'a.row',
            { href: app.href('c', collectionId, item.$id), class: item.hidden ? 'is-muted' : '' },
            manual && h('span.drag-handle', { title: 'Drag to reorder', onclick: (e) => e.preventDefault(), onpointerdown: () => (row.draggable = true) }, icon('grip', 16)),
            h('span.row__thumb', image ? mediaThumb(app, image, { size: 'sm' }) : type.detailPage ? h('span.row__art', { innerHTML: String(coverArt(type.titleOf?.(item) || item.$id)) }) : h('span.row__icon', icon(type.icon, 18))),
            h('span.row__main', h('strong.row__title', type.titleOf?.(item) || item.$id), h('span.row__sub', type.subtitleOf?.(item) || '')),
            h(
              'span.row__badges',
              item.featured && h('span.badge.badge--soft', icon('star', 11), 'Featured'),
              item.hidden && h('span.badge.badge--muted', icon('eye-off', 12), 'Hidden'),
              dirty && h('span.badge.badge--modified', 'Draft'),
            ),
            icon('chevron-right', 16),
          );
          if (manual) {
            row.addEventListener('dragstart', (e) => {
              dragFrom = index;
              e.dataTransfer.effectAllowed = 'move';
              row.classList.add('is-dragging');
            });
            row.addEventListener('dragend', () => {
              row.draggable = false;
              row.classList.remove('is-dragging');
            });
            row.addEventListener('dragover', (e) => {
              if (dragFrom === null) return;
              e.preventDefault();
              row.classList.add('is-drop-target');
            });
            row.addEventListener('dragleave', () => row.classList.remove('is-drop-target'));
            row.addEventListener('drop', (e) => {
              e.preventDefault();
              if (dragFrom !== null && dragFrom !== index) reorder(dragFrom, index);
              dragFrom = null;
            });
          }
          return row;
        }),
        !items.length && h('p.muted.center', `Nothing matches “${query}”.`),
      );
    };

    const search = h('input.input.input--search', {
      type: 'search',
      placeholder: `Search ${type.plural.toLowerCase()}…`,
      oninput: (e) => {
        query = e.target.value;
        draw();
      },
    });

    el.append(
      viewHeader({
        title: config.label || type.plural,
        subtitle: type.description,
        actions: [h('button.btn.btn--primary', { type: 'button', onclick: () => createItem(app, collectionId) }, icon('plus', 16), `New ${type.label.toLowerCase()}`)],
      }),
      h(
        'div.view-body',
        h('div.toolbar', h('div.input-icon', icon('search', 16), search), h('label.toolbar__sort', h('span.muted', 'Order'), sortSelect(sort, setSort))),
        sort === 'manual' ? h('p.hint', icon('grip', 14), 'Drag items to set the order visitors see.') : null,
        listHost,
      ),
    );
    draw();
    return app.ws.on('change', draw);
  },
};

/** Sort selector (a compact dropdown). */
function sortSelect(value, onChange) {
  const sel = h('select.input.select.select--sm', { onchange: (e) => onChange(e.target.value) }, SORTS.map((s) => h('option', { value: s.value }, s.label)));
  sel.value = value;
  return sel;
}

