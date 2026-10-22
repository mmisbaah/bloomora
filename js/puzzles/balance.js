// A balance scale with mystery creatures. Guess one creature's weight and watch the beam tip.
import { h } from '../core/dom.js';
import { numpad } from '../core/numpad.js';
import { why } from '../core/explain.js';
import { pic } from '../ui/art.js';

const sideText = (s, c) => [s.x && `${s.x} × ${c}`, s.k && `${s.k} 🐚`].filter(Boolean).join(' + ');

export default {
  id: 'balance',
  name: 'Lagoon Scales',
  prompt: r => `How many shells does one ${r.critter} weigh?`,
  say: () => 'Type a weight and watch the scale. Level beam means you got it!',
  nudge: () => 'Try any guess and watch which way the scale tips.',
  hint(r) {
    const { left: L, right: R } = r;
    const steps = [];
    if (R.x) steps.push(`take ${R.x} × ${r.critter} off both sides`);
    if (L.k) steps.push(`take ${L.k} 🐚 off both sides`);
    const left = L.x - R.x, shells = R.k - L.k;
    const lead = steps.length ? `First ${steps.join(', then ')}. ` : '';
    return `${lead}That leaves ${left} × ${r.critter} balancing ${shells} 🐚. Share ${shells} into ${left} equal parts.`;
  },
  mount(root, r, api) {
    const { left: L, right: R } = r;
    const Rt = R;
    const answer = (R.k - L.k) / (L.x - R.x);

    const load = s => h('div', { class: 'pan-load' },
      Array.from({ length: s.x }, () => h('span', { class: 'pan-critter' }, pic(r.critter))),
      s.k ? h('span', { class: 'weight' }, h('span', { class: 'weight-shell' }, pic('🐚')), s.k) : null);

    const beam = h('div', { class: 'beam' },
      h('div', { class: 'pan pan--l' }, load(L), h('div', { class: 'dish' })),
      h('div', { class: 'pan pan--r' }, load(R), h('div', { class: 'dish' })));
    const scale = h('div', { class: 'scale wobble', 'aria-hidden': 'true' }, beam, h('div', { class: 'post' }), h('div', { class: 'base' }));

    const guess = h('span', { class: 'guess' }, '?');
    const eq = h('div', { class: 'equation' },
      h('p', {}, `${sideText(L, r.critter)}  balances  ${sideText(R, r.critter)}`),
      h('p', {}, `One ${r.critter} = `, guess, ' 🐚'));

    const setTilt = deg => beam.style.setProperty('--tilt', `${deg}deg`);

    const pad = numpad({
      maxLen: 3,
      onChange: v => { guess.textContent = v || '?'; },
      onSubmit: g => {
        if (api.locked) return;
        scale.classList.remove('wobble');
        const lw = L.x * g + L.k;
        const rw = R.x * g + R.k;
        // Positive rotation tips the right pan down.
        setTilt(Math.max(-16, Math.min(16, (rw - lw) * 2)));
        if (lw === rw) {
          scale.classList.add('balanced');
          api.correct(`Balanced! Each ${r.critter} weighs ${answer} shells.`);
        } else {
          const heavier = lw > rw ? 'left' : 'right';
          api.wrong(`With ${g}, the ${heavier} side sinks. Try a ${lw > rw ? 'lighter' : 'heavier'} ${r.critter}.`);
          const side = (s, w) => [s.x && `${s.x} × ${g}`, s.k && `${s.k}`].filter(Boolean).join(' + ') + ` = ${w}`;
          api.showWhy(why(`If one ${r.critter} weighs ${g} shells…`,
            h('div', { class: 'xs-sides' },
              h('span', { class: lw > rw ? 'xs-heavy' : '' }, 'Left: ', side(L, lw)),
              h('span', { class: rw > lw ? 'xs-heavy' : '' }, 'Right: ', side(Rt, rw))),
            h('p', {}, `The sides need to be equal. Try a ${lw > rw ? 'smaller' : 'bigger'} number.`)));
          pad.clear();
        }
      },
    });

    root.append(h('div', { class: 'balance-layout' }, h('div', {}, scale, eq), pad.el));
    return pad.destroy;
  },
};
