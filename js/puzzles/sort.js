// Tap the swimmers in order to line them up.
import { h, shuffle, replay } from '../core/dom.js';
import { audio } from '../core/audio.js';
import { why } from '../core/explain.js';
import { pic } from '../ui/art.js';

const ordered = r => [...r.values].sort((a, b) => (r.desc ? b - a : a - b));

export default {
  id: 'sort',
  name: 'Line-Up',
  prompt: r => (r.desc ? 'Tap them from the biggest number to the smallest' : 'Tap them from the smallest number to the biggest'),
  say: r => `These ${r.critterName || 'turtles'} want to swim in order.`,
  nudge: r => `Which number is the ${r.desc ? 'biggest' : 'smallest'}?`,
  hint: r => `Start with ${ordered(r)[0]}, then look for the next ${r.desc ? 'smaller' : 'bigger'} number.`,
  mount(root, r, api) {
    const order = ordered(r);
    const critter = r.critter || '🐢';
    let pos = 0;

    let start = shuffle(r.values);
    if (start.every((v, i) => v === order[i])) start = start.reverse();

    const line = h('div', { class: 'sort-line' }, order.map(() => h('div', { class: 'sort-spot' })));
    const pool = h('div', { class: 'sort-pool' }, start.map(v => {
      const b = h('button', { class: 'pebble', 'aria-label': `${v}`, onclick: () => tap(v, b) },
        h('span', { class: 'pebble-critter' }, pic(critter)),
        h('span', { class: 'pebble-num' }, v));
      return b;
    }));

    function tap(v, b) {
      if (api.locked || b.classList.contains('gone')) return;
      if (v === order[pos]) {
        audio.tap();
        line.children[pos].append(h('div', { class: 'pebble pebble--placed pop-in' },
          h('span', { class: 'pebble-critter' }, pic(critter)),
          h('span', { class: 'pebble-num' }, v)));
        b.classList.add('gone');
        b.disabled = true;
        pos++;
        if (pos === order.length) api.correct('A perfect line-up!');
      } else {
        replay(b, 'shake');
        api.wrong(`${v} isn't next. Find the ${r.desc ? 'biggest' : 'smallest'} number still waiting.`);
        // A number line: where each waiting number sits shows which comes next.
        const left = start.filter(x => !order.slice(0, pos).includes(x));
        const top = Math.max(...r.values);
        api.showWhy(why('Smaller numbers sit further left on the number line',
          h('div', { class: 'xs-line' }, h('span', { class: 'xs-end' }, '0'),
            left.map(x => h('span', { class: 'xs-dot', style: { left: `${6 + (x / top) * 86}%` } }, x)),
            h('span', { class: 'xs-end xs-end--r' }, top))));
      }
    }

    root.append(
      h('div', { class: 'eyebrow sort-label' }, 'Swim lane'), line,
      h('div', { class: 'eyebrow sort-label' }, 'Waiting to swim'), pool);
  },
};
