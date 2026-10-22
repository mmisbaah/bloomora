// "Show me how": a ghost hand glides to the question, then to where the answer goes.
// It runs on its own the first time a player meets each puzzle type, and again from ⚙️ Settings.
import { h } from '../core/dom.js';
import { isArabic, AR_HOW } from '../core/i18n.js';

export const howText = id => (isArabic() ? AR_HOW[id] : HOW[id]);

export const HOW = {
  build: 'Look at how the pools grow. Tap + or − to fill the empty pool, then press Check.',
  predict: 'Find the jump between pools. Keep jumping to the far pool, then tap your answer.',
  missing: 'One stone sank. Work out the jump, then type the missing number.',
  rule: 'Watch how the pools change. Tap the card that tells the rule.',
  oddOne: 'All the stones follow one rule except one. Tap the stone that breaks it.',
  shapes: 'Say the pattern out loud. Then tap what comes next to fill each gap.',
  sort: 'Tap the critters in order, starting with the smallest.',
  balance: 'Both sides must weigh the same. Type the number that balances the scale.',
  machine: 'The machine does the same thing to every number. Find what it does, then type the answer.',
  mirror: 'Make the other side match. Tap squares to copy the pattern in the mirror.',
  twins: 'Two patterns swim side by side. Find the rule linking them, then tap it.',
  pick: 'Tap every number in the net that fits the rule, then press Check.',
  sticks: 'Count the sticks in each shape. Find how many get added, then type the answer.',
  story: 'Read the story. Find the pattern in it, then type your answer.',
  table: 'Look down the table or graph. Find the rule, then fill in the missing number.',
};

const QUESTION = '.far-q, .stone-num, .q, .guess, .parade-slot.active, .stick-q, .story-q, .table-q, .pool:last-child';
const ANSWER = '.options, .numpad, .parade-options, .rule-list, .build-controls, .stones, .sort-pool, .net-grid, .mirror-grid, .option';

export function ghostHand(stageEl, root, onDone = () => {}) {
  stageEl.querySelector('.ghost')?.remove();
  const q = root.querySelector(QUESTION) || root.firstElementChild;
  const a = [...root.querySelectorAll(ANSWER)].find(el => el.offsetParent) || root.lastElementChild;
  if (!q || !a) { onDone(); return () => {}; }
  const hand = h('div', { class: 'ghost', 'aria-hidden': 'true' }, h('span', { class: 'ghost-ring' }), h('span', { class: 'ghost-hand' }, '👆'));
  stageEl.append(hand);
  const at = el => {
    const s = stageEl.getBoundingClientRect(), r = el.getBoundingClientRect();
    return [r.left - s.left + r.width / 2, r.top - s.top + r.height / 2];
  };
  const moveTo = el => {
    const [x, y] = at(el);
    hand.style.left = `${x}px`;
    hand.style.top = `${y}px`;
    hand.classList.remove('tap');
    void hand.offsetWidth;
    hand.classList.add('tap');
  };
  const steps = [() => moveTo(q), () => moveTo(a), () => moveTo(q), () => moveTo(a), () => { hand.remove(); onDone(); }];
  let i = 0, t = null;
  const tick = () => { steps[i++](); if (i < steps.length) t = setTimeout(tick, 1300); };
  const [x0, y0] = at(stageEl.querySelector('.stage-head') || root);
  hand.style.left = `${x0}px`;
  hand.style.top = `${y0}px`;
  t = setTimeout(tick, 250);
  return () => { clearTimeout(t); hand.remove(); };
}
