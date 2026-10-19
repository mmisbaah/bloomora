// Jump ahead: pick how big a pool further down the beach will be.
import { h, shuffle } from '../core/dom.js';
import { seqFn, hintFor, distractors } from '../core/sequences.js';
import { poolCard } from '../core/render.js';

export default {
  id: 'predict',
  name: 'Look Ahead',
  prompt: r => `How many ${r.itemPlural} will Pool ${r.ask} have?`,
  say: r => `Pool ${r.ask} is further down the beach. Follow the pattern to get there.`,
  hint: r => `${hintFor(r.seq)} Keep going from Pool ${r.from + r.show - 1} until you reach Pool ${r.ask}.`,
  mount(root, r, api) {
    const f = seqFn(r.seq);
    const answer = f(r.ask);
    const last = r.from + r.show - 1;

    const pools = h('div', { class: 'pools' });
    for (let n = r.from; n <= last; n++) pools.append(poolCard(n, f(n), r));
    const gap = r.ask - last;
    pools.append(h('div', { class: 'pool pool--far' },
      h('div', { class: 'pool-label' }, `Pool ${r.ask}`),
      h('div', { class: 'pool-body' }, h('span', { class: 'far-q' }, '?')),
      h('div', { class: 'pool-count' }, gap > 1 ? `${gap} pools on` : 'the next pool')));

    // Most tempting mistakes first: stopping one pool short or going one too far.
    const tempting = [f(r.ask - 1), f(r.ask + 1), ...shuffle([answer + 1, answer - 1, answer * 2, answer + 2])];
    // Younger bands see fewer choices (optionCount comes from the age band).
    const opts = shuffle([answer, ...distractors(answer, tempting, (r.optionCount || 4) - 1)]);

    const grid = h('div', { class: 'options' }, opts.map(o => {
      const b = h('button', { class: 'option', onclick: () => choose(o, b) },
        h('span', { class: 'option-num' }, o),
        h('span', { class: 'option-unit' }, r.itemPlural));
      return b;
    }));

    function choose(o, b) {
      if (api.locked) return;
      if (o === answer) {
        b.classList.add('is-right');
        api.correct(`Spot on! Pool ${r.ask} has ${answer} ${r.itemPlural}.`);
      } else {
        b.classList.add('is-wrong');
        b.disabled = true;
        api.wrong(`Not ${o}. Check how much each pool changes, and count the pools carefully.`);
      }
    }

    root.append(pools, grid);
  },
};
