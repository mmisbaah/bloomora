import { h } from '../core/dom.js';
import * as S from '../core/state.js';
import { ALL_WORLDS, LEVEL_COUNT, MAX_STARS } from '../data/worlds.js';
import {pearlStat, confirmBox } from '../ui/widgets.js';
import { settingsButton } from '../ui/settings.js';
import { pager } from '../ui/pager.js';
import { toast } from '../core/fx.js';
import { pic } from '../ui/art.js';
import { audio } from '../core/audio.js';
import { t } from '../core/i18n.js';

function critterCard(w) {
  const recs = w.levels.map(l => S.levelRecord(l.id));
  const cleared = recs.every(Boolean);
  const perfect = cleared && recs.every(r => r.stars === 3);
  let visits = 0;
  const reply = h('p', { class: 'friend-reply', role: 'status' });
  const portrait = h('div', { class: 'critter-emoji' }, pic(w.reward.emoji));
  return h('article', { class: `critter panel${cleared ? '' : ' locked'}${perfect ? ' gold' : ''}` },
    portrait,
    h('h3', {}, cleared ? w.reward.name : 'Still hiding'),
    h('p', {}, cleared ? w.reward.line : `Clear ${w.name} to meet this friend.`),
    perfect ? h('span', { class: 'badge' }, 'Golden') : null,
    cleared ? h('button', { class: 'btn btn--small btn--ghost', onclick: () => {
      visits++;
      audio.bubble();
      portrait.classList.remove('friend-wave');
      void portrait.offsetWidth;
      portrait.classList.add('friend-wave');
      reply.textContent = visits % 2 ? `${w.reward.name}: ${w.reward.line}` : t('Your patterns brought my home back to life. Thank you!');
    } }, t('Say hello')) : null,
    reply);
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
      settingsButton()),
    pages.el));
  pages.layout();
}
