/**
 * @file views/media.js
 * Media library: upload (drag & drop anywhere), browse, see where each file
 * is used, set the résumé, copy links, and delete unused files.
 */
import { h, icon } from '../lib/dom.js';
import { viewHeader } from '../components/view-header.js';
import { emptyState } from '../lib/ui.js';
import { listMedia, mediaThumb, uploadFiles, pickFiles, dropZone } from '../components/media.js';
import { describeChange } from './publish.js';
import { bytes } from '../lib/format.js';

export default {
  render(el, app) {
    let selected = null;
    let filter = 'all';
    const grid = h('div.media-grid');
    const detail = h('aside.media-detail');

    const upload = async (files) => {
      const refs = await uploadFiles(app, files);
      if (refs.length) selected = refs[refs.length - 1];
      draw();
    };

    const drawDetail = () => {
      const item = listMedia(app).find((m) => m.ref === selected);
      if (!item) {
        detail.replaceChildren(h('div.media-detail__empty', icon('image', 22), h('p', 'Select a file to see details.')));
        return;
      }
      const usages = app.ws.usagesOf(app.siteId, item.ref);
      const isResume = app.site.resume === item.ref;
      const url = app.liveUrl(`${app.site.basePath}${item.ref}`);
      detail.replaceChildren(
        mediaThumb(app, item.ref, { size: 'xl' }),
        h('h3.media-detail__name', item.name),
        h('p.muted', bytes(item.size), isResume && h('span.badge.badge--soft', 'Current résumé')),
        h(
          'div.media-detail__actions',
          h(
            'button.btn.btn--sm',
            {
              type: 'button',
              onclick: async () => {
                await navigator.clipboard?.writeText(url);
                app.toast('Link copied', { type: 'success' });
              },
            },
            icon('copy', 14),
            'Copy link',
          ),
          /\.pdf$/i.test(item.name) && !isResume
            ? h(
                'button.btn.btn--sm',
                {
                  type: 'button',
                  onclick: () => {
                    app.updateSite((s) => (s.resume = item.ref));
                    app.toast('Set as your résumé. Every “Résumé” button now opens this file once you publish.', { type: 'success' });
                    draw();
                  },
                },
                icon('file', 14),
                'Use as résumé',
              )
            : null,
          h(
            'button.btn.btn--sm',
            {
              type: 'button',
              title: 'Upload a new version with the same name — every link keeps working',
              onclick: async () => {
                const [file] = await pickFiles({ multiple: false });
                if (!file) return;
                await uploadFiles(app, [file], { replacePath: item.path });
                draw();
              },
            },
            icon('refresh', 14),
            'Replace',
          ),
        ),
        h('h4.media-detail__heading', 'Used in'),
        usages.length ? h('ul.usage-list', usages.map((p) => h('li', icon(describeChange(app, p).icon, 14), describeChange(app, p).title))) : h('p.muted', 'Not used anywhere yet.'),
        h(
          'button.btn.btn--sm.btn--danger-text.media-detail__delete',
          {
            type: 'button',
            onclick: async () => {
              const warn = usages.length || isResume ? ' It’s still used on your site — those spots will show nothing.' : '';
              if (!(await app.confirm({ title: `Delete ${item.name}?`, message: `This removes the file right away.${warn}`, confirmLabel: 'Delete file', danger: true }))) return;
              try {
                await app.ws.deleteMedia(item.path);
                selected = null;
                app.toast('File deleted', { type: 'success' });
                draw();
              } catch (err) {
                app.toast(err.message, { type: 'error' });
              }
            },
          },
          icon('trash', 14),
          'Delete',
        ),
      );
    };

    const draw = () => {
      const items = listMedia(app).filter((m) => filter === 'all' || (filter === 'images' ? m.image : !m.image));
      if (!listMedia(app).length) {
        grid.replaceChildren(
          emptyState({
            iconName: 'images',
            title: 'No files yet',
            text: 'Drop photos or PDFs anywhere on this screen. Photos are resized and compressed automatically.',
            action: h('button.btn.btn--primary', { type: 'button', onclick: async () => upload(await pickFiles()) }, icon('upload', 16), 'Upload files'),
          }),
        );
      } else {
        grid.replaceChildren(
          ...items.map((m) =>
            h(
              'button.media-tile',
              { type: 'button', class: m.ref === selected ? 'is-selected' : '', title: m.name, onclick: () => ((selected = m.ref), draw()) },
              mediaThumb(app, m.ref),
              h('span.media-tile__name', m.name),
              h('span.media-tile__size', bytes(m.size), app.site.resume === m.ref ? ' · Résumé' : ''),
            ),
          ),
        );
      }
      drawDetail();
    };

    const filters = h(
      'div.chips-filter',
      [
        ['all', 'All'],
        ['images', 'Images'],
        ['files', 'Documents'],
      ].map(([value, label]) =>
        h(
          'button.filter-chip',
          {
            type: 'button',
            attrs: { 'aria-pressed': String(filter === value) },
            onclick: (e) => {
              filter = value;
              e.currentTarget.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
              draw();
            },
          },
          label,
        ),
      ),
    );

    el.append(
      viewHeader({
        title: 'Media',
        subtitle: 'Photos, PDFs and other files. Drop files anywhere here to upload.',
        actions: [h('button.btn.btn--primary', { type: 'button', onclick: async () => upload(await pickFiles()) }, icon('upload', 16), 'Upload')],
      }),
      dropZone(h('div.view-body.media-layout', h('div.media-main', filters, grid), detail), upload),
    );
    draw();
  },
};
