/**
 * @file views/shell.js
 * The admin frame: sidebar (site switcher + navigation), top bar (publish +
 * deploy status) and the routed view area.
 *
 * Views are plain modules: { render(container, app) → cleanup? }. Register a
 * new screen by adding it to VIEWS and (optionally) a sidebar link.
 */
import { h, icon, replace } from '../lib/dom.js';
import { parseRoute, navigate } from '../router.js';
import { createApp } from '../app.js';
import { openPublish, trackDeploy } from './publish.js';
import { openNewSite } from './new-site.js';
import { initials } from '../../../engine/layout/header.js';
import { getPreset } from '../../../engine/themes/presets.js';
import { vault } from '../lib/vault.js';
import overview from './overview.js';
import pages from './pages.js';
import pageEditor from './page-editor.js';
import collection from './collection.js';
import itemEditor from './item-editor.js';
import media from './media.js';
import design from './design.js';
import settings from './settings.js';

const VIEWS = {
  overview,
  pages,
  page: pageEditor,
  collection,
  item: itemEditor,
  media,
  design,
  settings,
};

const ADMIN_THEME_KEY = 'admin-theme';

/** Apply the admin's own light/dark preference. */
export function applyAdminTheme(value = localStorage.getItem(ADMIN_THEME_KEY) || 'system') {
  if (value === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', value);
}

export function startShell(base) {
  const app = createApp(base);
  const { ws } = app;

  const sidebar = h('aside.sidebar', { attrs: { 'aria-label': 'Admin navigation' } });
  const scrim = h('div.scrim', { onclick: () => document.body.classList.remove('sidebar-open') });
  const topbar = h('header.topbar');
  const view = h('main.view', { id: 'view', tabIndex: -1 });
  const status = h('div.deploy-status', { hidden: true });
  const publishBtn = h('button.btn.btn--primary.publish-btn', { type: 'button', onclick: () => openPublish(app) });

  document.getElementById('app').replaceChildren(h('div.shell', sidebar, scrim, h('div.shell__main', topbar, view)));

  app.trackDeploy = (sha) => trackDeploy(app, sha, status);
  app.rerender = () => route();
  app.refreshChrome = () => {
    drawSidebar();
    drawTopbar();
  };

  /* ── Sidebar ─────────────────────────────────────── */

  function siteMark(site) {
    const color = site.theme?.accent || getPreset(site.theme?.preset).light.accent;
    return h('span.site-mark', { style: { background: color } }, initials(site.title));
  }

  function navLink(label, iconName, target, active, extra) {
    return h(
      'a.nav-item',
      {
        href: target,
        class: active ? 'is-active' : '',
        attrs: { 'aria-current': active ? 'page' : null },
        onclick: () => document.body.classList.remove('sidebar-open'),
      },
      icon(iconName, 17),
      h('span.nav-item__label', label),
      extra,
    );
  }

  function drawSidebar() {
    const bundles = ws.bundles();
    const site = app.site;
    if (!site) return;
    const r = app.route;
    const dirty = (prefix) => ws.changes().some((c) => c.path.startsWith(prefix));
    const dot = (prefix) => (dirty(prefix) ? h('span.nav-item__dot', { title: 'Unpublished changes' }) : null);
    const base = `content/sites/${app.siteId}/`;

    const switcher = h(
      'button.site-switcher',
      {
        type: 'button',
        onclick: (e) =>
          app.menu(e.currentTarget, [
            ...Object.values(bundles).map((b) => ({
              label: `${b.site.title}${b.id === app.siteId ? '  ✓' : ''}`,
              icon: 'globe',
              run: () => navigate(b.id),
            })),
            '-',
            { label: 'New site…', icon: 'plus', run: () => openNewSite(app) },
            { label: 'View live site', icon: 'external', run: () => window.open(app.liveUrl(site.basePath), '_blank', 'noopener') },
          ]),
      },
      siteMark(site),
      h('span.site-switcher__text', h('strong', site.title), h('small', site.basePath === '/' ? 'Main site' : site.basePath)),
      icon('chevron-down', 16),
    );

    const collections = site.collections.map((c) => {
      const type = app.registry.collections.get(c.type);
      const count = Object.keys(app.bundle.collections[c.id] || {}).length;
      return navLink(
        c.label || c.id,
        type?.icon || 'folder',
        app.href('c', c.id),
        (r.view === 'collection' || r.view === 'item') && r.id === c.id,
        [dot(`${base}collections/${c.id}/`), h('span.nav-item__count', count)],
      );
    });

    const user = app.user || {};
    const userBtn = h(
      'button.user-chip',
      {
        type: 'button',
        onclick: (e) =>
          app.menu(e.currentTarget, [
            { label: 'Light appearance', icon: 'sun', run: () => setAdminTheme('light') },
            { label: 'Dark appearance', icon: 'moon', run: () => setAdminTheme('dark') },
            { label: 'Match system', icon: 'monitor', run: () => setAdminTheme('system') },
            '-',
            { label: 'Help & guides', icon: 'info', run: () => window.open(`https://github.com/${app.config.repo.owner}/${app.config.repo.name}/blob/main/docs/ADMIN_GUIDE.md`, '_blank', 'noopener') },
            ...(app.storage.kind === 'github'
              ? [
                  '-',
                  { label: 'Lock', icon: 'lock', run: () => (vault.lock(), location.reload()) },
                  {
                    label: 'Sign out & forget this device',
                    icon: 'log-out',
                    danger: true,
                    run: async () => {
                      if (await app.confirm({ title: 'Forget this device?', message: 'You’ll need your GitHub access key to sign in again. Unpublished drafts stay saved.', confirmLabel: 'Sign out', danger: true })) {
                        vault.forget();
                        location.reload();
                      }
                    },
                  },
                ]
              : []),
          ]),
      },
      user.avatarUrl ? h('img.user-chip__avatar', { src: user.avatarUrl, alt: '' }) : h('span.user-chip__avatar', icon('user', 16)),
      h('span.user-chip__text', h('strong', user.name || user.login || 'You'), h('small', app.storage.kind === 'local' ? 'Local files' : app.storage.label)),
      icon('more', 16),
    );

    sidebar.replaceChildren(
      h('div.sidebar__top', switcher),
      h(
        'nav.sidebar__nav',
        navLink('Overview', 'home', app.href(), r.view === 'overview'),
        navLink('Pages', 'file', app.href('pages'), r.view === 'pages' || r.view === 'page', dot(`${base}pages/`)),
        collections.length ? h('div.nav-heading', 'Content') : null,
        collections,
        h('div.nav-heading', 'Library'),
        navLink('Media', 'images', app.href('media'), r.view === 'media'),
        h('div.nav-heading', 'Site'),
        navLink('Design', 'palette', app.href('design'), r.view === 'design'),
        navLink('Settings', 'sliders', app.href('settings'), r.view === 'settings', dot(`${base}site.json`)),
      ),
      h('div.sidebar__bottom', userBtn),
    );
  }

  function setAdminTheme(value) {
    localStorage.setItem(ADMIN_THEME_KEY, value);
    applyAdminTheme(value);
  }

  /* ── Top bar ─────────────────────────────────────── */

  function drawTopbar() {
    const count = ws.changes().length;
    replace(publishBtn, icon(count ? 'send' : 'check', 16), h('span', count ? 'Publish' : 'Published'), count ? h('span.publish-btn__count', count) : null);
    publishBtn.disabled = !count;
    publishBtn.title = count ? `Publish ${count} change${count === 1 ? '' : 's'}` : 'Everything is published';
    if (topbar.childElementCount) return;
    topbar.append(
      h('button.icon-btn.menu-btn', { type: 'button', 'aria-label': 'Open navigation', onclick: () => document.body.classList.add('sidebar-open') }, icon('menu')),
      h('div.topbar__spacer'),
      status,
      h(
        'a.btn.btn--ghost.view-site',
        { href: '#', target: '_blank', rel: 'noopener', onclick: (e) => (e.currentTarget.href = app.liveUrl(app.site?.basePath || '/')) },
        icon('external', 16),
        h('span', 'View site'),
      ),
      publishBtn,
    );
  }

  /* ── Routing ─────────────────────────────────────── */

  let cleanup = null;
  function route() {
    const r = parseRoute();
    const bundles = ws.bundles();
    if (!r.siteId || !bundles[r.siteId]) {
      const first = Object.values(bundles).find((b) => b.site.basePath === '/') || Object.values(bundles)[0];
      if (first) return navigate(first.id);
      view.replaceChildren(h('div.empty', h('h3.empty__title', 'No sites yet'), h('button.btn.btn--primary', { onclick: () => openNewSite(app) }, 'Create a site')));
      return;
    }
    app.siteId = r.siteId;
    app.route = r;
    if (typeof cleanup === 'function') cleanup();
    cleanup = null;
    drawSidebar();
    drawTopbar();
    view.replaceChildren();
    view.scrollTop = 0;
    const mod = VIEWS[r.view];
    if (!mod) {
      navigate(r.siteId);
      return;
    }
    try {
      cleanup = mod.render(view, app);
    } catch (err) {
      console.error(err);
      view.replaceChildren(h('div.empty', h('h3.empty__title', 'Something went wrong'), h('p.empty__text', err.message)));
    }
  }

  let raf = 0;
  ws.on('change', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (app.site) {
        drawSidebar();
        drawTopbar();
      }
    });
  });

  // Every commit (publish, upload, delete) triggers a deploy worth tracking.
  ws.on('published', (commit) => app.trackDeploy(commit.sha));

  window.addEventListener('hashchange', route);
  route();

  // Keyboard shortcut: ⌘/Ctrl + S publishes.
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (ws.changes().length) openPublish(app);
      else app.toast('Everything is already published.');
    }
  });

  return app;
}
