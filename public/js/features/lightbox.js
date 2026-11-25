/**
 * @file features/lightbox.js
 * Full-screen photo viewer for galleries. Uses the native <dialog> element
 * (Escape to close, focus trapping for free). Arrow keys move between photos.
 */

let dialog;

function ensureDialog() {
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Photo viewer');
  dialog.innerHTML = `
    <button type="button" class="lightbox__close" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
    <figure><img alt=""><figcaption></figcaption></figure>`;
  document.body.append(dialog);
  dialog.querySelector('.lightbox__close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.tagName === 'FIGURE') dialog.close();
  });
  return dialog;
}

function show(links, index) {
  const d = ensureDialog();
  const link = links[index];
  const img = d.querySelector('img');
  img.src = link.href;
  img.alt = link.querySelector('img')?.alt || '';
  d.querySelector('figcaption').textContent = link.dataset.caption || '';
  d.dataset.index = String(index);
  d._links = links;
  if (!d.open) d.showModal();
}

export default {
  name: 'lightbox',
  init() {
    document.querySelectorAll('[data-feature="lightbox"]').forEach((gallery) => {
      const links = [...gallery.querySelectorAll('a[data-lightbox]')];
      links.forEach((link, i) =>
        link.addEventListener('click', (e) => {
          if (typeof HTMLDialogElement === 'undefined') return; // fall back to opening the image
          e.preventDefault();
          show(links, i);
        }),
      );
    });

    document.addEventListener('keydown', (e) => {
      if (!dialog?.open || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const links = dialog._links;
      const i = Number(dialog.dataset.index) + (e.key === 'ArrowRight' ? 1 : -1);
      show(links, (i + links.length) % links.length);
    });
  },
};
