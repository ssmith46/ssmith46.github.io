/**
 * @file education.js
 * Collection type: Education — degrees, certificates, courses.
 */
import { formatRange } from '../../core/utils.js';
import { timeline, compactList } from '../shared/timeline.js';

function toEntry(item) {
  return {
    title: item.degree,
    org: item.school,
    orgUrl: item.url,
    location: item.location,
    period: formatRange(item.start, item.end, { presentLabel: 'In progress' }),
    current: !item.end,
    summary: item.summary,
    bullets: item.honors,
    tags: item.coursework,
    logo: item.logo,
    aside: item.gpa ? `GPA ${item.gpa}` : '',
  };
}

export default {
  type: 'education',
  label: 'Education',
  plural: 'Education',
  icon: 'graduation',
  description: 'Degrees, certificates and coursework.',
  detailPage: false,
  defaultSort: 'newest',

  fields: [
    { key: 'degree', type: 'text', label: 'Degree or certificate', required: true, placeholder: 'B.S. Computer Science' },
    { key: 'school', type: 'text', label: 'School', placeholder: 'University of Mary Washington' },
    { key: 'location', type: 'text', label: 'Location', width: 'half' },
    { key: 'url', type: 'url', label: 'School website', width: 'half' },
    { key: 'start', type: 'date', label: 'Started', precision: 'month', width: 'half' },
    { key: 'end', type: 'date', label: 'Finished', precision: 'month', width: 'half', help: 'Leave empty if in progress.' },
    { key: 'gpa', type: 'text', label: 'GPA', width: 'half' },
    { key: 'summary', type: 'markdown', label: 'Summary', rows: 3 },
    { key: 'honors', type: 'lines', label: 'Honors & awards' },
    { key: 'coursework', type: 'tags', label: 'Relevant coursework' },
    { key: 'logo', type: 'image', label: 'Logo' },
    { key: 'hidden', type: 'toggle', label: 'Hide from the site' },
  ],

  defaults: () => ({ degree: '', school: '', honors: [], coursework: [] }),

  titleOf: (item) => item.degree,
  subtitleOf: (item) => [item.school, formatRange(item.start, item.end, { presentLabel: 'In progress' })].filter(Boolean).join(' · '),
  dateOf: (item) => (item.end ? item.end : '9999'),

  layouts: {
    timeline: { label: 'Timeline', render: (items, ctx) => timeline(items.map(toEntry), ctx) },
    compact: { label: 'Compact list', render: (items) => compactList(items.map(toEntry)) },
  },
};
