/**
 * @file views/pages.js
 * Page list: every page with its address, menu status and visibility, plus
 * "New page".
 */
import { h, icon } from '../lib/dom.js';
import { viewHeader } from '../components/view-header.js';
import { slugify, uid } from '../../../engine/core/utils.js';
import { RESERVED_SLUGS, pageSlug } from '../../../engine/core/bundle.js';

/** Create a page (as a draft) and open it. */
export async function createPage(app) {
  const title = await app.prompt({
    title: 'New page',
    label: 'Page name',
    placeholder: 'e.g. Talks',
    help: 'You can change the name and address later.',
    validate: (v) => {
      const id = slugify(v);
      if (!id) return 'Please use some letters or numbers.';
      if (RESERVED_SLUGS.includes(id)) return `“${id}” is reserved — try another name.`;
      if (app.ws.exists(app.paths.page(id)) || id === 'home') return 'A page with that address already exists.';
      return null;
    },
  });
  if (!title) return;
  const id = slugify(title);
  app.ws.writeJson(app.paths.page(id), {
    title,
    slug: id,
    intro: '',
    sections: [{ id: uid('s'), type: 'text', heading: '', body: '' }],
  });
  const addToMenu = await app.confirm({ title: 'Add it to the menu?', message: `Show “${title}” in your site’s navigation.`, confirmLabel: 'Add to menu' });
  if (addToMenu) app.updateSite((s) => (s.nav = [...(s.nav || []), { label: title, link: `page:${id}` }]));
  app.go('pages', id);
}

export default {
  render(el, app) {
    const { bundle, site } = app;
    const inMenu = new Set((site.nav || []).map((n) => n.link));
    const pages = Object.values(bundle.pages).sort((a, b) => {
      const rank = (p) => (p.$id === 'home' ? 0 : p.$id === '404' ? 2 : 1);
      return rank(a) - rank(b) || String(a.title).localeCompare(String(b.title));
    });

    const row = (page) => {
      const slug = pageSlug(page);
      const path = page.$id === '404' ? `${site.basePath}404` : `${site.basePath}${slug ? `${slug}/` : ''}`;
      const dirty = app.ws.isDirty(app.paths.page(page.$id));
      return h(
        'a.row',
        { href: app.href('pages', page.$id) },
        h('span.row__icon', icon(page.$id === 'home' ? 'home' : page.$id === '404' ? 'rocket' : 'file', 18)),
        h('span.row__main', h('strong.row__title', page.title || page.$id), h('span.row__sub', path)),
        h(
          'span.row__badges',
          page.$id === 'home' && h('span.badge', 'Home'),
          page.$id === '404' && h('span.badge', 'Not-found page'),
          inMenu.has(`page:${page.$id}`) && h('span.badge.badge--soft', 'In menu'),
          page.hidden && h('span.badge.badge--muted', icon('eye-off', 12), 'Hidden'),
          dirty && h('span.badge.badge--modified', 'Draft'),
        ),
        h('span.row__meta', `${(page.sections || []).length} sections`),
        icon('chevron-right', 16),
      );
    };

    el.append(
      viewHeader({
        title: 'Pages',
        subtitle: 'Each page is made of sections you can add, reorder and style.',
        actions: [h('button.btn.btn--primary', { type: 'button', onclick: () => createPage(app) }, icon('plus', 16), 'New page')],
      }),
      h('div.view-body', h('div.rows', pages.map(row))),
    );
  },
};
