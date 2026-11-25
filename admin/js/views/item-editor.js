/**
 * @file views/item-editor.js
 * Edit one collection item with a form generated from its type's fields.
 * The preview shows the item's own page — or, for types without pages (like
 * experience), the page that lists it.
 */
import { h, icon } from '../lib/dom.js';
import { renderForm } from '../fields/index.js';
import { viewHeader } from '../components/view-header.js';
import { editorLayout, bindDocument } from '../components/editor-layout.js';
import { createPreview, previewRenderOptions } from '../components/preview.js';
import { renderItemHtml, renderPageHtml } from '../../../engine/core/render.js';
import { clone } from '../../../engine/core/utils.js';
import { itemSlug } from '../../../engine/core/bundle.js';

/** Find a page that shows this collection (prefer one that isn't home). */
function pageShowing(app, collectionId) {
  const pages = Object.values(app.bundle.pages).filter((p) => (p.sections || []).some((s) => s.type === 'collection' && s.collection === collectionId));
  return pages.find((p) => p.$id !== 'home') || pages[0] || null;
}

export default {
  render(el, app) {
    const collectionId = app.route.id;
    const itemId = app.route.sub;
    const config = app.collectionConfig(collectionId);
    const type = app.collectionType(collectionId);
    const path = app.paths.item(collectionId, itemId);
    const stored = app.ws.readJson(path);
    const back = { href: app.href('c', collectionId), label: config?.label || 'Back' };
    if (!type || !stored) {
      el.append(viewHeader({ title: 'Not found', back }));
      return;
    }

    const doc = clone(stored);
    const sync = bindDocument(app, path, () => app.rerender());

    // Preview: the item's page, or a page listing the collection.
    const listingPage = type.detailPage ? null : pageShowing(app, collectionId);
    const preview =
      type.detailPage || listingPage
        ? createPreview(app, {
            render: () =>
              type.detailPage
                ? renderItemHtml(app.bundle, app.registry, collectionId, itemId, previewRenderOptions)
                : renderPageHtml(app.bundle, app.registry, listingPage.$id, previewRenderOptions),
          })
        : null;

    const headerHost = h('div');
    const drawHeader = () => {
      const title = type.titleOf?.(doc) || 'Untitled';
      const live = type.detailPage ? `${app.site.basePath}${config.route || config.id}/${itemSlug({ ...doc, $id: itemId })}/` : null;
      headerHost.replaceChildren(
        viewHeader({
          title,
          back,
          badge: [app.ws.isDirty(path) && h('span.badge.badge--modified', 'Draft'), doc.hidden && h('span.badge.badge--muted', icon('eye-off', 12), 'Hidden')],
          subtitle: live ? h('a.muted-link', { href: app.liveUrl(live), target: '_blank', rel: 'noopener' }, live, icon('arrow-up-right', 12)) : type.label,
          actions: [h('button.icon-btn', { type: 'button', title: 'More', 'aria-label': 'More actions', onclick: (e) => app.menu(e.currentTarget, menuItems()) }, icon('more'))],
        }),
      );
    };

    const menuItems = () => [
      {
        label: 'Duplicate',
        icon: 'copy',
        run: () => {
          let id = `${itemId}-copy`;
          for (let i = 2; app.ws.exists(app.paths.item(collectionId, id)); i++) id = `${itemId}-copy-${i}`;
          const copy = clone(doc);
          const titleKey = type.fields.find((f) => f.type === 'text')?.key;
          if (titleKey && copy[titleKey]) copy[titleKey] = `${copy[titleKey]} (copy)`;
          delete copy.slug;
          copy.hidden = true;
          app.ws.writeJson(app.paths.item(collectionId, id), copy);
          app.toast('Duplicated — the copy is hidden until you’re ready.', { type: 'success' });
          app.go('c', collectionId, id);
        },
      },
      '-',
      {
        label: `Delete ${type.label.toLowerCase()}`,
        icon: 'trash',
        danger: true,
        run: async () => {
          if (!(await app.confirm({ title: `Delete “${type.titleOf?.(doc) || itemId}”?`, message: 'It will be removed from your site when you publish.', confirmLabel: 'Delete', danger: true }))) return;
          app.ws.remove(path);
          app.updateSite((s) => {
            const c = s.collections.find((x) => x.id === collectionId);
            if (c?.order) c.order = c.order.filter((x) => x !== itemId);
          });
          app.go('c', collectionId);
        },
      },
    ];

    const form = renderForm(type.fields, doc, {
      app,
      onChange: () => {
        sync.save(doc);
        drawHeader();
      },
    });

    drawHeader();
    el.append(editorLayout({ form: h('div.editor__form-inner', headerHost, h('div.editor-body', form)), preview }));

    const offPreview = preview ? app.ws.on('change', () => preview.refresh()) : () => {};
    return () => {
      sync.off();
      offPreview();
      preview?.destroy();
    };
  },
};
