/**
 * @file views/settings.js
 * Site settings: details, résumé, menu, social links, footer, collections,
 * address & visibility, and deleting a site. Most panels are generated from
 * field lists, so adding a setting is usually one line.
 */
import { h, icon } from '../lib/dom.js';
import { renderForm } from '../fields/index.js';
import { viewHeader } from '../components/view-header.js';
import { bindDocument } from '../components/editor-layout.js';
import { NETWORKS } from '../../../engine/layout/socials.js';
import { slugify, uid, clone } from '../../../engine/core/utils.js';
import { normalizeBasePath, RESERVED_SLUGS } from '../../../engine/core/bundle.js';

const DETAILS = [
  { key: 'title', type: 'text', label: 'Site name', required: true, help: 'Shown in the header, browser tabs and search results.' },
  { key: 'tagline', type: 'text', label: 'Tagline', placeholder: 'Computer Scientist' },
  { key: 'description', type: 'textarea', label: 'Description', rows: 2, help: 'A sentence or two for Google and link previews.' },
  { key: 'url', type: 'url', label: 'Public address', placeholder: 'https://you.github.io', help: 'Used for link previews and the sitemap.' },
  { key: 'shareImage', type: 'image', label: 'Default sharing image', width: 'half' },
  { key: 'favicon', type: 'image', label: 'Browser tab icon', width: 'half', help: 'Optional — a monogram is generated otherwise.' },
  { key: 'logo', type: 'image', label: 'Logo', help: 'Optional — replaces the monogram in the header.' },
];

const RESUME = [
  { key: 'resume', type: 'file', label: 'Résumé (PDF)', accept: '.pdf,application/pdf', help: 'Every button or menu item that links to “My résumé” opens this file. Replace it here and they all update.' },
  { key: 'resumeAliases', type: 'tags', label: 'Old résumé addresses', placeholder: 'e.g. resume.pdf', help: 'Links you shared in the past (like on LinkedIn) keep working and always open your current résumé.' },
]

const MENU = [
  {
    key: 'nav',
    type: 'list',
    label: 'Menu items',
    addLabel: 'Add menu item',
    itemLabel: 'label',
    fields: [
      { key: 'label', type: 'text', label: 'Label', required: true },
      { key: 'link', type: 'link', label: 'Link to' },
      {
        key: 'style',
        type: 'select',
        label: 'Style',
        options: [
          { value: 'link', label: 'Text link' },
          { value: 'button', label: 'Outlined button' },
        ],
      },
    ],
  },
];

const SOCIALS = [
  {
    key: 'socials',
    type: 'list',
    label: 'Profiles',
    addLabel: 'Add profile',
    itemLabel: (s) => NETWORKS[s.network]?.label || s.network,
    fields: [
      { key: 'network', type: 'select', label: 'Network', options: Object.entries(NETWORKS).map(([value, n]) => ({ value, label: n.label })) },
      { key: 'url', type: 'text', label: 'Address', placeholder: 'https://… or an email' },
      { key: 'label', type: 'text', label: 'Custom label', placeholder: 'Optional' },
    ],
  },
];

const FOOTER = [{ key: 'footer', type: 'text', label: 'Footer note', placeholder: 'Built with care.', help: 'Short text under the copyright line. Links allowed: [text](https://…)' }];

function panel(title, description, ...content) {
  return h('section.panel.settings-panel', h('header.panel__header', h('h2.panel__title', title), description && h('p.panel__desc', description)), ...content);
}

export default {
  render(el, app) {
    const path = app.paths.site();
    const doc = clone(app.readSite());
    const sync = bindDocument(app, path, () => app.rerender());
    const save = () => sync.save(doc);
    const form = (fields) => renderForm(fields, doc, { app, onChange: save });

    const isMain = app.site.basePath === '/';
    const otherSites = Object.values(app.ws.bundles()).filter((b) => b.id !== app.siteId);

    /* Collections panel (custom UI) */
    const collectionsHost = h('div.collection-settings');
    const drawCollections = () => {
      collectionsHost.replaceChildren(
        ...(doc.collections || []).map((c, i) => {
          const type = app.registry.collections.get(c.type);
          const count = Object.keys(app.bundle.collections[c.id] || {}).length;
          return h(
            'div.collection-row',
            h('span.row__icon', icon(type?.icon || 'folder', 18)),
            h('label.field', h('span.field__label', 'Name'), h('input.input', { type: 'text', value: c.label || '', oninput: (e) => ((c.label = e.target.value), save()) })),
            h(
              'label.field',
              h('span.field__label', type?.detailPage ? 'Item pages live at' : 'Address'),
              h('div.input-affix.input-affix--prefix', h('span.input-affix__text', app.site.basePath), h('input.input', { type: 'text', value: c.route || c.id, onchange: (e) => ((c.route = slugify(e.target.value) || c.id), (e.target.value = c.route), save()) })),
            ),
            h('span.collection-row__meta', `${type?.label || c.type} · ${count}`),
            h(
              'button.icon-btn.icon-btn--danger',
              {
                type: 'button',
                title: 'Remove collection',
                'aria-label': `Remove ${c.label}`,
                onclick: async () => {
                  const ok = await app.confirm({
                    title: `Remove “${c.label}”?`,
                    message: count ? `Its ${count} item(s) will be deleted when you publish. Sections showing it will be empty.` : 'Sections showing it will be empty.',
                    confirmLabel: 'Remove',
                    danger: true,
                  });
                  if (!ok) return;
                  for (const itemId of Object.keys(app.bundle.collections[c.id] || {})) app.ws.remove(app.paths.item(c.id, itemId));
                  doc.collections.splice(i, 1);
                  save();
                  drawCollections();
                },
              },
              icon('trash', 16),
            ),
          );
        }),
        h('button.btn.btn--sm', { type: 'button', onclick: () => addCollection(app, doc, save).then(drawCollections) }, icon('plus', 14), 'Add collection'),
      );
    };
    drawCollections();

    /* Address & visibility */
    const addressField = isMain
      ? h('p.muted', 'This is your main site, at the root of your address. Additional sites get their own path, like /running/.')
      : h(
          'label.field',
          h('span.field__label', 'Address'),
          h('input.input', {
            type: 'text',
            value: doc.basePath,
            onchange: (e) => {
              const next = normalizeBasePath(slugify(e.target.value.replace(/\//g, ' ')) || doc.basePath);
              const first = next.split('/').filter(Boolean)[0];
              if (RESERVED_SLUGS.includes(first) || otherSites.some((b) => b.site.basePath === next)) {
                app.toast(`${next} is already taken.`, { type: 'error' });
                e.target.value = doc.basePath;
                return;
              }
              doc.basePath = next;
              e.target.value = next;
              save();
            },
          }),
          h('span.field__help', 'The path this site lives at on your domain. Visitors of one site never see links to another.'),
        );

    const visibility = renderForm([{ key: 'indexable', type: 'toggle', label: 'Let search engines list this site' }], (doc.indexable ??= true, doc), { app, onChange: save });

    const danger =
      !isMain || otherSites.length
        ? panel(
            'Delete this site',
            'Removes every page, item and setting of this site when you publish. Uploaded files stay in the media folder.',
            h(
              'button.btn.btn--danger',
              {
                type: 'button',
                onclick: async () => {
                  const answer = await app.prompt({ title: 'Delete site', label: `Type “${doc.title}” to confirm`, confirmLabel: 'Delete site', validate: (v) => (v === doc.title ? null : 'That doesn’t match the site name.') });
                  if (!answer) return;
                  const prefix = `content/sites/${app.siteId}/`;
                  for (const p of app.ws.jsonPaths().filter((p) => p.startsWith(prefix))) app.ws.remove(p);
                  app.navigate('');
                },
              },
              icon('trash', 16),
              'Delete site…',
            ),
          )
        : null;

    el.append(
      viewHeader({ title: 'Settings', subtitle: `Everything about ${app.site.title} that isn’t a page.` }),
      h(
        'div.view-body.settings',
        panel('Site details', null, form(DETAILS)),
        panel('Résumé', 'Keep one résumé file and link to it everywhere.', form(RESUME)),
        panel('Menu', 'Links in the header. Drag to reorder.', form(MENU)),
        panel('Social links', 'Shown in your hero, call-to-action sections and footer.', form(SOCIALS)),
        panel('Footer', null, form(FOOTER)),
        panel('Collections', 'Lists of things you keep — projects, jobs, write-ups, runs, movies… Each can be shown on any page with a Collection section.', collectionsHost),
        panel('Address & visibility', null, addressField, visibility),
        danger,
      ),
    );
    return () => sync.off();
  },
};

/** Dialog: add a collection of any registered type. */
async function addCollection(app, doc, save) {
  const types = [...app.registry.collections.values()];
  const result = await app.modal({
    title: 'Add a collection',
    size: 'md',
    render: (close) => {
      let chosen = types[0].type;
      const name = h('input.input', { type: 'text', placeholder: 'e.g. Talks', autofocus: true });
      const makePage = h('input', { type: 'checkbox', checked: true });
      const cards = h('div.type-grid');
      const draw = () =>
        cards.replaceChildren(
          ...types.map((t) =>
            h(
              'button.type-card',
              { type: 'button', attrs: { 'aria-pressed': String(t.type === chosen) }, onclick: () => ((chosen = t.type), draw(), !name.value && (name.placeholder = `e.g. ${t.plural}`)) },
              icon(t.icon, 20),
              h('strong', t.plural),
              h('small', t.description),
            ),
          ),
        );
      draw();
      return h(
        'form',
        {
          onsubmit: (e) => {
            e.preventDefault();
            const label = name.value.trim() || app.registry.collections.get(chosen).plural;
            close({ label, type: chosen, makePage: makePage.checked });
          },
        },
        h('div.field', h('span.field__label', 'What kind of items?'), cards),
        h('label.field', h('span.field__label', 'Name'), name),
        h('label.switch', makePage, h('span.switch__track', h('span.switch__thumb')), h('span.switch__label', 'Also create a page that lists them')),
        h('div.modal__actions', h('button.btn', { type: 'button', onclick: () => close() }, 'Cancel'), h('button.btn.btn--primary', { type: 'submit' }, 'Add collection')),
      );
    },
  });
  if (!result) return;

  let id = slugify(result.label) || result.type;
  for (let i = 2; (doc.collections || []).some((c) => c.id === id); i++) id = `${slugify(result.label)}-${i}`;
  const type = app.registry.collections.get(result.type);
  doc.collections = [...(doc.collections || []), { id, type: result.type, label: result.label, route: id, sort: type.defaultSort || 'newest' }];

  if (result.makePage && !app.ws.exists(app.paths.page(id))) {
    app.ws.writeJson(app.paths.page(id), {
      title: result.label,
      slug: id,
      sections: [{ id: uid('s'), type: 'collection', collection: id, layout: Object.keys(type.layouts || {})[0] }],
    });
    doc.nav = [...(doc.nav || []), { label: result.label, link: `page:${id}` }];
  }
  save();
  app.toast(`${result.label} added — find it in the sidebar.`, { type: 'success' });
}
