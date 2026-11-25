#!/usr/bin/env node
/**
 * @file tools/dev.mjs
 * Local development server. Zero dependencies.
 *
 *   node tools/dev.mjs            → http://localhost:4000  (site)
 *                                   http://localhost:4000/<adminPath>/  (admin, "local mode";
 *                                   adminPath is set in tools/config.mjs)
 *
 * - Rebuilds _site/ whenever content/, engine/, public/ or admin/ change and
 *   live-reloads open site pages.
 * - Exposes a tiny API under /__admin/api/ so the admin can read and write the
 *   local content/ folder instead of GitHub. It is the "local" storage adapter
 *   (admin/js/storage/local.js) counterpart — handy for development and tests.
 *   It only ever writes inside content/ and only listens on localhost.
 *
 * Options: --port 4000   --host 127.0.0.1
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { walk, gitBlobSha, writeFile, MIME } from './lib/files.mjs';
import config from './config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '_site');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const PORT = Number(arg('port', process.env.PORT || 4000));
const HOST = arg('host', '127.0.0.1');

/* ── Live reload ─────────────────────────────────────── */

const clients = new Set();
const LIVE_RELOAD = `<script>(function(){var s=new EventSource('/__dev/events');s.onmessage=function(e){if(e.data==='reload')location.reload()};})();</script>`;

let building = null;
let queued = false;
async function rebuild(reason = '') {
  if (building) {
    queued = true;
    return building;
  }
  // Each build runs in a fresh Node process so edits to engine modules are
  // picked up (an in-process import would keep serving the cached modules).
  building = new Promise((resolve, reject) => {
    execFile(process.execPath, [path.join(ROOT, 'tools/build.mjs')], { cwd: ROOT, env: { ...process.env, BUILD_EXTRA_HEAD: LIVE_RELOAD } }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr.trim() || err.message));
      else resolve(stdout);
    });
  })
    .then((stdout) => {
      const summary = stdout.trim().split('\n').pop();
      console.log(`↻ ${summary}${reason ? `  (${reason})` : ''}`);
      for (const res of clients) res.write('data: reload\n\n');
    })
    .catch((err) => console.error(`✗ build failed:\n${err.message}`))
    .finally(() => {
      building = null;
      if (queued) {
        queued = false;
        rebuild('queued changes');
      }
    });
  return building;
}

let timer;
for (const dir of ['content', 'engine', 'public', 'admin']) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) continue;
  fs.watch(full, { recursive: true }, (_event, file) => {
    clearTimeout(timer);
    timer = setTimeout(() => rebuild(`${dir}/${file}`), 120);
  });
}

/* ── Local admin API ─────────────────────────────────── */

const commitLog = [];

/** Resolve a repo path safely inside content/. */
function contentPath(rel) {
  const clean = path.posix.normalize(String(rel || '')).replace(/^\/+/, '');
  if (!clean.startsWith('content/') || clean.includes('..')) throw Object.assign(new Error('Path must be inside content/'), { status: 400 });
  return path.join(ROOT, clean);
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

/** Fingerprint of the whole content tree, used as a fake "commit" id. */
function headId() {
  const files = walk(path.join(ROOT, 'content'), ROOT);
  const sig = files.map((f) => `${f}:${fs.statSync(path.join(ROOT, f)).mtimeMs}`).join('|');
  return `local-${gitBlobSha(Buffer.from(sig)).slice(0, 12)}`;
}

async function handleApi(req, res, url) {
  const route = url.pathname.replace('/__admin/api/', '');
  try {
    if (route === 'info') return sendJson(res, 200, { mode: 'local', user: { login: 'local', name: 'Local editor' } });

    if (route === 'tree') {
      const files = walk(path.join(ROOT, 'content'), ROOT).map((p) => {
        const buf = fs.readFileSync(path.join(ROOT, p));
        return { path: p, sha: gitBlobSha(buf), size: buf.length };
      });
      return sendJson(res, 200, { head: headId(), files });
    }

    if (route === 'raw') {
      const file = contentPath(url.searchParams.get('path'));
      if (!fs.existsSync(file)) return sendJson(res, 404, { error: 'Not found' });
      res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
      return fs.createReadStream(file).pipe(res);
    }

    if (route === 'commits') return sendJson(res, 200, commitLog.slice(-20).reverse());

    if (route === 'commit' && req.method === 'POST') {
      const { message = 'Update content', changes = [], expected = {} } = await readBody(req);
      // Conflict check: refuse if a file changed since the admin loaded it.
      const conflicts = [];
      for (const [p, sha] of Object.entries(expected)) {
        const file = contentPath(p);
        const now = fs.existsSync(file) ? gitBlobSha(fs.readFileSync(file)) : null;
        if (now !== sha) conflicts.push(p);
      }
      if (conflicts.length) return sendJson(res, 409, { error: 'conflict', conflicts });

      for (const change of changes) {
        const file = contentPath(change.path);
        if (change.content == null) fs.rmSync(file, { force: true });
        else writeFile(file, Buffer.from(change.content, change.encoding === 'base64' ? 'base64' : 'utf8'));
      }
      await rebuild('admin publish');
      const head = headId();
      commitLog.push({ sha: head, message, date: new Date().toISOString(), author: 'Local editor' });
      return sendJson(res, 200, { commit: head });
    }

    return sendJson(res, 404, { error: 'Unknown endpoint' });
  } catch (err) {
    return sendJson(res, err.status || 500, { error: err.message });
  }
}

/* ── Static files ────────────────────────────────────── */

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  let file = path.join(OUT, rel);
  if (!file.startsWith(OUT)) return sendJson(res, 403, { error: 'Forbidden' });
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    res.writeHead(301, { location: `${url.pathname}/` });
    return res.end();
  }
  let status = 200;
  if (!fs.existsSync(file)) {
    status = 404;
    file = path.join(OUT, '404.html');
    if (!fs.existsSync(file)) return sendJson(res, 404, { error: 'Not found' });
  }
  res.writeHead(status, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/__dev/events') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  if (url.pathname.startsWith('/__admin/api/')) return handleApi(req, res, url);
  return serveStatic(req, res, url);
});

await rebuild('startup');
server.listen(PORT, HOST, () => {
  console.log(`\n  Site   http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/`);
  console.log(`  Admin  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/${config.adminPath}/  (local mode — edits save to content/)\n`);
});
