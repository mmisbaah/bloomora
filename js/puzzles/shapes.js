// A parade of sea creatures repeats a unit. Fill the empty spots at the end.
import { h, shuffle, replay } from '../core/dom.js';
import { audio } from '../core/audio.js';
import { why } from '../core/explain.js';

const DECOYS = ['🦑', '🐙', '🪼', '🐡', '🦐', '🐚', '⭐', '🐠', '🦀', '🐢', '🔶', '🟢'];

export default {
  id: 'shapes',
  name: 'Pattern Parade',
  prompt: r => ((r.blanks || 1) > 1 ? `Fill the next ${r.blanks} spots in the parade` : 'Who comes next in the parade?'),
  say: () => 'Find the part that repeats, then keep it going.',
  nudge: () => 'Find the part that repeats.',
  hint: r => `The parade repeats every ${r.unit.length}: ${r.unit.join(' ')}`,
  mount(root, r, api) {
    const blanks = r.blanks || 1;
    const len = r.unit.length;
    const answers = Array.from({ length: blanks }, (_, i) => r.unit[(r.shown + i) % len]);
    let filled = 0;

    const parade = h('div', { class: 'parade' });
    for (let i = 0; i < r.shown; i++) {
      parade.append(h('div', { class: 'parade-item', style: { animationDelay: `${i * 60}ms` } }, r.unit[i % len]));
    }
    const slots = answers.map((_, i) => h('div', { class: `parade-item parade-slot${i === 0 ? ' active' : ''}` }, '?'));
    parade.append(...slots);

    const unique = [...new Set(r.unit)];
    const decoy = shuffle(DECOYS).find(d => !unique.includes(d));
    const options = h('div', { class: 'parade-options' }, shuffle([...unique, decoy]).map(o => {
      const b = h('button', { class: 'parade-option', 'aria-label': `Place ${o}`, onclick: () => place(o, b) }, o);
      return b;
    }));

    function place(o, b) {
      if (api.locked) return;
      if (o === answers[filled]) {
        audio.tap();
        const slot = slots[filled];
        slot.textContent = o;
        slot.classList.remove('active');
        slot.classList.add('filled', 'pop-in');
        filled++;
        if (filled === blanks) api.correct('The parade marches on!');
        else slots[filled].classList.add('active');
      } else {
        replay(b, 'shake');
        api.wrong(`${o} doesn't go there. Say the pattern out loud from the start.`);
        const groups = Math.ceil((r.shown + blanks) / len);
        api.showWhy(why('The parade is the same group over and over',
          h('div', { class: 'xs-groups' }, Array.from({ length: Math.min(groups, 3) }, () => h('span', { class: 'xs-group' }, r.unit.join(' '))), h('span', { class: 'xs-more' }, '…'))));
      }
    }

    root.append(parade, options);
  },
};
