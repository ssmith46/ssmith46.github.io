/**
 * Tests the GitHub storage adapter against a fake GitHub API (no network).
 * Covers loading, publishing as one commit, and conflict detection.
 * Run: node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GitHubStorage } from '../admin/js/storage/github.js';

/** Minimal in-memory imitation of the GitHub Git Data API. */
function fakeGitHub(files) {
  const state = { head: 'c1', commits: { c1: { tree: 't1' } }, trees: { t1: Object.entries(files).map(([path, sha]) => ({ path, sha, type: 'blob', size: 10 })) }, blobs: {}, calls: [] };
  let n = 0;
  globalThis.fetch = async (url, opts = {}) => {
    const u = new URL(url);
    const p = u.pathname;
    const method = opts.method || 'GET';
    const body = opts.body ? JSON.parse(opts.body) : null;
    state.calls.push(`${method} ${p}`);
    const json = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
    let m;
    if (p.endsWith('/git/ref/heads/main')) return json({ object: { sha: state.head } });
    if ((m = p.match(/git\/commits\/(\w+)$/))) return json({ tree: { sha: state.commits[m[1]].tree } });
    if ((m = p.match(/git\/trees\/(\w+)$/)) && method === 'GET') return json({ tree: state.trees[m[1]], truncated: false });
    if ((m = p.match(/git\/blobs\/(\w+)$/))) return json({ content: Buffer.from(state.blobs[m[1]] || '{"x":1}').toString('base64') });
    if (p.endsWith('/git/blobs') && method === 'POST') {
      const sha = `b${++n}`;
      state.blobs[sha] = body.content;
      return json({ sha });
    }
    if (p.endsWith('/git/trees') && method === 'POST') {
      const base = state.trees[body.base_tree].filter((e) => !body.tree.some((t) => t.path === e.path));
      const added = body.tree.filter((t) => t.sha).map((t) => ({ path: t.path, sha: t.sha, type: 'blob', size: 1 }));
      const sha = `t${++n}`;
      state.trees[sha] = [...base, ...added];
      return json({ sha });
    }
    if (p.endsWith('/git/commits') && method === 'POST') {
      const sha = `c${++n}`;
      state.commits[sha] = { tree: body.tree };
      return json({ sha });
    }
    if (p.endsWith('/git/refs/heads/main') && method === 'PATCH') {
      state.head = body.sha;
      return json({});
    }
    return json({ message: 'Not Found' }, 404);
  };
  return state;
}

const storage = () => new GitHubStorage({ owner: 'me', repo: 'me.github.io', branch: 'main', token: 't' });

test('loadTree lists only content files', async () => {
  fakeGitHub({ 'content/sites/a/site.json': 's1', 'README.md': 's2' });
  const { head, files } = await storage().loadTree();
  assert.equal(head, 'c1');
  assert.deepEqual(files.map((f) => f.path), ['content/sites/a/site.json']);
});

test('commit writes every change in a single commit and moves the branch', async () => {
  const gh = fakeGitHub({ 'content/sites/a/site.json': 's1', 'content/sites/a/pages/old.json': 's2' });
  const { commit } = await storage().commit({
    message: 'Update',
    changes: [
      { path: 'content/sites/a/site.json', content: '{"title":"New"}' },
      { path: 'content/sites/a/pages/old.json', content: null },
      { path: 'content/sites/a/pages/new.json', content: '{}' },
    ],
    expected: { 'content/sites/a/site.json': 's1', 'content/sites/a/pages/old.json': 's2', 'content/sites/a/pages/new.json': null },
  });
  assert.equal(gh.head, commit);
  const tree = gh.trees[gh.commits[commit].tree].map((e) => e.path).sort();
  assert.deepEqual(tree, ['content/sites/a/pages/new.json', 'content/sites/a/site.json']);
  assert.equal(gh.calls.filter((c) => c === 'POST /repos/me/me.github.io/git/commits').length, 1);
});

test('commit refuses to overwrite files changed elsewhere', async () => {
  fakeGitHub({ 'content/sites/a/site.json': 'changed-by-someone' });
  await assert.rejects(
    storage().commit({ message: 'x', changes: [{ path: 'content/sites/a/site.json', content: '{}' }], expected: { 'content/sites/a/site.json': 'what-i-loaded' } }),
    (err) => err.status === 409 && err.conflicts[0] === 'content/sites/a/site.json',
  );
});

test('commit never writes outside content/', async () => {
  fakeGitHub({});
  await assert.rejects(storage().commit({ message: 'x', changes: [{ path: '.github/workflows/evil.yml', content: 'x' }] }), /outside content/);
});
