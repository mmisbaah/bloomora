import { h } from '../core/dom.js';
import * as S from '../core/state.js';
import { ALL_WORLDS, LEVEL_COUNT, MAX_STARS } from '../data/worlds.js';
import { muteButton, pearlStat, confirmBox } from '../ui/widgets.js';
import { pager } from '../ui/pager.js';
import { toast } from '../core/fx.js';

function critterCard(w) {
  const recs = w.levels.map(l => S.levelRecord(l.id));
  const cleared = recs.every(Boolean);
  const perfect = cleared && recs.every(r => r.stars === 3);
  return h('article', { class: `critter panel${cleared ? '' : ' locked'}${perfect ? ' gold' : ''}` },
    h('div', { class: 'critter-emoji', 'aria-hidden': 'true' }, w.reward.emoji),
    h('h3', {}, cleared ? w.reward.name : 'Still hiding'),
    h('p', {}, cleared ? w.reward.line : `Clear ${w.name} to meet this friend.`),
    perfect ? h('span', { class: 'badge' }, 'Golden') : null);
}

export function collectionScreen(app, _params, nav) {
  const cleared = Object.keys(S.getState().levels).length;
  const pages = pager(ALL_WORLDS.map(critterCard), { className: 'critters', label: 'Page' });
  app.append(h('div', { class: 'screen' },
    h('header', { class: 'top-bar' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back to map', onclick: nav.map }, '←'),
      h('div', { class: 'top-bar-title' }, h('h1', {}, 'Collection')),
      h('span', { class: 'stat' }, `${cleared}/${LEVEL_COUNT} levels`),
      h('span', { class: 'stat' }, h('span', { class: 'star-glyph' }, '★'), ` ${S.totalStars()}/${MAX_STARS}`),
      pearlStat(),
      h('button', {
        class: 'icon-btn',
        'aria-label': 'Reset progress',
        title: 'Reset progress',
        onclick: () => confirmBox({
          title: 'Start over?',
          body: 'This clears every star, score and pearl on this device.',
          ok: 'Clear progress',
          cancel: 'Keep it',
          onOk: () => { S.resetProgress(); toast('Progress cleared'); nav.collection(); },
        }),
      }, '♻️'),
      muteButton()),
    pages.el));
  pages.layout();
}
