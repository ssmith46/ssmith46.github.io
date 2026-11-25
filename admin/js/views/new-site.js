/**
 * @file views/new-site.js
 * "New site" dialog. Creates a completely separate site — its own pages,
 * menu, theme and address — from one of the engine's templates. Visitors of
 * one site never see links to another.
 */
import { h, icon } from '../lib/dom.js';
import { slugify } from '../../../engine/core/utils.js';
import { paths, RESERVED_SLUGS } from '../../../engine/core/bundle.js';

export async function openNewSite(app) {
  const templates = [...app.registry.templates.values()];
  const taken = new Set(Object.values(app.ws.bundles()).map((b) => b.site.basePath));
  const takenIds = new Set(Object.keys(app.ws.bundles()));

  const result = await app.modal({
    title: 'Create a new site',
    size: 'lg',
    render: (close) => {
      let template = templates[0].id;
      let pathTouched = false;
      const name = h('input.input', { type: 'text', placeholder: 'e.g. Sully Runs', autofocus: true });
      const address = h('input.input', { type: 'text', placeholder: 'running' });
      const error = h('p.field__error', { hidden: true });
      const grid = h('div.type-grid.type-grid--templates');

      name.addEventListener('input', () => {
        if (!pathTouched) address.value = slugify(name.value);
      });
      address.addEventListener('input', () => (pathTouched = true));

      const draw = () =>
        grid.replaceChildren(
          ...templates.map((t) =>
            h(
              'button.type-card',
              { type: 'button', attrs: { 'aria-pressed': String(t.id === template) }, onclick: () => ((template = t.id), draw()) },
              icon(t.icon, 22),
              h('strong', t.label),
              h('small', t.description),
            ),
          ),
        );
      draw();

      return h(
        'form',
        {
          onsubmit: (e) => {
            e.preventDefault();
            const title = name.value.trim();
            const slug = slugify(address.value || title);
            const basePath = `/${slug}/`;
            const problem = !title
              ? 'Give your site a name.'
              : !slug
                ? 'Choose an address.'
                : RESERVED_SLUGS.includes(slug) || taken.has(basePath) || takenIds.has(slug) || app.bundle?.pages?.[slug]
                  ? `The address /${slug}/ is already in use.`
                  : null;
            if (problem) {
              error.textContent = problem;
              error.hidden = false;
              return;
            }
            close({ title, slug, basePath, template });
          },
        },
        h('div.field', h('span.field__label', 'Start from'), grid),
        h('div.form-grid', h('label.field.field--half', h('span.field__label', 'Site name'), name), h('label.field.field--half', h('span.field__label', 'Address'), h('div.input-affix.input-affix--prefix', h('span.input-affix__text', '/'), address))),
        h('p.field__help', 'Each site is completely separate: its own pages, menu, look and address. Nothing links between them.'),
        error,
        h('div.modal__actions', h('button.btn', { type: 'button', onclick: () => close() }, 'Cancel'), h('button.btn.btn--primary', { type: 'submit' }, icon('plus', 16), 'Create site')),
      );
    },
  });
  if (!result) return;

  const tpl = app.registry.templates.get(result.template);
  const files = tpl.create({ title: result.title, basePath: result.basePath });
  const root = paths.siteRoot(result.slug);
  for (const [rel, data] of Object.entries(files)) app.ws.writeJson(`${root}/${rel}`, data);
  app.toast(`${result.title} created. Publish when you’re ready to put it online.`, { type: 'success' });
  app.navigate(result.slug);
}
