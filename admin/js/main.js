/**
 * @file main.js
 * Admin entry point.
 *
 *   1. Pick a storage adapter: the local dev server (if running) or GitHub.
 *   2. Sign in (GitHub only) — see views/login.js.
 *   3. Load every content file into the workspace.
 *   4. Start the shell (sidebar + routed views).
 *
 * Add ?github to the URL while running the dev server to test against GitHub.
 */
import config from './config.js';
import { h } from './lib/dom.js';
import { registry } from '../../engine/registry.js';
import { Workspace } from './state/workspace.js';
import { GitHubStorage } from './storage/github.js';
import { LocalStorageAdapter } from './storage/local.js';
import { login } from './views/login.js';
import { startShell, applyAdminTheme } from './views/shell.js';
import { vault } from './lib/vault.js';

const root = document.getElementById('app');

function bootScreen(message, progress) {
  root.replaceChildren(
    h('div.boot', h('div.boot__mark'), h('p.boot__text', message), progress != null ? h('div.boot__bar', h('span', { style: { width: `${Math.round(progress * 100)}%` } })) : null),
  );
}

function errorScreen(err, retry) {
  root.replaceChildren(
    h(
      'div.login',
      h(
        'div.login__card',
        h('h1.login__title', 'Couldn’t open the admin'),
        h('p.login__text', err.message || String(err)),
        h('div.modal__actions', h('button.btn', { type: 'button', onclick: () => (vault.forget(), location.reload()) }, 'Sign in again'), h('button.btn.btn--primary', { type: 'button', onclick: retry }, 'Try again')),
      ),
    ),
  );
}

async function boot() {
  applyAdminTheme();
  bootScreen('Starting…');

  let storage;
  let user;
  const forceGitHub = new URLSearchParams(location.search).has('github');
  if (!forceGitHub && (await LocalStorageAdapter.detect())) {
    storage = new LocalStorageAdapter();
    user = await storage.whoAmI();
  } else {
    const session = await login(root, config);
    storage = new GitHubStorage({ owner: config.repo.owner, repo: config.repo.name, branch: config.repo.branch, token: session.token, contentRoot: config.contentRoot });
    user = session.user;
  }

  const ws = new Workspace(storage);
  try {
    bootScreen('Loading your content…', 0);
    await ws.load((done, total) => bootScreen('Loading your content…', done / total));
  } catch (err) {
    console.error(err);
    errorScreen(err, () => boot());
    return;
  }

  startShell({ ws, storage, registry, user, config });
}

boot();
