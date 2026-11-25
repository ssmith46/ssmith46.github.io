/**
 * @file fields/markdown.js
 * Rich-text field: a comfortable textarea with a formatting toolbar, an
 * "insert image" button and a Preview tab rendered by the site's own
 * Markdown engine (so the preview matches the live page).
 */
import { h, icon, autosize, fragment } from '../lib/dom.js';
import { markdown as renderMarkdown } from '../../../engine/core/markdown.js';
import { openMediaPicker } from '../components/media.js';

/** Wrap the selection (or insert a placeholder) with before/after text. */
function wrapSelection(textarea, before, after = before, placeholder = 'text') {
  const { selectionStart: s, selectionEnd: e, value } = textarea;
  const selected = value.slice(s, e) || placeholder;
  textarea.setRangeText(`${before}${selected}${after}`, s, e, 'end');
  textarea.setSelectionRange(s + before.length, s + before.length + selected.length);
  textarea.focus();
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Prefix every selected line (for headings and lists). */
function prefixLines(textarea, prefix) {
  const { selectionStart: s, selectionEnd: e, value } = textarea;
  const start = value.lastIndexOf('\n', s - 1) + 1;
  const block = value.slice(start, e) || '';
  const replaced = block
    .split('\n')
    .map((line, i) => (typeof prefix === 'function' ? prefix(i) : prefix) + line.replace(/^(#{1,6}\s|[-*]\s|\d+\.\s)/, ''))
    .join('\n');
  textarea.setRangeText(replaced, start, e, 'end');
  textarea.focus();
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

export const markdownField = {
  render: ({ field, value, set, id, fctx }) => {
    const textarea = autosize(
      h('textarea.input.input--markdown', {
        id,
        rows: field.rows || 6,
        value: value ?? '',
        placeholder: field.placeholder || 'Write here… **bold**, *italic*, [links](https://…), - lists',
        oninput: (e) => set(e.target.value),
      }),
    );

    const preview = h('div.md-preview.prose-admin', { hidden: true });
    const tabs = h('div.md-tabs');
    const setMode = (mode) => {
      const showPreview = mode === 'preview';
      preview.hidden = !showPreview;
      textarea.hidden = showPreview;
      toolbar.classList.toggle('is-disabled', showPreview);
      if (showPreview) {
        const htmlOut = String(renderMarkdown(textarea.value));
        preview.replaceChildren(htmlOut.trim() ? fragment(htmlOut) : h('p.muted', 'Nothing to preview yet.'));
      }
      tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    };
    tabs.append(
      h('button.md-tab', { type: 'button', dataset: { mode: 'write' }, attrs: { 'aria-selected': 'true' }, onclick: () => setMode('write') }, 'Write'),
      h('button.md-tab', { type: 'button', dataset: { mode: 'preview' }, onclick: () => setMode('preview') }, 'Preview'),
    );

    const tool = (iconName, title, run) => h('button.md-tool', { type: 'button', title, 'aria-label': title, onclick: run }, icon(iconName, 16));
    const toolbar = h(
      'div.md-toolbar',
      tool('bold', 'Bold', () => wrapSelection(textarea, '**')),
      tool('italic', 'Italic', () => wrapSelection(textarea, '*')),
      tool('heading', 'Heading', () => prefixLines(textarea, '### ')),
      tool('list', 'Bulleted list', () => prefixLines(textarea, '- ')),
      tool('quote', 'Quote', () => prefixLines(textarea, '> ')),
      tool('link', 'Link', () => {
        const url = window.prompt('Link address (https://…)', 'https://');
        if (url) wrapSelection(textarea, '[', `](${url})`, 'link text');
      }),
      tool('image', 'Insert image', async () => {
        const ref = await openMediaPicker(fctx.app, { kind: 'image' });
        if (ref) wrapSelection(textarea, '![', `](${ref})`, 'Describe the image');
      }),
    );

    return h('div.md-field', h('div.md-bar', tabs, toolbar), textarea, preview);
  },
};
