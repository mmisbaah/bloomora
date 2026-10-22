// Growing shapes made of sticks (squares, triangles or houses in a row). How many sticks will a
// later shape need? Common Core 4.OA.C.5 and 5.OA.B.3; England Year 6 linear sequences.
import { h } from '../core/dom.js';
import { seqFn } from '../core/sequences.js';
import { answerArea } from '../core/answer.js';
import { why } from '../core/explain.js';
import { t } from '../core/i18n.js';

// Sticks in shape n: squares 3n + 1, triangles 2n + 1, houses 4n + 1.
export const STICK_SHAPES = {
  squares: { a: 4, d: 3, name: 'squares', per: 'Each new square needs 3 more sticks.' },
  triangles: { a: 3, d: 2, name: 'triangles', per: 'Each new triangle needs 2 more sticks.' },
  houses: { a: 5, d: 4, name: 'houses', per: 'Each new house needs 4 more sticks: a floor, a wall and two for the roof.' },
};
export const stickSeq = shape => ({ kind: 'arith', a: STICK_SHAPES[shape].a, d: STICK_SHAPES[shape].d });

const U = 20;
function segments(shape, n) {
  const segs = [];
  if (shape === 'squares') {
    for (let i = 0; i < n; i++) segs.push([i * U, 0, (i + 1) * U, 0], [i * U, U, (i + 1) * U, U]);
    for (let i = 0; i <= n; i++) segs.push([i * U, 0, i * U, U]);
  } else if (shape === 'triangles') {
    const B = k => [k * U, U], T = k => [(k + 0.5) * U, 0];
    const zig = [];
    for (let k = 0; zig.length < n + 2; k++) zig.push(B(k), T(k));
    for (let i = 0; i <= n; i++) segs.push([...zig[i], ...zig[i + 1]]);
    for (let i = 0; i < n; i++) {
      const k = Math.floor(i / 2);
      segs.push(i % 2 ? [...T(k), ...T(k + 1)] : [...B(k), ...B(k + 1)]);
    }
  } else {
    const top = U * 0.7, base = U * 1.7;
    segs.push([0, top, 0, base]);
    for (let i = 0; i < n; i++) {
      segs.push([i * U, base, (i + 1) * U, base], [(i + 1) * U, top, (i + 1) * U, base],
        [i * U, top, (i + 0.5) * U, 0], [(i + 0.5) * U, 0, (i + 1) * U, top]);
    }
  }
  return segs;
}

export function stickFigure(shape, n) {
  const segs = segments(shape, n);
  const w = n * U + 8, ht = (shape === 'houses' ? U * 1.7 : U) + 8;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `-4 -4 ${w} ${ht}`);
  svg.setAttribute('class', 'stick-svg');
  svg.style.setProperty('--w', n);
  svg.setAttribute('aria-hidden', 'true');
  for (const [x1, y1, x2, y2] of segs) {
    const l = document.createElementNS(ns, 'line');
    Object.entries({ x1, y1, x2, y2 }).forEach(([k, v]) => l.setAttribute(k, v));
    svg.append(l);
  }
  return svg;
}

export default {
  id: 'sticks',
  name: 'Stick Shapes',
  prompt: r => `How many sticks make Shape ${r.ask}?`,
  say: r => (r.ask > r.show + 1 ? `Shape ${r.ask} is too big to draw here. Find how many sticks each new piece adds.` : 'Count the sticks, then work out the next shape.'),
  nudge: r => STICK_SHAPES[r.shape].per,
  hint: r => {
    const s = STICK_SHAPES[r.shape];
    return `${s.per} Shape 1 has ${s.a}, so Shape ${r.ask} has ${s.a} + ${s.d} × ${r.ask - 1}.`;
  },
  mount(root, r, api) {
    const f = seqFn(stickSeq(r.shape));
    const answer = f(r.ask);
    const cards = h('div', { class: 'stick-row' });
    for (let n = 1; n <= r.show; n++) {
      cards.append(h('div', { class: 'stick-card' },
        h('div', { class: 'pool-label' }, t('Shape {n}', { n })),
        stickFigure(r.shape, n),
        h('div', { class: 'pool-count' }, r.counts === false ? '' : `${f(n)} ${t('sticks')}`)));
    }
    const guess = h('span', { class: 'stick-q' }, '?');
    cards.append(h('div', { class: 'stick-card stick-card--q' },
      h('div', { class: 'pool-label' }, t('Shape {n}', { n: r.ask })), guess,
      h('div', { class: 'pool-count' }, t('sticks'))));
    const area = answerArea(r, api, {
      answer,
      tempting: [f(r.ask - 1), f(r.ask + 1), r.ask * STICK_SHAPES[r.shape].d, r.ask * STICK_SHAPES[r.shape].a],
      onTyping: v => { guess.textContent = v || '?'; },
      onRight: () => { guess.textContent = answer; api.correct(`Yes! Shape ${r.ask} needs ${answer} sticks.`); },
      onWrong: v => {
        const s = STICK_SHAPES[r.shape];
        api.wrong(v === r.ask * s.a ? 'Careful: the pieces share sticks, so you can’t just multiply.' : `Not ${v}. ${s.per}`);
        const steps = [];
        for (let n = 1; n <= Math.min(r.ask, 6); n++) steps.push(h('span', { class: 'xs-stone' }, h('span', { class: 'xs-pool' }, `Shape ${n}`), f(n)));
        if (r.ask > 6) steps.push(h('span', { class: 'xs-jump' }, '…'), h('span', { class: 'xs-stone xs-q' }, h('span', { class: 'xs-pool' }, `Shape ${r.ask}`), '?'));
        api.showWhy(why(`+${s.d} sticks every time`, h('div', { class: 'xs-strip' }, steps)));
      },
    });
    root.append(cards, area.el);
    return area.destroy;
  },
};
