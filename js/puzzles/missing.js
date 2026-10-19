// A stepping-stone path with one stone sunk under the sand. Type the missing number.
import { h } from '../core/dom.js';
import { seqFn, hintFor } from '../core/sequences.js';
import { numpad } from '../core/numpad.js';

export default {
  id: 'missing',
  name: 'Sunken Stone',
  prompt: () => 'Which number is hiding under the sand?',
  say: () => 'Type the missing number on the shell pad.',
  hint: r => `${hintFor(r.seq)} Look at the stones on both sides of the gap.`,
  mount(root, r, api) {
    const f = seqFn(r.seq);
    const answer = f(r.gap);
    const gapNum = h('span', { class: 'stone-num' }, '?');
    const gapStone = h('div', { class: 'stone stone--gap', 'aria-label': 'Missing stone' }, gapNum);

    const stones = h('div', { class: 'stones' });
    for (let n = r.from; n < r.from + r.count; n++) {
      stones.append(n === r.gap ? gapStone : h('div', { class: 'stone' }, h('span', { class: 'stone-num' }, f(n))));
    }

    const pad = numpad({
      onChange: v => { gapNum.textContent = v || '?'; },
      onSubmit: v => {
        if (api.locked) return;
        if (v === answer) {
          gapStone.classList.add('is-fixed', 'pop-in');
          api.correct(`${answer} fits perfectly!`);
        } else {
          api.wrong(`${v} doesn't fit. Try a ${v < answer ? 'bigger' : 'smaller'} number.`);
          pad.clear();
        }
      },
    });

    root.append(stones, pad.el);
    return pad.destroy;
  },
};
