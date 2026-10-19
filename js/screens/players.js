// "Who's playing?" Each player has their own stars, pearls, streak and practice list.
import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';
import * as S from '../core/state.js';
import { findBand } from '../data/bands.js';
import { PLAYER_EMOJI } from '../data/shop.js';
import { muteButton, openOverlay, closeOverlay, confirmBox } from '../ui/widgets.js';
import { pager } from '../ui/pager.js';

function addPlayerBox(nav) {
  let emoji = PLAYER_EMOJI[S.profiles().length % PLAYER_EMOJI.length];
  const name = h('input', { id: 'player-name', class: 'name-input', type: 'text', maxlength: '16', placeholder: 'Your name', autocomplete: 'off' });
  const picks = h('div', { class: 'emoji-picks', role: 'radiogroup', 'aria-label': 'Pick your sea friend' }, PLAYER_EMOJI.map(e => {
    const b = h('button', { class: `emoji-pick${e === emoji ? ' on' : ''}`, role: 'radio', 'aria-checked': String(e === emoji), 'aria-label': e, onclick: () => {
      emoji = e;
      [...picks.children].forEach(c => { c.classList.toggle('on', c === b); c.setAttribute('aria-checked', String(c === b)); });
      audio.tap();
    } }, e);
    return b;
  }));
  const form = h('form', { class: 'modal panel pop-in', onsubmit: e => {
    e.preventDefault();
    S.addProfile(name.value, emoji);
    closeOverlay();
    audio.bloom();
    nav.title();
  } },
  h('h2', {}, 'New diver'),
  h('label', { for: 'player-name', class: 'eyebrow' }, 'Name'),
  name,
  h('div', { class: 'eyebrow' }, 'Sea friend'),
  picks,
  h('div', { class: 'modal-actions' },
    h('button', { type: 'button', class: 'btn btn--ghost', onclick: closeOverlay }, 'Cancel'),
    h('button', { type: 'submit', class: 'btn' }, 'Add diver')));
  openOverlay(form);
  name.focus();
}

export function playersScreen(app, _params, nav) {
  const current = S.currentProfile().id;
  const cards = S.profiles().map(p => {
    const data = S.peekProfile(p.id);
    const band = data.band ? findBand(data.band) : null;
    return h('div', { class: `player-card panel${p.id === current ? ' current' : ''}` },
      h('button', {
        class: 'player-main',
        'aria-label': `Play as ${p.name}`,
        onclick: () => { S.switchProfile(p.id); audio.bloom(); nav.title(); },
      },
      h('span', { class: 'player-emoji', 'aria-hidden': 'true' }, p.emoji),
      h('span', { class: 'player-name' }, p.name),
      h('span', { class: 'player-meta' }, `★ ${S.totalStars(data)} · ${band ? `${band.emoji} ${band.ages}` : 'new'}`)),
      S.profiles().length > 1 ? h('button', {
        class: 'player-remove',
        'aria-label': `Remove ${p.name}`,
        onclick: () => confirmBox({
          title: `Remove ${p.name}?`,
          body: 'Their stars, pearls and streak on this device will be deleted.',
          ok: 'Remove', cancel: 'Keep',
          onOk: () => { S.removeProfile(p.id); nav.players(); },
        }),
      }, '✕') : null);
  });
  if (S.canAddProfile()) {
    cards.push(h('button', { class: 'player-card player-add panel', onclick: () => addPlayerBox(nav) },
      h('span', { class: 'player-emoji', 'aria-hidden': 'true' }, '➕'),
      h('span', { class: 'player-name' }, 'Add a diver')));
  }
  const pages = pager(cards, { className: 'players', label: 'Page' });
  app.append(h('div', { class: 'screen' },
    h('header', { class: 'top-bar' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back to title', onclick: nav.title }, '←'),
      h('div', { class: 'top-bar-title' }, h('h1', {}, 'Who’s playing?')),
      muteButton()),
    pages.el));
  pages.layout();
}
