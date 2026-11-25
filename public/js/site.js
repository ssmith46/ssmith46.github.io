/**
 * @file site.js
 * Entry point for the small amount of JavaScript visitors download.
 * Each feature is an independent module with `init()`; a failure in one never
 * stops the others. To add behaviour, create public/js/features/<name>.js and
 * list it below.
 */
import theme from './features/theme.js';
import nav from './features/nav.js';
import reveal from './features/reveal.js';
import lightbox from './features/lightbox.js';
import space from './features/space.js';

const FEATURES = [theme, nav, reveal, lightbox, space];

for (const feature of FEATURES) {
  try {
    feature.init(document);
  } catch (err) {
    console.error(`[site] feature "${feature.name}" failed`, err);
  }
}
