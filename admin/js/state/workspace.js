/**
 * @file state/workspace.js
 * The admin's single source of truth.
 *
 * - Loads every JSON content file from storage (GitHub or local).
 * - Edits are kept as *drafts* (saved on this device in localStorage, so a
 *   refresh or closed tab never loses work) until you press Publish.
 * - Publish sends all drafts as one commit.
 * - Media uploads/deletions commit immediately (they're big binary files and
 *   pages can only reference them once they exist).
 *
 * Views never touch storage directly; they read and write through here and
 * listen for the "change" event.
 */
import { Emitter } from '../lib/emitter.js';
import { bytesToBase64, gitBlobSha } from '../lib/encoding.js';
import { buildBundles, classifyPath } from '../../../engine/core/bundle.js';
import { toJson } from '../../../engine/core/utils.js';

const DRAFT_PREFIX = 'admin-drafts:';

/** Run async tasks with limited concurrency. */
async function pool(items, limit, task) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) await task(queue.shift());
  });
  await Promise.all(workers);
}

export class Workspace extends Emitter {
  /** @param {import('../storage/github.js').GitHubStorage} storage */
  constructor(storage) {
    super();
    this.storage = storage;
    /** @type {Map<string, { path: string, sha: string, size: number }>} every file under content/ */
    this.tree = new Map();
    /** @type {Map<string, string>} published JSON text by path */
    this.original = new Map();
    /** @type {Map<string, string|null>} drafts: new text, or null = deleted */
    this.drafts = new Map();
    this.version = 0;
    this.head = null;
    this.lastCommit = null;
  }

  /* ── Loading ─────────────────────────────────────── */

  async load(onProgress = () => {}) {
    const { head, files } = await this.storage.loadTree();
    this.head = head;
    this.tree = new Map(files.map((f) => [f.path, f]));
    this.original = new Map();

    const jsonFiles = files.filter((f) => f.path.endsWith('.json') && classifyPath(f.path).kind !== 'media');
    let done = 0;
    await pool(jsonFiles, 8, async (f) => {
      this.original.set(f.path, await this.storage.readText(f.path, f.sha));
      onProgress(++done, jsonFiles.length);
    });

    this.restoreDrafts();
    this.touch();
  }

  /* ── Reading ─────────────────────────────────────── */

  /** Current text of a JSON file (draft first), or undefined if missing/deleted. */
  read(path) {
    if (this.drafts.has(path)) return this.drafts.get(path) ?? undefined;
    return this.original.get(path);
  }

  /** Parsed JSON (a fresh copy, safe to mutate). */
  readJson(path) {
    const text = this.read(path);
    if (text === undefined) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }

  exists(path) {
    return this.read(path) !== undefined;
  }

  /** All JSON paths (published + drafts, minus deleted). */
  jsonPaths() {
    const all = new Set([...this.original.keys(), ...this.drafts.keys()]);
    return [...all].filter((p) => this.exists(p)).sort();
  }

  /** All media paths under content/. */
  mediaPaths(siteId) {
    return [...this.tree.keys()].filter((p) => {
      const info = classifyPath(p);
      return info.kind === 'media' && (!siteId || info.siteId === siteId);
    });
  }

  /** Site bundles built from the current (draft) state; memoised per version. */
  bundles() {
    if (this._bundles?.version !== this.version) {
      const entries = this.jsonPaths().map((p) => [p, this.read(p)]);
      this._bundles = { version: this.version, value: buildBundles(entries, this.mediaPaths()) };
    }
    return this._bundles.value;
  }

  bundle(siteId) {
    return this.bundles()[siteId];
  }

  /* ── Writing drafts ──────────────────────────────── */

  writeJson(path, data) {
    const text = toJson(data);
    if (text === this.original.get(path)) this.drafts.delete(path);
    else this.drafts.set(path, text);
    this.persistDrafts();
    this.touch(path);
  }

  remove(path) {
    if (this.original.has(path)) this.drafts.set(path, null);
    else this.drafts.delete(path);
    this.persistDrafts();
    this.touch(path);
  }

  /** Move a document (e.g. renaming an item's file). */
  rename(from, to) {
    const text = this.read(from);
    if (text === undefined || from === to) return;
    this.remove(from);
    if (text === this.original.get(to)) this.drafts.delete(to);
    else this.drafts.set(to, text);
    this.persistDrafts();
    this.touch(to);
  }

  discard(path) {
    this.drafts.delete(path);
    this.persistDrafts();
    this.touch(path);
  }

  discardAll() {
    this.drafts.clear();
    this.persistDrafts();
    this.touch();
  }

  /** @returns {{ path: string, status: 'added'|'modified'|'deleted' }[]} */
  changes() {
    return [...this.drafts.entries()]
      .map(([path, text]) => ({
        path,
        status: text === null ? 'deleted' : this.original.has(path) ? 'modified' : 'added',
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  isDirty(path) {
    return path ? this.drafts.has(path) : this.drafts.size > 0;
  }

  touch(path) {
    this.version++;
    this.emit('change', { path });
  }

  /* ── Draft persistence (survives reloads) ────────── */

  get draftKey() {
    return `${DRAFT_PREFIX}${this.storage.id}`;
  }

  persistDrafts() {
    try {
      if (this.drafts.size) localStorage.setItem(this.draftKey, JSON.stringify(Object.fromEntries(this.drafts)));
      else localStorage.removeItem(this.draftKey);
    } catch (err) {
      console.warn('[workspace] could not save drafts locally', err);
    }
  }

  restoreDrafts() {
    this.drafts = new Map();
    try {
      const saved = JSON.parse(localStorage.getItem(this.draftKey) || '{}');
      for (const [path, text] of Object.entries(saved)) {
        if (text === this.original.get(path)) continue; // already published
        if (text === null && !this.original.has(path)) continue; // deleted elsewhere too
        this.drafts.set(path, text);
      }
    } catch {
      /* ignore corrupt drafts */
    }
    this.persistDrafts();
  }

  /* ── Publishing ──────────────────────────────────── */

  /**
   * Commit every draft in one go.
   * @param {string} message
   * @param {{ force?: boolean }} [opts] force = overwrite files changed elsewhere
   */
  async publish(message, { force = false } = {}) {
    const changes = this.changes();
    if (!changes.length) return null;
    const expected = {};
    if (!force) for (const { path } of changes) expected[path] = this.tree.get(path)?.sha ?? null;

    const { commit } = await this.storage.commit({
      message,
      changes: changes.map(({ path }) => ({ path, content: this.drafts.get(path) })),
      expected,
    });

    // Fold drafts into the published state without re-downloading everything.
    for (const { path } of changes) {
      const text = this.drafts.get(path);
      if (text === null) {
        this.original.delete(path);
        this.tree.delete(path);
      } else {
        this.original.set(path, text);
        this.tree.set(path, { path, sha: await gitBlobSha(text), size: new TextEncoder().encode(text).length });
      }
    }
    this.drafts.clear();
    this.persistDrafts();
    this.head = commit;
    this.lastCommit = { sha: commit, message, date: new Date().toISOString() };
    this.touch();
    this.emit('published', this.lastCommit);
    return commit;
  }

  /* ── Media (committed immediately) ───────────────── */

  /** Pick a free file name in a site's media folder. */
  uniqueMediaPath(siteId, name) {
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    let candidate = `content/sites/${siteId}/media/${base}${ext}`;
    for (let i = 2; this.tree.has(candidate); i++) candidate = `content/sites/${siteId}/media/${base}-${i}${ext}`;
    return candidate;
  }

  /**
   * Upload a file; resolves with its site-relative reference ("media/x.webp").
   * @param {string} siteId
   * @param {Blob} blob
   * @param {string} name cleaned file name
   */
  async uploadMedia(siteId, blob, name, { replacePath } = {}) {
    const path = replacePath || this.uniqueMediaPath(siteId, name);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const sha = await gitBlobSha(bytes);
    const existing = this.tree.get(path);
    const { commit } = await this.storage.commit({
      message: `${existing ? 'Replace' : 'Upload'} ${path.split('/').pop()}`,
      changes: [{ path, content: bytesToBase64(bytes), encoding: 'base64' }],
      expected: replacePath ? {} : { [path]: null },
    });
    this.storage.cacheMedia(sha, blob);
    this.tree.set(path, { path, sha, size: bytes.length });
    this.head = commit;
    this.lastCommit = { sha: commit, message: `Upload ${name}`, date: new Date().toISOString() };
    this.touch(path);
    this.emit('published', this.lastCommit);
    return classifyPath(path).ref;
  }

  async deleteMedia(path) {
    const { commit } = await this.storage.commit({
      message: `Delete ${path.split('/').pop()}`,
      changes: [{ path, content: null }],
      expected: {},
    });
    this.tree.delete(path);
    this.head = commit;
    this.lastCommit = { sha: commit, message: `Delete ${path.split('/').pop()}`, date: new Date().toISOString() };
    this.touch(path);
    this.emit('published', this.lastCommit);
  }

  /** URL to display a media file (by repo path or site-relative ref). */
  mediaUrl(siteId, ref) {
    const path = ref.startsWith('content/') ? ref : `content/sites/${siteId}/${ref}`;
    return this.storage.mediaUrl(path, this.tree.get(path)?.sha);
  }

  /** Documents of a site that mention a media reference. */
  usagesOf(siteId, ref) {
    const prefix = `content/sites/${siteId}/`;
    return this.jsonPaths().filter((p) => p.startsWith(prefix) && this.read(p).includes(`"${ref}"`));
  }
}
