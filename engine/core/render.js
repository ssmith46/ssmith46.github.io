/**
 * @file render.js
 * Turns a site bundle into routes and full HTML documents.
 * Used by `tools/build.mjs` (to write files) and the admin (live preview).
 */
import { html } from './html.js';
import { createContext } from './context.js';
import { wrapSection } from './section.js';
import { pageSlug, itemSlug } from './bundle.js';
import { renderDocument } from '../layout/document.js';
import { plainText, truncate } from './utils.js';

/**
 * @typedef {object} RenderOptions
 * @property {'build'|'preview'} [mode]
 * @property {(ref: string) => string} [mediaUrl]
 * @property {{ base?: string, version?: string }} [assets]
 * @property {string} [extraHead]
 */

/**
 * @typedef {object} Route
 * @property {'page'|'item'|'notFound'} kind
 * @property {string} path  public URL path, e.g. "/projects/ship-cnn/"
 * @property {string} file  output file relative to the build root
 * @property {string} [pageId]
 * @property {string} [collectionId]
 * @property {string} [itemId]
 */

/** Convert a URL path into the file the static host should serve. */
function fileFor(path) {
  const clean = path.replace(/^\/+/, '');
  return clean.endsWith('.html') ? clean : `${clean}index.html`;
}

/**
 * Every public route for a site.
 * @returns {Route[]}
 */
export function listRoutes(bundle, registry) {
  const base = bundle.site.basePath;
  const routes = [];

  for (const page of Object.values(bundle.pages)) {
    if (page.hidden) continue;
    if (page.$id === '404') {
      routes.push({ kind: 'notFound', pageId: '404', path: `${base}404.html`, file: fileFor(`${base}404.html`) });
      continue;
    }
    const slug = pageSlug(page);
    const path = `${base}${slug ? `${slug}/` : ''}`;
    routes.push({ kind: 'page', pageId: page.$id, path, file: fileFor(path) });
  }

  for (const config of bundle.site.collections) {
    const type = registry.collections.get(config.type);
    if (!type?.detailPage) continue;
    for (const item of Object.values(bundle.collections[config.id] || {})) {
      if (item.hidden) continue;
      const path = `${base}${config.route || config.id}/${itemSlug(item)}/`;
      routes.push({ kind: 'item', collectionId: config.id, itemId: item.$id, path, file: fileFor(path) });
    }
  }
  return routes;
}

/** Title + intro shown at the top of inner pages. */
function pageHeader(page, ctx) {
  return html`<header class="page-header">
    <div class="container">
      ${page.eyebrow ? html`<p class="eyebrow">${page.eyebrow}</p>` : ''}
      <h1 class="page-header__title">${page.title}</h1>
      ${page.intro ? html`<div class="page-header__intro prose">${ctx.md(page.intro)}</div>` : ''}
    </div>
  </header>`;
}

/** Render a page's sections (shared by full documents and admin previews). */
export function renderSections(page, ctx) {
  const sections = page.sections || [];
  if (!sections.length && ctx.mode === 'preview') {
    return html`<div class="container preview-empty">This page has no sections yet — add one from the editor.</div>`;
  }
  return sections.map((block, index) => {
    if (block.hidden) {
      return ctx.mode === 'preview'
        ? html`<div class="container preview-hidden" data-section-id="${block.id}">Hidden section · ${block.type}</div>`
        : '';
    }
    return wrapSection(block, ctx.renderBlock(block, index), { index });
  });
}

/**
 * Render a page by id into a full HTML document.
 * @param {RenderOptions} [opts]
 */
export function renderPageHtml(bundle, registry, pageId, opts = {}) {
  const page = bundle.pages[pageId];
  if (!page) throw new Error(`Unknown page "${pageId}"`);
  const ctx = createContext({ bundle, registry, mode: opts.mode, mediaUrl: opts.mediaUrl, page });
  const isHome = pageId === 'home';
  const is404 = pageId === '404';
  const showHeader = !isHome && !is404 && page.showHeader !== false;
  const path = is404 ? ctx.url('404.html') : ctx.pageUrl(pageId);
  const { site } = bundle;

  const body = html`${showHeader ? pageHeader(page, ctx) : ''}${renderSections(page, ctx)}`;
  const title = isHome ? (site.tagline ? `${site.title} — ${site.tagline}` : site.title) : `${page.title || 'Untitled'} — ${site.title}`;

  return renderDocument(ctx, body, {
    title,
    description: page.description || (page.intro ? truncate(plainText(page.intro), 180) : ''),
    image: page.image,
    path,
    noindex: page.noindex || is404,
    bodyClass: `page page--${pageId}`,
    assets: opts.assets,
    extraHead: opts.extraHead,
  });
}

/**
 * Render a collection item's detail page.
 * @param {RenderOptions} [opts]
 */
export function renderItemHtml(bundle, registry, collectionId, itemId, opts = {}) {
  const item = bundle.collections[collectionId]?.[itemId];
  if (!item) throw new Error(`Unknown item "${collectionId}/${itemId}"`);
  const ctx = createContext({ bundle, registry, mode: opts.mode, mediaUrl: opts.mediaUrl, item });
  const type = ctx.collectionType(collectionId);
  if (!type?.renderPage) throw new Error(`Collection "${collectionId}" has no detail pages`);

  const title = type.titleOf ? type.titleOf(item) : item.title;
  return renderDocument(ctx, type.renderPage(item, ctx), {
    title: `${title || 'Untitled'} — ${bundle.site.title}`,
    description: item.summary || truncate(plainText(item.body), 180),
    image: item.cover || item.image || item.poster,
    path: ctx.itemUrl(item),
    type: 'article',
    bodyClass: `page page--item page--${type.type}`,
    assets: opts.assets,
    extraHead: opts.extraHead,
  });
}

/** Render any route returned by listRoutes(). */
export function renderRoute(bundle, registry, route, opts = {}) {
  if (route.kind === 'item') return renderItemHtml(bundle, registry, route.collectionId, route.itemId, opts);
  return renderPageHtml(bundle, registry, route.pageId, opts);
}
