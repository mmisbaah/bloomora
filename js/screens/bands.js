// "Who's diving today?" age band picker.
import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';
import * as S from '../core/state.js';
import { BANDS } from '../data/bands.js';
import { worldsInBand } from '../data/worlds.js';
import { speak } from '../core/speech.js';
import { sprig, muteButton } from '../ui/widgets.js';

export function bandsScreen(app, _params, nav) {
  const current = S.getState().band;

  const card = b => {
    const s = b.settings;
    const levels = worldsInBand(b.id).reduce((n, w) => n + w.levels.length, 0);
    return h('button', {
      class: `band-card panel${b.id === current ? ' current' : ''}`,
      style: { '--w': b.color },
      'aria-label': `${b.name}, ages ${b.ages}`,
      onclick: () => {
        S.setBand(b.id);
        // Clear any manual read-aloud choice so the new band's default applies.
        S.setReadAloud(null);
        audio.bloom();
        nav.map();
      },
    },
    h('span', { class: 'band-emoji', 'aria-hidden': 'true' }, b.emoji),
    h('span', { class: 'band-ages' }, `Ages ${b.ages}`),
    h('span', { class: 'band-name' }, b.name),
    h('span', { class: 'band-focus' }, b.focus),
    h('span', { class: 'band-tags' },
      h('span', { class: 'chip' }, `${levels} levels`),
      h('span', { class: 'chip' }, `${s.hearts} hearts`),
      s.readAloud ? h('span', { class: 'chip' }, 'Reads aloud') : null,
      s.timer ? h('span', { class: 'chip' }, 'Timed boss') : h('span', { class: 'chip' }, 'No clock')));
  };

  app.append(h('div', { class: 'screen' },
    h('header', { class: 'top-bar' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back to title', onclick: nav.title }, '←'),
      h('div', { class: 'top-bar-title' }, h('h1', {}, 'Who’s diving?')),
      h('button', { class: 'icon-btn', 'aria-label': 'For grown-ups', title: 'For grown-ups', onclick: nav.guide }, 'ℹ️'),
      muteButton()),
    h('div', { class: 'sprig-bar bands-intro' }, sprig(),
      h('div', { class: 'speech panel' }, h('div', { class: 'speech-name' }, 'Sprig'),
        h('p', { class: 'speech-text' }, 'Tap the group that matches your age. You can visit the others any time from the map.'))),
    h('div', { class: 'bands' }, BANDS.map(card))));

  speak('Who is diving today? Tap the group that matches your age.');
}
