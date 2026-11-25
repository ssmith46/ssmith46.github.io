/**
 * @file tools/lib/files.mjs
 * Filesystem helpers for the build and dev server (Node only).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Recursively list files under `dir`, returning POSIX paths relative to `base`.
 * Dotfiles and dot-directories are skipped.
 */
export function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out.sort();
}

/** Write a file, creating parent directories. */
export function writeFile(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}

/** Copy a directory tree (no-op if it doesn't exist). */
export function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, to, { recursive: true, filter: (src) => !path.basename(src).startsWith('.') });
}

/**
 * Read everything under content/ the way the admin sees it through GitHub.
 * @param {string} root repository root
 * @returns {{ jsonFiles: [string, string][], mediaPaths: string[] }}
 */
export function readContent(root) {
  const files = walk(path.join(root, 'content'), root);
  const jsonFiles = [];
  const mediaPaths = [];
  for (const file of files) {
    if (file.includes('/media/')) mediaPaths.push(file);
    else if (file.endsWith('.json')) jsonFiles.push([file, fs.readFileSync(path.join(root, file), 'utf8')]);
  }
  return { jsonFiles, mediaPaths };
}

/** Git-compatible blob SHA-1 (matches the SHAs GitHub reports). */
export function gitBlobSha(buffer) {
  return crypto.createHash('sha1').update(`blob ${buffer.length}\0`).update(buffer).digest('hex');
}

/** Short content hash for cache-busting asset URLs. */
export function shortHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 10);
}

/** Minimal content-type map for the dev server. */
export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
};
