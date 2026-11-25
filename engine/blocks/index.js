/**
 * @file blocks/index.js
 * Every page-section type available in the admin's "Add section" menu.
 *
 * To add a block:
 *   1. Create engine/blocks/<name>/<name>.js exporting { type, label, icon,
 *      description, fields, defaults, render(props, ctx) }.
 *   2. Optionally add engine/blocks/<name>/<name>.css (bundled automatically).
 *   3. Import it below and add it to the list. Order = order in the admin menu.
 */
import hero from './hero/hero.js';
import text from './text/text.js';
import collection from './collection/collection.js';
import cta from './cta/cta.js';
import stats from './stats/stats.js';
import skills from './skills/skills.js';
import links from './links/links.js';
import gallery from './gallery/gallery.js';
import space from './space/space.js';

export default [hero, text, collection, cta, stats, skills, links, gallery, space];
