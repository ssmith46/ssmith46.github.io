/**
 * @file features/reveal.js
 * Fades [data-reveal] elements up as they scroll into view. Elements that
 * enter together are lightly staggered. CSS lives in public/css/40-motion.css.
 */

export default {
  name: 'reveal',
  init() {
    const items = [...document.querySelectorAll('[data-reveal]')];
    const root = document.documentElement;
    const motionOff =
      root.dataset.motion === 'off' || root.dataset.preview || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (motionOff || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entering = entries.filter((e) => e.isIntersecting);
        entering.forEach((entry, i) => {
          entry.target.style.setProperty('--reveal-delay', `${Math.min(i, 4) * 90}ms`);
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    items.forEach((el) => observer.observe(el));
  },
};
