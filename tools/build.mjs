#!/usr/bin/env node
/**
 * @file tools/build.mjs
 * Static site build. Zero dependencies — just Node 20+.
 *
 *   node tools/build.mjs            → writes the finished website to _site/
 *
 * Steps
 *   1. Read content/ into per-site bundles (engine/core/bundle.js).
 *   2. Render every route of every site to HTML (engine/core/render.js).
 *   3. Copy each site's media next to its pages.
 *   4. Bundle CSS (public/css + every module's .css) and copy client JS.
 *   5. Copy the admin app and the engine (the admin imports it for previews).
 *
 * The same engine renders the admin's live preview, so what you see while
 * editing is exactly what this build produces.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { walk, writeFile, copyDir, readContent, shortHash } from './lib/files.mjs';
import { buildBundles } from '../engine/core/bundle.js';
import { listRoutes, renderRoute } from '../engine/core/render.js';
import { registry } from '../engine/registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Concatenate global CSS (public/css, in file-name order) followed by every
 * module stylesheet under engine/ (blocks, collections…).
 */
export function bundleCss(root = ROOT) {
  const globalCss = walk(path.join(root, 'public/css'), root).filter((f) => f.endsWith('.css'));
  const moduleCss = walk(path.join(root, 'engine'), root).filter((f) => f.endsWith('.css'));
  return [...globalCss, ...moduleCss]
    .map((f) => `/* ── ${f} ── */\n${fs.readFileSync(path.join(root, f), 'utf8').trim()}\n`)
    .join('\n');
}

/** Ensure no two sites claim the same URL space. */
function checkBasePaths(sites) {
  const seen = new Map();
  for (const bundle of Object.values(sites)) {
    const base = bundle.site.basePath;
    if (seen.has(base)) throw new Error(`Sites "${seen.get(base)}" and "${bundle.id}" both use the address ${base}`);
    seen.set(base, bundle.id);
  }
}

/** sitemap.xml for one site (only when it is indexable and has a public URL). */
function sitemap(bundle, routes) {
  const origin = String(bundle.site.url || '').replace(/\/+$/, '');
  if (!origin || bundle.site.indexable === false) return '';
  const urls = routes
    .filter((r) => r.kind !== 'notFound' && !bundle.pages[r.pageId]?.noindex)
    .map((r) => `  <url><loc>${origin}${r.path}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * Build everything into `outDir`.
 * @param {{ root?: string, outDir?: string, extraHead?: string, quiet?: boolean }} [options]
 */
export async function build({ root = ROOT, outDir = path.join(root, '_site'), extraHead = '', quiet = false, includeAdmin = false } = {}) {
  const started = Date.now();
  const log = quiet ? () => {} : (...a) => console.log(...a);

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Content
  const { jsonFiles, mediaPaths } = readContent(root);
  const sites = buildBundles(jsonFiles, mediaPaths);
  checkBasePaths(sites);
  const warnings = Object.values(sites).flatMap((b) => b.errors.map((e) => `${e.path}: ${e.message}`));

  // 2. Assets (hash first so pages can reference versioned URLs)
  const css = bundleCss(root);
  const jsFiles = walk(path.join(root, 'public/js'), root);
  const version = shortHash(css + jsFiles.map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join(''));
  writeFile(path.join(outDir, 'assets/site.css'), css);
  copyDir(path.join(root, 'public/js'), path.join(outDir, 'assets/js'));
  const assets = { base: '/assets/', version };

  // 3. Pages
  let pageCount = 0;
  for (const bundle of Object.values(sites)) {
    const routes = listRoutes(bundle, registry);
    for (const route of routes) {
      const html = renderRoute(bundle, registry, route, { mode: 'build', assets, extraHead });
      writeFile(path.join(outDir, route.file), html);
      pageCount++;
    }
    copyDir(path.join(root, 'content/sites', bundle.id, 'media'), path.join(outDir, bundle.site.basePath, 'media'));
    // Old résumé addresses keep working and always serve the current file.
    const resumeFile = bundle.site.resume && path.join(root, 'content/sites', bundle.id, bundle.site.resume);
    for (const alias of bundle.site.resumeAliases || []) {
      const clean = String(alias).replace(/^\/+/, '');
      if (resumeFile && fs.existsSync(resumeFile) && clean && !clean.includes('..')) {
        writeFile(path.join(outDir, bundle.site.basePath, clean), fs.readFileSync(resumeFile));
      }
    }
    const map = sitemap(bundle, routes);
    if (map) writeFile(path.join(outDir, bundle.site.basePath, 'sitemap.xml'), map);
    log(`  ✓ ${bundle.site.title} (${bundle.id}) → ${bundle.site.basePath}  ${routes.length} pages`);
  }

  // 4. Admin + engine (the admin imports ../../engine/* for live previews)
  //    the admin; run `node tools/dev.mjs` to use it on your own computer.
  if (includeAdmin) {
    copyDir(path.join(root, 'admin'), path.join(outDir, 'admin'));
    copyDir(path.join(root, 'engine'), path.join(outDir, 'engine'));
  }

  // 5. Host files
  const rootSite = Object.values(sites).find((b) => b.site.basePath === '/');
  const sitemapLine = rootSite && rootSite.site.url && rootSite.site.indexable !== false ? `Sitemap: ${rootSite.site.url.replace(/\/+$/, '')}/sitemap.xml\n` : '';
  writeFile(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n${sitemapLine}`);
  writeFile(path.join(outDir, '.nojekyll'), '');

  for (const w of warnings) console.warn(`  ⚠ ${w}`);
  log(`Built ${pageCount} pages for ${Object.keys(sites).length} site(s) in ${Date.now() - started} ms → ${path.relative(process.cwd(), outDir) || '.'}`);
  return { sites, pageCount, warnings, version };
}

// Run when invoked directly: `node tools/build.mjs`
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  // BUILD_EXTRA_HEAD lets the dev server inject its live-reload script.
    // The dev server sets these to add live reload and the local-only admin.
  build({ extraHead: process.env.BUILD_EXTRA_HEAD || '', includeAdmin: process.env.BUILD_INCLUDE_ADMIN === '1' }).catch((err) => {
    console.error(`\nBuild failed: ${err.stack || err.message}`);
    process.exit(1);
  });
}
