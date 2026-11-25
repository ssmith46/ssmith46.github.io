/**
 * @file shared/cards.js
 * Card grid and row list used by projects, write-ups and similar types.
 * Types map items to plain "card" objects, keeping this renderer generic.
 */
import { html, attrs, cx } from '../../core/html.js';
import { tags as tagList } from '../../core/ui.js';
import { coverArt } from '../../core/artwork.js';

/**
 * @typedef {object} Card
 * @property {string} title
 * @property {string} href          detail page or external URL
 * @property {string} [meta]        small line above the title
 * @property {string} [summary]
 * @property {string[]} [tags]
 * @property {string} [image]       media ref
 * @property {string} [imageAlt]
 * @property {boolean} [featured]
 */

/** @param {Card[]} cards */
export function cardGrid(cards, ctx, { className = '', aspect = 'wide', generated = true } = {}) {
  return html`<ul class="${cx('card-grid', className)}">
    ${cards.map(
      (c) => html`<li>
        <article class="${cx('card', c.featured && 'card--featured')}">
          <div class="${cx('card__media', `card__media--${aspect}`)}">
            ${c.image ? html`<img src="${ctx.media(c.image)}" alt="${c.imageAlt || ''}" loading="lazy" decoding="async">` : generated ? coverArt(c.title) : ''}
          </div>
          <div class="card__body">
            ${c.meta ? html`<p class="card__meta">${c.meta}</p>` : ''}
            <h3 class="card__title"><a${attrs(linkAttrs(c.href, ctx))} class="card__link">${c.title}</a></h3>
            ${c.summary ? html`<p class="card__summary">${c.summary}</p>` : ''}
            ${tagList(c.tags, { limit: 4 })}
          </div>
          <span class="card__arrow" aria-hidden="true">${ctx.icon(ctx.isExternal(c.href) ? 'arrow-up-right' : 'arrow-right', { size: 18 })}</span>
        </article>
      </li>`,
    )}
  </ul>`;
}

/** Editorial row list: meta | title + summary | arrow. */
export function rowList(cards, ctx) {
  return html`<ul class="row-list">
    ${cards.map(
      (c) => html`<li>
        <a${attrs(linkAttrs(c.href, ctx))} class="row-list__item">
          <span class="row-list__meta">${c.meta}</span>
          <span class="row-list__main">
            <span class="row-list__title">${c.title}</span>
            ${c.summary ? html`<span class="row-list__summary">${c.summary}</span>` : ''}
          </span>
          <span class="row-list__arrow">${ctx.icon(ctx.isExternal(c.href) ? 'arrow-up-right' : 'arrow-right', { size: 18 })}</span>
        </a>
      </li>`,
    )}
  </ul>`;
}

function linkAttrs(href, ctx) {
  const external = ctx.isExternal(href);
  return { href: href || '#', target: external && '_blank', rel: external && 'noopener noreferrer' };
}
