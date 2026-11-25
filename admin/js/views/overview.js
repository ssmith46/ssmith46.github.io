/**
 * @file views/overview.js
 * Dashboard: greeting, quick actions, what's in the site, and recent history.
 */
import { h, icon } from '../lib/dom.js';
import { greeting, timeAgo, plural } from '../lib/format.js';
import { createItem } from './collection.js';
import { uploadFiles, pickFiles } from '../components/media.js';

function quickAction(iconName, title, text, onclick) {
  return h('button.quick-action', { type: 'button', onclick }, h('span.quick-action__icon', icon(iconName, 20)), h('span.quick-action__text', h('strong', title), h('small', text)), icon('arrow-right', 16));
}

export default {
  render(el, app) {
    const { site, bundle, ws } = app;
    const firstName = app.storage.kind === 'local' ? '' : (app.user?.name || '').split(' ')[0];
    const live = app.liveUrl(site.basePath);

    // Quick actions adapt to the collections this site has.
    const actions = [quickAction('pencil', 'Edit the home page', 'Change your intro, photo and sections', () => app.go('pages', 'home'))];
    for (const c of site.collections.slice(0, 3)) {
      const type = app.registry.collections.get(c.type);
      if (type) actions.push(quickAction(type.icon, `New ${type.label.toLowerCase()}`, `Add to ${c.label}`, () => createItem(app, c.id)));
    }
    if ('resume' in app.readSite() || site.collections.some((c) => c.type === 'experience')) {
      actions.push(
        quickAction('file', 'Update your résumé', site.resume ? 'Upload a new PDF — every link updates' : 'Upload a PDF', async () => {
          const files = await pickFiles({ accept: '.pdf,application/pdf', multiple: false });
          if (!files.length) return;
          const [ref] = await uploadFiles(app, files);
          if (ref) {
            app.updateSite((s) => (s.resume = ref));
            app.toast('Résumé updated — publish to make it live.', { type: 'success', action: { label: 'Publish', run: () => document.querySelector('.publish-btn')?.click() } });
          }
        }),
      );
    }
    actions.push(quickAction('palette', 'Change the look', 'Colors, fonts and light/dark mode', () => app.go('design')));

    const stats = [
      { label: 'Pages', value: Object.values(bundle.pages).filter((p) => p.$id !== '404').length, href: app.href('pages') },
      ...site.collections.map((c) => ({ label: c.label, value: Object.keys(bundle.collections[c.id] || {}).length, href: app.href('c', c.id) })),
      { label: 'Files', value: ws.mediaPaths(app.siteId).length, href: app.href('media') },
    ];

    const changes = ws.changes();
    const history = h('ul.history', h('li.history__loading', h('span.spinner.spinner--sm'), 'Loading history…'));
    app.storage
      .recentCommits()
      .then((commits) =>
        history.replaceChildren(
          ...(commits.length
            ? commits.map((c) =>
                h(
                  'li.history__item',
                  h('span.history__dot'),
                  h('span.history__msg', c.url ? h('a', { href: c.url, target: '_blank', rel: 'noopener' }, c.message) : c.message),
                  h('span.history__when', timeAgo(c.date)),
                ),
              )
            : [h('li.muted', 'No published changes yet.')]),
        ),
      )
      .catch(() => history.replaceChildren(h('li.muted', 'History isn’t available right now.')));

    el.append(
      h(
        'div.view-body.overview',
        h(
          'section.welcome',
          h('div', h('p.welcome__eyebrow', `${greeting()}${firstName ? `, ${firstName}` : ''}`), h('h1.welcome__title', site.title), h('a.welcome__link', { href: live, target: '_blank', rel: 'noopener' }, live.replace(/^https?:\/\//, ''), icon('arrow-up-right', 14))),
          changes.length
            ? h('div.welcome__drafts', h('span', icon('pencil', 16), `${plural(changes.length, 'unpublished change')}`), h('button.btn.btn--primary.btn--sm', { type: 'button', onclick: () => document.querySelector('.publish-btn')?.click() }, 'Review & publish'))
            : h('div.welcome__drafts.is-clean', icon('check-circle', 16), 'Everything is published'),
        ),
        h('h2.section-title', 'Quick actions'),
        h('div.quick-actions', actions),
        h('div.overview__grid', h('section.panel', h('h2.panel__title', 'At a glance'), h('div.stat-tiles', stats.map((s) => h('a.stat-tile', { href: s.href }, h('strong', s.value), h('span', s.label))))), h('section.panel', h('h2.panel__title', 'Recent activity'), history)),
        bundle.errors.length
          ? h('section.callout.callout--error', h('strong', 'Some content files have problems:'), h('ul', bundle.errors.map((e) => h('li', `${e.path}: ${e.message}`))))
          : null,
      ),
    );
  },
};
