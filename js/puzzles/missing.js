// A stepping-stone path with one stone sunk under the sand. Type the missing number.
import { h } from '../core/dom.js';
import { seqFn, hintFor, fmt } from '../core/sequences.js';
import { jumpStrip, why } from '../core/explain.js';
import { numpad } from '../core/numpad.js';

export default {
  id: 'missing',
  name: 'Sunken Stone',
  prompt: () => 'Which number is hiding under the sand?',
  say: () => 'Type the missing number on the shell pad.',
  nudge: () => 'What jump do the other stones make?',
  hint: r => `${hintFor(r.seq)} Look at the stones on both sides of the gap.`,
  mount(root, r, api) {
    const f = seqFn(r.seq);
    const answer = f(r.gap);
    const gapNum = h('span', { class: 'stone-num' }, '?');
    const gapStone = h('div', { class: 'stone stone--gap', 'aria-label': 'Missing stone' }, gapNum);

    const stones = h('div', { class: 'stones' });
    for (let n = r.from; n < r.from + r.count; n++) {
      stones.append(n === r.gap ? gapStone : h('div', { class: 'stone' }, h('span', { class: 'stone-num' }, fmt(f(n)))));
    }

    const pad = numpad({
      negative: !!r.negative,
      onChange: v => { gapNum.textContent = v || '?'; },
      onSubmit: v => {
        if (api.locked) return;
        if (v === answer) {
          gapStone.classList.add('is-fixed', 'pop-in');
          api.correct(`${fmt(answer)} fits perfectly!`);
        } else {
          api.wrong(`${fmt(v)} doesn't fit. Try a ${v < answer ? 'bigger' : 'smaller'} number.`);
          api.showWhy(why('Look at the jumps around the gap', jumpStrip(r.seq, r.from, r.from + r.count - 1, { hide: [r.gap], hideJumps: [r.gap - 1, r.gap] })));
          pad.clear();
        }
      },
    });

    root.append(stones, pad.el);
    return pad.destroy;
  },
};
