# Architecture

## Goals

1. **Editable without code.** All content lives in `content/` as JSON, and a browser admin edits it.
2. **Low coupling.** Page sections, content types, themes and field types are plug-ins listed in a registry. They don't import each other, so adding or removing one can't break another.
3. **No dependencies, no build step for the code.** Plain ES modules everywhere. The only tool you need is Node, and only to build or preview locally.
4. **What you edit is what ships.** The admin preview and the production build run the *same* rendering engine.

## Data flow

```
             ┌──────────── admin (browser) ────────────┐
 GitHub API ─┤ storage/github.js ─► state/workspace.js │──► engine ──► live preview (iframe)
   or        │ storage/local.js  ─┘   (drafts, publish) │
 dev server  └─────────────────────────────────────────┘
                     │ commit (one per Publish)
                     ▼
               content/**.json + media
                     │ push to main triggers GitHub Actions
                     ▼
   tools/build.mjs ─► engine ─► _site/ (static HTML + CSS + JS) ─► GitHub Pages
```

## Content model (`content/`)

```
content/sites/<siteId>/site.json                             settings, theme, menu, collections
content/sites/<siteId>/pages/<pageId>.json                   { title, slug, intro, sections: [...] }
content/sites/<siteId>/collections/<collectionId>/<id>.json  one item per file
content/sites/<siteId>/media/<file>                          uploads
```

- **Sites** are independent. Each has its own `basePath` (`/`, `/running/`…), theme, menu and pages, and no site links to another.
- **Pages** are ordered lists of **sections**: `{ id, type, ...props }`. `type` names a block module.
- **Collections** are declared in `site.json` (`{ id, type, label, route, sort, order }`), and their items are separate files. `type` names a collection-type module.
- **Links** are stored as references, not URLs: `page:about`, `item:projects/ship-cnn`, `resume`, `media/x.pdf`, or a plain `https://…` / `mailto:`. Renaming a page's address never breaks a button. See `resolveLink()` in `engine/core/context.js`.
- The loader (`engine/core/bundle.js`) adds computed `$id` / `$collection` properties. Anything starting with `$` is never stored.

## Engine (`engine/`)

Runs in Node (the build) and in the browser (the admin preview), so it uses no DOM and no Node APIs.

| Path | Role |
| --- | --- |
| `core/html.js` | `html\`…\`` tagged template that auto-escapes; `raw()`, `attrs()` |
| `core/markdown.js` | Small, safe Markdown renderer (raw HTML is escaped, URLs are sanitised) |
| `core/bundle.js` | Content path conventions and the loader → per-site bundles |
| `core/context.js` | The `ctx` object every renderer receives (URLs, links, media, items, Markdown, icons) |
| `core/render.js` | Routes for a site, and rendering of pages and item pages into full documents |
| `core/section.js` | The wrapper and shared settings (background, spacing, anchor, hidden) for every section |
| `core/fields.js` | The field schema language that admin forms are generated from |
| `core/ui.js`, `core/artwork.js`, `core/icons.js`, `core/color.js`, `core/utils.js` | Shared primitives |
| `layout/` | Document head, header, footer, social links |
| `themes/` | Color presets (light + dark), font pairings, and token → CSS generation |
| `blocks/<name>/` | One folder per section type: `<name>.js` (+ optional `<name>.css`) |
| `collections/<name>/` | One folder per content type; `shared/` holds cards, timeline and article layouts |
| `templates/index.js` | Starting points for "New site" |
| `registry.js` | Imports the module lists and validates them. **The only place modules are wired in.** |

## Public site (`public/`)

- `css/` holds global styles, loaded in file-name order (`00-reset`, `10-base`, `20-layout`, …). Every module's `.css` under `engine/` is appended automatically by the build.
- `js/site.js` loads independent **features** (`theme`, `nav`, `reveal`, `lightbox`, `space`). Each one has an `init()` and fails in isolation.
- Theme colors are CSS custom properties generated per site and inlined in `<head>`. A tiny inline script applies the visitor's saved light/dark choice before first paint, so there is no flash.

## Admin (`admin/`)

The build publishes the admin at `/<adminPath>/`, set in `tools/config.mjs`. It's never linked from the site, and the build refuses to start if a page, collection or site uses that address. Inside the admin, `config.adminPath` is read from the URL it's served at.

| Path | Role |
| --- | --- |
| `js/main.js` | Boot: pick storage → sign in → load the workspace → start the shell |
| `js/storage/` | `github.js` (REST + Git Data API, one commit per publish, conflict detection) and `local.js` (dev server). Both share the same interface. |
| `js/state/workspace.js` | Source of truth: published files, drafts (persisted in localStorage), publish, media upload |
| `js/app.js` | The `app` object every view receives |
| `js/views/` | One module per screen. Views depend on `app`, never on each other. |
| `js/fields/` | Field-type renderers; `form.js` turns schemas into forms |
| `js/components/` | Preview pane, media picker, editor layout, block picker, view header |
| `js/lib/` | DOM builder, dialogs and toasts, encrypted token vault, image compression, encodings |

### Security model

- Writes go through the GitHub API using a fine-grained token scoped to this repository. GitHub enforces who can publish, so the admin's login screen is a convenience, not the security boundary.
- The token is encrypted at rest (PBKDF2 → AES-GCM) with a per-device password. The decrypted token lives in `sessionStorage` only for the current tab.
- The GitHub storage adapter refuses to write outside `content/`. Code, workflows and the admin itself can't be modified from the admin.
- Rendered content is escaped by default, and Markdown never passes raw HTML through.

## Deploy

`.github/workflows/deploy.yml` runs `node tools/build.mjs` on every push to `main` and deploys `_site/` with the official Pages actions. `.github/workflows/ci.yml` runs the tests and a build on pull requests.
