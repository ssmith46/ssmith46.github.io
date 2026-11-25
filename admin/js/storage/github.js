/**
 * @file storage/github.js
 * Storage adapter that reads and writes the repository through the GitHub
 * REST API, straight from the browser. Publishing creates one commit on the
 * configured branch; the deploy workflow then rebuilds the site.
 *
 * Every adapter implements the same interface (see storage/local.js):
 *   id, label, kind
 *   whoAmI()                      → { login, name, avatarUrl }
 *   loadTree()                    → { head, files: [{ path, sha, size }] }
 *   readText(path, sha)           → string
 *   mediaUrl(path, sha)           → URL usable in <img src>
 *   commit({ message, changes, expected }) → { commit }
 *       changes:  [{ path, content: string|null, encoding?: 'utf-8'|'base64' }]
 *       expected: { [path]: sha|null }  — fail if the file changed meanwhile
 *   recentCommits()               → [{ sha, message, date, author }]
 *   deployStatus(commitSha)       → { state: 'pending'|'success'|'failure'|'unknown', url? }
 */
import { base64ToText } from '../lib/encoding.js';

const API = 'https://api.github.com';

/** Error carrying the HTTP status and a friendly message. */
export class StorageError extends Error {
  constructor(message, { status = 0, conflicts = [] } = {}) {
    super(message);
    this.status = status;
    this.conflicts = conflicts;
  }
}

export class GitHubStorage {
  kind = 'github';

  /** @param {{ owner: string, repo: string, branch: string, token: string, contentRoot?: string }} opts */
  constructor({ owner, repo, branch = 'main', token, contentRoot = 'content' }) {
    Object.assign(this, { owner, repo, branch, token, contentRoot });
    this.id = `github:${owner}/${repo}@${branch}`;
    this.label = `${owner}/${repo}`;
    this.mediaCache = new Map();
  }

  /** Low-level API request. */
  async api(path, { method = 'GET', body, accept = 'application/vnd.github+json', raw = false } = {}) {
    let res;
    try {
      res = await fetch(`${API}${path}`, {
        method,
        headers: {
          Accept: accept,
          Authorization: `Bearer ${this.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      });
    } catch {
      throw new StorageError('Couldn’t reach GitHub. Check your internet connection.');
    }
    if (!res.ok) {
      let detail = '';
      try {
        detail = (await res.json()).message || '';
      } catch {
        /* ignore */
      }
      const friendly =
        res.status === 401
          ? 'GitHub didn’t accept your access key. It may have expired — connect again with a new key.'
          : res.status === 403 && /rate limit/i.test(detail)
            ? 'GitHub is rate-limiting requests. Wait a minute and try again.'
            : res.status === 403 || res.status === 404
              ? `Your access key can’t reach ${this.label}. Make sure it has “Contents: Read and write” for this repository.`
              : detail || `GitHub error ${res.status}`;
      throw new StorageError(friendly, { status: res.status });
    }
    if (raw) return res;
    return res.status === 204 ? null : res.json();
  }

  get repoPath() {
    return `/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}`;
  }

  async whoAmI() {
    const user = await this.api('/user');
    return { login: user.login, name: user.name || user.login, avatarUrl: user.avatar_url };
  }

  /** Confirm the key can write to the repository. */
  async checkAccess() {
    const repo = await this.api(this.repoPath);
    if (!repo.permissions?.push) {
      throw new StorageError(`This GitHub account can view ${this.label} but can’t publish to it.`, { status: 403 });
    }
    return repo;
  }

  async headCommit() {
    const ref = await this.api(`${this.repoPath}/git/ref/heads/${encodeURIComponent(this.branch)}`);
    return ref.object.sha;
  }

  async treeAt(commitSha) {
    const commit = await this.api(`${this.repoPath}/git/commits/${commitSha}`);
    const tree = await this.api(`${this.repoPath}/git/trees/${commit.tree.sha}?recursive=1`);
    if (tree.truncated) console.warn('[github] repository tree was truncated; very large repos may miss files');
    return { treeSha: commit.tree.sha, entries: tree.tree };
  }

  async loadTree() {
    const head = await this.headCommit();
    const { entries } = await this.treeAt(head);
    const prefix = `${this.contentRoot}/`;
    const files = entries.filter((e) => e.type === 'blob' && e.path.startsWith(prefix)).map((e) => ({ path: e.path, sha: e.sha, size: e.size }));
    return { head, files };
  }

  async readText(_path, sha) {
    const blob = await this.api(`${this.repoPath}/git/blobs/${sha}`);
    return base64ToText(blob.content);
  }

  /** Download a media file once and serve it from an object URL. */
  async mediaUrl(path, sha) {
    const key = sha || path;
    if (!this.mediaCache.has(key)) {
      const promise = (async () => {
        const res = sha
          ? await this.api(`${this.repoPath}/git/blobs/${sha}`, { accept: 'application/vnd.github.raw+json', raw: true })
          : await this.api(`${this.repoPath}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(this.branch)}`, {
              accept: 'application/vnd.github.raw+json',
              raw: true,
            });
        const type = mimeFor(path);
        const blob = await res.blob();
        return URL.createObjectURL(type ? new Blob([blob], { type }) : blob);
      })();
      this.mediaCache.set(key, promise);
      promise.catch(() => this.mediaCache.delete(key));
    }
    return this.mediaCache.get(key);
  }

  /** Remember a just-uploaded file so previews don't re-download it. */
  cacheMedia(sha, blob) {
    this.mediaCache.set(sha, Promise.resolve(URL.createObjectURL(blob)));
  }

  /**
   * Create a single commit containing every change, using the Git Data API.
   * Retries automatically if someone else pushed in the meantime.
   */
  async commit({ message, changes, expected = {} }) {
    for (const change of changes) {
      if (!change.path.startsWith(`${this.contentRoot}/`)) throw new StorageError(`Refusing to write outside ${this.contentRoot}/: ${change.path}`);
    }

    // Upload file contents once (blobs are content-addressed, so retries reuse them).
    const blobShas = new Map();
    for (const change of changes) {
      if (change.content == null) continue;
      const blob = await this.api(`${this.repoPath}/git/blobs`, {
        method: 'POST',
        body: { content: change.content, encoding: change.encoding === 'base64' ? 'base64' : 'utf-8' },
      });
      blobShas.set(change.path, blob.sha);
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      const head = await this.headCommit();
      const { treeSha, entries } = await this.treeAt(head);

      // Refuse to overwrite files that changed since they were loaded.
      const remote = new Map(entries.filter((e) => e.type === 'blob').map((e) => [e.path, e.sha]));
      const conflicts = Object.entries(expected)
        .filter(([path, sha]) => (remote.get(path) ?? null) !== (sha ?? null))
        .map(([path]) => path);
      if (conflicts.length) throw new StorageError('Some files were changed somewhere else since you opened them.', { status: 409, conflicts });

      const tree = await this.api(`${this.repoPath}/git/trees`, {
        method: 'POST',
        body: {
          base_tree: treeSha,
          tree: changes
            .filter((c) => c.content != null || remote.has(c.path))
            .map((c) => ({ path: c.path, mode: '100644', type: 'blob', sha: c.content == null ? null : blobShas.get(c.path) })),
        },
      });
      const commit = await this.api(`${this.repoPath}/git/commits`, {
        method: 'POST',
        body: { message, tree: tree.sha, parents: [head] },
      });
      try {
        await this.api(`${this.repoPath}/git/refs/heads/${encodeURIComponent(this.branch)}`, {
          method: 'PATCH',
          body: { sha: commit.sha, force: false },
        });
        return { commit: commit.sha };
      } catch (err) {
        if (err.status !== 422 || attempt === 2) throw err; // 422 = branch moved; rebuild on the new head
      }
    }
    throw new StorageError('Couldn’t publish after several attempts. Please try again.');
  }

  async recentCommits() {
    const list = await this.api(`${this.repoPath}/commits?sha=${encodeURIComponent(this.branch)}&path=${this.contentRoot}&per_page=8`);
    return list.map((c) => ({
      sha: c.sha,
      message: c.commit.message.split('\n')[0],
      date: c.commit.author?.date,
      author: c.commit.author?.name,
      url: c.html_url,
    }));
  }

  /** Status of the GitHub Actions deploy triggered by a commit. */
  async deployStatus(commitSha) {
    try {
      const data = await this.api(`${this.repoPath}/actions/runs?head_sha=${commitSha}&per_page=5`);
      const run = data.workflow_runs?.find((r) => /deploy/i.test(r.name)) || data.workflow_runs?.[0];
      if (!run) return { state: 'pending' };
      if (run.status !== 'completed') return { state: 'pending', url: run.html_url };
      return { state: run.conclusion === 'success' ? 'success' : 'failure', url: run.html_url };
    } catch {
      return { state: 'unknown' }; // key lacks "Actions: read" — not fatal
    }
  }

  /** Where the built site lives (used for "View site" links). */
  defaultSiteUrl() {
    const host = `${this.owner.toLowerCase()}.github.io`;
    return this.repo.toLowerCase() === host ? `https://${host}` : `https://${host}/${this.repo}`;
  }
}

/** Content types for media previews. */
export function mimeFor(path) {
  const ext = path.split('.').pop().toLowerCase();
  return (
    {
      webp: 'image/webp',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      avif: 'image/avif',
      pdf: 'application/pdf',
      mp4: 'video/mp4',
    }[ext] || ''
  );
}
