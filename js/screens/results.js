// End-of-level overlays: cleared (stars, score tally) and failed.
import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';
import { openOverlay, closeOverlay } from '../ui/widgets.js';

const act = fn => () => { closeOverlay(); fn(); };

function starLine(stars, [three]) {
  if (stars === 3) return three ? 'Wonderful! Three bright stars.' : 'Perfect! Not a single mistake.';
  if (stars === 2) return 'So close! A couple fewer slips earns all 3 stars.';
  return 'Cleared! Fewer mistakes earns more stars.';
}

export function showResults(o) {
  const stars = h('div', { class: 'stars-big', role: 'img', 'aria-label': `${o.stars} of 3 stars` },
    [0, 1, 2].map(i => h('span', { class: `star${i < o.stars ? ' on' : ''}`, style: { animationDelay: `${300 + i * 350}ms` } }, '★')));
  for (let i = 0; i < o.stars; i++) setTimeout(() => audio.star(i), 300 + i * 350);

  const row = (label, value, cls) => [h('dt', {}, label), h('dd', { class: cls }, value)];
  openOverlay(h('div', { class: 'modal panel pop-in' },
    h('div', { class: 'eyebrow' }, 'Level cleared'),
    h('h2', {}, o.levelName),
    stars,
    h('p', {}, starLine(o.stars, o.starRule)),
    o.newBest ? h('span', { class: 'badge' }, 'New best score!') : null,
    h('dl', { class: 'tally' },
      row('Puzzle points', o.score),
      o.speedBonus ? row(`Speed bonus (${Math.round(o.secs)}s)`, `+${o.timeBonus}`) : null,
      row('Total', o.total, 'total'),
      row('Pearls found', `+${o.pearls}`)),
    h('div', { class: 'modal-actions' },
      h('button', { class: 'btn btn--ghost', onclick: act(o.onRetry) }, 'Replay'),
      h('button', { class: o.onNext ? 'btn btn--ghost' : 'btn', onclick: act(o.onMap) }, 'Map'),
      o.onNext ? h('button', { class: 'btn', onclick: act(o.onNext) }, 'Next level') : null)));
}

export function showFail({ reason, onRetry, onMap }) {
  openOverlay(h('div', { class: 'modal panel pop-in' },
    h('div', { class: 'fail-face', 'aria-hidden': 'true' }, '🌊'),
    h('h2', {}, 'Washed out!'),
    h('p', {}, reason),
    h('div', { class: 'modal-actions' },
      h('button', { class: 'btn btn--ghost', onclick: act(onMap) }, 'Map'),
      h('button', { class: 'btn', onclick: act(onRetry) }, 'Try again'))));
}

export function showFreeResults({ depth, score, pearls, isRecord, prev, onRetry, onMap }) {
  const row = (label, value, cls) => [h('dt', {}, label), h('dd', { class: cls }, value)];
  openOverlay(h('div', { class: 'modal panel pop-in' },
    h('div', { class: 'eyebrow' }, 'Free Dive over'),
    h('h2', {}, `Depth ${depth}`),
    h('p', {}, depth ? `You solved ${depth} fresh puzzle${depth === 1 ? '' : 's'} in a row.` : 'The deep is tricky. Try again!'),
    isRecord && depth ? h('span', { class: 'badge' }, prev ? 'New record!' : 'First record set!') : null,
    h('dl', { class: 'tally' },
      row('Puzzles solved', depth),
      row('Score', score, 'total'),
      prev ? row('Previous record', `depth ${prev.depth}`) : null,
      row('Pearls found', `+${pearls}`)),
    h('div', { class: 'modal-actions' },
      h('button', { class: 'btn btn--ghost', onclick: act(onMap) }, 'Map'),
      h('button', { class: 'btn', onclick: act(onRetry) }, 'Dive again'))));
}

// Plain results card for Daily Dive and Practice.
export function showSimpleResults({ eyebrow, title, text, rows, onRetry, onMap }) {
  const row = ([label, value]) => [h('dt', {}, label), h('dd', {}, value)];
  openOverlay(h('div', { class: 'modal panel pop-in' },
    h('div', { class: 'eyebrow' }, eyebrow),
    h('h2', {}, title),
    h('p', {}, text),
    h('dl', { class: 'tally' }, rows.map(row)),
    h('div', { class: 'modal-actions' },
      h('button', { class: onRetry ? 'btn btn--ghost' : 'btn', onclick: act(onMap) }, 'Map'),
      onRetry ? h('button', { class: 'btn', onclick: act(onRetry) }, 'Play again') : null)));
}
