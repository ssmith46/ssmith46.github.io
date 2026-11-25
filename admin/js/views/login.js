/**
 * @file views/login.js
 * Sign-in screens. Only people with write access to the GitHub repository can
 * publish, so that's what we verify.
 *
 *   First visit:  paste a GitHub access key → choose a password for this device
 *   Next visits:  enter that password
 *
 * Resolves with a working access token.
 */
import { h, icon } from '../lib/dom.js';
import { vault } from '../lib/vault.js';
import { GitHubStorage } from '../storage/github.js';

/** Pre-filled "create a fine-grained token" link for this repository. */
function tokenUrl(config) {
  const params = new URLSearchParams({
    name: `Website admin (${new Date().toISOString().slice(0, 10)})`,
    description: `Lets the admin at ${location.host} publish to ${config.repo.owner}/${config.repo.name}.`,
    target_name: config.repo.owner,
    expires_in: '366',
    contents: 'write',
    actions: 'read',
  });
  return `https://github.com/settings/personal-access-tokens/new?${params}`;
}

function screen(...children) {
  return h('div.login', h('div.login__card', h('div.login__brand', h('span.login__mark', icon('rocket', 22)), h('span', 'Site admin')), ...children));
}

function spin(button, busy, label) {
  button.disabled = busy;
  button.replaceChildren(...(busy ? [h('span.spinner'), 'Checking…'] : [label]));
}

/**
 * @param {HTMLElement} root
 * @param {object} config admin/js/config.js
 * @returns {Promise<{ token: string, user: object }>}
 */
export function login(root, config) {
  return new Promise((resolve) => {
    const verify = async (token) => {
      const storage = new GitHubStorage({ owner: config.repo.owner, repo: config.repo.name, branch: config.repo.branch, token });
      const user = await storage.whoAmI();
      await storage.checkAccess();
      return user;
    };

    /* Returning visitor: unlock with password */
    const unlockScreen = (info) => {
      const password = h('input.input', { type: 'password', autocomplete: 'current-password', placeholder: 'Password', autofocus: true });
      const error = h('p.field__error', { hidden: true });
      const submit = h('button.btn.btn--primary.btn--block', { type: 'submit' }, 'Unlock');
      root.replaceChildren(
        screen(
          h('div.login__avatar', info?.avatarUrl ? h('img', { src: info.avatarUrl, alt: '' }) : icon('user', 28)),
          h('h1.login__title', `Welcome back${info?.name ? `, ${info.name.split(' ')[0]}` : ''}`),
          h('p.login__text', 'Enter your password to open the admin.'),
          h(
            'form.login__form',
            {
              onsubmit: async (e) => {
                e.preventDefault();
                spin(submit, true, 'Unlock');
                error.hidden = true;
                try {
                  const token = await vault.unlock(password.value);
                  const user = await verify(token);
                  resolve({ token, user });
                } catch (err) {
                  if (err.status === 401) vault.lock();
                  error.textContent = err.message;
                  error.hidden = false;
                  spin(submit, false, 'Unlock');
                  password.select();
                }
              },
            },
            password,
            error,
            submit,
          ),
          h(
            'button.link-btn',
            {
              type: 'button',
              onclick: () => {
                if (window.confirm('Forget the saved login on this device? You’ll need a GitHub access key to sign in again.')) {
                  vault.forget();
                  connectScreen();
                }
              },
            },
            'Use a different account or forgot your password?',
          ),
        ),
      );
      password.focus();
    };

    /* First visit: connect a GitHub access key */
    const connectScreen = () => {
      const token = h('input.input.input--mono', { type: 'password', autocomplete: 'off', placeholder: 'github_pat_…', spellcheck: false });
      const password = h('input.input', { type: 'password', autocomplete: 'new-password', placeholder: 'At least 8 characters' });
      const confirmPw = h('input.input', { type: 'password', autocomplete: 'new-password', placeholder: 'Type it again' });
      const error = h('p.field__error', { hidden: true });
      const submit = h('button.btn.btn--primary.btn--block', { type: 'submit' }, 'Connect');

      root.replaceChildren(
        screen(
          h('h1.login__title', 'Connect your site'),
          h('p.login__text', `Only GitHub accounts that can edit `, h('strong', `${config.repo.owner}/${config.repo.name}`), ' can sign in here.'),
          h(
            'ol.login__steps',
            h(
              'li',
              h('strong', 'Create an access key on GitHub. '),
              'Choose “Only select repositories” → ',
              h('code', config.repo.name),
              ', give “Contents” Read and write access, then press Generate.',
              h('a.btn.btn--sm.login__gh', { href: tokenUrl(config), target: '_blank', rel: 'noopener' }, icon('github', 16), 'Open GitHub', icon('arrow-up-right', 14)),
            ),
            h('li', h('strong', 'Paste the key below'), ' and choose a password for this device.'),
          ),
          h(
            'form.login__form',
            {
              onsubmit: async (e) => {
                e.preventDefault();
                error.hidden = true;
                const t = token.value.trim();
                const problem = !t ? 'Paste your GitHub access key.' : password.value.length < 8 ? 'Choose a password with at least 8 characters.' : password.value !== confirmPw.value ? 'The passwords don’t match.' : null;
                if (problem) {
                  error.textContent = problem;
                  error.hidden = false;
                  return;
                }
                spin(submit, true, 'Connect');
                try {
                  const user = await verify(t);
                  await vault.save(t, password.value, { name: user.name, login: user.login, avatarUrl: user.avatarUrl });
                  resolve({ token: t, user });
                } catch (err) {
                  error.textContent = err.message;
                  error.hidden = false;
                  spin(submit, false, 'Connect');
                }
              },
            },
            h('label.field', h('span.field__label', 'GitHub access key'), token),
            h('label.field', h('span.field__label', 'Password for this device'), password, h('span.field__help', 'Your key is stored encrypted on this device only. You’ll use this password to sign in next time.')),
            h('label.field', h('span.field__label', 'Confirm password'), confirmPw),
            error,
            submit,
          ),
        ),
      );
      token.focus();
    };

    const session = vault.session();
    if (session) {
      verify(session)
        .then((user) => resolve({ token: session, user }))
        .catch(() => {
          vault.lock();
          vault.info() ? unlockScreen(vault.info()) : connectScreen();
        });
      root.replaceChildren(h('div.boot', h('span.spinner'), 'Signing in…'));
    } else if (vault.info()) unlockScreen(vault.info());
    else connectScreen();
  });
}
