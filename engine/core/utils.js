/**
 * @file utils.js
 * Small pure helpers shared by the engine, the build tools and the admin.
 */

/**
 * Turn any text into a URL/file-safe slug: "Ship CNN (2024)" → "ship-cnn-2024".
 * @param {string} text
 */
export function slugify(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Deep clone plain JSON data. */
export function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

/** Stable JSON formatting used for every content file (diff-friendly). */
export function toJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Parse "YYYY", "YYYY-MM" or "YYYY-MM-DD" without timezone surprises.
 * @returns {{ year: number, month?: number, day?: number } | null}
 */
export function parseDate(value) {
  const m = String(value ?? '').match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/);
  if (!m) return null;
  return { year: Number(m[1]), month: m[2] ? Number(m[2]) : undefined, day: m[3] ? Number(m[3]) : undefined };
}

/**
 * Format a partial date for display.
 * @param {string} value "2025-06" etc.
 * @param {'short' | 'long' | 'year' | 'full'} [style]
 */
export function formatDate(value, style = 'short') {
  const d = parseDate(value);
  if (!d) return '';
  if (style === 'year' || !d.month) return String(d.year);
  const names = style === 'short' ? MONTHS : MONTHS_LONG;
  const month = names[d.month - 1] ?? '';
  if (style === 'full' && d.day) return `${month} ${d.day}, ${d.year}`;
  return `${month} ${d.year}`;
}

/**
 * Format a start/end range: "Jun 2025 – Present", "2023 – 2025".
 * An empty or "present" end means ongoing.
 */
export function formatRange(start, end, { presentLabel = 'Present' } = {}) {
  const a = formatDate(start);
  const ongoing = !end || String(end).toLowerCase() === 'present';
  const b = ongoing ? presentLabel : formatDate(end);
  if (!a) return ongoing ? '' : b;
  return a === b ? a : `${a} – ${b}`;
}

/** Sortable numeric key for partial dates (missing parts sort last within the year). */
export function dateKey(value) {
  const d = parseDate(value);
  if (!d) return 0;
  return d.year * 10000 + (d.month ?? 12) * 100 + (d.day ?? 31);
}

/** Simple deterministic hash (for stable generated artwork, ids, …). */
export function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Short random id for sections and list items. */
export function uid(prefix = '') {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${Date.now().toString(36).slice(-4)}${rand}`;
}

/** Truncate text to a maximum length on a word boundary. */
export function truncate(text, max = 160) {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

/** Strip Markdown syntax for meta descriptions and excerpts. */
export function plainText(markdownText) {
  return String(markdownText ?? '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
