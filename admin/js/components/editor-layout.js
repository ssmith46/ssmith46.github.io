/**
 * @file components/editor-layout.js
 * Two-pane editor frame (form on the left, live preview on the right) used
 * by the page, item and design editors. On small screens the panes become
 * tabs switched with a floating "Preview / Edit" button.
 */
import { h, icon } from '../lib/dom.js';

/**
 * @param {{ form: Node, preview?: { el: Node } }} parts
 */
export function editorLayout({ form, preview }) {
  const root = h('div.editor', { class: preview ? '' : 'editor--solo' });
  const toggle = preview
    ? h(
        'button.btn.btn--primary.editor__toggle',
        {
          type: 'button',
          onclick: () => {
            const showing = root.classList.toggle('is-previewing');
            toggle.replaceChildren(icon(showing ? 'pencil' : 'eye', 16), showing ? 'Edit' : 'Preview');
          },
        },
        icon('eye', 16),
        'Preview',
      )
    : null;
  root.append(h('div.editor__form', form), preview ? h('div.editor__preview', preview.el) : null, toggle);
  return root;
}

/**
 * Connect an editor to one document in the workspace.
 * - `save(doc)` stores the editor's copy as a draft.
 * - `onExternalChange` runs when the document changes *outside* the editor
 *   (e.g. a draft is discarded from the Publish dialog), so the editor can
 *   re-render with fresh data instead of overwriting it.
 * @returns {{ save: (doc: object) => void, off: () => void }}
 */
export function bindDocument(app, path, onExternalChange) {
  let saving = false;
  let lastSeen = app.ws.read(path);
  const off = app.ws.on('change', () => {
    if (saving) return;
    const current = app.ws.read(path);
    if (current !== lastSeen) {
      lastSeen = current;
      onExternalChange();
    }
  });
  return {
    save(doc) {
      saving = true;
      try {
        app.ws.writeJson(path, doc);
      } finally {
        saving = false;
      }
      lastSeen = app.ws.read(path);
    },
    off,
  };
}
