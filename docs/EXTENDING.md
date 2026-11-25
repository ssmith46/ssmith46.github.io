# Extending the site

Everything below is a plug-in. You write one module, list it in one `index.js`, and the admin picks it up automatically, including a generated editing form. Run `node --test "tests/*.test.mjs"` afterwards: the contract tests check new modules for you.

## Add a page section (block)

```bash
node tools/scaffold.mjs block pull-quote
```

This creates `engine/blocks/pull-quote/pull-quote.js` (and `.css`) and registers it in `engine/blocks/index.js`. A block looks like this:

```js
export default {
  type: 'pull-quote',               // stored in page JSON
  label: 'Pull quote',              // shown in "Add section"
  icon: 'quote',                    // any name in engine/core/icons.js
  description: 'A big quotation with attribution.',
  fields: [                         // → admin form (see "Field types" below)
    { key: 'quote', type: 'textarea', label: 'Quote', required: true },
    { key: 'by', type: 'text', label: 'Who said it' },
  ],
  defaults: () => ({ quote: '' }),
  render(p, ctx) {                  // return html`…` — use only ctx helpers
    return html`<figure class="container pull-quote" data-reveal>
      <blockquote>${p.quote}</blockquote>${p.by ? html`<figcaption>${p.by}</figcaption>` : ''}
    </figure>`;
  },
};
```

Rules of thumb:

- Render your own `.container`. The section wrapper adds background, spacing, the anchor and `data-section-id` for you.
- Add `data-reveal` to elements that should fade in on scroll.
- Use `ctx` (`ctx.md`, `ctx.link`, `ctx.media`, `ctx.items`, `ctx.icon`…; see `engine/core/context.js`). Never import build or admin code.
- Need browser behaviour? Add `public/js/features/<name>.js` exporting `{ name, init() }`, list it in `public/js/site.js`, and target your markup with `data-feature="<name>"`. See `features/space.js`.

## Add a content type (collection)

```bash
node tools/scaffold.mjs collection book
```

A collection type defines one kind of item:

| Property | Purpose |
| --- | --- |
| `type`, `label`, `plural`, `icon`, `description` | Identity and admin labels |
| `fields`, `defaults()` | Generated form and new-item defaults |
| `titleOf(item)`, `subtitleOf(item)`, `imageOf?(item)` | How items appear in admin lists |
| `dateOf?(item)` | Date used by "newest/oldest" sorting (default `item.date`) |
| `defaultSort` | `'manual'`, `'newest'`, `'oldest'` or `'title'` |
| `layouts: { id: { label, render(items, ctx, blockProps) } }` | How a Collection section can display items |
| `detailPage`, `renderPage(item, ctx)` | Optional: give every item its own page |

Reuse `collections/shared/` (cards, row list, timeline, article) for a consistent look. After registering the type, add a collection of that type in the admin under **Settings → Collections**. That step also offers to create a page for it.

`run/run.js` (stats, chart, table) and `movie/movie.js` (posters, ratings) are good examples of how far a type can go.

## Field types

`text`, `slug`, `textarea`, `markdown`, `url`, `link`, `image`, `file`, `date` (`precision: 'month'|'day'`), `select` (`options` or `optionsFrom`), `toggle`, `number`, `tags`, `lines`, `list` (`fields`, `itemLabel`, `addLabel`), `color`, `collection`, `icon`.

Common options: `label`, `help`, `placeholder`, `required`, `default`, `width: 'half'`, `group: 'Advanced'`, and `when: (values) => boolean`.

To add a field type, write a renderer in `admin/js/fields/` (`{ render({ field, value, set, id, fctx }) }`), register it in `admin/js/fields/index.js`, and add its name to `FIELD_TYPES` in `engine/core/fields.js`.

## Add a color theme or font pairing

- Append to `PRESETS` in `engine/themes/presets.js` (a light and a dark palette using the same tokens).
- Append to `FONT_PAIRS` in `engine/themes/fonts.js`.

Both appear in **Design** automatically.

## Add a "New site" template

Append to `engine/templates/index.js`: `{ id, label, icon, description, create({ title, basePath }) → { 'site.json': {...}, 'pages/home.json': {...}, … } }`. The modules test renders every route of every template.

## Add an admin screen

Create `admin/js/views/<name>.js` exporting `{ render(container, app) → cleanup? }`, add it to `VIEWS` in `admin/js/views/shell.js`, and add a sidebar link there. The route is `#/<site>/<name>`.

## Give a site its own domain

Sites share one GitHub Pages domain and are separated by path (`/`, `/running/`). For a completely separate domain, create another repository, copy `engine/`, `public/`, `admin/`, `tools/`, `.github/` and that site's `content/`, set the site's `basePath` to `/`, and attach the custom domain in that repository's Pages settings. Then update `admin/js/config.js` (or serve the admin from `<owner>.github.io`) so it points at the new repository.
