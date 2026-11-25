/**
 * @file app.js
 * Builds the `app` object every view receives — one place that exposes the
 * workspace, the current site and handy helpers. Views depend only on this
 * object (never on each other), so they can be added or removed freely.
 */
import { paths } from '../../engine/core/bundle.js';
import { navigate, href } from './router.js';
import { toast, confirm, prompt, modal, menu } from './lib/ui.js';

/**
 * @param {{ ws: import('./state/workspace.js').Workspace, storage: object, registry: object, user: object, config: object }} base
 */
export function createApp(base) {
  const app = {
    ...base,
    siteId: null,
    route: { view: 'home' },

    /** Current site's bundle (rebuilt from drafts on every change). */
    get bundle() {
      return app.ws.bundle(app.siteId);
    },
    get site() {
      return app.bundle?.site;
    },

    /** Repository paths for the current site. */
    paths: {
      site: () => paths.site(app.siteId),
      page: (pageId) => paths.page(app.siteId, pageId),
      item: (collectionId, itemId) => paths.item(app.siteId, collectionId, itemId),
      collectionDir: (collectionId) => paths.collectionDir(app.siteId, collectionId),
    },

    /** Raw site.json (without engine defaults) — what gets saved. */
    readSite() {
      return app.ws.readJson(paths.site(app.siteId)) || {};
    },

    /** Mutate site.json with a function and save it as a draft. */
    updateSite(mutate) {
      const data = app.readSite();
      mutate(data);
      app.ws.writeJson(paths.site(app.siteId), data);
    },

    collectionConfig(collectionId) {
      return app.site?.collections.find((c) => c.id === collectionId) || null;
    },

    collectionType(collectionId) {
      const c = app.collectionConfig(collectionId);
      return c ? app.registry.collections.get(c.type) || null : null;
    },

    /** Public URL of a path on the live site. */
    liveUrl(sitePath = '') {
      const origin = String(app.site?.url || app.storage.defaultSiteUrl()).replace(/\/+$/, '');
      return `${origin}${sitePath}`;
    },

    navigate,
    href: (...segments) => href(app.siteId, ...segments),
    go: (...segments) => navigate(app.siteId, ...segments),

    toast,
    confirm,
    prompt,
    modal,
    menu,
  };
  return app;
}
