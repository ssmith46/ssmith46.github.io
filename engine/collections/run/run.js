/**
 * @file run.js
 * Collection type: Run — a personal running log with totals, a monthly
 * chart and a pace-aware table. Shipped as an example of how far the
 * collection system stretches beyond a portfolio (used by the "Running log"
 * site template).
 */
import { html } from '../../core/html.js';
import { formatDate, parseDate } from '../../core/utils.js';

const KM_PER_MI = 1.609344;

/** "1:32:10" or "45:30" → seconds (0 if unparseable). */
export function parseDuration(text) {
  const parts = String(text ?? '').trim().split(':').map(Number);
  if (!parts.length || parts.some((n) => Number.isNaN(n))) return 0;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** Seconds → "1:32:10" / "45:30". */
export function formatDuration(total) {
  if (!total) return '';
  const s = Math.round(total);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** Distance of a run expressed in `unit`. */
function distanceIn(item, unit) {
  const d = Number(item.distance) || 0;
  const from = item.unit || 'mi';
  if (from === unit) return d;
  return unit === 'km' ? d * KM_PER_MI : d / KM_PER_MI;
}

/** "8:15 /mi" */
function paceOf(item) {
  const secs = parseDuration(item.duration);
  const dist = Number(item.distance) || 0;
  return secs && dist ? `${formatDuration(secs / dist)} /${item.unit || 'mi'}` : '';
}

const fmt = (n) => (Math.round(n * 10) / 10).toLocaleString('en-US');

function summary(items, ctx) {
  const unit = items[0]?.unit || 'mi';
  const total = items.reduce((a, i) => a + distanceIn(i, unit), 0);
  const longest = items.reduce((a, i) => Math.max(a, distanceIn(i, unit)), 0);
  const timed = items.filter((i) => parseDuration(i.duration) && Number(i.distance));
  const avgPace = timed.length
    ? timed.reduce((a, i) => a + parseDuration(i.duration), 0) / timed.reduce((a, i) => a + distanceIn(i, unit), 0)
    : 0;

  // Monthly totals for the 12 months ending with the latest run.
  const latest = parseDate(items.map((i) => i.date).sort().pop()) || { year: new Date().getFullYear(), month: 12 };
  const months = [];
  for (let k = 11; k >= 0; k--) {
    const d = new Date(latest.year, (latest.month || 12) - 1 - k, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ key, label: formatDate(key).slice(0, 3), value: 0 });
  }
  for (const i of items) {
    const m = months.find((x) => String(i.date || '').startsWith(x.key));
    if (m) m.value += distanceIn(i, unit);
  }
  const peak = Math.max(1, ...months.map((m) => m.value));

  return html`<div class="run-summary">
    <dl class="stats" style="--count:4">
      <div class="stat"><dt class="stat__label">Total distance</dt><dd class="stat__value">${fmt(total)}<small> ${unit}</small></dd></div>
      <div class="stat"><dt class="stat__label">Runs</dt><dd class="stat__value">${items.length}</dd></div>
      <div class="stat"><dt class="stat__label">Longest</dt><dd class="stat__value">${fmt(longest)}<small> ${unit}</small></dd></div>
      <div class="stat"><dt class="stat__label">Average pace</dt><dd class="stat__value">${avgPace ? formatDuration(avgPace) : '—'}<small> /${unit}</small></dd></div>
    </dl>
    <figure class="bar-chart" aria-label="Distance per month">
      <ol>${months.map(
        (m) => html`<li style="--h:${Math.round((m.value / peak) * 100)}%" title="${m.label}: ${fmt(m.value)} ${unit}">
          <span class="bar-chart__bar"></span><span class="bar-chart__label">${m.label}</span>
        </li>`,
      )}</ol>
    </figure>
  </div>`;
}

function log(items, ctx) {
  return html`<div class="table-wrap"><table class="data-table">
    <thead><tr><th scope="col">Date</th><th scope="col">Run</th><th scope="col" class="num">Distance</th><th scope="col" class="num">Time</th><th scope="col" class="num">Pace</th></tr></thead>
    <tbody>${items.map(
      (i) => html`<tr>
        <td class="nowrap">${formatDate(i.date, 'full')}</td>
        <td><span class="run-kind run-kind--${i.kind || 'easy'}">${KINDS[i.kind] || 'Run'}</span> ${i.title || ''}</td>
        <td class="num">${i.distance ? `${fmt(Number(i.distance))} ${i.unit || 'mi'}` : ''}</td>
        <td class="num">${i.duration || ''}</td>
        <td class="num">${paceOf(i)}</td>
      </tr>`,
    )}</tbody>
  </table></div>`;
}

const KINDS = { easy: 'Easy', long: 'Long', tempo: 'Tempo', intervals: 'Intervals', race: 'Race', recovery: 'Recovery', trail: 'Trail' };

export default {
  type: 'run',
  label: 'Run',
  plural: 'Runs',
  icon: 'activity',
  description: 'A running log with totals, a monthly chart and paces.',
  detailPage: false,
  defaultSort: 'newest',

  fields: [
    { key: 'date', type: 'date', label: 'Date', precision: 'day', required: true, width: 'half', default: () => new Date().toISOString().slice(0, 10) },
    { key: 'kind', type: 'select', label: 'Type', width: 'half', options: Object.entries(KINDS).map(([value, label]) => ({ value, label })) },
    { key: 'title', type: 'text', label: 'Title', placeholder: 'Sunday long run' },
    { key: 'distance', type: 'number', label: 'Distance', min: 0, step: 0.01, width: 'half' },
    { key: 'unit', type: 'select', label: 'Unit', width: 'half', options: [{ value: 'mi', label: 'Miles' }, { value: 'km', label: 'Kilometers' }] },
    { key: 'duration', type: 'text', label: 'Time', placeholder: '45:30 or 1:32:10', width: 'half' },
    { key: 'elevation', type: 'number', label: 'Elevation gain', min: 0, width: 'half' },
    { key: 'notes', type: 'markdown', label: 'Notes', rows: 4 },
    { key: 'hidden', type: 'toggle', label: 'Hide from the site' },
  ],

  defaults: () => ({ kind: 'easy', unit: 'mi', distance: null, duration: '' }),

  titleOf: (item) => item.title || `${KINDS[item.kind] || 'Run'} · ${item.distance || 0} ${item.unit || 'mi'}`,
  subtitleOf: (item) => [formatDate(item.date, 'full'), item.duration, paceOf(item)].filter(Boolean).join(' · '),

  layouts: {
    summary: { label: 'Summary & chart', render: summary },
    log: { label: 'Log table', render: log },
  },
};
