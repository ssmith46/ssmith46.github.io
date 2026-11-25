/**
 * @file artwork.js
 * Deterministic generative cover art for items without an image, so cards
 * always look intentional. Colors come from CSS variables, which means the
 * artwork automatically follows the active theme and light/dark mode.
 */
import { raw } from './html.js';
import { hashString } from './utils.js';

/** Small seeded PRNG (mulberry32) so the same title always yields the same art. */
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 400;
const H = 250;
const f = (n) => Math.round(n * 10) / 10;

/** Concentric orbits with a small planet. */
function orbits(r) {
  const cx = W * (0.25 + r() * 0.5);
  const cy = H * (0.3 + r() * 0.4);
  let s = '';
  const rings = 4 + Math.floor(r() * 3);
  for (let i = 1; i <= rings; i++) {
    const rx = 30 + i * (22 + r() * 10);
    s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(rx * (0.42 + r() * 0.1))}" transform="rotate(${f(-18 + r() * 8)} ${f(cx)} ${f(cy)})" fill="none" stroke="var(--accent)" stroke-opacity="${f(0.18 + (rings - i) * 0.08)}" stroke-width="1.2"/>`;
  }
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(14 + r() * 8)}" fill="var(--accent)" fill-opacity="0.85"/>`;
  const a = r() * Math.PI * 2;
  s += `<circle cx="${f(cx + Math.cos(a) * 110)}" cy="${f(cy + Math.sin(a) * 48)}" r="4.5" fill="var(--text)" fill-opacity="0.55"/>`;
  return s;
}

/** Halftone dot field. */
function halftone(r) {
  const px = W * r();
  const py = H * r();
  let s = '';
  for (let x = 12; x < W; x += 22) {
    for (let y = 12; y < H; y += 22) {
      const d = Math.hypot(x - px, y - py) / Math.hypot(W, H);
      const rad = Math.max(0.6, 6.5 * (1 - d * 1.6));
      s += `<circle cx="${x}" cy="${y}" r="${f(rad)}" fill="var(--accent)" fill-opacity="${f(0.2 + (1 - d) * 0.5)}"/>`;
    }
  }
  return s;
}

/** Stacked contour waves. */
function contours(r) {
  let s = '';
  const amp = 10 + r() * 14;
  const freq = 1.5 + r() * 2;
  const phase = r() * Math.PI * 2;
  for (let i = 0; i < 11; i++) {
    const y0 = 20 + i * 21;
    let d = `M0 ${f(y0)}`;
    for (let x = 0; x <= W; x += 20) {
      d += ` L${x} ${f(y0 + Math.sin((x / W) * Math.PI * freq + phase + i * 0.35) * amp)}`;
    }
    s += `<path d="${d}" fill="none" stroke="var(--accent)" stroke-opacity="${f(0.15 + i * 0.05)}" stroke-width="1.4"/>`;
  }
  return s;
}

/** Diagonal light rays. */
function rays(r) {
  let s = '';
  const n = 9 + Math.floor(r() * 5);
  for (let i = 0; i < n; i++) {
    const x = (i / n) * (W + H) - H * 0.5 + r() * 12;
    const w = 6 + r() * 18;
    s += `<path d="M${f(x)} ${H} L${f(x + H * 0.7)} 0 L${f(x + H * 0.7 + w)} 0 L${f(x + w)} ${H} Z" fill="var(--accent)" fill-opacity="${f(0.08 + r() * 0.3)}"/>`;
  }
  return s;
}

const VARIANTS = [orbits, halftone, contours, rays];

/**
 * @param {string} seed usually the item title or id
 * @returns {import('./html.js').SafeHtml} an <svg> element
 */
export function coverArt(seed) {
  const h = hashString(String(seed || 'cover'));
  const draw = VARIANTS[h % VARIANTS.length];
  const body = draw(prng(h));
  return raw(
    `<svg class="cover-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect width="${W}" height="${H}" fill="var(--accent-soft)"/>${body}</svg>`,
  );
}
