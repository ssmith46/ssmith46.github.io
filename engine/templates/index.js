/**
 * @file templates/index.js
 * Starting points for the admin's "New site" dialog. Each template returns
 * the files for a brand-new, fully separate site (its own pages, menu, theme
 * and URL). Paths are relative to content/sites/<siteId>/.
 *
 * Template shape:
 *   { id, label, description, icon, create({ title, basePath }) → { [path]: json } }
 */
import { uid } from '../core/utils.js';

const section = (type, props) => ({ id: uid('s'), type, ...props });
const today = () => new Date().toISOString().slice(0, 10);

const portfolio = {
  id: 'portfolio',
  label: 'Portfolio',
  icon: 'briefcase',
  description: 'Home, projects and experience — a polished personal site.',
  create: ({ title, basePath }) => ({
    'site.json': {
      title,
      tagline: '',
      description: '',
      basePath,
      theme: { preset: 'graphite', fonts: 'technical', radius: 'soft', defaultMode: 'system', motion: true },
      nav: [
        { label: 'Projects', link: 'page:projects' },
        { label: 'Experience', link: 'page:experience' },
      ],
      socials: [],
      collections: [
        { id: 'projects', type: 'project', label: 'Projects', route: 'projects', sort: 'manual', order: [] },
        { id: 'experience', type: 'experience', label: 'Experience', route: 'experience' },
      ],
    },
    'pages/home.json': {
      title: 'Home',
      sections: [
        section('hero', { layout: 'centered', title, subtitle: 'What you do, in a few words', intro: 'A sentence or two about you.', actions: [], showSocials: true }),
        section('collection', { collection: 'projects', layout: 'grid', heading: 'Selected work', limit: 3 }),
      ],
    },
    'pages/projects.json': { title: 'Projects', slug: 'projects', intro: 'Things I’ve built.', sections: [section('collection', { collection: 'projects', layout: 'grid' })] },
    'pages/experience.json': { title: 'Experience', slug: 'experience', sections: [section('collection', { collection: 'experience', layout: 'timeline' })] },
  }),
};

const running = {
  id: 'running',
  label: 'Running log',
  icon: 'activity',
  description: 'Track runs with totals, a monthly chart and paces.',
  create: ({ title, basePath }) => ({
    'site.json': {
      title,
      tagline: 'Miles, logged.',
      basePath,
      indexable: false,
      theme: { preset: 'fjord', fonts: 'modern', radius: 'round', defaultMode: 'dark', motion: true },
      nav: [{ label: 'Log', link: 'page:log' }],
      collections: [{ id: 'runs', type: 'run', label: 'Runs', route: 'runs' }],
    },
    'pages/home.json': {
      title: 'Home',
      sections: [
        section('hero', { layout: 'minimal', eyebrow: 'Training log', title, subtitle: 'Every run, in one place.', actions: [{ label: 'See the log', link: 'page:log', style: 'primary' }] }),
        section('collection', { collection: 'runs', layout: 'summary', heading: 'This year' }),
      ],
    },
    'pages/log.json': { title: 'Log', slug: 'log', sections: [section('collection', { collection: 'runs', layout: 'log' })] },
    [`collections/runs/${today()}-first-run.json`]: { date: today(), kind: 'easy', title: 'First logged run', distance: 3.1, unit: 'mi', duration: '27:45' },
  }),
};

const movies = {
  id: 'movies',
  label: 'Movie journal',
  icon: 'film',
  description: 'A film diary with posters, star ratings and reviews.',
  create: ({ title, basePath }) => ({
    'site.json': {
      title,
      tagline: 'Films I’ve watched',
      basePath,
      indexable: false,
      theme: { preset: 'nebula', fonts: 'editorial', radius: 'soft', defaultMode: 'dark', motion: true },
      nav: [{ label: 'Diary', link: 'page:diary' }],
      collections: [{ id: 'movies', type: 'movie', label: 'Movies', route: 'diary' }],
    },
    'pages/home.json': {
      title: 'Home',
      sections: [
        section('hero', { layout: 'minimal', eyebrow: 'Film diary', title, subtitle: 'Reviews, ratings and favorites.' }),
        section('collection', { collection: 'movies', layout: 'posters', heading: 'Recently watched', limit: 12 }),
      ],
    },
    'pages/diary.json': { title: 'Diary', slug: 'diary', sections: [section('collection', { collection: 'movies', layout: 'list' })] },
  }),
};

const blank = {
  id: 'blank',
  label: 'Blank',
  icon: 'file',
  description: 'Just a home page. Build anything.',
  create: ({ title, basePath }) => ({
    'site.json': { title, basePath, theme: { preset: 'graphite', fonts: 'system', radius: 'soft', defaultMode: 'system', motion: true }, nav: [], collections: [] },
    'pages/home.json': { title: 'Home', sections: [section('hero', { layout: 'minimal', title, subtitle: 'Something new is coming.' })] },
  }),
};

export default [portfolio, running, movies, blank];
