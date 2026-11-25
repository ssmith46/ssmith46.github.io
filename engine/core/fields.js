/**
 * @file fields.js
 * The schema language modules use to describe their editable data. The admin
 * turns these descriptions into forms automatically, so a new block or
 * collection type gets a complete editing UI without any admin code.
 *
 * A field is a plain object:
 *
 *   { key: 'title', type: 'text', label: 'Title', required: true }
 *
 * Common properties
 *   key          property name in the stored JSON
 *   type         one of FIELD_TYPES below
 *   label        form label
 *   help         hint under the input
 *   placeholder  input placeholder
 *   required     show a required marker and warn when empty
 *   default      value for new documents
 *   group        fields sharing a group render inside a collapsible panel
 *   when         (values) => boolean — only show the field when true
 *   width        'half' to place two short fields side by side
 *
 * Type-specific properties
 *   select       options: [{ value, label }]  or  optionsFrom: 'collectionLayouts'
 *   number       min, max, step, suffix
 *   date         precision: 'month' | 'day'
 *   file         accept: '.pdf'
 *   list         fields: [...] (sub-fields), itemLabel: 'key' | (item) => string, addLabel
 *   markdown     rows
 */

/** Every field type the admin knows how to edit. */
export const FIELD_TYPES = [
  'text', // single line
  'slug', // web-address segment, auto-cleaned ("my-page")
  'textarea', // plain multi-line
  'markdown', // rich text with toolbar + preview
  'url', // web address
  'link', // internal page, item, résumé, file or URL ("page:about", "resume", …)
  'image', // picks/uploads an image → "media/x.webp"
  'file', // picks/uploads any file → "media/x.pdf"
  'date', // "YYYY-MM" or "YYYY-MM-DD"
  'select', // dropdown / segmented choice
  'toggle', // on/off
  'number', // numeric input
  'tags', // list of short strings, entered as chips
  'lines', // list of sentences (e.g. résumé bullet points)
  'list', // repeatable group of sub-fields
  'color', // hex color
  'collection', // picks one of the site's collections
  'icon', // picks an icon name
];

/**
 * Build a default value object for a set of fields.
 * @param {object[]} fields
 */
export function defaultsFor(fields = []) {
  const out = {};
  for (const field of fields) {
    if (field.default !== undefined) out[field.key] = typeof field.default === 'function' ? field.default() : JSON.parse(JSON.stringify(field.default));
    else if (field.type === 'list' || field.type === 'tags' || field.type === 'lines') out[field.key] = [];
    else if (field.type === 'toggle') out[field.key] = false;
    else if (field.type === 'select' && field.options?.length) out[field.key] = field.options[0].value;
  }
  return out;
}

/**
 * Return the label for a list item using the field's `itemLabel` setting.
 * @param {object} field list field definition
 * @param {object} item
 * @param {number} index
 */
export function listItemLabel(field, item, index) {
  if (typeof field.itemLabel === 'function') return field.itemLabel(item) || `Item ${index + 1}`;
  if (typeof field.itemLabel === 'string') return item?.[field.itemLabel] || `Item ${index + 1}`;
  const first = field.fields?.find((f) => ['text', 'url', 'link'].includes(f.type));
  return (first && item?.[first.key]) || `Item ${index + 1}`;
}
