/**
 * @file fields/media.js
 * Image and file fields. Shows a thumbnail (or file chip) with Replace /
 * Remove, and accepts files dropped straight onto it.
 * Values are site-relative references like "media/photo.webp".
 */
import { h, icon } from '../lib/dom.js';
import { openMediaPicker, uploadFiles, mediaThumb } from '../components/media.js';

function mediaField(kind) {
  return {
    render: ({ field, value, set, fctx }) => {
      const { app } = fctx;
      const root = h(`div.media-field.media-field--${kind}`);

      const choose = async () => {
        const ref = await openMediaPicker(app, { kind, accept: field.accept });
        if (ref) update(ref);
      };
      const update = (ref) => {
        value = ref;
        set(ref);
        draw();
      };

      const draw = () => {
        if (!value) {
          root.replaceChildren(
            h(
              'button.media-field__empty',
              { type: 'button', onclick: choose },
              icon(kind === 'image' ? 'image' : 'file', 20),
              h('span', h('strong', kind === 'image' ? 'Choose an image' : 'Choose a file'), h('small', 'or drop one here')),
            ),
          );
          return;
        }
        root.replaceChildren(
          mediaThumb(app, value, { size: kind === 'image' ? 'lg' : 'sm' }),
          h(
            'div.media-field__meta',
            h('span.media-field__name', value.split('/').pop()),
            h(
              'div.media-field__actions',
              h('button.btn.btn--sm', { type: 'button', onclick: choose }, 'Replace'),
              h('button.btn.btn--sm.btn--ghost', { type: 'button', onclick: () => update('') }, 'Remove'),
            ),
          ),
        );
      };

      // Drag & drop upload
      root.addEventListener('dragover', (e) => {
        e.preventDefault();
        root.classList.add('is-dragging');
      });
      root.addEventListener('dragleave', () => root.classList.remove('is-dragging'));
      root.addEventListener('drop', async (e) => {
        e.preventDefault();
        root.classList.remove('is-dragging');
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;
        const [ref] = await uploadFiles(app, [file]);
        if (ref) update(ref);
      });

      draw();
      return root;
    },
  };
}

export const image = mediaField('image');
export const file = mediaField('file');
