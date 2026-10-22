import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';
import * as S from '../core/state.js';
import { BANDS, findBand } from '../data/bands.js';
import { LEVEL_COUNT, MAX_STARS } from '../data/worlds.js';
import { PUZZLES } from '../puzzles/index.js';
import {sprig } from '../ui/widgets.js';
import { settingsButton } from '../ui/settings.js';
import { t } from '../core/i18n.js';
import { puzzleName } from '../puzzles/index.js';

export function titleScreen(app, _params, nav) {
  const st = S.getState();
  const stars = S.totalStars();
  const band = st.band ? findBand(st.band) : null;
  const go = () => {
    audio.bloom();
    if (band) nav.map();
    else nav.bands();
  };

  app.append(h('div', { class: 'screen title-screen' },
    h('div', { class: 'title-top' },
      h('button', { class: 'btn btn--ghost btn--small player-chip', 'aria-label': `Playing as ${S.currentProfile().name}. Change player`, onclick: nav.players },
        `${S.currentProfile().emoji} ${S.currentProfile().name}`),
      h('span', { class: 'title-top-gap' }),
      h('button', { class: 'btn btn--ghost btn--small', onclick: nav.guide }, t('For grown-ups')),
      settingsButton()),
    h('div', { class: 'title-hero' },
      sprig('big'),
      h('div', {},
        h('h1', { class: 'logo', 'aria-label': 'Bloomora' },
          [...'Bloomora'].map((ch, i) => h('span', { 'aria-hidden': 'true', style: { animationDelay: `${i * 90}ms` } }, ch))),
        h('p', { class: 'logo-sub' }, t('The Sunken Lagoon'))),
      h('p', { class: 'tagline' }, t('The lagoon has gone quiet. Help Sprig the lantern sprout find the hidden patterns and wake the reef back up.')),
      h('div', { class: 'title-actions' },
        h('button', { class: 'btn btn--big', onclick: go }, stars ? t('Continue') : t('Play')),
        h('button', { class: 'btn btn--ghost', onclick: nav.collection }, t('Collection'))),
      band
        ? h('p', { class: 'title-band' }, t('Diving as {band} (ages {ages}) · ', { band: `${band.emoji} ${band.name}`, ages: band.ages }),
          h('button', { class: 'link-btn', onclick: nav.bands }, t('change')))
        : null,
      h('div', { class: 'title-facts' },
        h('span', { class: 'stat' }, t('{n} age bands', { n: BANDS.length })),
        h('span', { class: 'stat' }, t('{n} levels', { n: LEVEL_COUNT })),
        h('span', { class: 'stat' }, h('span', { class: 'star-glyph' }, '★'), ` ${stars} / ${MAX_STARS}`)),
      h('ul', { class: 'title-types', 'aria-label': 'Kinds of puzzle' },
        Object.values(PUZZLES).map(p => h('li', { class: 'chip' }, puzzleName(p)))))));
}
