// "Show me why" pictures that appear after a wrong answer. The main one is a jump strip:
// stones with the jump between each pair labelled (+3, +3, ×2 …), with unknowns shown as "?".
import { h } from './dom.js';
import { seqFn, fmt } from './sequences.js';

function jumpText(s, a, b) {
  if (s.kind === 'geo') return `×${s.r}`;
  const d = b - a;
  return d >= 0 ? `+${d}` : `−${-d}`;
}

// from..to are pool numbers. hide: pools to show as "?". mark: jumps (by left pool) to highlight.
// values: optional replacement values by pool (for a broken stone).
export function jumpStrip(seq, from, to, { hide = [], mark = [], hideJumps = [], values = {} } = {}) {
  const f = seqFn(seq);
  const val = n => (n in values ? values[n] : f(n));
  const parts = [];
  for (let n = from; n <= to; n++) {
    parts.push(h('span', { class: `xs-stone${hide.includes(n) ? ' xs-q' : ''}` },
      h('span', { class: 'xs-pool' }, `Pool ${n}`),
      hide.includes(n) ? '?' : fmt(val(n))));
    if (n < to) {
      const unknown = hideJumps.includes(n);
      parts.push(h('span', { class: `xs-jump${mark.includes(n) ? ' xs-mark' : ''}` },
        h('span', { class: 'xs-arrow', 'aria-hidden': 'true' }, '→'),
        unknown ? '?' : jumpText(seq, val(n), val(n + 1))));
    }
  }
  return h('div', { class: 'xs-strip' }, parts);
}

export function why(title, ...body) {
  return h('div', { class: 'explain pop-in' }, h('div', { class: 'explain-title' }, '💡 ', title), ...body);
}
