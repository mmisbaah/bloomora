// Build the next pool with + / − buttons, then check it.
import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';
import { seqFn, hintFor } from '../core/sequences.js';
import { poolCard, renderTerm } from '../core/render.js';

// Each mode turns "number of presses" (k) into a pool value.
const MODES = {
  one: { value: k => k, label: (k, r) => `+1 ${r.itemName}` },
  group: { value: (k, r) => k * (r.group || r.seq.d), label: (k, r) => `+ group of ${r.group || r.seq.d}` },
  border: { value: k => k * k, label: k => `+ border of ${2 * k + 1}` },
  row: { value: k => (k * (k + 1)) / 2, label: k => `+ row of ${k + 1}` },
};

export default {
  id: 'build',
  name: 'Build the Pool',
  prompt: r => `Build Pool ${r.from + r.show}`,
  say: r => `Use the buttons to fill Pool ${r.from + r.show}, then press Check.`,
  hint(r) {
    const f = seqFn(r.seq);
    const t = r.from + r.show;
    switch (r.mode) {
      case 'border': return `Pool ${t} is a ${t} × ${t} square. Each press adds one L-shaped border around it.`;
      case 'row': return `Pool ${t} has rows of 1, 2, 3 … all the way up to ${t}.`;
      case 'group': return `${hintFor(r.seq)} Pool ${t - 1} has ${f(t - 1)}, so Pool ${t} has one more group than that.`;
      default: return `${hintFor(r.seq)} Pool ${t - 1} has ${f(t - 1)}.`;
    }
  },
  mount(root, r, api) {
    const f = seqFn(r.seq);
    const t = r.from + r.show;
    const target = f(t);
    const mode = MODES[r.mode || 'one'];
    let targetK = 0;
    while (mode.value(targetK, r) < target && targetK < 200) targetK++;
    const maxK = targetK + 3;
    let k = 0;

    const pools = h('div', { class: 'pools' });
    for (let n = r.from; n < t; n++) pools.append(poolCard(n, f(n), r));
    const body = h('div', { class: 'pool-body' });
    const count = h('div', { class: 'pool-count' });
    const buildCard = h('div', { class: 'pool pool--build' }, h('div', { class: 'pool-label' }, `Pool ${t}`), body, count);
    pools.append(buildCard);

    const minus = h('button', { class: 'btn btn--ghost btn--small', 'aria-label': 'Take one away', onclick: () => set(k - 1) }, '−');
    const plus = h('button', { class: 'btn btn--kelp btn--small', onclick: () => set(k + 1) });
    const check = h('button', { class: 'btn', onclick: verify }, 'Check');

    function draw() {
      const v = mode.value(k, r);
      body.replaceChildren(renderTerm(v, r));
      count.textContent = `${v} ${v === 1 ? r.itemName : r.itemPlural}`;
      plus.textContent = mode.label(k, r);
      minus.disabled = k === 0;
      plus.disabled = k >= maxK;
    }

    function set(next) {
      if (api.locked) return;
      k = Math.max(0, Math.min(maxK, next));
      audio.tap();
      draw();
    }

    function verify() {
      if (api.locked) return;
      const v = mode.value(k, r);
      if (v === target) {
        buildCard.classList.add('pool--win');
        api.correct(`Pool ${t} is built with exactly ${target} ${r.itemPlural}!`);
      } else if (v < target) {
        api.wrong(`${v} is not enough for Pool ${t}. Add more.`);
      } else {
        api.wrong(`${v} is too many for Pool ${t}.`);
      }
    }

    draw();
    root.append(pools, h('div', { class: 'build-controls' }, minus, plus, check));
  },
};
