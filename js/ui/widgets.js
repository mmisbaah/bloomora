// Small shared UI pieces: Sprig, the pearl counter, and modal overlays.
import { h } from '../core/dom.js';
import * as S from '../core/state.js';
import { findHat } from '../data/shop.js';
import { sprigArt } from './art.js';

export function sprig(size = '', mood = 'calm') {
  const hat = findHat(S.getState().hat);
  return h('div', { class: `sprig ${size}${hat ? ' has-hat' : ''}`, 'aria-hidden': 'true' },
    sprigArt(mood),
    hat ? h('span', { class: 'sprig-hat' }, hat.emoji) : null);
}

// Change Sprig's face: calm, happy, oops or think.
export function setMood(sprigEl, mood) {
  const art = sprigEl?.querySelector('.sprig-art');
  if (art) art.dataset.mood = mood;
}

export function pearlStat() {
  return h('div', { class: 'stat', 'aria-label': `${S.getState().pearls} pearls` }, h('i', { class: 'pearl' }), S.getState().pearls);
}

let closeCurrent = null;

export function openOverlay(content) {
  closeOverlay();
  const el = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true' }, content);
  document.body.append(el);
  // Short screens: shrink the pop-up rather than let its buttons fall off the bottom.
  const box = el.firstElementChild;
  const room = el.clientHeight - 16;
  if (box && box.offsetHeight > room) {
    box.style.scale = String(Math.max(0.7, room / box.offsetHeight));
  }
  el.querySelector('.btn:last-of-type, button')?.focus({ preventScroll: true });
  closeCurrent = () => el.remove();
}

export function closeOverlay() {
  closeCurrent?.();
  closeCurrent = null;
}

// In-page confirm (the viewer blocks window.confirm).
export function confirmBox({ title, body, ok, cancel = 'Cancel', onOk }) {
  openOverlay(h('div', { class: 'modal panel pop-in' },
    h('h2', {}, title),
    h('p', {}, body),
    h('div', { class: 'modal-actions' },
      h('button', { class: 'btn btn--ghost', onclick: closeOverlay }, cancel),
      h('button', { class: 'btn', onclick: () => { closeOverlay(); onOk(); } }, ok))));
}
