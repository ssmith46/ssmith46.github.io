/**
 * @file router.js
 * Hash-based routes, so the admin works as static files on any host:
 *
 *   #/<site>                      overview
 *   #/<site>/pages                page list
 *   #/<site>/pages/<pageId>       page editor
 *   #/<site>/c/<collectionId>     collection list
 *   #/<site>/c/<collection>/<id>  item editor
 *   #/<site>/media | design | settings
 */

/** @returns {{ siteId?: string, view: string, id?: string, sub?: string }} */
export function parseRoute(hash = location.hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [siteId, section, id, sub] = parts;
  if (!siteId) return { view: 'home' };
  if (!section) return { siteId, view: 'overview' };
  if (section === 'pages') return id ? { siteId, view: 'page', id } : { siteId, view: 'pages' };
  if (section === 'c') return sub ? { siteId, view: 'item', id, sub } : { siteId, view: 'collection', id };
  return { siteId, view: section };
}

/** Build a hash URL from path segments: href('portfolio', 'pages', 'home'). */
export function href(...segments) {
  return `#/${segments.filter((s) => s != null && s !== '').map(encodeURIComponent).join('/')}`;
}

export function navigate(...segments) {
  location.hash = href(...segments);
}
