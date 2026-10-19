// Pick the rule card that explains the whole pattern.
import { h, shuffle } from '../core/dom.js';
import { seqFn, ruleCards, nthCards } from '../core/sequences.js';
import { jumpStrip, why } from '../core/explain.js';
import { poolCard } from '../core/render.js';

export default {
  id: 'rule',
  name: 'Rule Card',
  prompt: () => 'Which rule card explains this pattern?',
  say: () => 'Test each card on every pool. Only one works every time.',
  nudge: () => 'Work out the jump from one pool to the next.',
  hint: () => 'Work out the jump from Pool 1 to Pool 2, then from Pool 2 to Pool 3. Do the jumps stay the same, or grow?',
  mount(root, r, api) {
    const f = seqFn(r.seq);
    const pools = h('div', { class: 'pools' });
    for (let n = r.from; n < r.from + r.show; n++) pools.append(poolCard(n, f(n), r));

    let cards = r.cards || (r.nth ? nthCards(r.seq) : ruleCards(r.seq));
    // Short screens: three cards (the right one and two wrong) so the text can stay full size.
    if (window.innerHeight < 640 && cards.length > 3) cards = [cards.find(c => c.correct), ...shuffle(cards.filter(c => !c.correct)).slice(0, 2)];
    cards = shuffle(cards);
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
        api.showWhy(why('Here are the jumps. Which card matches all of them?', jumpStrip(r.seq, r.from, r.from + r.show - 1)));
      }
    }

    root.append(pools, list);
  },
};
