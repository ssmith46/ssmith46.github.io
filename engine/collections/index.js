/**
 * @file collections/index.js
 * Every collection type a site can use.
 *
 * A collection type describes one kind of item (a project, a job, a run…):
 *   { type, label, plural, icon, description, fields, defaults,
 *     detailPage, defaultSort, titleOf, subtitleOf, dateOf?, imageOf?,
 *     layouts: { id: { label, render(items, ctx, blockProps) } },
 *     renderPage?(item, ctx) }
 *
 * To add one: create engine/collections/<name>/<name>.js (+ optional CSS),
 * import it here, then add a collection of that type in the admin
 * (Settings → Collections).
 */
import project from './project/project.js';
import experience from './experience/experience.js';
import education from './education/education.js';
import post from './post/post.js';
import run from './run/run.js';
import movie from './movie/movie.js';

export default [project, experience, education, post, run, movie];
