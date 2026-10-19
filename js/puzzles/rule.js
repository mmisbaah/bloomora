// Pick the rule card that explains the whole pattern.
import { h, shuffle } from '../core/dom.js';
import { seqFn, ruleCards } from '../core/sequences.js';
import { poolCard } from '../core/render.js';

export default {
  id: 'rule',
  name: 'Rule Card',
  prompt: () => 'Which rule card explains this pattern?',
  say: () => 'Test each card on every pool. Only one works every time.',
  hint: () => 'Work out the jump from Pool 1 to Pool 2, then from Pool 2 to Pool 3. Do the jumps stay the same, or grow?',
  mount(root, r, api) {
    const f = seqFn(r.seq);
    const pools = h('div', { class: 'pools' });
    for (let n = r.from; n < r.from + r.show; n++) pools.append(poolCard(n, f(n), r));

    const cards = shuffle(r.cards || ruleCards(r.seq));
    const list = h('div', { class: 'cards' }, cards.map(c => {
      const b = h('button', { class: 'rule-card', onclick: () => choose(c, b) }, c.text);
      return b;
    }));

    function choose(c, b) {
      if (api.locked) return;
      if (c.correct) {
        b.classList.add('is-right');
        api.correct('That rule works for every pool!');
      } else {
        b.classList.add('is-wrong');
        b.disabled = true;
        api.wrong('That card breaks on at least one pool. Test it again.');
      }
    }

    root.append(pools, list);
  },
};
