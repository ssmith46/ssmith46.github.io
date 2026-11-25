/**
 * @file gallery.js
 * Block: Gallery — a grid of photos with captions. Clicking a photo opens it
 * full-screen (public/js/features/lightbox.js).
 */
import { html, cx } from '../../core/html.js';
import { sectionHeading } from '../../core/ui.js';

export default {
  type: 'gallery',
  label: 'Gallery',
  icon: 'images',
  description: 'Photos in a grid or mosaic, with captions and full-screen viewing.',

  fields: [
    { key: 'eyebrow', type: 'text', label: 'Small heading' },
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'intro', type: 'markdown', label: 'Introduction', rows: 2 },
    {
      key: 'layout',
      type: 'select',
      label: 'Layout',
      width: 'half',
      options: [
        { value: 'grid', label: 'Even grid' },
        { value: 'mosaic', label: 'Mosaic' },
      ],
    },
    {
      key: 'columns',
      type: 'select',
      label: 'Columns',
      width: 'half',
      options: [
        { value: '3', label: '3' },
        { value: '2', label: '2' },
        { value: '4', label: '4' },
        { value: '1', label: '1 (large)' },
      ],
    },
    {
      key: 'images',
      type: 'list',
      label: 'Photos',
      addLabel: 'Add photo',
      itemLabel: (i) => i.caption || i.alt || i.image?.split('/').pop(),
      fields: [
        { key: 'image', type: 'image', label: 'Photo', required: true },
        { key: 'alt', type: 'text', label: 'Description', help: 'For screen readers.' },
        { key: 'caption', type: 'text', label: 'Caption' },
      ],
    },
  ],

  defaults: () => ({ layout: 'grid', columns: '3', images: [] }),

  render(p, ctx) {
    const images = (p.images || []).filter((i) => i.image);
    if (!images.length) return ctx.mode === 'preview' ? html`<div class="container preview-empty">Add photos to this gallery.</div>` : '';
    return html`<div class="container gallery-block">
      ${sectionHeading(p, ctx)}
      <ul class="${cx('gallery', `gallery--${p.layout || 'grid'}`)}" style="--cols:${Number(p.columns) || 3}" data-feature="lightbox" data-reveal>
        ${images.map(
          (img) => html`<li class="gallery__item">
            <figure>
              <a href="${ctx.media(img.image)}" class="gallery__link" data-lightbox data-caption="${img.caption || ''}">
                <img src="${ctx.media(img.image)}" alt="${img.alt || img.caption || ''}" loading="lazy" decoding="async">
              </a>
              ${img.caption ? html`<figcaption>${img.caption}</figcaption>` : ''}
            </figure>
          </li>`,
        )}
      </ul>
    </div>`;
  },
};
