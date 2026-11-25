/**
 * @file views/design.js
 * Design editor: color theme, accent, fonts, corners, default light/dark mode
 * and motion — with the home page previewed live as you click.
 * Options come straight from engine/themes, so new presets or font pairings
 * appear here automatically.
 */
import { h, icon } from '../lib/dom.js';
import { segmented } from '../lib/ui.js';
import { viewHeader } from '../components/view-header.js';
import { editorLayout } from '../components/editor-layout.js';
import { createPreview, previewRenderOptions } from '../components/preview.js';
import { renderPageHtml } from '../../../engine/core/render.js';
import { PRESETS, RADII, getPreset } from '../../../engine/themes/presets.js';
import { FONT_PAIRS } from '../../../engine/themes/fonts.js';

/** Load every font pairing once so the cards can show real type. */
function loadFontPreviews() {
  if (document.getElementById('font-previews')) return;
  const families = FONT_PAIRS.map((f) => f.google).filter(Boolean).join('&');
  document.head.append(h('link', { id: 'font-previews', rel: 'stylesheet', href: `https://fonts.googleapis.com/css2?${families}&display=swap` }));
}

export default {
  render(el, app) {
    loadFontPreviews();
    const theme = () => ({ preset: 'ember', fonts: 'technical', radius: 'soft', defaultMode: 'system', motion: true, ...(app.readSite().theme || {}) });
    const update = (patch) =>
      app.updateSite((s) => {
        s.theme = { ...theme(), ...patch };
        for (const [k, v] of Object.entries(s.theme)) if (v === '' || v == null) delete s.theme[k];
      });

    const homeId = app.bundle.pages.home ? 'home' : Object.keys(app.bundle.pages)[0];
    const preview = createPreview(app, { render: () => renderPageHtml(app.bundle, app.registry, homeId, previewRenderOptions) });

    const body = h('div.design');
    const draw = () => {
      const t = theme();
      const preset = getPreset(t.preset);
      body.replaceChildren(
        // Color theme
        h(
          'section.design-group',
          h('h2.design-group__title', 'Color theme'),
          h('p.design-group__hint', 'Each theme includes a matching light and dark version.'),
          h(
            'div.theme-grid',
            PRESETS.map((p) =>
              h(
                'button.theme-card',
                {
                  type: 'button',
                  attrs: { 'aria-pressed': String(p.id === t.preset) },
                  onclick: () => {
                    update({ preset: p.id, accent: '', accentDark: '' });
                    draw();
                  },
                },
                h(
                  'span.theme-card__swatch',
                  h('span.theme-card__half', { style: { background: p.light.bg } }, h('span.theme-card__dot', { style: { background: p.light.accent } }), h('span.theme-card__line', { style: { background: p.light.text } })),
                  h('span.theme-card__half', { style: { background: p.dark.bg } }, h('span.theme-card__dot', { style: { background: p.dark.accent } }), h('span.theme-card__line', { style: { background: p.dark.text } })),
                ),
                h('span.theme-card__label', h('strong', p.label), h('small', p.description)),
                p.id === t.preset ? h('span.theme-card__check', icon('check', 14)) : null,
              ),
            ),
          ),
        ),

        // Accent
        h(
          'section.design-group',
          h('h2.design-group__title', 'Accent color'),
          h('p.design-group__hint', 'Used for buttons, links and highlights. Dark mode automatically gets a brighter version.'),
          h(
            'div.accent-row',
            h(
              'button.accent-swatch',
              { type: 'button', title: `${preset.label} default`, attrs: { 'aria-pressed': String(!t.accent) }, style: { background: preset.light.accent }, onclick: () => (update({ accent: '' }), draw()) },
              !t.accent ? icon('check', 14) : null,
            ),
            ...['#2563eb', '#0d8a85', '#4d7c3a', '#c8641e', '#c02a5a', '#6d4ae6', '#111827']
              .filter((c) => c !== preset.light.accent)
              .map((c) =>
                h(
                  'button.accent-swatch',
                  { type: 'button', title: c, attrs: { 'aria-pressed': String(t.accent === c) }, style: { background: c }, onclick: () => (update({ accent: c }), draw()) },
                  t.accent === c ? icon('check', 14) : null,
                ),
              ),
            h(
              'label.accent-custom',
              { title: 'Pick any color' },
              h('input', { type: 'color', value: t.accent || preset.light.accent, onchange: (e) => (update({ accent: e.target.value }), draw()) }),
              h('span', 'Custom'),
            ),
          ),
        ),

        // Fonts
        h(
          'section.design-group',
          h('h2.design-group__title', 'Fonts'),
          h(
            'div.font-grid',
            FONT_PAIRS.map((f) =>
              h(
                'button.font-card',
                { type: 'button', attrs: { 'aria-pressed': String(f.id === t.fonts) }, onclick: () => (update({ fonts: f.id }), draw()) },
                h('span.font-card__sample', { style: { fontFamily: f.display, fontWeight: f.displayWeight, letterSpacing: f.tracking } }, 'Aa'),
                h('span.font-card__label', h('strong', f.label), h('small', f.description)),
              ),
            ),
          ),
        ),

        // Corners, mode, motion
        h(
          'section.design-group.design-group--row',
          h('div', h('h2.design-group__title', 'Corners'), segmented(Object.entries(RADII).map(([value, r]) => ({ value, label: r.label })), t.radius, (v) => update({ radius: v }), { label: 'Corner style' })),
          h(
            'div',
            h('h2.design-group__title', 'Visitors see'),
            segmented(
              [
                { value: 'system', label: 'Their setting', icon: 'monitor' },
                { value: 'light', label: 'Light', icon: 'sun' },
                { value: 'dark', label: 'Dark', icon: 'moon' },
              ],
              t.defaultMode,
              (v) => update({ defaultMode: v }),
              { label: 'Default appearance' },
            ),
            h('p.design-group__hint', 'Visitors can always switch with the toggle in the menu.'),
          ),
          h(
            'div',
            h('h2.design-group__title', 'Animations'),
            h(
              'label.switch',
              h('input', { type: 'checkbox', checked: t.motion !== false, onchange: (e) => update({ motion: e.target.checked }) }),
              h('span.switch__track', h('span.switch__thumb')),
              h('span.switch__label', 'Fade content in on scroll'),
            ),
          ),
        ),
      );
    };
    draw();

    el.append(
      editorLayout({
        form: h('div.editor__form-inner', viewHeader({ title: 'Design', subtitle: 'Changes preview instantly and go live when you publish.' }), body),
        preview,
      }),
    );
    const off = app.ws.on('change', () => preview.refresh());
    return () => {
      off();
      preview.destroy();
    };
  },
};

