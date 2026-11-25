/**
 * @file features/theme.js
 * Light / System / Dark switch. The visitor's choice is saved in
 * localStorage and applied before first paint by the tiny inline script in
 * engine/layout/document.js, so pages never flash the wrong colors.
 */

const KEY = 'theme-preference';
const ORDER = ['light', 'system', 'dark'];
const root = document.documentElement;

function stored() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** The active preference: saved choice, else the site's default. */
function current() {
  const value = stored() || root.dataset.defaultTheme || 'system';
  return ORDER.includes(value) ? value : 'system';
}

function apply(pref) {
  if (pref === 'light' || pref === 'dark') root.setAttribute('data-theme', pref);
  else root.removeAttribute('data-theme');
  sync(pref);
  document.dispatchEvent(new CustomEvent('themechange', { detail: { preference: pref } }));
}

/** Reflect the preference in every switch on the page. */
function sync(pref) {
  document.querySelectorAll('[data-feature="theme-toggle"]').forEach((toggle) => {
    toggle.style.setProperty('--theme-index', String(ORDER.indexOf(pref)));
    toggle.querySelectorAll('[data-theme-value]').forEach((btn) => {
      btn.setAttribute('aria-checked', String(btn.dataset.themeValue === pref));
    });
  });
}

function choose(pref) {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* private mode — still apply for this page view */
  }
  apply(pref);
}

export default {
  name: 'theme',
  init() {
    sync(current());

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-theme-value]');
      if (btn) choose(btn.dataset.themeValue);
    });

    // Arrow keys move between options, like a native radio group.
    document.addEventListener('keydown', (e) => {
      const btn = e.target.closest?.('[data-theme-value]');
      if (!btn || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const i = ORDER.indexOf(btn.dataset.themeValue) + (e.key === 'ArrowRight' ? 1 : -1);
      const next = ORDER[(i + ORDER.length) % ORDER.length];
      choose(next);
      btn.parentElement.querySelector(`[data-theme-value="${next}"]`)?.focus();
    });

    // Keep tabs in sync.
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) apply(current());
    });
  },
};
