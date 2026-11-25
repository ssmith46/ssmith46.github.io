/**
 * @file markdown.js
 * A small, safe Markdown renderer for write-ups and rich-text fields.
 *
 * Supported syntax (deliberately compact so it stays easy to maintain):
 *   Blocks : # headings, paragraphs, > quotes, - / 1. lists, ``` code fences,
 *            --- rules, and a standalone ![image](src "caption") as a figure.
 *   Inline : **bold**, *italic*, ~~strike~~, `code`, [links](url), ![img](src)
 *            and hard line breaks (two trailing spaces or a trailing "\").
 *
 * Raw HTML in the source is always escaped, and link/image URLs are
 * sanitised, so content can never inject scripts into the page.
 */
import { SafeHtml, escapeHtml } from './html.js';

/**
 * @typedef {object} MarkdownOptions
 * @property {(url: string) => string} [resolveUrl] Map content URLs (e.g. "media/x.webp") to real URLs.
 * @property {number} [minHeading=2] Lowest heading level emitted ("#" is promoted to it).
 */

/**
 * Render Markdown to SafeHtml.
 * @param {string} source
 * @param {MarkdownOptions} [options]
 * @returns {SafeHtml}
 */
export function markdown(source, options = {}) {
  const opts = { resolveUrl: (u) => u, minHeading: 2, ...options };
  const lines = String(source ?? '').replace(/\r\n?/g, '\n').split('\n');
  return new SafeHtml(renderBlocks(lines, opts));
}

/**
 * Render Markdown inline syntax only (no paragraphs). Handy for short fields.
 * @param {string} source
 * @param {MarkdownOptions} [options]
 */
export function markdownInline(source, options = {}) {
  return new SafeHtml(renderInline(String(source ?? ''), { resolveUrl: (u) => u, ...options }));
}

/* ------------------------------------------------------------------ */
/* Block level                                                          */
/* ------------------------------------------------------------------ */

const RE = {
  blank: /^\s*$/,
  fence: /^\s*```\s*([\w+-]*)\s*$/,
  heading: /^(#{1,6})\s+(.*?)\s*#*\s*$/,
  rule: /^\s*([-*_])(\s*\1){2,}\s*$/,
  quote: /^\s*>\s?(.*)$/,
  listItem: /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/,
  figure: /^\s*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/,
};

function renderBlocks(lines, opts) {
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    let m;

    if (RE.blank.test(line)) {
      i++;
      continue;
    }

    // Fenced code block
    if ((m = line.match(RE.fence))) {
      const lang = m[1];
      const buf = [];
      i++;
      while (i < lines.length && !RE.fence.test(lines[i])) buf.push(lines[i++]);
      i++; // skip closing fence (or run off the end safely)
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : '';
      out.push(`<pre><code${cls}>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }

    // Heading
    if ((m = line.match(RE.heading))) {
      // "#" and "##" both become the page's section level so authors can't
      // accidentally create a second <h1>; deeper levels pass through.
      const level = Math.min(6, Math.max(opts.minHeading, m[1].length));
      out.push(`<h${level}>${renderInline(m[2], opts)}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (RE.rule.test(line)) {
      out.push('<hr>');
      i++;
      continue;
    }

    // Block quote: gather consecutive ">" lines and render recursively
    if (RE.quote.test(line)) {
      const buf = [];
      while (i < lines.length && RE.quote.test(lines[i])) buf.push(lines[i++].match(RE.quote)[1]);
      out.push(`<blockquote>${renderBlocks(buf, opts)}</blockquote>`);
      continue;
    }

    // List (single level, with indented continuation lines)
    if ((m = line.match(RE.listItem))) {
      const ordered = /\d/.test(m[2]);
      const items = [];
      while (i < lines.length) {
        const im = lines[i].match(RE.listItem);
        if (im && /\d/.test(im[2]) === ordered) {
          items.push(im[3]);
          i++;
        } else if (items.length && /^\s{2,}\S/.test(lines[i])) {
          items[items.length - 1] += ` ${lines[i].trim()}`;
          i++;
        } else break;
      }
      const tag = ordered ? 'ol' : 'ul';
      const start = ordered && parseInt(m[2], 10) !== 1 ? ` start="${parseInt(m[2], 10)}"` : '';
      out.push(`<${tag}${start}>${items.map((t) => `<li>${renderInline(t, opts)}</li>`).join('')}</${tag}>`);
      continue;
    }

    // Standalone image => figure with optional caption
    if ((m = line.match(RE.figure))) {
      const src = safeUrl(m[2], opts);
      const caption = m[3] ? `<figcaption>${renderInline(m[3], opts)}</figcaption>` : '';
      out.push(`<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(m[1])}" loading="lazy">${caption}</figure>`);
      i++;
      continue;
    }

    // Paragraph: consume until a blank line or the start of another block
    const buf = [];
    while (i < lines.length && !RE.blank.test(lines[i]) && !startsBlock(lines[i])) buf.push(lines[i++]);
    if (buf.length === 0) buf.push(lines[i++]); // safety: never loop forever
    out.push(`<p>${renderParagraph(buf, opts)}</p>`);
  }

  return out.join('\n');
}

function startsBlock(line) {
  return RE.fence.test(line) || RE.heading.test(line) || RE.rule.test(line) || RE.quote.test(line) || RE.listItem.test(line);
}

function renderParagraph(lines, opts) {
  return lines
    .map((line, idx) => {
      const last = idx === lines.length - 1;
      const hardBreak = !last && (/ {2,}$/.test(line) || /\\$/.test(line));
      const text = renderInline(line.replace(/\\$/, '').trim(), opts);
      return hardBreak ? `${text}<br>` : text;
    })
    .join('\n');
}

/* ------------------------------------------------------------------ */
/* Inline level                                                         */
/* ------------------------------------------------------------------ */

/**
 * Inline rendering works on escaped text. Code spans are swapped out for
 * placeholders first so their contents are never formatted.
 */
function renderInline(text, opts) {
  const stash = [];
  const keep = (htmlStr) => `\u0000${stash.push(htmlStr) - 1}\u0000`;

  let s = text.replace(/`([^`]+)`/g, (_, code) => keep(`<code>${escapeHtml(code)}</code>`));
  s = escapeHtml(s);

  // Images before links (they share syntax)
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;(.*?)&quot;)?\)/g, (_, alt, url, title) =>
    keep(
      `<img src="${escapeHtml(safeUrl(unescape(url), opts))}" alt="${alt}"${title ? ` title="${title}"` : ''} loading="lazy">`,
    ),
  );
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;(.*?)&quot;)?\)/g, (_, label, url, title) => {
    const href = safeUrl(unescape(url), opts);
    const external = /^https?:\/\//i.test(href);
    const extra = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return keep(`<a href="${escapeHtml(href)}"${title ? ` title="${title}"` : ''}${extra}>${label}</a>`);
  });

  s = s
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/__(?=\S)([\s\S]*?\S)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?=\S)([^*]*?\S)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])_(?=\S)([^_]*?\S)_(?=$|[\s).,!?:;])/g, '$1<em>$2</em>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');

  return s.replace(/\u0000(\d+)\u0000/g, (_, n) => stash[Number(n)]);
}

/** Reverse escapeHtml for URLs captured from already-escaped text. */
function unescape(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/**
 * Allow only harmless URL schemes. Anything else (javascript:, data:, …)
 * becomes "#". Relative URLs are passed through `resolveUrl`.
 */
export function safeUrl(url, opts = {}) {
  const value = String(url ?? '').trim();
  const scheme = value.match(/^([a-z][a-z0-9+.-]*):/i);
  if (scheme && !/^(https?|mailto|tel)$/i.test(scheme[1])) return '#';
  if (!scheme && opts.resolveUrl) return opts.resolveUrl(value);
  return value;
}
