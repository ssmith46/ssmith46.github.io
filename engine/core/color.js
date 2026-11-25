/**
 * @file color.js
 * Minimal color helpers used to derive theme tokens from a single accent.
 * All functions accept/return "#rrggbb" hex strings.
 */

/** @param {string} hex @returns {[number, number, number] | null} */
export function hexToRgb(hex) {
  const m = String(hex || '').trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** @param {number[]} rgb @returns {string} */
export function rgbToHex([r, g, b]) {
  const to = (v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** True when the string is a valid hex color. */
export function isHex(value) {
  return hexToRgb(value) !== null;
}

/**
 * Mix two colors. `amount` 0 → a, 1 → b.
 * @param {string} a @param {string} b @param {number} amount
 */
export function mix(a, b, amount) {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return a;
  return rgbToHex(ra.map((v, i) => v + (rb[i] - v) * amount));
}

/** WCAG relative luminance (0–1). */
export function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colors (1–21). */
export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Pick black-ish or white text for the best contrast on a background. */
export function readableOn(bg, dark = '#111111', light = '#ffffff') {
  return contrast(bg, dark) >= contrast(bg, light) ? dark : light;
}

/**
 * Nudge a color toward black/white until it reaches `ratio` contrast
 * against `bg`. Used so custom accents stay legible in both modes.
 */
export function ensureContrast(color, bg, ratio = 3) {
  if (!isHex(color) || !isHex(bg)) return color;
  const target = luminance(bg) > 0.5 ? '#000000' : '#ffffff';
  let out = color;
  for (let i = 0; i < 20 && contrast(out, bg) < ratio; i++) out = mix(out, target, 0.08);
  return out;
}
