/**
 * @file components/media.js
 * Media helpers shared by the Media screen, image/file fields and the
 * Markdown editor: uploading (with automatic photo compression), thumbnails,
 * and the "choose a file" dialog.
 */
import { h, icon } from '../lib/dom.js';
import { modal, toast } from '../lib/ui.js';
import { prepareUpload, isImage } from '../lib/image.js';
import { bytes } from '../lib/format.js';

/**
 * Upload files to the current site's media folder.
 * @returns {Promise<string[]>} site-relative refs of the uploaded files
 */
export async function uploadFiles(app, files, { replacePath } = {}) {
  const refs = [];
  for (const file of files) {
    const close = toast(`Uploading ${file.name}…`, { timeout: 0 });
    try {
      const { blob, name } = await prepareUpload(file);
      const ref = await app.ws.uploadMedia(app.siteId, blob, name, { replacePath });
      refs.push(ref);
      close();
      toast(`${name} uploaded`, { type: 'success' });
    } catch (err) {
      close();
      toast(`Couldn’t upload ${file.name}: ${err.message}`, { type: 'error', timeout: 8000 });
    }
  }
  return refs;
}

/** Ask the browser for files. */
export function pickFiles({ accept = '', multiple = true } = {}) {
  return new Promise((resolve) => {
    const input = h('input', { type: 'file', accept, multiple, style: 'display:none' });
    input.addEventListener('change', () => {
      resolve([...input.files]);
      input.remove();
    });
    document.body.append(input);
    input.click();
  });
}

/** Thumbnail for a media reference (image preview or file chip). */
export function mediaThumb(app, ref, { size = 'md' } = {}) {
  const name = ref.split('/').pop();
  if (!isImage(ref)) {
    const ext = name.split('.').pop().toUpperCase();
    return h(`div.thumb.thumb--file.thumb--${size}`, icon('file', size === 'sm' ? 18 : 26), h('span.thumb__ext', ext));
  }
  const img = h('img', { alt: '', loading: 'lazy', decoding: 'async' });
  const box = h(`div.thumb.thumb--${size}.is-loading`, img);
  Promise.resolve(app.ws.mediaUrl(app.siteId, ref))
    .then((url) => {
      img.src = url;
      img.onload = () => box.classList.remove('is-loading');
    })
    .catch(() => box.classList.add('is-broken'));
  return box;
}

/** List a site's media as { path, ref, name, size, image }. */
export function listMedia(app, { kind } = {}) {
  return app.ws
    .mediaPaths(app.siteId)
    .map((path) => {
      const meta = app.ws.tree.get(path);
      const ref = path.slice(`content/sites/${app.siteId}/`.length);
      return { path, ref, name: ref.split('/').pop(), size: meta?.size, image: isImage(path) };
    })
    .filter((m) => kind !== 'image' || m.image)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Make an element accept dropped files. */
export function dropZone(el, onFiles) {
  el.addEventListener('dragover', (e) => {
    if (![...(e.dataTransfer?.types || [])].includes('Files')) return;
    e.preventDefault();
    el.classList.add('is-dragging');
  });
  el.addEventListener('dragleave', (e) => {
    if (!el.contains(e.relatedTarget)) el.classList.remove('is-dragging');
  });
  el.addEventListener('drop', (e) => {
    if (!e.dataTransfer?.files?.length) return;
    e.preventDefault();
    el.classList.remove('is-dragging');
    onFiles([...e.dataTransfer.files]);
  });
  return el;
}

/**
 * Dialog for choosing (or uploading) a media file.
 * @param {object} app
 * @param {{ kind?: 'image'|'file', accept?: string }} [opts]
 * @returns {Promise<string|undefined>} the chosen reference
 */
export function openMediaPicker(app, { kind = 'image', accept } = {}) {
  const acceptAttr = accept || (kind === 'image' ? 'image/*' : '');
  let off;
  return modal({
    title: kind === 'image' ? 'Choose an image' : 'Choose a file',
    size: 'lg',
    render: (close) => {
      const grid = h('div.media-grid.media-grid--picker');
      const draw = () => {
        const items = listMedia(app, { kind });
        grid.replaceChildren(
          h(
            'button.media-tile.media-tile--upload',
            {
              type: 'button',
              onclick: async () => {
                const files = await pickFiles({ accept: acceptAttr, multiple: false });
                if (!files.length) return;
                const [ref] = await uploadFiles(app, files);
                if (ref) close(ref);
              },
            },
            icon('upload', 22),
            h('span', 'Upload new'),
            h('small', 'or drop files here'),
          ),
          ...items.map((m) =>
            h(
              'button.media-tile',
              { type: 'button', title: m.name, onclick: () => close(m.ref) },
              mediaThumb(app, m.ref),
              h('span.media-tile__name', m.name),
              h('span.media-tile__size', bytes(m.size)),
            ),
          ),
        );
      };
      draw();
      off = app.ws.on('change', draw); // refresh when uploads land
      return dropZone(h('div.picker', grid), async (files) => {
        const refs = await uploadFiles(app, files);
        if (refs.length === 1) close(refs[0]);
      });
    },
  }).finally(() => off?.());
}
