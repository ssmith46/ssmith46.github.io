/**
 * @file css.js
 * Turns a site's `theme` settings into CSS custom properties.
 *
 * The output is inlined in every page's <head>, so changing the theme in the
 * admin restyles the whole site without touching any stylesheet. Light tokens
 * apply by default; dark tokens apply when the visitor's OS prefers dark (and
 * they haven't chosen "light"), or when they explicitly choose "dark".
 */
import { getPreset, RADII } from './presets.js';
import { getFontPair } from './fonts.js';
import { mix, readableOn, ensureContrast, isHex } from '../core/color.js';

/**
 * @typedef {object} ThemeSettings
 * @property {string} [preset]      preset id (see presets.js)
 * @property {string} [accent]      optional custom accent hex (light mode)
 * @property {string} [accentDark]  optional custom accent hex (dark mode)
 * @property {string} [fonts]       font pair id (see fonts.js)
 * @property {string} [radius]      'sharp' | 'soft' | 'round'
 * @property {'system'|'light'|'dark'} [defaultMode]
 * @property {boolean} [motion]     enable scroll-reveal animations
 */

/** Derive the full token map for one mode from a palette. */
export function paletteTokens(palette, accentOverride) {
  const accent = isHex(accentOverride) ? accentOverride : palette.accent;
  const isDark = readableOn(palette.bg) === '#ffffff';
  const accentText = ensureContrast(accent, palette.bg, 4.5);
  return {
    '--bg': palette.bg,
    '--surface': palette.surface,
    '--surface-2': palette.surface2,
    '--border': palette.border,
    '--border-strong': mix(palette.border, palette.text, 0.18),
    '--text': palette.text,
    '--muted': palette.muted,
    '--faint': palette.faint,
    '--accent': accent,
    '--accent-text': accentText,
    '--accent-ink': readableOn(accent, '#14110f', '#ffffff'),
    '--accent-soft': mix(palette.bg, accent, isDark ? 0.16 : 0.1),
    '--accent-line': mix(palette.bg, accent, isDark ? 0.4 : 0.32),
    '--shadow-color': isDark ? '0 0% 0%' : '30 10% 20%',
    '--shadow-strength': isDark ? '0.5' : '0.08',
    'color-scheme': isDark ? 'dark' : 'light',
  };
}

/** Serialize a token map as CSS declarations. */
function decls(tokens) {
  return Object.entries(tokens)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
}

/**
 * Build the theme stylesheet for a site.
 * @param {ThemeSettings} theme
 * @returns {string} CSS text
 */
export function themeCss(theme = {}) {
  const preset = getPreset(theme.preset);
  const fonts = getFontPair(theme.fonts);
  const radius = RADII[theme.radius] || RADII.soft;

  let darkAccent = theme.accentDark;
  if (!isHex(darkAccent) && isHex(theme.accent)) darkAccent = ensureContrast(theme.accent, preset.dark.bg, 4.5);

  const shared = {
    '--font-display': fonts.display,
    '--font-body': fonts.body,
    '--font-mono': fonts.mono,
    '--display-weight': fonts.displayWeight,
    '--display-tracking': fonts.tracking,
    '--radius-sm': radius.sm,
    '--radius-md': radius.md,
    '--radius-lg': radius.lg,
    '--radius-xl': radius.xl,
  };
  const light = decls({ ...shared, ...paletteTokens(preset.light, theme.accent) });
  const dark = decls(paletteTokens(preset.dark, darkAccent));

  return [
    `:root{${light}}`,
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}`,
    `:root[data-theme="dark"]{${dark}}`,
  ].join('\n');
}
