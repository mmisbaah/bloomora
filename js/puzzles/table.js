// Patterns in a table or a bar graph: read the known rows, find the rule, fill in the missing one.
// Common Core 5.OA.B.3 (form ordered pairs, graph them) and 4.OA.C.5; England Year 4 statistics.
import { h } from '../core/dom.js';
import { seqFn, hintFor, fmt } from '../core/sequences.js';
import { answerArea } from '../core/answer.js';
import { jumpStrip, why } from '../core/explain.js';

export default {
  id: 'table',
  name: 'Tide Charts',
  prompt: r => (r.mode === 'graph' ? `How tall is the bar for ${r.cols[0]} ${r.ask}?` : `What goes in the table for ${r.cols[0]} ${r.ask}?`),
  say: r => (r.mode === 'graph' ? 'Read each bar. How much taller does each one get?' : 'Read down the table. What happens each row?'),
  nudge: () => 'Find the difference between two rows next to each other.',
  hint: r => `${hintFor(r.seq)} Keep going until ${r.cols[0]} ${r.ask}.`,
  mount(root, r, api) {
    const f = seqFn(r.seq);
    const show = v => fmt(v, r.seq.format);
    const answer = f(r.ask);
    const ns = [];
    for (let n = r.from; n < r.from + r.show; n++) ns.push(n);
    const q = h('span', { class: 'table-q' }, '?');
    let chart;
    if (r.mode === 'graph') {
      const top = Math.max(...ns.map(f), answer) * 1.1;
      const bar = (n, label, extra = '') => h('div', { class: `bar${extra}` },
        h('span', { class: 'bar-val' }, label),
        h('span', { class: 'bar-fill', style: { '--h': `${Math.max(4, (f(n) / top) * 100)}%` } }),
        h('span', { class: 'bar-x' }, n));
      chart = h('div', { class: 'graph', role: 'img', 'aria-label': `Bar graph of ${r.cols[1]}` },
        h('div', { class: 'graph-bars' }, ns.map(n => bar(n, show(f(n)))),
          r.ask > ns[ns.length - 1] + 1 ? h('div', { class: 'bar bar--gap' }, '…') : null,
          (() => { const b = bar(r.ask, '', ' bar--q'); b.querySelector('.bar-val').append(q); return b; })()),
        h('div', { class: 'graph-axis' }, r.cols[0]));
    } else {
      chart = h('table', { class: 'tide-table' },
        h('thead', {}, h('tr', {}, r.cols.map(c => h('th', {}, c)))),
        h('tbody', {},
          ns.map(n => h('tr', {}, h('td', {}, n), h('td', {}, show(f(n))))),
          r.ask > ns[ns.length - 1] + 1 ? h('tr', { class: 'gap-row' }, h('td', {}, '⋮'), h('td', {}, '⋮')) : null,
          h('tr', { class: 'ask-row' }, h('td', {}, r.ask), h('td', {}, q))));
    }
    const last = ns[ns.length - 1];
    const area = answerArea(r, api, {
      answer,
      tempting: [f(r.ask - 1), f(r.ask + 1), answer + 1, answer - 1],
      onTyping: v => { q.textContent = v || '?'; },
      onRight: () => { q.textContent = show(answer); api.correct(`Yes, ${show(answer)}.`); },
      onWrong: v => {
        api.wrong(`Not ${show(v)}. Check the change from row to row.`);
        const hide = [];
        for (let n = last + 1; n <= r.ask; n++) hide.push(n);
        api.showWhy(why('The same change every time', jumpStrip(r.seq, Math.max(r.from, last - 1), r.ask, { hide })));
      },
    });
    root.append(h('div', { class: 'table-layout' }, chart, area.el));
    return area.destroy;
  },
};
