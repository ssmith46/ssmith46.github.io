/**
 * @file views/publish.js
 * The Publish dialog (review drafts → one commit) and the deploy tracker that
 * shows "Publishing… → Live" in the top bar.
 */
import { h, icon } from '../lib/dom.js';
import { modal, toast } from '../lib/ui.js';
import { classifyPath } from '../../../engine/core/bundle.js';
import { plural } from '../lib/format.js';

/** Describe a changed file in plain words: { group, title }. */
export function describeChange(app, path) {
  const info = classifyPath(path);
  const bundle = app.ws.bundle(info.siteId);
  const doc = app.ws.readJson(path) || JSON.parse(app.ws.original.get(path) || '{}');
  const siteTitle = bundle?.site.title || info.siteId;
  if (info.kind === 'site') return { group: siteTitle, title: 'Site settings & design', icon: 'sliders' };
  if (info.kind === 'page') return { group: siteTitle, title: `Page · ${doc.title || info.pageId}`, icon: 'file' };
  if (info.kind === 'item') {
    const config = bundle?.site.collections.find((c) => c.id === info.collectionId);
    const type = config && app.registry.collections.get(config.type);
    const name = type?.titleOf?.(doc) || doc.title || info.itemId;
    return { group: siteTitle, title: `${type?.label || 'Item'} · ${name}`, icon: type?.icon || 'folder' };
  }
  return { group: siteTitle, title: path, icon: 'file' };
}

/** A sensible default commit message from the list of changes. */
function defaultMessage(app, changes) {
  const titles = changes.map((c) => describeChange(app, c.path).title.replace(/^.*· /, ''));
  if (changes.length === 1) {
    const verb = { added: 'Add', modified: 'Update', deleted: 'Remove' }[changes[0].status];
    return `${verb} ${titles[0]}`;
  }
  return `Update ${titles.slice(0, 3).join(', ')}${changes.length > 3 ? ` and ${changes.length - 3} more` : ''}`;
}

export function openPublish(app) {
  const { ws } = app;
  if (!ws.changes().length) return;

  return modal({
    title: 'Publish changes',
    size: 'md',
    render: (close) => {
      const list = h('ul.change-list');
      const message = h('input.input', { type: 'text' });
      const publishBtn = h('button.btn.btn--primary', { type: 'submit' }, icon('send', 16), 'Publish');
      const error = h('div.callout.callout--error', { hidden: true });

      const draw = () => {
        const changes = ws.changes();
        if (!changes.length) return close();
        message.value = defaultMessage(app, changes);
        list.replaceChildren(
          ...changes.map((c) => {
            const d = describeChange(app, c.path);
            return h(
              'li.change',
              h('span.change__icon', icon(d.icon, 16)),
              h('span.change__text', h('strong', d.title), h('small', d.group)),
              h(`span.badge.badge--${c.status}`, { added: 'New', modified: 'Edited', deleted: 'Removed' }[c.status]),
              h(
                'button.icon-btn.icon-btn--sm',
                {
                  type: 'button',
                  title: 'Discard this change',
                  'aria-label': 'Discard this change',
                  onclick: async () => {
                    if (await app.confirm({ title: 'Discard this change?', message: `${d.title} will go back to the published version.`, confirmLabel: 'Discard', danger: true })) {
                      ws.discard(c.path);
                      draw();
                    }
                  },
                },
                icon('undo', 15),
              ),
            );
          }),
        );
      };
      draw();

      const submit = async (e, force = false) => {
        e?.preventDefault();
        publishBtn.disabled = true;
        publishBtn.replaceChildren(h('span.spinner'), 'Publishing…');
        error.hidden = true;
        try {
          const count = ws.changes().length;
          await ws.publish(message.value.trim() || 'Update content', { force });
          close();
          toast(`Published ${plural(count, 'change')}. ${app.storage.kind === 'local' ? 'Saved to your files.' : 'Your site updates in about a minute.'}`, { type: 'success' });
          // The shell listens for the workspace's "published" event and tracks the deploy.
        } catch (err) {
          publishBtn.disabled = false;
          publishBtn.replaceChildren(icon('send', 16), 'Publish');
          error.hidden = false;
          if (err.status === 409) {
            error.replaceChildren(
              h('strong', 'Someone changed these files elsewhere:'),
              h('ul', (err.conflicts || []).map((p) => h('li', describeChange(app, p).title))),
              h('p', 'Publishing anyway will replace their version with yours.'),
              h('button.btn.btn--danger.btn--sm', { type: 'button', onclick: (ev) => submit(ev, true) }, 'Publish anyway'),
            );
          } else {
            error.replaceChildren(icon('alert-circle', 16), h('span', err.message));
          }
        }
      };

      return h(
        'form.publish',
        { onsubmit: submit },
        h('p.muted', 'These changes will go live on your site. Everything else stays as it is.'),
        list,
        h('label.field', h('span.field__label', 'Describe this update'), message, h('span.field__help', 'Saved in your site’s history so you can find this version later.')),
        error,
        h(
          'div.modal__actions',
          h(
            'button.btn.btn--ghost.btn--danger-text',
            {
              type: 'button',
              onclick: async () => {
                if (await app.confirm({ title: 'Discard all changes?', message: 'Every unpublished edit will be thrown away. This can’t be undone.', confirmLabel: 'Discard all', danger: true })) {
                  ws.discardAll();
                  close();
                }
              },
            },
            'Discard all',
          ),
          h('span.spacer'),
          h('button.btn', { type: 'button', onclick: () => close() }, 'Cancel'),
          publishBtn,
        ),
      );
    },
  });
}

/**
 * Poll the deploy that a commit triggered and show its progress.
 * @param {object} app
 * @param {string} sha commit id
 * @param {HTMLElement} el status element in the top bar
 */
export function trackDeploy(app, sha, el) {
  if (!sha || !el) return;
  const token = Symbol('deploy');
  el._token = token;
  const show = (state, text, url) => {
    if (el._token !== token) return;
    el.hidden = false;
    el.className = `deploy-status deploy-status--${state}`;
    el.replaceChildren(
      state === 'pending' ? h('span.spinner.spinner--sm') : h('span.deploy-status__dot'),
      url ? h('a', { href: url, target: '_blank', rel: 'noopener' }, text) : h('span', text),
    );
  };

  if (app.storage.kind === 'local') {
    show('success', 'Saved locally');
    setTimeout(() => el._token === token && (el.hidden = true), 6000);
    return;
  }

  show('pending', 'Publishing…');
  const started = Date.now();
  const poll = async () => {
    if (el._token !== token) return;
    const { state, url } = await app.storage.deployStatus(sha);
    if (state === 'success') {
      show('success', 'Live', app.liveUrl(app.site?.basePath || '/'));
      setTimeout(() => el._token === token && (el.hidden = true), 20000);
    } else if (state === 'failure') {
      show('failure', 'Deploy failed — details', url);
    } else if (state === 'unknown' && Date.now() - started > 90000) {
      show('success', 'Published', app.liveUrl(app.site?.basePath || '/'));
    } else if (Date.now() - started < 10 * 60 * 1000) {
      setTimeout(poll, 5000);
    }
  };
  setTimeout(poll, 4000);
}
