// On-screen shell pad for typed answers. Also listens to the keyboard while mounted.
import { h } from './dom.js';
import { audio } from './audio.js';

export function numpad({ onSubmit, onChange = () => {}, maxLen = 4 }) {
  let val = '';
  const go = h('button', { class: 'np-key np-key--go', 'aria-label': 'Submit answer', disabled: true, onclick: () => press('go') }, '✓');

  const set = v => {
    val = v;
    go.disabled = !val;
    onChange(val);
  };

  function press(k) {
    if (k === 'go') {
      if (val) onSubmit(Number(val));
      return;
    }
    audio.tap();
    if (k === 'del') set(val.slice(0, -1));
    else if (val.length < maxLen) set(val === '0' ? k : val + k);
  }

  const key = (k, label = k, cls = '') =>
    h('button', { class: `np-key ${cls}`, 'aria-label': label, onclick: () => press(k) }, k === 'del' ? '⌫' : k);

  const grid = h('div', { class: 'np-grid' },
    ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(k => key(k)),
    key('del', 'Delete', 'np-key--del'),
    key('0'),
    go);

  const onKey = e => {
    if (e.target.closest?.('input, textarea')) return;
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') press('del');
    else if (e.key === 'Enter') {
      e.preventDefault();
      press('go');
    }
  };
  document.addEventListener('keydown', onKey);

  const el = h('div', { class: 'numpad' }, grid, h('p', { class: 'np-note' }, 'You can type on a keyboard too.'));
  return {
    el,
    clear: () => set(''),
    destroy: () => document.removeEventListener('keydown', onKey),
  };
}
