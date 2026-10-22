// Draws a single pool's contents in the style of the current world.
import { h } from './dom.js';
import { pic } from '../ui/art.js';
import { fmt } from './sequences.js';
import { t } from './i18n.js';

// Above these sizes a drawing stops being countable, so show the number instead.
const LIMITS = { count: 20, groups: 40, squares: 100, triangle: 45 };

function triRows(v) {
  const r = (Math.sqrt(8 * v + 1) - 1) / 2;
  return Number.isInteger(r) ? r : null;
}

function pickStyle(value, r) {
  const style = r.style || 'number';
  if (!Number.isInteger(value) || value > (LIMITS[style] ?? Infinity)) return 'number';
  if (style === 'squares' && !Number.isInteger(Math.sqrt(value))) return 'number';
  if (style === 'triangle' && triRows(value) === null) return 'number';
  return style;
}

export function renderTerm(value, r) {
  if (value === 0) return h('span', { class: 'empty' }, 'empty pool');
  switch (pickStyle(value, r)) {
    case 'count':
      return h('div', { class: 't-count' },
        Array.from({ length: value }, (_, i) => h('span', { style: { animationDelay: `${i * 25}ms` } }, pic(r.item))));
    case 'groups': {
      const size = r.group || r.seq?.d || 3;
      const full = Math.floor(value / size);
      const rest = value % size;
      const groups = Array.from({ length: full }, (_, i) =>
        h('span', { class: 't-group', style: { animationDelay: `${i * 50}ms` } }, Array.from({ length: size }, () => pic(r.item))));
      if (rest) groups.push(h('span', { class: 't-group' }, Array.from({ length: rest }, () => pic(r.item))));
      return h('div', { class: 't-groups' }, groups);
    }
    case 'squares': {
      const n = Math.sqrt(value);
      // The newest L-shaped border (last row + last column) is tinted so the odd-number growth shows.
      return h('div', { class: 't-squares', style: { '--n': n }, 'aria-label': `${n} by ${n} square` },
        Array.from({ length: value }, (_, i) => {
          const row = Math.floor(i / n), col = i % n;
          return h('i', { class: n > 1 && (row === n - 1 || col === n - 1) ? 'edge' : null });
        }));
    }
    case 'triangle': {
      const rows = triRows(value);
      return h('div', { class: 't-tri' },
        Array.from({ length: rows }, (_, i) => h('div', { class: 't-tri-row' }, Array.from({ length: i + 1 }, () => h('i')))));
    }
    default:
      return h('div', { class: 't-number' }, fmt(value, r.seq?.format));
  }
}

export function poolCard(n, value, r) {
  return h('div', { class: 'pool' },
    h('div', { class: 'pool-label' }, t('Pool {n}', { n })),
    h('div', { class: 'pool-body' }, renderTerm(value, r)),
    h('div', { class: 'pool-count' }, r.seq?.format ? r.itemPlural || '' : `${value} ${value === 1 ? r.itemName : r.itemPlural}`));
}
