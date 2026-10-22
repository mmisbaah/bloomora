// On-screen shell pad for typed answers. Also listens to the keyboard while mounted.
// With `negative`, a ± key flips the sign (and "-" on a keyboard does the same).
import { h } from './dom.js';
import { audio } from './audio.js';

export function numpad({ onSubmit, onChange = () => {}, maxLen = 4, negative = false }) {
  let digits = '';
  let minus = false;
  const shown = () => (digits ? `${minus ? '−' : ''}${digits}` : minus ? '−' : '');
  const go = h('button', { class: 'np-key np-key--go', 'aria-label': 'Submit answer', disabled: true, onclick: () => press('go') }, '✓');

  const update = () => {
    go.disabled = !digits;
    onChange(shown());
  };

  function press(k) {
    if (k === 'go') {
      if (digits) onSubmit((minus ? -1 : 1) * Number(digits));
      return;
    }
    audio.tap();
    if (k === 'del') {
      if (digits) digits = digits.slice(0, -1);
      else minus = false;
    } else if (k === 'sign') {
      if (negative) minus = !minus;
    } else if (digits.length < maxLen) {
      digits = digits === '0' ? k : digits + k;
    }
    update();
  }

  const key = (k, label = k, cls = '', text = k) =>
    h('button', { class: `np-key ${cls}`, 'aria-label': label, onclick: () => press(k) }, text);

  const grid = h('div', { class: `np-grid${negative ? ' np-grid--neg' : ''}` },
    ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(k => key(k)),
    key('del', 'Delete', 'np-key--del', '⌫'),
    key('0'),
    go,
    negative ? key('sign', 'Make it negative or positive', 'np-key--sign', '±') : null);

  const onKey = e => {
    if (document.querySelector('.overlay')) return;
    if (e.target.closest?.('input, textarea')) return;
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') press('del');
    else if (e.key === '-' && negative) press('sign');
    else if (e.key === 'Enter') {
      e.preventDefault();
      press('go');
    }
  };
  document.addEventListener('keydown', onKey);

  const el = h('div', { class: 'numpad' }, grid, h('p', { class: 'np-note' }, 'You can type on a keyboard too.'));
  return {
    el,
    clear: () => { digits = ''; minus = false; update(); },
    destroy: () => document.removeEventListener('keydown', onKey),
  };
}
