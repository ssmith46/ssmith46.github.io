/**
 * @file movie.js
 * Collection type: Movie — a film diary with posters, star ratings and
 * reviews. Used by the "Movie journal" site template.
 */
import { html, attrs } from '../../core/html.js';
import { formatDate } from '../../core/utils.js';
import { article, siblingsOf, collectionHome } from '../shared/article.js';

/** Accessible 0–5 star rating. */
export function stars(rating) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  if (!r) return '';
  return html`<span class="stars" style="--rating:${r}" role="img" aria-label="${r} out of 5 stars"><span aria-hidden="true">★★★★★</span></span>`;
}

export default {
  type: 'movie',
  label: 'Movie',
  plural: 'Movies',
  icon: 'film',
  description: 'A film diary with posters, ratings and reviews.',
  detailPage: true,
  defaultSort: 'newest',

  fields: [
    { key: 'title', type: 'text', label: 'Title', required: true },
    { key: 'year', type: 'number', label: 'Release year', min: 1888, max: 2100, width: 'half' },
    { key: 'watched', type: 'date', label: 'Watched on', precision: 'day', width: 'half', default: () => new Date().toISOString().slice(0, 10) },
    { key: 'rating', type: 'number', label: 'Rating (0–5)', min: 0, max: 5, step: 0.5, width: 'half' },
    { key: 'director', type: 'text', label: 'Director', width: 'half' },
    { key: 'poster', type: 'image', label: 'Poster' },
    { key: 'tags', type: 'tags', label: 'Genres' },
    { key: 'review', type: 'markdown', label: 'Review', rows: 10 },
    { key: 'favorite', type: 'toggle', label: 'Favorite', width: 'half' },
    { key: 'rewatch', type: 'toggle', label: 'Rewatch', width: 'half' },
    { key: 'hidden', type: 'toggle', label: 'Hide from the site' },
  ],

  defaults: () => ({ title: '', rating: null, tags: [] }),

  titleOf: (item) => item.title,
  subtitleOf: (item) => [item.year, item.rating ? `${item.rating}★` : '', formatDate(item.watched, 'full')].filter(Boolean).join(' · '),
  dateOf: (item) => item.watched,
  imageOf: (item) => item.poster,

  layouts: {
    posters: {
      label: 'Poster wall',
      render: (items, ctx) => html`<ul class="poster-grid">${items.map(
        (m) => html`<li><a${attrs({ class: 'poster', href: ctx.itemUrl(m) })}>
          <span class="poster__art">${m.poster ? html`<img src="${ctx.media(m.poster)}" alt="" loading="lazy">` : html`<span class="poster__placeholder">${m.title}</span>`}
            ${m.favorite ? html`<span class="poster__fav" title="Favorite">${ctx.icon('star', { size: 14 })}</span>` : ''}</span>
          <span class="poster__title">${m.title}${m.year ? html` <span class="poster__year">${m.year}</span>` : ''}</span>
          ${stars(m.rating)}
        </a></li>`,
      )}</ul>`,
    },
    list: {
      label: 'Diary list',
      render: (items, ctx) => html`<ul class="row-list">${items.map(
        (m) => html`<li><a class="row-list__item" href="${ctx.itemUrl(m)}">
          <span class="row-list__meta">${formatDate(m.watched, 'full')}</span>
          <span class="row-list__main"><span class="row-list__title">${m.title}${m.year ? ` (${m.year})` : ''}</span>${stars(m.rating)}</span>
          <span class="row-list__arrow">${ctx.icon('arrow-right', { size: 18 })}</span>
        </a></li>`,
      )}</ul>`,
    },
  },

  renderPage(item, ctx) {
    const back = collectionHome(item, ctx);
    return article(ctx, {
      backHref: back.href,
      backLabel: back.label,
      eyebrow: item.watched ? `Watched ${formatDate(item.watched, 'full')}${item.rewatch ? ' · Rewatch' : ''}` : '',
      title: item.title,
      meta: [item.year, item.director && `Directed by ${item.director}`, stars(item.rating)],
      tags: item.tags,
      cover: item.poster,
      coverStyle: 'poster',
      body: item.review,
      siblings: siblingsOf(item, ctx),
    });
  },
};
