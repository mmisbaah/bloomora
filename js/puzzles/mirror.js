// Reflect a tile picture across the mirror line by tapping cells on the empty side.
import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';

export default {
  id: 'mirror',
  name: 'Mirror Pool',
  prompt: r => (r.axis === 'h' ? 'Reflect the tiles across the water line' : 'Reflect the tiles across the mirror line'),
  say: () => 'Tap tiles on the empty side to make a perfect reflection, then press Check.',
  nudge: () => 'Start with the tiles that touch the line.',
  hint: () => 'Count steps from the line. A tile 1 step from the line on one side lands 1 step from it on the other.',
  mount(root, r, api) {
    const axis = r.axis || 'v';
    const p = r.pattern;
    const rows = axis === 'v' ? p.length : p.length * 2;
    const cols = axis === 'v' ? p[0].length * 2 : p[0].length;
    const isSource = (y, x) => (axis === 'v' ? x < cols / 2 : y < rows / 2);
    const mirrorOf = (y, x) => (axis === 'v' ? [y, cols - 1 - x] : [rows - 1 - y, x]);
    const key = (y, x) => `${y},${x}`;

    const expected = new Set();
    const chosen = new Set();
    const cells = new Map();
    const grid = h('div', { class: 'mirror', style: { '--cols': cols, '--rows': rows } });

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (isSource(y, x)) {
          const on = p[y][x] === '#';
          if (on) expected.add(key(...mirrorOf(y, x)));
          grid.append(h('div', { class: `cell src${on ? ' on' : ''}` }));
        } else {
          const k = key(y, x);
          const cell = h('button', { class: 'cell tgt', 'aria-label': `Row ${y + 1}, column ${x + 1}`, 'aria-pressed': 'false', onclick: () => toggle(k, cell) });
          cells.set(k, cell);
          grid.append(cell);
        }
      }
    }

    function toggle(k, cell) {
      if (api.locked) return;
      audio.tap();
      if (chosen.has(k)) chosen.delete(k);
      else chosen.add(k);
      const on = chosen.has(k);
      cell.classList.toggle('on', on);
      cell.setAttribute('aria-pressed', String(on));
    }

    function clearAll() {
      if (api.locked) return;
      chosen.clear();
      cells.forEach(c => {
        c.classList.remove('on');
        c.setAttribute('aria-pressed', 'false');
      });
    }

    function verify() {
      if (api.locked) return;
      let missing = 0, extra = 0;
      expected.forEach(k => { if (!chosen.has(k)) missing++; });
      const extras = [...chosen].filter(k => !expected.has(k));
      extra = extras.length;
      if (!missing && !extra) {
        grid.classList.add('mirror--win');
        api.correct('A perfect reflection!');
        return;
      }
      extras.forEach(k => cells.get(k).classList.add('oops'));
      setTimeout(() => extras.forEach(k => cells.get(k)?.classList.remove('oops')), 1000);
      const bits = [];
      if (missing) bits.push(`${missing} tile${missing > 1 ? 's' : ''} missing`);
      if (extra) bits.push(`${extra} in the wrong place`);
      api.wrong(`Almost: ${bits.join(', ')}. Count steps from the line.`);
      // Point out one missing tile as a worked example, not all of them.
      const example = [...expected].find(k => !chosen.has(k));
      if (example) {
        const cell = cells.get(example);
        cell.classList.add('example');
        setTimeout(() => cell.classList.remove('example'), 2500);
        api.showWhy(why('Here’s one you missed (it’s glowing). It’s the same number of steps from the line as its partner.'));
      }
    }

    root.append(
      h('div', { class: 'mirror-wrap' }, grid, h('div', { class: `mirror-line mirror-line--${axis}`, 'aria-hidden': 'true' })),
      h('div', { class: 'mirror-actions' },
        h('button', { class: 'btn btn--ghost btn--small', onclick: clearAll }, 'Clear'),
        h('button', { class: 'btn', onclick: verify }, 'Check reflection')));
  },
};
