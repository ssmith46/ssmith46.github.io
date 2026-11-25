/**
 * @file bundle.js
 * Content conventions + loader shared by the static build and the admin.
 *
 * All editable data lives under `content/` as plain JSON (plus media files):
 *
 *   content/sites/<siteId>/site.json                              site settings
 *   content/sites/<siteId>/pages/<pageId>.json                    one page each
 *   content/sites/<siteId>/collections/<collectionId>/<id>.json   one item each
 *   content/sites/<siteId>/media/<file>                           images, PDFs…
 *
 * `buildBundles()` turns a flat list of files into one "bundle" per site — the
 * read-only data structure every renderer receives. Properties that start
 * with `$` (e.g. `$id`) are computed by the loader and never stored on disk.
 */

export const CONTENT_ROOT = 'content';
export const SITES_ROOT = `${CONTENT_ROOT}/sites`;

/** Path builders — the single source of truth for where content lives. */
export const paths = {
  siteRoot: (siteId) => `${SITES_ROOT}/${siteId}`,
  site: (siteId) => `${SITES_ROOT}/${siteId}/site.json`,
  page: (siteId, pageId) => `${SITES_ROOT}/${siteId}/pages/${pageId}.json`,
  item: (siteId, collectionId, itemId) => `${SITES_ROOT}/${siteId}/collections/${collectionId}/${itemId}.json`,
  collectionDir: (siteId, collectionId) => `${SITES_ROOT}/${siteId}/collections/${collectionId}`,
  mediaDir: (siteId) => `${SITES_ROOT}/${siteId}/media`,
  /** @param {string} ref site-relative media reference, e.g. "media/photo.webp" */
  media: (siteId, ref) => `${SITES_ROOT}/${siteId}/${ref}`,
};

/** URL paths that pages may never use because the build reserves them. */
export const RESERVED_SLUGS = ['admin', 'engine', 'assets', 'media', '404'];

/**
 * Work out what a repository path refers to.
 * @param {string} path
 * @returns {{ kind: 'site'|'page'|'item'|'media'|'other', siteId?: string, pageId?: string, collectionId?: string, itemId?: string, ref?: string }}
 */
export function classifyPath(path) {
  const m = path.match(/^content\/sites\/([^/]+)\/(.+)$/);
  if (!m) return { kind: 'other' };
  const [, siteId, rest] = m;
  let r;
  if (rest === 'site.json') return { kind: 'site', siteId };
  if ((r = rest.match(/^pages\/([^/]+)\.json$/))) return { kind: 'page', siteId, pageId: r[1] };
  if ((r = rest.match(/^collections\/([^/]+)\/([^/]+)\.json$/))) return { kind: 'item', siteId, collectionId: r[1], itemId: r[2] };
  if (rest.startsWith('media/')) return { kind: 'media', siteId, ref: rest };
  return { kind: 'other', siteId };
}

/** Ensure a base path looks like "/" or "/running/". */
export function normalizeBasePath(value) {
  const parts = String(value ?? '/').split('/').filter(Boolean);
  return parts.length ? `/${parts.join('/')}/` : '/';
}

/** Fill in defaults so renderers never have to null-check site settings. */
export function normalizeSite(site, siteId) {
  return {
    title: siteId,
    tagline: '',
    description: '',
    language: 'en',
    indexable: true,
    resume: '',
    nav: [],
    socials: [],
    collections: [],
    footer: '',
    ...site,
    basePath: normalizeBasePath(site?.basePath),
    theme: { preset: 'ember', fonts: 'technical', radius: 'soft', defaultMode: 'system', motion: true, ...(site?.theme || {}) },
  };
}

/**
 * @typedef {object} SiteBundle
 * @property {string} id
 * @property {ReturnType<typeof normalizeSite>} site
 * @property {Record<string, any>} pages        keyed by page id
 * @property {Record<string, Record<string, any>>} collections  collectionId → itemId → item
 * @property {string[]} media                   site-relative refs, e.g. "media/photo.webp"
 * @property {{ path: string, message: string }[]} errors
 */

/**
 * Group raw files into per-site bundles.
 * @param {Iterable<[string, string]>} jsonFiles [path, text] pairs (JSON content files)
 * @param {Iterable<string>} [mediaPaths] repository paths of media files
 * @returns {Record<string, SiteBundle>}
 */
export function buildBundles(jsonFiles, mediaPaths = []) {
  /** @type {Record<string, SiteBundle>} */
  const sites = {};
  const ensure = (siteId) =>
    (sites[siteId] ??= { id: siteId, site: null, pages: {}, collections: {}, media: [], errors: [] });

  for (const [path, text] of jsonFiles) {
    const info = classifyPath(path);
    if (info.kind === 'other' || info.kind === 'media') continue;
    const bundle = ensure(info.siteId);
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      bundle.errors.push({ path, message: `Invalid JSON: ${err.message}` });
      continue;
    }
    if (info.kind === 'site') bundle.site = data;
    else if (info.kind === 'page') bundle.pages[info.pageId] = { ...data, $id: info.pageId };
    else if (info.kind === 'item') {
      (bundle.collections[info.collectionId] ??= {})[info.itemId] = {
        ...data,
        $id: info.itemId,
        $collection: info.collectionId,
      };
    }
  }

  for (const path of mediaPaths) {
    const info = classifyPath(path);
    if (info.kind === 'media' && sites[info.siteId]) sites[info.siteId].media.push(info.ref);
  }

  for (const [siteId, bundle] of Object.entries(sites)) {
    if (!bundle.site) {
      bundle.errors.push({ path: paths.site(siteId), message: 'Missing site.json' });
      delete sites[siteId];
      continue;
    }
    bundle.site = normalizeSite(bundle.site, siteId);
    bundle.media.sort();
  }

  return sites;
}

/** Slug used in URLs for a page ('' for the home page). */
export function pageSlug(page) {
  if (page.$id === 'home') return '';
  return String(page.slug ?? page.$id).replace(/^\/+|\/+$/g, '');
}

/** Slug used in URLs for a collection item. */
export function itemSlug(item) {
  return String(item.slug || item.$id).replace(/^\/+|\/+$/g, '');
}
