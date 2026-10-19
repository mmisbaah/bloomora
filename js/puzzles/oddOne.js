// One stone in the path has the wrong number. Find it.
import { h } from '../core/dom.js';
import { seqFn, hintFor, fmt } from '../core/sequences.js';
import { jumpStrip, why } from '../core/explain.js';

export default {
  id: 'oddOne',
  name: 'Broken Stone',
  prompt: () => 'One stone breaks the pattern. Tap it!',
  say: () => 'Check every jump from stone to stone.',
  nudge: () => 'Say each jump out loud. One will sound wrong.',
  hint: r => `${hintFor(r.seq)} Find the jump that looks different.`,
  mount(root, r, api) {
    const f = seqFn(r.seq);
    const stones = h('div', { class: 'stones' });

    for (let n = r.from; n < r.from + r.count; n++) {
      const bad = n === r.bad.at;
      const value = bad ? r.bad.value : f(n);
      const b = h('button', { class: 'stone', 'aria-label': `Stone ${value}`, onclick: () => tap(bad, b, n, value) },
        h('span', { class: 'stone-num' }, fmt(value)));
      stones.append(b);
    }

    function tap(bad, b, n, value) {
      if (api.locked) return;
      if (bad) {
        b.classList.add('is-fixed', 'pop-in');
        b.replaceChildren(h('s', { class: 'stone-old' }, fmt(value)), h('span', { class: 'stone-num' }, fmt(f(n))));
        api.correct(`Found it! That stone should say ${f(n)}.`);
      } else {
        b.classList.add('is-wrong');
        b.disabled = true;
        api.wrong(`${fmt(value)} fits the pattern. Look at the jumps again.`);
        api.showWhy(why('Two jumps look different from the rest', jumpStrip(r.seq, r.from, r.from + r.count - 1, { values: { [r.bad.at]: r.bad.value }, mark: [r.bad.at - 1, r.bad.at] })));
      }
    }

    root.append(stones);
  },
};
