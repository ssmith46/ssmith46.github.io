/**
 * @file socials.js
 * Social network definitions and the shared social-links renderer.
 * Add a network by adding an entry to NETWORKS (icon names come from icons.js).
 */
import { html, attrs } from '../core/html.js';

export const NETWORKS = {
  github: { label: 'GitHub', icon: 'github' },
  linkedin: { label: 'LinkedIn', icon: 'linkedin' },
  email: { label: 'Email', icon: 'mail' },
  x: { label: 'X (Twitter)', icon: 'x-twitter' },
  instagram: { label: 'Instagram', icon: 'instagram' },
  youtube: { label: 'YouTube', icon: 'youtube' },
  strava: { label: 'Strava', icon: 'strava' },
  letterboxd: { label: 'Letterboxd', icon: 'film' },
  website: { label: 'Website', icon: 'globe' },
};

/** Normalise a social URL (adds mailto: for bare email addresses). */
export function socialHref(social) {
  const url = String(social?.url ?? '').trim();
  if (social?.network === 'email' && url && !url.startsWith('mailto:')) return `mailto:${url}`;
  return url;
}

/**
 * Render a row of icon links.
 * @param {{ network: string, url: string, label?: string }[]} socials
 * @param {object} ctx render context
 * @param {{ className?: string, size?: number, withLabels?: boolean }} [opts]
 */
export function renderSocials(socials, ctx, { className = 'socials', size = 20, withLabels = false } = {}) {
  const list = (socials || []).filter((s) => s && s.url);
  if (!list.length) return '';
  return html`<ul class="${className}">
    ${list.map((s) => {
      const net = NETWORKS[s.network] || NETWORKS.website;
      const label = s.label || net.label;
      const href = socialHref(s);
      const external = /^https?:/i.test(href);
      return html`<li><a${attrs({
        href,
        class: 'social-link',
        target: external && '_blank',
        rel: external && 'noopener noreferrer me',
        'aria-label': withLabels ? null : label,
        title: label,
      })}>${ctx.icon(net.icon, { size })}${withLabels ? html`<span>${label}</span>` : ''}</a></li>`;
    })}
  </ul>`;
}
