/**
 * @file features/nav.js
 * Header behaviour: a hairline border once the page scrolls, and the
 * full-screen mobile menu (open/close, Escape, focus handling).
 */

export default {
  name: 'nav',
  init() {
    const header = document.querySelector('[data-feature="header"]');
    if (!header) return;

    // Border appears once content scrolls under the header.
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const toggle = header.querySelector('[data-feature="nav-toggle"]');
    const panel = document.getElementById(toggle?.getAttribute('aria-controls') || '');
    if (!toggle || !panel) return;

    panel.querySelectorAll('.nav-link').forEach((link, i) => link.style.setProperty('--i', String(i)));

    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      panel.hidden = !open;
      document.body.classList.toggle('nav-open', open);
      if (open) panel.querySelector('a, button')?.focus();
    };

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    panel.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 52.0625rem)').addEventListener('change', (e) => {
      if (e.matches) setOpen(false);
    });
  },
};
