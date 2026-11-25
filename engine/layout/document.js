/**
 * @file document.js
 * Wraps rendered page content in a complete HTML document: <head> metadata,
 * theme tokens, fonts, header, footer and the small client-side script.
 */
import { html, raw, attrs } from '../core/html.js';
import { themeCss } from '../themes/css.js';
import { getPreset } from '../themes/presets.js';
import { getFontPair, fontStylesheetUrl } from '../themes/fonts.js';
import { truncate } from '../core/utils.js';
import { renderHeader, initials } from './header.js';
import { renderFooter } from './footer.js';

/**
 * Runs before first paint so the page never flashes the wrong theme.
 * Kept tiny and dependency-free on purpose.
 */
const NO_FLASH_SCRIPT =
  "(function(){var d=document.documentElement;d.classList.add('js');try{var p=localStorage.getItem('theme-preference');" +
  "if(p==='light'||p==='dark')d.setAttribute('data-theme',p);else if(p==='system')d.removeAttribute('data-theme');}catch(e){}})();";

/** Monogram favicon as an SVG data URI (used when no favicon is uploaded). */
export function monogramFavicon(title, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${color}"/><text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="28" font-weight="700" fill="#fff">${initials(title)}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Make a URL absolute when the site's public URL is known (for social cards). */
function absolute(ctx, url) {
  if (!url || /^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  const origin = String(ctx.site.url || '').replace(/\/+$/, '');
  return origin ? `${origin}${url.startsWith('/') ? '' : '/'}${url}` : url;
}

/**
 * @typedef {object} DocumentOptions
 * @property {string} title           full <title>
 * @property {string} [description]   meta description
 * @property {string} [image]         media ref or URL for social cards
 * @property {string} path            URL path of this page (for nav + canonical)
 * @property {'website'|'article'} [type]
 * @property {boolean} [noindex]
 * @property {string} [bodyClass]
 * @property {{ base?: string, version?: string }} [assets]
 * @property {string} [extraHead]     trusted markup appended to <head> (dev/preview)
 */

/**
 * @param {object} ctx render context
 * @param {import('../core/html.js').SafeHtml} body
 * @param {DocumentOptions} options
 */
export function renderDocument(ctx, body, options) {
  const { site } = ctx;
  const theme = site.theme || {};
  const preset = getPreset(theme.preset);
  const fonts = getFontPair(theme.fonts);
  const fontUrl = fontStylesheetUrl(fonts);
  const assetBase = options.assets?.base ?? '/assets/';
  const v = options.assets?.version ? `?v=${options.assets.version}` : '';
  const description = truncate(options.description || site.description || site.tagline || '', 200);
  const image = options.image ? ctx.media(options.image) : site.shareImage ? ctx.media(site.shareImage) : '';
  const favicon = site.favicon ? ctx.media(site.favicon) : monogramFavicon(site.title, theme.accent || preset.light.accent);
  const forcedMode = theme.defaultMode === 'light' || theme.defaultMode === 'dark' ? theme.defaultMode : null;
  const noindex = options.noindex || site.indexable === false;
  const canonical = site.url ? absolute(ctx, options.path) : '';

  return `<!doctype html>\n${html`<html${attrs({
    lang: site.language || 'en',
    'data-theme': forcedMode,
    'data-default-theme': theme.defaultMode || 'system',
    'data-motion': theme.motion === false ? 'off' : 'on',
    'data-preview': ctx.mode === 'preview' ? 'true' : null,
  })}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${options.title}</title>
${description ? html`<meta name="description" content="${description}">` : ''}
${noindex ? html`<meta name="robots" content="noindex, nofollow">` : ''}
${canonical ? html`<link rel="canonical" href="${canonical}">` : ''}
<meta property="og:type" content="${options.type || 'website'}">
<meta property="og:title" content="${options.title}">
<meta property="og:site_name" content="${site.title}">
${description ? html`<meta property="og:description" content="${description}">` : ''}
${canonical ? html`<meta property="og:url" content="${canonical}">` : ''}
${image ? html`<meta property="og:image" content="${absolute(ctx, image)}"><meta name="twitter:card" content="summary_large_image">` : ''}
<meta name="theme-color" content="${preset.light.bg}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="${preset.dark.bg}" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${favicon}">
<script>${raw(NO_FLASH_SCRIPT)}</script>
${fontUrl ? html`<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${fontUrl}">` : ''}
<link rel="stylesheet" href="${assetBase}site.css${v}">
<style id="theme-tokens">${raw(themeCss(theme))}</style>
<script type="module" src="${assetBase}js/site.js${v}"></script>
${raw(options.extraHead || '')}
</head>
<body${attrs({ class: options.bodyClass, id: 'top' })}>
<a class="skip-link" href="#main">Skip to content</a>
${renderHeader(ctx, options.path)}
<main id="main" class="site-main">
${body}
</main>
${renderFooter(ctx)}
</body>
</html>`}\n`;
}
