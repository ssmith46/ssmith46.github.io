/**
 * @file views/page-editor.js
 * Edit one page: its sections (add, reorder, hide, style) and its settings,
 * with a live preview beside the form. Click a section in the preview to jump
 * straight to its settings.
 */
import { h, icon } from '../lib/dom.js';
import { renderForm } from '../fields/index.js';
import { viewHeader } from '../components/view-header.js';
import { editorLayout, bindDocument } from '../components/editor-layout.js';
import { createPreview, previewRenderOptions } from '../components/preview.js';
import { pickBlock } from '../components/block-picker.js';
import { renderPageHtml } from '../../../engine/core/render.js';
import { SECTION_FIELDS } from '../../../engine/core/section.js';
import { defaultsFor } from '../../../engine/core/fields.js';
import { clone, uid, slugify } from '../../../engine/core/utils.js';
import { pageSlug, RESERVED_SLUGS } from '../../../engine/core/bundle.js';

/** Fields for the "Page settings" tab. */
function pageFields(pageId, app) {
  const special = pageId === 'home' || pageId === '404';
  return [
    { key: 'title', type: 'text', label: 'Page title', required: true },
    !special && { key: 'slug', type: 'slug', label: 'Web address', prefix: app.site.basePath, help: 'Changing this won’t break your menu or buttons — they link to the page itself.' },
    !special && { key: 'showHeader', type: 'toggle', label: 'Show the page title and introduction at the top' },
    !special && { key: 'eyebrow', type: 'text', label: 'Small heading above the title', when: (v) => v.showHeader !== false },
    !special && { key: 'intro', type: 'markdown', label: 'Introduction', rows: 3, when: (v) => v.showHeader !== false },
    { key: 'description', type: 'textarea', label: 'Search & sharing description', rows: 2, help: 'Shown by Google and in link previews (LinkedIn, iMessage…).' },
    { key: 'image', type: 'image', label: 'Sharing image', help: 'Optional — shown when the page is shared.' },
    !special && { key: 'hidden', type: 'toggle', label: 'Hide this page from the site' },
  ].filter(Boolean);
}

/** One-line description of a section for its collapsed card. */
function sectionSummary(block, app) {
  if (block.type === 'collection') {
    const c = app.collectionConfig(block.collection);
    return [block.heading, c ? `${c.label}` : 'No collection chosen'].filter(Boolean).join(' · ');
  }
  return block.heading || block.title || block.eyebrow || (block.items?.length ? `${block.items.length} items` : '') || (block.images?.length ? `${block.images.length} photos` : '') || 'Empty';
}

export default {
  render(el, app) {
    const pageId = app.route.id;
    const path = app.paths.page(pageId);
    const original = app.ws.readJson(path);
    if (!original) {
      el.append(viewHeader({ title: 'Page not found', back: { href: app.href('pages'), label: 'Pages' } }));
      return;
    }

    const doc = clone(original);
    doc.sections ||= [];
    for (const s of doc.sections) s.id ||= uid('s');
    if (doc.showHeader === undefined && pageId !== 'home' && pageId !== '404') doc.showHeader = true;

    const sync = bindDocument(app, path, () => app.rerender());
    const open = new Set();
    let tab = 'sections';

    const preview = createPreview(app, {
      render: () => renderPageHtml(app.bundle, app.registry, pageId, previewRenderOptions),
      onSectionClick: (id) => {
        tab = 'sections';
        open.clear();
        open.add(id);
        drawBody();
        el.querySelector(`[data-card="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    });

    const save = () => {
      sync.save(doc);
      drawHeader();
    };

    /* ── Header ──────────────────────────────────── */
    const headerHost = h('div');
    const drawHeader = () => {
      const livePath = pageId === '404' ? null : `${app.site.basePath}${pageSlug({ ...doc, $id: pageId }) ? `${pageSlug({ ...doc, $id: pageId })}/` : ''}`;
      headerHost.replaceChildren(
        viewHeader({
          title: doc.title || 'Untitled page',
          back: { href: app.href('pages'), label: 'Pages' },
          badge: [
            app.ws.isDirty(path) && h('span.badge.badge--modified', 'Draft'),
            doc.hidden && h('span.badge.badge--muted', icon('eye-off', 12), 'Hidden'),
          ],
          subtitle: livePath ? h('a.muted-link', { href: app.liveUrl(livePath), target: '_blank', rel: 'noopener' }, livePath, icon('arrow-up-right', 12)) : 'Shown when a visitor opens a missing address',
          actions: [
            h(
              'button.icon-btn',
              {
                type: 'button',
                title: 'More',
                'aria-label': 'More actions',
                onclick: (e) => app.menu(e.currentTarget, pageMenu()),
              },
              icon('more'),
            ),
          ],
        }),
      );
    };

    const pageMenu = () => {
      const inMenu = (app.readSite().nav || []).some((n) => n.link === `page:${pageId}`);
      const items = [];
      if (pageId !== '404') {
        items.push({
          label: inMenu ? 'Remove from menu' : 'Add to menu',
          icon: 'list',
          run: () =>
            app.updateSite((s) => {
              s.nav = inMenu ? (s.nav || []).filter((n) => n.link !== `page:${pageId}`) : [...(s.nav || []), { label: doc.title, link: `page:${pageId}` }];
            }),
        });
      }
      items.push({
        label: 'Duplicate page',
        icon: 'copy',
        run: () => {
          let id = `${slugify(doc.title) || 'page'}-copy`;
          for (let i = 2; app.ws.exists(app.paths.page(id)); i++) id = `${slugify(doc.title)}-copy-${i}`;
          const copy = clone(doc);
          copy.title = `${doc.title} (copy)`;
          copy.slug = id;
          copy.hidden = true;
          copy.sections.forEach((s) => (s.id = uid('s')));
          app.ws.writeJson(app.paths.page(id), copy);
          app.toast('Page duplicated (hidden until you’re ready).', { type: 'success' });
          app.go('pages', id);
        },
      });
      if (pageId !== 'home' && pageId !== '404') {
        items.push('-', {
          label: 'Delete page',
          icon: 'trash',
          danger: true,
          run: async () => {
            if (!(await app.confirm({ title: `Delete “${doc.title}”?`, message: 'The page will be removed when you publish. Menu links to it are removed too.', confirmLabel: 'Delete page', danger: true }))) return;
            app.ws.remove(path);
            app.updateSite((s) => (s.nav = (s.nav || []).filter((n) => n.link !== `page:${pageId}`)));
            app.go('pages');
          },
        });
      }
      return items;
    };

    /* ── Sections ────────────────────────────────── */
    const insertSection = async (index) => {
      const type = await pickBlock(app);
      if (!type) return;
      const mod = app.registry.blocks.get(type);
      const block = { id: uid('s'), type, ...defaultsFor(mod.fields), ...(mod.defaults ? mod.defaults() : {}) };
      doc.sections.splice(index, 0, block);
      open.clear();
      open.add(block.id);
      save();
      drawBody();
      setTimeout(() => preview.focusSection(block.id), 600);
    };

    let dragFrom = null;
    const sectionCard = (block, index) => {
      const mod = app.registry.blocks.get(block.type);
      const isOpen = open.has(block.id);
      const summary = h('span.section-card__summary', sectionSummary(block, app));
      const move = (delta) => {
        const to = index + delta;
        if (to < 0 || to >= doc.sections.length) return;
        doc.sections.splice(to, 0, doc.sections.splice(index, 1)[0]);
        save();
        drawBody();
      };
      const card = h(
        'div.section-card',
        { class: [isOpen && 'is-open', block.hidden && 'is-hidden'].filter(Boolean).join(' '), dataset: { card: block.id } },
        h(
          'div.section-card__head',
          h('span.drag-handle', { title: 'Drag to reorder', onpointerdown: () => (card.draggable = true) }, icon('grip', 16)),
          h(
            'button.section-card__toggle',
            {
              type: 'button',
              'aria-expanded': String(isOpen),
              onclick: () => {
                isOpen ? open.delete(block.id) : (open.clear(), open.add(block.id));
                drawBody();
                if (!isOpen) preview.focusSection(block.id);
              },
            },
            h('span.section-card__icon', icon(mod?.icon || 'layers', 18)),
            h('span.section-card__text', h('strong', mod?.label || block.type), summary),
          ),
          h(
            'button.icon-btn.icon-btn--sm',
            {
              type: 'button',
              title: block.hidden ? 'Show section' : 'Hide section',
              'aria-label': block.hidden ? 'Show section' : 'Hide section',
              onclick: () => {
                block.hidden = !block.hidden;
                if (!block.hidden) delete block.hidden;
                save();
                drawBody();
              },
            },
            icon(block.hidden ? 'eye-off' : 'eye', 15),
          ),
          h(
            'button.icon-btn.icon-btn--sm',
            {
              type: 'button',
              title: 'Section actions',
              'aria-label': 'Section actions',
              onclick: (e) =>
                app.menu(e.currentTarget, [
                  { label: 'Move up', icon: 'arrow-up', disabled: index === 0, run: () => move(-1) },
                  { label: 'Move down', icon: 'arrow-down', disabled: index === doc.sections.length - 1, run: () => move(1) },
                  { label: 'Add section above', icon: 'plus', run: () => insertSection(index) },
                  {
                    label: 'Duplicate',
                    icon: 'copy',
                    run: () => {
                      const copy = { ...clone(block), id: uid('s') };
                      doc.sections.splice(index + 1, 0, copy);
                      save();
                      drawBody();
                    },
                  },
                  '-',
                  {
                    label: 'Delete section',
                    icon: 'trash',
                    danger: true,
                    run: async () => {
                      if (!(await app.confirm({ title: 'Delete this section?', message: `${mod?.label || 'Section'} · ${sectionSummary(block, app)}`, confirmLabel: 'Delete', danger: true }))) return;
                      doc.sections.splice(index, 1);
                      save();
                      drawBody();
                    },
                  },
                ]),
            },
            icon('more', 15),
          ),
        ),
        isOpen && mod
          ? h(
              'div.section-card__body',
              renderForm([...mod.fields, ...SECTION_FIELDS], block, {
                app,
                onChange: () => {
                  summary.textContent = sectionSummary(block, app);
                  save();
                },
              }),
            )
          : null,
      );

      card.addEventListener('dragstart', (e) => {
        dragFrom = index;
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('is-dragging');
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
        if (dragFrom === null || dragFrom === index) return;
        doc.sections.splice(index, 0, doc.sections.splice(dragFrom, 1)[0]);
        dragFrom = null;
        save();
        drawBody();
      });
      return card;
    };

    /* ── Tabs + body ─────────────────────────────── */
    const body = h('div.editor-body');
    const tabs = h('div.tabs', { attrs: { role: 'tablist' } });
    const drawTabs = () =>
      tabs.replaceChildren(
        ...[
          ['sections', `Sections (${doc.sections.length})`],
          ['settings', 'Page settings'],
        ].map(([id, label]) =>
          h(
            'button.tab',
            {
              type: 'button',
              attrs: { role: 'tab', 'aria-selected': String(tab === id) },
              onclick: () => {
                tab = id;
                drawBody();
              },
            },
            label,
          ),
        ),
      );

    const drawBody = () => {
      drawTabs();
      if (tab === 'settings') {
        body.replaceChildren(
          renderForm(pageFields(pageId, app), doc, {
            app,
            onChange: () => {
              if (doc.slug !== undefined && RESERVED_SLUGS.includes(doc.slug)) app.toast(`“${doc.slug}” is reserved — choose another address.`, { type: 'error' });
              save();
            },
          }),
        );
        return;
      }
      body.replaceChildren(
        h(
          'div.section-list',
          doc.sections.map((block, i) => [i > 0 && h('button.insert-line', { type: 'button', title: 'Add a section here', 'aria-label': 'Add a section here', onclick: () => insertSection(i) }, icon('plus', 14)), sectionCard(block, i)]),
        ),
        h('button.add-section', { type: 'button', onclick: () => insertSection(doc.sections.length) }, icon('plus', 18), 'Add section'),
      );
    };

    drawHeader();
    drawBody();
    el.append(editorLayout({ form: h('div.editor__form-inner', headerHost, tabs, body), preview }));

    // Re-render if this page changed elsewhere (e.g. discarded), refresh preview on any change.
    const offPreview = app.ws.on('change', () => preview.refresh());
    return () => {
      sync.off();
      offPreview();
      preview.destroy();
    };
  },
};
