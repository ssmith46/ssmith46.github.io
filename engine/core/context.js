/**
 * @file context.js
 * The render context (`ctx`) is the one object every block and collection
 * renderer receives. It hides *where* and *how* the site is being rendered
 * (static build vs. admin preview) behind a small, stable API:
 *
 *   ctx.site / ctx.bundle / ctx.page     the data being rendered
 *   ctx.url(path)                        site-relative URL → absolute path
 *   ctx.link(ref)                        "page:about", "resume", "https://…" → href
 *   ctx.media(ref)                       "media/x.webp" → URL
 *   ctx.md(text) / ctx.mdInline(text)    Markdown → SafeHtml
 *   ctx.items(collectionId, options)     sorted, visible collection items
 *   ctx.itemUrl(item)                    detail page URL for an item
 *   ctx.icon(name)                       inline SVG
 *   ctx.renderBlock(block)               render a nested block
 *
 * Renderers must only use `ctx` (never import build or admin code), which is
 * what keeps every module independent and portable.
 */
import { markdown, markdownInline } from './markdown.js';
import { icon } from './icons.js';
import { html } from './html.js';
import { pageSlug, itemSlug } from './bundle.js';
import { formatDate, formatRange, dateKey } from './utils.js';

/**
 * @typedef {object} ContextOptions
 * @property {import('./bundle.js').SiteBundle} bundle
 * @property {import('../registry.js').Registry} registry
 * @property {'build'|'preview'} [mode]
 * @property {(ref: string, bundle: any) => string} [mediaUrl] override media URL resolution
 * @property {object} [page] page currently being rendered
 * @property {object} [item] collection item currently being rendered
 */

/** @param {ContextOptions} options */
export function createContext(options) {
  const { bundle, registry, mode = 'build' } = options;
  const site = bundle.site;
  const base = site.basePath;

  const ctx = {
    mode,
    bundle,
    site,
    registry,
    page: options.page ?? null,
    item: options.item ?? null,
    year: new Date().getFullYear(),

    /** Prefix a site-relative path with the site's base path. */
    url(path = '') {
      const clean = String(path).replace(/^\/+/, '');
      return `${base}${clean}`;
    },

    /** Resolve a media reference ("media/photo.webp") to a URL. */
    media(ref) {
      if (!ref) return '';
      if (/^(https?:)?\/\//i.test(ref) || ref.startsWith('data:') || ref.startsWith('blob:')) return ref;
      if (options.mediaUrl) return options.mediaUrl(ref, bundle);
      return ctx.url(ref);
    },

    /** Resolve a link reference used by buttons, menus and link lists. */
    link(ref) {
      return resolveLink(ref, ctx);
    },

    /** True when a link opens another website. */
    isExternal(ref) {
      return /^https?:\/\//i.test(String(ref ?? ''));
    },

    md(text) {
      return markdown(text, { resolveUrl: (u) => (u.startsWith('media/') ? ctx.media(u) : u) });
    },

    mdInline(text) {
      return markdownInline(text, { resolveUrl: (u) => (u.startsWith('media/') ? ctx.media(u) : u) });
    },

    icon,
    formatDate,
    formatRange,

    /** Collection config from site.json, e.g. { id, type, label, route }. */
    collection(collectionId) {
      return site.collections.find((c) => c.id === collectionId) || null;
    },

    /** The collection type module (project, experience, …) for a collection. */
    collectionType(collectionId) {
      const config = ctx.collection(collectionId);
      return config ? registry.collections.get(config.type) || null : null;
    },

    /**
     * Sorted, published items for a collection.
     * @param {string} collectionId
     * @param {{ limit?: number, featured?: boolean, tag?: string, includeHidden?: boolean }} [opts]
     */
    items(collectionId, opts = {}) {
      return getItems(bundle, registry, collectionId, opts);
    },

    /** Detail page URL for an item, or '' if its collection has no detail pages. */
    itemUrl(item) {
      const config = ctx.collection(item.$collection);
      const type = ctx.collectionType(item.$collection);
      if (!config || !type?.detailPage) return '';
      return ctx.url(`${config.route || config.id}/${itemSlug(item)}/`);
    },

    /** URL of a page by id. */
    pageUrl(pageId) {
      const page = bundle.pages[pageId];
      if (!page) return ctx.url('');
      const slug = pageSlug(page);
      return ctx.url(slug ? `${slug}/` : '');
    },

    /** Render a block object ({ type, ...props }) with its module. */
    renderBlock(block, index = 0) {
      return renderBlock(block, ctx, index);
    },
  };
  return ctx;
}

/**
 * Link reference formats (stored in content as plain strings):
 *   "page:<pageId>"                 an internal page
 *   "item:<collectionId>/<itemId>"  an item's detail page
 *   "resume"                        the site's current résumé file
 *   "media/<file>"                  any uploaded file
 *   "#section" / "/path" / "https://…" / "mailto:…"   used as-is
 */
export function resolveLink(ref, ctx) {
  const value = String(ref ?? '').trim();
  if (!value) return '#';
  if (value === 'resume') return ctx.site.resume ? ctx.media(ctx.site.resume) : '#';
  if (value.startsWith('page:')) return ctx.pageUrl(value.slice(5));
  if (value.startsWith('item:')) {
    const [collectionId, itemId] = value.slice(5).split('/');
    const item = ctx.bundle.collections[collectionId]?.[itemId];
    return item ? ctx.itemUrl(item) || '#' : '#';
  }
  if (value.startsWith('media/')) return ctx.media(value);
  const scheme = value.match(/^([a-z][a-z0-9+.-]*):/i);
  if (scheme && !/^(https?|mailto|tel)$/i.test(scheme[1])) return '#';
  return value;
}

/** Sort + filter a collection's items according to its settings. */
export function getItems(bundle, registry, collectionId, opts = {}) {
  const config = bundle.site.collections.find((c) => c.id === collectionId);
  const type = config ? registry.collections.get(config.type) : null;
  let items = Object.values(bundle.collections[collectionId] || {});

  if (!opts.includeHidden) items = items.filter((it) => !it.hidden);
  if (opts.featured) items = items.filter((it) => it.featured);
  if (opts.tag) items = items.filter((it) => (it.tags || []).includes(opts.tag));

  const sort = config?.sort || type?.defaultSort || 'newest';
  const dateOf = (it) => dateKey(type?.dateOf ? type.dateOf(it) : it.date);
  const titleOf = (it) => String(type?.titleOf ? type.titleOf(it) : it.title || '').toLowerCase();

  if (sort === 'manual') {
    const order = config?.order || [];
    const pos = (it) => {
      const i = order.indexOf(it.$id);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    items.sort((a, b) => pos(a) - pos(b) || dateOf(b) - dateOf(a));
  } else if (sort === 'oldest') items.sort((a, b) => dateOf(a) - dateOf(b));
  else if (sort === 'title') items.sort((a, b) => titleOf(a).localeCompare(titleOf(b)));
  else items.sort((a, b) => dateOf(b) - dateOf(a));

  return opts.limit ? items.slice(0, Number(opts.limit)) : items;
}

/** Render one block, isolating failures so one bad section never breaks a page. */
export function renderBlock(block, ctx, index = 0) {
  const mod = ctx.registry.blocks.get(block?.type);
  if (!mod) {
    return ctx.mode === 'preview'
      ? html`<div class="block-missing">Unknown section type “${block?.type}”</div>`
      : '';
  }
  try {
    const props = { ...(mod.defaults ? mod.defaults() : {}), ...block };
    return mod.render(props, ctx, { index });
  } catch (err) {
    if (typeof console !== 'undefined') console.error(`Block "${block.type}" failed to render:`, err);
    return ctx.mode === 'preview' ? html`<div class="block-missing">Couldn’t render “${mod.label}”: ${err.message}</div>` : '';
  }
}
