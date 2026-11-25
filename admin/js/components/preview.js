/**
 * @file components/preview.js
 * Live preview pane. Renders pages with the *same engine* the build uses, so
 * what you see while editing is exactly what visitors get.
 *
 * - Double-buffered iframes: the next render loads off-screen and swaps in
 *   when ready, keeping the scroll position — no flicker while typing.
 * - Desktop / tablet / phone widths (scaled to fit) and light / dark toggle.
 * - Click any section in the preview to jump to its settings.
 */
import { h, icon, debounce } from '../lib/dom.js';
import { segmented } from '../lib/ui.js';

const MEDIA_TOKEN = '/__media__/';
const DEVICES = { desktop: 1280, tablet: 834, mobile: 390 };
const MODE_KEY = 'admin-preview-mode';
const DEVICE_KEY = 'admin-preview-device';

/** Script + styles injected into previews (never into the real site). */
const PREVIEW_HEAD = `<style>
  [data-section-id]{cursor:pointer;transition:outline-color .2s}
  [data-section-id]:hover{outline:2px dashed color-mix(in srgb,var(--accent) 55%,transparent);outline-offset:-2px}
  .is-preview-focus{outline:2px solid var(--accent)!important;outline-offset:-2px}
</style>
<script>
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (a) e.preventDefault();
    var s = e.target.closest('[data-section-id]');
    if (s) parent.postMessage({ type: 'preview:section', id: s.getAttribute('data-section-id') }, '*');
  }, true);
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'preview:focus') return;
    var el = document.querySelector('[data-section-id="' + e.data.id + '"]');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('is-preview-focus');
    setTimeout(function () { el.classList.remove('is-preview-focus'); }, 1400);
  });
</script>`;

/** Media options for engine renders inside the preview. */
export const previewRenderOptions = {
  mode: 'preview',
  mediaUrl: (ref) => `${MEDIA_TOKEN}${ref}`,
  extraHead: PREVIEW_HEAD,
};

/**
 * @param {object} app
 * @param {{ render: () => string, onSectionClick?: (id: string) => void }} opts
 *   render() returns a full HTML document rendered with previewRenderOptions.
 */
export function createPreview(app, { render, onSectionClick }) {
  let mode = localStorage.getItem(MODE_KEY) || 'auto';
  let device = localStorage.getItem(DEVICE_KEY) || 'desktop';
  let renderId = 0;

  const frames = [h('iframe.preview__frame', { title: 'Preview' }), h('iframe.preview__frame', { title: 'Preview', class: 'is-back' })];
  let front = 0;
  const stage = h('div.preview__stage', frames);
  const viewport = h('div.preview__viewport', stage);
  const status = h('span.preview__status');

  const toolbar = h(
    'div.preview__toolbar',
    h('span.preview__title', icon('eye', 15), 'Preview', status),
    segmented(
      [
        { value: 'desktop', icon: 'monitor', label: '' },
        { value: 'tablet', icon: 'tablet', label: '' },
        { value: 'mobile', icon: 'smartphone', label: '' },
      ],
      device,
      (v) => {
        device = v;
        localStorage.setItem(DEVICE_KEY, v);
        layout();
      },
      { label: 'Preview width' },
    ),
    segmented(
      [
        { value: 'light', icon: 'sun', label: '' },
        { value: 'auto', icon: 'monitor', label: '' },
        { value: 'dark', icon: 'moon', label: '' },
      ],
      mode,
      (v) => {
        mode = v;
        localStorage.setItem(MODE_KEY, v);
        frames.forEach(applyMode);
      },
      { label: 'Preview colors' },
    ),
  );
  const el = h('div.preview', toolbar, viewport);

  function applyMode(frame) {
    const doc = frame.contentDocument?.documentElement;
    if (!doc) return;
    if (mode === 'auto') doc.removeAttribute('data-theme');
    else doc.setAttribute('data-theme', mode);
  }

  /** Scale the fixed-width frame to fit the pane. */
  function layout() {
    const width = DEVICES[device];
    const avail = viewport.clientWidth - 32;
    const scale = Math.min(1, avail / width);
    const height = (viewport.clientHeight - 32) / scale;
    stage.style.width = `${width}px`;
    stage.style.height = `${height}px`;
    stage.style.transform = `scale(${scale})`;
    stage.dataset.device = device;
  }
  const ro = new ResizeObserver(layout);
  ro.observe(viewport);

  /** Swap media placeholders for real URLs (object URLs or the dev server). */
  async function resolveMedia(htmlText) {
    const refs = new Set(htmlText.match(new RegExp(`${MEDIA_TOKEN}[^"'\\s)<>&]+`, 'g')) || []);
    const urls = new Map();
    await Promise.all(
      [...refs].map(async (token) => {
        try {
          urls.set(token, await app.ws.mediaUrl(app.siteId, token.slice(MEDIA_TOKEN.length)));
        } catch {
          urls.set(token, '');
        }
      }),
    );
    return htmlText.replace(new RegExp(`${MEDIA_TOKEN}[^"'\\s)<>&]+`, 'g'), (t) => urls.get(t) ?? t);
  }

  async function refreshNow() {
    const id = ++renderId;
    let htmlText;
    try {
      htmlText = await resolveMedia(render());
    } catch (err) {
      htmlText = `<!doctype html><body style="font:14px system-ui;padding:2rem;color:#b91c1c">Preview error: ${String(err.message).replace(/</g, '&lt;')}</body>`;
    }
    if (id !== renderId) return; // a newer render superseded this one
    const back = frames[1 - front];
    const current = frames[front];
    const scrollY = current.contentWindow?.scrollY || 0;
    status.textContent = '· updating';
    back.onload = () => {
      if (id !== renderId) return;
      applyMode(back);
      back.contentWindow?.scrollTo(0, scrollY);
      back.classList.remove('is-back');
      current.classList.add('is-back');
      front = 1 - front;
      status.textContent = '';
    };
    back.srcdoc = htmlText;
  }

  const refresh = debounce(refreshNow, 220);

  const onMessage = (e) => {
    if (e.data?.type === 'preview:section' && frames.some((f) => f.contentWindow === e.source)) onSectionClick?.(e.data.id);
  };
  window.addEventListener('message', onMessage);

  layout();
  refreshNow();

  return {
    el,
    refresh,
    refreshNow,
    /** Scroll the preview to a section and flash it. */
    focusSection(id) {
      frames[front].contentWindow?.postMessage({ type: 'preview:focus', id }, '*');
    },
    destroy() {
      ro.disconnect();
      window.removeEventListener('message', onMessage);
      renderId++;
    },
  };
}
