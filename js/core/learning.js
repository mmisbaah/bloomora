// Known examples first; guided help leaves every final move to the child.
import { h } from './dom.js';
import { seqFn, fmt, hintFor, pickTest } from './sequences.js';
import { jumpStrip } from './explain.js';
import { stickSeq } from '../puzzles/sticks.js';
import { pic } from '../ui/art.js';
import { t, isArabic } from './i18n.js';

export function workedExample(r) {
  const box = h('div', { class: 'help-example', role: 'status' }, h('h3', {}, t('Worked example')));
  const line = text => box.append(h('p', {}, text));
  if (r.type === 'sticks') {
    const s = stickSeq(r.shape), f = seqFn(s);
    line(`${fmt(f(1))} + ${s.d} = ${fmt(f(2))}`);
    box.append(jumpStrip(s, 1, 3));
  } else if (['build', 'predict', 'missing', 'oddOne', 'rule', 'story', 'table'].includes(r.type) && r.seq) {
    line(isArabic() ? t('Watch how these two known steps change.') : hintFor(r.seq));
    const from = r.type === 'missing' && r.gap <= r.from + 1 ? r.gap + 1 : r.from;
    box.append(jumpStrip(r.seq, from, from + 1));
  } else if (r.type === 'mirror') {
    line(t('One step from the line on this side means one step on the other side.'));
    box.append(h('div', { class: 'mirror-example', 'aria-label': t('Filled tile, empty tile, mirror, empty tile, filled tile') }, '■ □ │ □ ■'));
  } else if (r.type === 'shapes') {
    line(t('Find one group, then repeat the whole group.'));
    box.append(h('div', { class: 'xs-groups' }, [0, 1].map(() => h('span', { class: 'xs-group' }, r.unit.map(u => pic(u))))));
  } else if (r.type === 'balance') {
    line(t('Both sides must have the same total.'));
    line('2 × ? + 1 = 7 → 2 × ? = 6 → ? = 3');
  } else if (r.type === 'machine') {
    line(t('Try the rule on a known pair before finding the unknown.'));
    const x = r.examples[0];
    line(`${x} × ${r.m} ${r.b < 0 ? '−' : '+'} ${Math.abs(r.b)} = ${r.m * x + r.b}`);
  } else if (r.type === 'sort') {
    line(r.desc ? t('Largest first: 9 → 5 → 2.') : t('Smallest first: 2 → 5 → 9.'));
  } else if (r.type === 'twins') {
    line(`${r.a} × ${r.k} = ${r.a * r.k}; ${2 * r.a} × ${r.k} = ${2 * r.a * r.k}`);
  } else if (r.type === 'pick') {
    line(r.rule === 'even' ? t('Even numbers make pairs: 2, 4, 6.') : r.rule === 'odd' ? t('Odd numbers leave one over: 1, 3, 5.') : `${r.k} × 1 = ${r.k}; ${r.k} × 2 = ${2 * r.k}`);
  }
  return box;
}

export function answerFor(r) {
  if (r.type === 'sticks') return seqFn(stickSeq(r.shape))(r.ask);
  if (r.type === 'balance') return (r.right.k - r.left.k) / (r.left.x - r.right.x);
  if (r.type === 'machine') return r.inverse ? r.ask : r.m * r.ask + r.b;
  if (!r.seq) return null;
  return seqFn(r.seq)(r.type === 'missing' ? r.gap : r.type === 'build' ? r.from + r.show : r.ask);
}

export function guideRound(root, r) {
  const note = h('div', { class: 'help-example guided-note', role: 'status' });
  const update = () => {
    root.querySelectorAll('.guided-target').forEach(el => el.classList.remove('guided-target'));
    let text = t('Follow the outlined step, then check your answer.');
    const mark = el => el?.classList.add('guided-target');
    const card = [...root.querySelectorAll('.rule-card')].find(b => b.bloomoraOk && !b.disabled);
    if (card) { mark(card); text = t('Test the outlined rule on every example, then choose it.'); }
    else if (r.type === 'mirror') {
      root.querySelectorAll('.cell.tgt').forEach(cell => {
        const [y, x] = cell.getAttribute('aria-label').match(/\d+/g).map(n => +n - 1);
        const sy = r.axis === 'h' ? r.pattern.length * 2 - 1 - y : y;
        const sx = r.axis === 'h' ? x : r.pattern[0].length * 2 - 1 - x;
        if ((r.pattern[sy][sx] === '#') !== (cell.getAttribute('aria-pressed') === 'true')) mark(cell);
      });
      text = t('Change the outlined tiles, then check your reflection.');
    } else if (r.type === 'shapes') {
      const filled = root.querySelectorAll('.parade-slot.filled').length;
      const next = r.unit[(r.shown + filled) % r.unit.length];
      mark([...root.querySelectorAll('.parade-option')].find(b => b.getAttribute('aria-label') === `Place ${next}`));
    } else if (r.type === 'sort') {
      const order = [...r.values].sort((a, b) => r.desc ? b - a : a - b);
      const next = order[root.querySelectorAll('.pebble--placed').length];
      mark([...root.querySelectorAll('.sort-pool .pebble')].find(b => b.getAttribute('aria-label') === String(next)));
    } else if (r.type === 'pick') {
      const test = pickTest(r.rule, r.k);
      root.querySelectorAll('.net-fish').forEach(b => {
        if (test(+b.getAttribute('aria-label')) !== (b.getAttribute('aria-pressed') === 'true')) mark(b);
      });
      text = t('Change the outlined numbers, then check your net.');
    } else if (r.type === 'oddOne') {
      mark(root.querySelectorAll('button.stone')[r.bad.at - r.from]);
      text = t('The outlined stone breaks the pattern. Compare its jumps with its neighbours.');
    } else {
      const answer = answerFor(r);
      if (answer !== null && answer !== undefined) {
        text = t('Work towards {answer}, then check. You make the final move.', { answer: fmt(answer, r.seq?.format) });
        mark([...root.querySelectorAll('.option')].find(b => b.querySelector('.option-num')?.textContent === fmt(answer, r.seq?.format)));
        mark(root.querySelector('.numpad, .build-controls'));
      }
    }
    note.textContent = text;
  };
  root.append(note);
  root.addEventListener('click', update);
  update();
  return () => {
    root.removeEventListener('click', update);
    root.querySelectorAll('.guided-target').forEach(el => el.classList.remove('guided-target'));
    note.remove();
  };
}
