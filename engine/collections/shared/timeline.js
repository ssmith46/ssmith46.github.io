/**
 * @file shared/timeline.js
 * Vertical timeline used by experience and education (and anything else with
 * date ranges). Collection types map their items to plain "entries" first,
 * so this renderer stays generic.
 */
import { html, attrs, cx } from '../../core/html.js';
import { tags as tagList } from '../../core/ui.js';

/**
 * @typedef {object} TimelineEntry
 * @property {string} title          e.g. role or degree
 * @property {string} [org]          organisation / school
 * @property {string} [orgUrl]
 * @property {string} [location]
 * @property {string} [period]       formatted date range
 * @property {boolean} [current]     highlights the marker
 * @property {string} [summary]      Markdown
 * @property {string[]} [bullets]
 * @property {string[]} [tags]
 * @property {string} [logo]         media ref
 * @property {string} [aside]        small detail (e.g. GPA)
 */

/** @param {TimelineEntry[]} entries */
export function timeline(entries, ctx) {
  return html`<ol class="timeline">
    ${entries.map(
      (e) => html`<li class="${cx('timeline__item', e.current && 'is-current')}">
        <span class="timeline__marker" aria-hidden="true"></span>
        <div class="timeline__when">${e.period}</div>
        <div class="timeline__card">
          <div class="timeline__head">
            ${e.logo ? html`<img class="timeline__logo" src="${ctx.media(e.logo)}" alt="" loading="lazy">` : ''}
            <div>
              <h3 class="timeline__title">${e.title}</h3>
              <p class="timeline__org">
                ${e.org ? (e.orgUrl ? html`<a${attrs({ href: e.orgUrl, target: '_blank', rel: 'noopener noreferrer' })}>${e.org}</a>` : e.org) : ''}
                ${e.location ? html`<span class="timeline__location">${ctx.icon('map-pin', { size: 14 })}${e.location}</span>` : ''}
              </p>
            </div>
            ${e.aside ? html`<span class="timeline__aside">${e.aside}</span>` : ''}
          </div>
          ${e.summary ? html`<div class="prose timeline__summary">${ctx.md(e.summary)}</div>` : ''}
          ${e.bullets?.length ? html`<ul class="timeline__bullets">${e.bullets.filter(Boolean).map((b) => html`<li>${ctx.mdInline(b)}</li>`)}</ul>` : ''}
          ${tagList(e.tags)}
        </div>
      </li>`,
    )}
  </ol>`;
}

/** Compact two-column list (period | title · org). */
export function compactList(entries) {
  return html`<ul class="compact-list">
    ${entries.map(
      (e) => html`<li class="compact-list__item">
        <span class="compact-list__when">${e.period}</span>
        <span class="compact-list__what"><strong>${e.title}</strong>${e.org ? html`<span class="compact-list__org"> · ${e.org}</span>` : ''}</span>
      </li>`,
    )}
  </ul>`;
}
