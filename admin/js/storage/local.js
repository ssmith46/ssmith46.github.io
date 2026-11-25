/**
 * @file storage/local.js
 * Storage adapter for local development: talks to `node tools/dev.mjs`,
 * which reads/writes the content/ folder on disk. Same interface as
 * storage/github.js, so the rest of the admin can't tell the difference.
 */
import { StorageError } from './github.js';

const API = '/__admin/api';

export class LocalStorageAdapter {
  kind = 'local';
  id = 'local';
  label = 'Local files';

  async request(path, options = {}) {
    let res;
    try {
      res = await fetch(`${API}/${path}`, { cache: 'no-store', ...options });
    } catch {
      throw new StorageError('The local dev server isn’t running. Start it with: node tools/dev.mjs');
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new StorageError(body.error === 'conflict' ? 'Some files changed on disk since you opened them.' : body.error || `Error ${res.status}`, {
        status: res.status,
        conflicts: body.conflicts || [],
      });
    }
    return res;
  }

  /** True when the page is served by the dev server. */
  static async detect() {
    try {
      const res = await fetch(`${API}/info`, { cache: 'no-store' });
      return res.ok && (await res.json()).mode === 'local';
    } catch {
      return false;
    }
  }

  async whoAmI() {
    return (await (await this.request('info')).json()).user;
  }

  async loadTree() {
    return (await this.request('tree')).json();
  }

  async readText(path) {
    return (await this.request(`raw?path=${encodeURIComponent(path)}`)).text();
  }

  async mediaUrl(path, sha) {
    return `${API}/raw?path=${encodeURIComponent(path)}${sha ? `&v=${sha.slice(0, 8)}` : ''}`;
  }

  cacheMedia() {}

  async commit({ message, changes, expected }) {
    const res = await this.request('commit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message, changes, expected }),
    });
    return res.json();
  }

  async recentCommits() {
    return (await this.request('commits')).json();
  }

  async deployStatus() {
    return { state: 'success' }; // the dev server rebuilds synchronously
  }

  defaultSiteUrl() {
    return location.origin;
  }
}
