// Two currents follow two "add" rules from 0. How do their numbers compare? (Common Core 5.OA.B.3)
import { h, shuffle } from '../core/dom.js';
import { why } from '../core/explain.js';

const row = (label, step, count) => h('div', { class: 'twin-row', style: { '--count': count } },
  h('span', { class: 'twin-label' }, label),
  Array.from({ length: count }, (_, n) => h('span', { class: 'stone twin-stone' }, h('span', { class: 'stone-num' }, step * n))));

export default {
  id: 'twins',
  name: 'Twin Currents',
  prompt: () => 'How does each bottom number compare to the top one?',
  say: r => `The top current adds ${r.a} each time. The bottom current adds ${r.a * r.k}. Compare the pairs.`,
  nudge: () => 'Look at one pair, one number above the other.',
  hint: r => `Try a pair: ${r.a * 2} on top, ${r.a * r.k * 2} below. How many ${r.a * 2}s make ${r.a * r.k * 2}?`,
  mount(root, r, api) {
    const count = r.count || 5;
    const top = row(`Add ${r.a}`, r.a, count);
    const bottom = row(`Add ${r.a * r.k}`, r.a * r.k, count);
    const choices = [...new Set([r.k, r.k + 1, Math.max(2, r.k - 1), r.k + 2])].slice(0, 3);
    const label = k => (k === 2 ? 'Double the top' : k === 3 ? 'Triple the top' : `${k} times the top`);
    const opts = shuffle([...choices.map(k => ({ text: label(k), ok: k === r.k })), { text: `The top + ${r.a}`, ok: false }]);

    const list = h('div', { class: 'cards' }, opts.map(o => {
      const b = h('button', { class: 'rule-card', onclick: () => choose(o, b) }, o.text);
      return b;
    }));

    function choose(o, b) {
      if (api.locked) return;
      if (o.ok) {
        b.classList.add('is-right');
        api.correct(`Yes! Adding ${r.a * r.k} makes every number ${r.k === 2 ? 'double' : r.k === 3 ? 'triple' : `${r.k} times`} the one from adding ${r.a}.`);
      } else {
        b.classList.add('is-wrong');
        b.disabled = true;
        api.wrong('That doesn’t work for every pair. Check another pair.');
        const pairs = [1, 2, 3].map(n => {
          const t = r.a * n, btm = r.a * r.k * n;
          return h('span', {}, `${btm} = ${Array(r.k).fill(t).join(' + ')}`);
        });
        api.showWhy(why('Each bottom number is made of copies of the top one', h('div', { class: 'xs-sides' }, pairs)));
      }
    }

    root.append(h('div', { class: 'twins' }, top, bottom), list);
  },
};
