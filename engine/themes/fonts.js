/**
 * @file fonts.js
 * Curated font pairings. `google` is the Google Fonts css2 family query; leave
 * it empty to use system fonts only (fastest, no third-party request).
 *
 * To add a pairing, append an entry — the admin's Design screen lists it.
 */

const SYSTEM_SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const SYSTEM_SERIF = 'ui-serif, Georgia, Cambria, "Times New Roman", serif';
const SYSTEM_MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

export const FONT_PAIRS = [
  {
    id: 'technical',
    label: 'Technical',
    description: 'Space Grotesk headlines, Inter text.',
    display: `"Space Grotesk", ${SYSTEM_SANS}`,
    body: `"Inter", ${SYSTEM_SANS}`,
    mono: `"JetBrains Mono", ${SYSTEM_MONO}`,
    google: 'family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500',
    displayWeight: 600,
    tracking: '-0.03em',
  },
  {
    id: 'editorial',
    label: 'Editorial',
    description: 'Fraunces serif headlines, Inter text.',
    display: `"Fraunces", ${SYSTEM_SERIF}`,
    body: `"Inter", ${SYSTEM_SANS}`,
    mono: `"JetBrains Mono", ${SYSTEM_MONO}`,
    google: 'family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500',
    displayWeight: 500,
    tracking: '-0.02em',
  },
  {
    id: 'modern',
    label: 'Modern',
    description: 'Manrope throughout — friendly and clean.',
    display: `"Manrope", ${SYSTEM_SANS}`,
    body: `"Manrope", ${SYSTEM_SANS}`,
    mono: `"JetBrains Mono", ${SYSTEM_MONO}`,
    google: 'family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500',
    displayWeight: 700,
    tracking: '-0.035em',
  },
  {
    id: 'classic',
    label: 'Classic',
    description: 'Playfair Display with Source Sans 3.',
    display: `"Playfair Display", ${SYSTEM_SERIF}`,
    body: `"Source Sans 3", ${SYSTEM_SANS}`,
    mono: `"JetBrains Mono", ${SYSTEM_MONO}`,
    google: 'family=Playfair+Display:wght@500;600;700&family=Source+Sans+3:wght@400;500;600&family=JetBrains+Mono:wght@400;500',
    displayWeight: 600,
    tracking: '-0.01em',
  },
  {
    id: 'system',
    label: 'System',
    description: "Your visitor's native fonts. Zero downloads.",
    display: SYSTEM_SANS,
    body: SYSTEM_SANS,
    mono: SYSTEM_MONO,
    google: '',
    displayWeight: 650,
    tracking: '-0.025em',
  },
];

/** Look up a font pairing by id, falling back to the first one. */
export function getFontPair(id) {
  return FONT_PAIRS.find((f) => f.id === id) || FONT_PAIRS[0];
}

/** Google Fonts stylesheet URL for a pairing, or '' for system fonts. */
export function fontStylesheetUrl(pair) {
  return pair.google ? `https://fonts.googleapis.com/css2?${pair.google}&display=swap` : '';
}
