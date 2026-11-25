/**
 * @file fields/index.js
 * Registry of field types → renderers. To add a field type, write a renderer
 * ({ render({ field, value, set, id, fctx }) → HTMLElement, ownLabel? }) and
 * register it here; any module can then use it in its `fields`.
 */
import { text, slug, url, textarea, number, date, color, toggle, select, collection, iconField } from './basic.js';
import { markdownField } from './markdown.js';
import { image, file } from './media.js';
import { link } from './link.js';
import { tags, lines, list } from './lists.js';

export const FIELD_RENDERERS = {
  text,
  slug,
  url,
  textarea,
  number,
  date,
  color,
  toggle,
  select,
  collection,
  icon: iconField,
  markdown: markdownField,
  image,
  file,
  link,
  tags,
  lines,
  list,
};

export { renderForm } from './form.js';
