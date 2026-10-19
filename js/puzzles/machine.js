// A current machine applies a secret rule (× m, then + b). Work out an output, or work backwards.
import { h, shuffle } from '../core/dom.js';
import { audio } from '../core/audio.js';
import { numpad } from '../core/numpad.js';

export function ruleLabel(m, b) {
  const parts = [];
  if (m !== 1) parts.push(`× ${m}`);
  if (b > 0) parts.push(`+ ${b}`);
  if (b < 0) parts.push(`− ${-b}`);
  return parts.length ? parts.join(', then ') : 'stays the same';
}

export default {
  id: 'machine',
  name: 'Current Machine',
  prompt: r => (r.inverse ? 'What number went into the machine?' : 'What number comes out of the machine?'),
  say: r => (r.inverse ? 'This time you know what came out. Work backwards!' : 'Every number goes through the same secret rule.'),
  hint(r) {
    if (r.inverse) {
      const steps = [];
      if (r.b) steps.push(`undo the ${r.b > 0 ? `+ ${r.b}` : `− ${-r.b}`}`);
      if (r.m !== 1) steps.push(`divide by ${r.m}`);
      return `Work backwards: ${steps.join(', then ')}.`;
    }
    const x = r.examples[0];
    return `When In goes up by 1, Out goes up by ${r.m}. Check it on In ${x} → Out ${r.m * x + r.b}.`;
  },
  mount(root, r, api) {
    const f = x => r.m * x + r.b;
    const answer = r.inverse ? r.ask : f(r.ask);
    let stage = 1;

    const row = (i, o) => h('div', { class: 'mrow' },
      h('span', { class: 'mval' }, i), h('span', { class: 'marrow' }, '→'), h('span', { class: 'mval' }, o));
    const qIn = h('span', { class: `mval${r.inverse ? ' q' : ''}` }, r.inverse ? '?' : r.ask);
    const qOut = h('span', { class: `mval${r.inverse ? '' : ' q'}` }, r.inverse ? f(r.ask) : '?');
    const target = r.inverse ? qIn : qOut;

    const machine = h('div', { class: 'machine' },
      h('div', { class: 'machine-head' }, h('span', {}, 'In'), h('span', { class: 'machine-core', 'aria-hidden': 'true' }, '⚙'), h('span', {}, 'Out')),
      r.examples.map(x => row(x, f(x))),
      h('div', { class: 'mrow mrow--q' }, qIn, h('span', { class: 'marrow' }, '→'), qOut));

    const pad = numpad({
      onChange: v => { target.textContent = v || '?'; },
      onSubmit: v => {
        if (api.locked || stage !== 1) return;
        if (v === answer) {
          target.classList.add('is-fixed', 'pop-in');
          if (r.pickRule) toRuleStage();
          else api.correct(`Yes! The machine's rule is ${ruleLabel(r.m, r.b)}.`);
        } else {
          api.wrong(`${v} isn't right. Test your rule on every row above.`);
          pad.clear();
        }
      },
    });
    const side = h('div', {}, pad.el);

    function toRuleStage() {
      stage = 2;
      audio.tap();
      pad.destroy();
      const fails = ([m, b]) => r.examples.some(x => m * x + b !== f(x));
      const correctLabel = ruleLabel(r.m, r.b);
      const x0 = r.examples[0];
      const candidates = [[1, f(x0) - x0], [r.m + 1, r.b], [r.m, r.b + 1], [r.m * 2, 0], [r.m + 1, r.b - x0], [r.m, r.b - 1]];
      const wrong = [];
      for (const c of candidates) {
        const label = ruleLabel(...c);
        if (fails(c) && label !== correctLabel && !wrong.includes(label)) wrong.push(label);
        if (wrong.length === 2) break;
      }
      const cards = shuffle([{ text: correctLabel, ok: true }, ...wrong.map(text => ({ text, ok: false }))]);
      side.replaceChildren(
        h('p', { class: 'sub-prompt' }, 'Bonus: which secret rule is inside the machine?'),
        h('div', { class: 'cards' }, cards.map(c => {
          const b = h('button', { class: 'rule-card', onclick: () => choose(c, b) }, `In ${c.text}`);
          return b;
        })));
      api.say('Great number! Now name the rule.', 'good');
    }

    function choose(c, b) {
      if (api.locked) return;
      if (c.ok) {
        b.classList.add('is-right');
        api.correct('You cracked the machine!');
      } else {
        b.classList.add('is-wrong');
        b.disabled = true;
        api.wrong('That rule fails on one of the rows. Test it.');
      }
    }

    root.append(h('div', { class: 'machine-layout' }, machine, side));
    return () => pad.destroy();
  },
};
