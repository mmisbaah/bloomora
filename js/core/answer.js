// The answer area shared by the newer puzzles: the shell pad for whole numbers, or answer
// buttons when the value is a time, money, a decimal or a half (those are hard to type).
import { h, shuffle } from './dom.js';
import { fmt, distractors } from './sequences.js';
import { numpad } from './numpad.js';

export function answerArea(r, api, { answer, tempting = [], onRight, onWrong, onTyping = () => {} }) {
  const format = r.seq?.format;
  const show = v => fmt(v, format);
  if (format || r.choices) {
    const opts = shuffle([answer, ...distractors(answer, tempting, (r.optionCount || 4) - 1, { negative: !!r.negative })]);
    const el = h('div', { class: 'options' }, opts.map(o => {
      const b = h('button', { class: 'option', onclick: () => {
        if (api.locked) return;
        if (o === answer) { b.classList.add('is-right'); onRight(); }
        else { b.classList.add('is-wrong'); b.disabled = true; onWrong(o); }
      } }, h('span', { class: 'option-num' }, show(o)));
      return b;
    }));
    return { el, destroy: null };
  }
  const pad = numpad({
    negative: !!r.negative,
    maxLen: 5,
    onChange: onTyping,
    onSubmit: v => {
      if (api.locked) return;
      if (v === answer) onRight();
      else { onWrong(v); pad.clear(); }
    },
  });
  return { el: pad.el, destroy: pad.destroy };
}
