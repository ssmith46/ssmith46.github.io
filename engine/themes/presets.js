/**
 * @file presets.js
 * Curated color themes. Each preset defines a light and a dark palette using
 * the same token names, so every component automatically supports both modes.
 *
 * Token reference (see public/css/10-base.css for how they are used):
 *   bg        page background            surface   cards, header
 *   surface2  subtle fills, inputs       border    hairlines
 *   text      primary text               muted     secondary text
 *   faint     tertiary text, meta        accent    links, buttons, highlights
 *
 * To add a theme, append an object to PRESETS — it will appear in the admin's
 * Design screen automatically.
 */

export const PRESETS = [
  {
    id: 'ember',
    label: 'Ember',
    description: 'Warm paper tones with a burnt-orange accent.',
    light: { bg: '#faf8f5', surface: '#ffffff', surface2: '#f2eee8', border: '#e7e1d8', text: '#1d1a16', muted: '#5f584f', faint: '#8d857a', accent: '#c8641e' },
    dark: { bg: '#0f0d0b', surface: '#181512', surface2: '#221e1a', border: '#2e2924', text: '#f4efe8', muted: '#b5ab9f', faint: '#81786d', accent: '#f08a3c' },
  },
  {
    id: 'graphite',
    label: 'Graphite',
    description: 'Crisp monochrome with an electric-blue accent.',
    light: { bg: '#fafafa', surface: '#ffffff', surface2: '#f1f1f3', border: '#e4e4e7', text: '#111113', muted: '#52525b', faint: '#8a8a93', accent: '#2563eb' },
    dark: { bg: '#09090b', surface: '#121215', surface2: '#1b1b1f', border: '#27272b', text: '#f4f4f5', muted: '#a1a1aa', faint: '#71717a', accent: '#60a5fa' },
  },
  {
    id: 'nebula',
    label: 'Nebula',
    description: 'Deep-space indigo with a violet glow.',
    light: { bg: '#f8f7fc', surface: '#ffffff', surface2: '#efedf8', border: '#e2dff0', text: '#16142b', muted: '#565273', faint: '#8a86a6', accent: '#6d4ae6' },
    dark: { bg: '#07061a', surface: '#0f0d26', surface2: '#181535', border: '#262248', text: '#eeecff', muted: '#a9a5cf', faint: '#7570a0', accent: '#a78bfa' },
  },
  {
    id: 'fjord',
    label: 'Fjord',
    description: 'Cool slate with a calm teal accent.',
    light: { bg: '#f6f9f9', surface: '#ffffff', surface2: '#ebf1f1', border: '#dce6e6', text: '#0f1c1d', muted: '#4c5f60', faint: '#7f9293', accent: '#0d8a85' },
    dark: { bg: '#071112', surface: '#0d191a', surface2: '#132324', border: '#1d3133', text: '#e8f3f2', muted: '#9bb4b3', faint: '#6b8584', accent: '#2dd4bf' },
  },
  {
    id: 'sage',
    label: 'Sage',
    description: 'Soft botanical greens, quietly confident.',
    light: { bg: '#f7f8f4', surface: '#ffffff', surface2: '#eef0e8', border: '#e0e4d6', text: '#171c14', muted: '#565e4f', faint: '#878f7f', accent: '#4d7c3a' },
    dark: { bg: '#0b0d09', surface: '#131610', surface2: '#1b1f17', border: '#282d22', text: '#eef1e8', muted: '#aab3a0', faint: '#7a8372', accent: '#9bcf7c' },
  },
  {
    id: 'rose',
    label: 'Rosé',
    description: 'Blush neutrals with a confident raspberry.',
    light: { bg: '#fcf8f8', surface: '#ffffff', surface2: '#f6eeef', border: '#eddfe1', text: '#1f1416', muted: '#655357', faint: '#97868a', accent: '#c02a5a' },
    dark: { bg: '#100a0b', surface: '#1a1113', surface2: '#24181b', border: '#332327', text: '#f8ecee', muted: '#bfa8ad', faint: '#8a7378', accent: '#fb7199' },
  },
];

/** Corner-radius scales. */
export const RADII = {
  sharp: { label: 'Sharp', sm: '3px', md: '6px', lg: '8px', xl: '10px' },
  soft: { label: 'Soft', sm: '6px', md: '12px', lg: '18px', xl: '28px' },
  round: { label: 'Round', sm: '10px', md: '18px', lg: '26px', xl: '36px' },
};

/** Look up a preset by id, falling back to the first one. */
export function getPreset(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}
