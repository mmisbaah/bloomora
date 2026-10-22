// Tap every number that fits a rule: even, odd, or a multiple of k. Then check.
import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';
import { pickTest, pickLabel } from '../core/sequences.js';
import { why } from '../core/explain.js';
import { pic } from '../ui/art.js';
import { t } from '../core/i18n.js';

const FACTS = {
  even: 'Even numbers end in 0, 2, 4, 6 or 8. They split into two equal groups.',
  odd: 'Odd numbers end in 1, 3, 5, 7 or 9. One is always left over when you make pairs.',
};

export default {
  id: 'pick',
  name: 'Number Net',
  prompt: r => `Catch every ${pickLabel(r.rule, r.k)} in your net`,
  say: () => 'Tap the numbers to catch them, then press Check.',
  nudge: r => (r.rule === 'multiple' ? `Count in ${r.k}s and listen for each number.` : 'Look at the last digit of each number.'),
  hint: r => FACTS[r.rule] || `Multiples of ${r.k}: ${Array.from({ length: Math.floor(r.max / r.k) }, (_, i) => r.k * (i + 1)).join(', ')}.`,
  mount(root, r, api) {
    const test = pickTest(r.rule, r.k);
    const chosen = new Set();
    const buttons = new Map();
    const grid = h('div', { class: 'net' }, r.values.map(v => {
      const b = h('button', { class: 'net-fish', 'aria-pressed': 'false', 'aria-label': `${v}`, onclick: () => toggle(v, b) },
        h('span', { class: 'net-icon' }, pic('🐟')), h('span', { class: 'net-num' }, v));
      buttons.set(v, b);
      return b;
    }));

    function toggle(v, b) {
      if (api.locked) return;
      audio.tap();
      if (chosen.has(v)) chosen.delete(v);
      else chosen.add(v);
      b.classList.toggle('on', chosen.has(v));
      b.setAttribute('aria-pressed', String(chosen.has(v)));
    }

    function check() {
      if (api.locked) return;
      const want = r.values.filter(test);
      const missed = want.filter(v => !chosen.has(v));
      const extra = [...chosen].filter(v => !test(v));
      if (!missed.length && !extra.length) {
        api.correct(`You caught all ${want.length}!`);
        return;
      }
      extra.forEach(v => buttons.get(v).classList.add('oops'));
      setTimeout(() => extra.forEach(v => buttons.get(v)?.classList.remove('oops')), 1200);
      const bits = [];
      if (missed.length) bits.push(`${missed.length} still swimming free`);
      if (extra.length) bits.push(`${extra.length} that don’t belong`);
      api.wrong(`Almost: ${bits.join(', ')}.`);
      const body = FACTS[r.rule]
        ? h('p', {}, FACTS[r.rule])
        : h('div', { class: 'xs-groups' }, Array.from({ length: Math.floor(r.max / r.k) }, (_, i) => h('span', { class: 'xs-group' }, r.k * (i + 1))));
      api.showWhy(why(r.rule === 'multiple' ? `Counting in ${r.k}s lands on every multiple` : 'How to tell', body));
    }

    root.append(grid, h('div', { class: 'mirror-actions' }, h('button', { class: 'btn', onclick: check }, t('Check my net'))));
  },
};
