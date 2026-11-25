/**
 * @file collection.js
 * Block: Collection — shows items from any collection (projects, experience,
 * write-ups, runs, movies…). The *collection type* decides how items look:
 * this block simply asks it for the chosen layout. That's what lets new
 * collection types appear on pages with zero changes here.
 */
import { html } from '../../core/html.js';
import { sectionHeading, button } from '../../core/ui.js';

export default {
  type: 'collection',
  label: 'Collection',
  icon: 'grid',
  description: 'Projects, experience, write-ups or any other list you keep.',

  fields: [
    { key: 'collection', type: 'collection', label: 'Show items from', required: true },
    { key: 'layout', type: 'select', label: 'Layout', optionsFrom: 'collectionLayouts' },
    { key: 'eyebrow', type: 'text', label: 'Small heading' },
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'intro', type: 'markdown', label: 'Introduction', rows: 3 },
    { key: 'limit', type: 'number', label: 'Maximum items', min: 0, help: 'Leave empty to show everything.', width: 'half' },
    { key: 'featuredOnly', type: 'toggle', label: 'Featured items only', width: 'half' },
    { key: 'tag', type: 'text', label: 'Only items tagged', placeholder: 'e.g. Python' },
    { key: 'moreLabel', type: 'text', label: '“See all” button', placeholder: 'All projects', width: 'half' },
    { key: 'moreLink', type: 'link', label: '“See all” goes to', width: 'half', when: (v) => v.moreLabel },
    { key: 'emptyText', type: 'text', label: 'Text when empty', placeholder: 'Coming soon.' },
  ],

  defaults: () => ({ collection: '', layout: '', limit: null, featuredOnly: false }),

  render(p, ctx) {
    const config = ctx.collection(p.collection);
    const type = ctx.collectionType(p.collection);
    if (!config || !type) {
      return ctx.mode === 'preview' ? html`<div class="container preview-empty">Choose a collection to show.</div>` : '';
    }
    const layouts = type.layouts || {};
    const layoutId = layouts[p.layout] ? p.layout : Object.keys(layouts)[0];
    const layout = layouts[layoutId];
    const items = ctx.items(p.collection, { limit: p.limit || undefined, featured: p.featuredOnly, tag: p.tag || undefined });

    let body;
    if (items.length) body = layout.render(items, ctx, p);
    else if (p.emptyText) body = html`<p class="empty-note">${p.emptyText}</p>`;
    else if (ctx.mode === 'preview') body = html`<p class="empty-note">No ${config.label?.toLowerCase() || 'items'} to show yet.</p>`;
    else return '';

    return html`<div class="container collection-block collection-block--${type.type}">
      ${sectionHeading(p, ctx)}
      <div data-reveal>${body}</div>
      ${p.moreLabel ? html`<div class="collection-block__more">${button({ label: p.moreLabel, link: p.moreLink || `page:${config.id}`, style: 'secondary', icon: 'arrow-right' }, ctx)}</div>` : ''}
    </div>`;
  },
};
