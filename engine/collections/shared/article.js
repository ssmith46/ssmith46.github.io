/**
 * @file shared/article.js
 * Detail-page layout shared by collection types that have their own pages
 * (projects, write-ups, movie reviews…). Keeps long-form pages consistent.
 */
import { html } from '../../core/html.js';
import { tags as tagList, buttons } from '../../core/ui.js';
import { coverArt } from '../../core/artwork.js';

/**
 * @param {object} ctx
 * @param {object} a
 * @param {string} a.backHref
 * @param {string} a.backLabel
 * @param {string} [a.eyebrow]
 * @param {string} a.title
 * @param {string} [a.summary]
 * @param {Array<string>} [a.meta]       small facts shown under the title
 * @param {string[]} [a.tags]
 * @param {object[]} [a.actions]         buttons (see core/ui.js)
 * @param {string} [a.cover]             media ref
 * @param {string} [a.coverAlt]
 * @param {boolean} [a.generatedCover]   show generated art when there's no cover
 * @param {'wide'|'poster'} [a.coverStyle]
 * @param {string} [a.body]              Markdown
 * @param {any} [a.aside]                extra SafeHtml under the body
 * @param {{ prev?: object, next?: object }} [a.siblings]  { href, title }
 */
export function article(ctx, a) {
  const cover = a.cover
    ? html`<img src="${ctx.media(a.cover)}" alt="${a.coverAlt || ''}" decoding="async">`
    : a.generatedCover
      ? coverArt(a.title)
      : '';
  const meta = (a.meta || []).filter(Boolean);

  return html`<article class="article article--${a.coverStyle || 'wide'}">
    <header class="container article__header" data-reveal>
      <a class="back-link" href="${a.backHref}">${ctx.icon('arrow-left', { size: 16 })}<span>${a.backLabel}</span></a>
      <div class="article__heading">
        ${a.coverStyle === 'poster' && cover ? html`<div class="article__poster">${cover}</div>` : ''}
        <div>
          ${a.eyebrow ? html`<p class="eyebrow">${a.eyebrow}</p>` : ''}
          <h1 class="article__title">${a.title}</h1>
          ${a.summary ? html`<p class="article__summary">${a.summary}</p>` : ''}
          ${meta.length ? html`<ul class="article__meta">${meta.map((m) => html`<li>${m}</li>`)}</ul>` : ''}
          ${tagList(a.tags)}
          ${buttons(a.actions, ctx, 'button-row article__actions')}
        </div>
      </div>
    </header>
    ${a.coverStyle !== 'poster' && cover ? html`<div class="container container--wide article__cover" data-reveal>${cover}</div>` : ''}
    ${a.body ? html`<div class="container article__body prose prose--lg" data-reveal>${ctx.md(a.body)}</div>` : ''}
    ${a.aside || ''}
    ${a.siblings && (a.siblings.prev || a.siblings.next)
      ? html`<nav class="container article__siblings" aria-label="More">
          ${a.siblings.prev ? html`<a class="sibling sibling--prev" href="${a.siblings.prev.href}"><span class="sibling__dir">${ctx.icon('arrow-left', { size: 16 })} Previous</span><span class="sibling__title">${a.siblings.prev.title}</span></a>` : html`<span></span>`}
          ${a.siblings.next ? html`<a class="sibling sibling--next" href="${a.siblings.next.href}"><span class="sibling__dir">Next ${ctx.icon('arrow-right', { size: 16 })}</span><span class="sibling__title">${a.siblings.next.title}</span></a>` : ''}
        </nav>`
      : ''}
  </article>`;
}

/**
 * Previous/next items around `item` in its collection's sort order.
 * @returns {{ prev?: { href: string, title: string }, next?: { href: string, title: string } }}
 */
export function siblingsOf(item, ctx, titleOf = (i) => i.title) {
  const list = ctx.items(item.$collection);
  const i = list.findIndex((x) => x.$id === item.$id);
  if (i === -1) return {};
  const pick = (x) => (x ? { href: ctx.itemUrl(x), title: titleOf(x) } : undefined);
  return { prev: pick(list[i - 1]), next: pick(list[i + 1]) };
}

/** URL of the page listing a collection (falls back to home). */
export function collectionHome(item, ctx) {
  const config = ctx.collection(item.$collection);
  const route = config?.route || config?.id;
  const page = Object.values(ctx.bundle.pages).find((p) => p.slug === route || p.$id === route);
  return { href: page ? ctx.pageUrl(page.$id) : ctx.url(''), label: config?.label || 'Back' };
}
