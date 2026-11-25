/**
 * @file header.js
 * Site header: brand, main navigation, theme switcher and mobile menu.
 * Interactive behaviour lives in public/js/features/{nav,theme}.js.
 */
import { html, attrs } from '../core/html.js';
import { renderSocials } from './socials.js';

/** Two-letter monogram from a site title ("Sullivan Smith" → "SS"). */
export function initials(title) {
  const words = String(title || '?').trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0]?.slice(0, 2) || '?';
  return letters.toUpperCase();
}

/** The three-way Light / System / Dark switch. */
export function themeToggle(ctx, { className = '' } = {}) {
  const option = (value, iconName, label) =>
    html`<button type="button" role="radio" aria-checked="false" data-theme-value="${value}" title="${label}" aria-label="${label}">${ctx.icon(iconName, { size: 16 })}</button>`;
  return html`<div class="theme-toggle ${className}" role="radiogroup" aria-label="Color theme" data-feature="theme-toggle">
    <span class="theme-toggle__thumb" aria-hidden="true"></span>
    ${option('light', 'sun', 'Light theme')}${option('system', 'monitor', 'Match system')}${option('dark', 'moon', 'Dark theme')}
  </div>`;
}

/** Resolve nav entries into { label, href, external, current }. */
export function navItems(ctx, currentPath) {
  return (ctx.site.nav || [])
    .filter((item) => item && item.label)
    .map((item) => {
      const href = ctx.link(item.link);
      const external = ctx.isExternal(item.link);
      const current = !external && href !== '#' && (href === currentPath || (href !== ctx.url('') && currentPath.startsWith(href)));
      const download = item.link === 'resume' || /\.pdf$/i.test(href);
      return { label: item.label, href, external, current, download, style: item.style };
    });
}

function navLink(item) {
  return html`<a${attrs({
    href: item.href,
    class: item.style === 'button' ? 'nav-link nav-link--button' : 'nav-link',
    'aria-current': item.current && 'page',
    target: (item.external || item.download) && '_blank',
    rel: item.external && 'noopener noreferrer',
  })}>${item.label}</a>`;
}

/**
 * @param {object} ctx render context
 * @param {string} currentPath URL path of the page being rendered
 */
export function renderHeader(ctx, currentPath) {
  const { site } = ctx;
  const items = navItems(ctx, currentPath);
  const brand = site.logo
    ? html`<img class="brand-logo" src="${ctx.media(site.logo)}" alt="" width="32" height="32">`
    : html`<span class="brand-mark" aria-hidden="true">${initials(site.title)}</span>`;

  return html`<header class="site-header" data-feature="header">
    <div class="container site-header__inner">
      <a class="brand" href="${ctx.url('')}" aria-label="${site.title} — home">${brand}<span class="brand-name">${site.title}</span></a>
      ${items.length ? html`<nav class="site-nav" aria-label="Main"><ul>${items.map((i) => html`<li>${navLink(i)}</li>`)}</ul></nav>` : ''}
      <div class="site-header__actions">
        ${themeToggle(ctx)}
        ${items.length
          ? html`<button type="button" class="icon-button nav-toggle" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu" data-feature="nav-toggle">
              <span class="nav-toggle__open">${ctx.icon('menu')}</span><span class="nav-toggle__close">${ctx.icon('x')}</span>
            </button>`
          : ''}
      </div>
    </div>
  </header>
  ${/* The mobile menu sits outside <header>: the header's backdrop-filter would otherwise trap this fixed panel inside it. */ ''}
  ${items.length
    ? html`<div class="mobile-nav" id="mobile-nav" hidden>
        <nav aria-label="Mobile"><ul>${items.map((i) => html`<li>${navLink(i)}</li>`)}</ul></nav>
        <div class="mobile-nav__footer">${themeToggle(ctx, { className: 'theme-toggle--large' })}${renderSocials(site.socials, ctx)}</div>
      </div>`
    : ''}`;
}
