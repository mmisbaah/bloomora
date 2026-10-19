// Small shared UI pieces: Sprig, the sound toggle, and modal overlays.
import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';
import * as S from '../core/state.js';
import { canSpeak, readAloudOn, stopSpeaking } from '../core/speech.js';

export function sprig(size = '') {
  return h('div', { class: `sprig ${size}`, 'aria-hidden': 'true' },
    h('span', { class: 'sprig-leaf' }),
    h('span', { class: 'sprig-eye l' }),
    h('span', { class: 'sprig-eye r' }),
    h('span', { class: 'sprig-mouth' }));
}

export function muteButton() {
  const b = h('button', {
    class: 'icon-btn',
    onclick() {
      const muted = !S.getState().muted;
      S.setMuted(muted);
      audio.muted = muted;
      update();
      if (!muted) audio.tap();
    },
  });
  function update() {
    const muted = S.getState().muted;
    b.textContent = muted ? '🔇' : '🔊';
    b.setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
  }
  update();
  return b;
}

// Toggle for read-aloud. Hidden when the browser has no speech synthesis.
export function readAloudButton(onChange = () => {}) {
  if (!canSpeak()) return null;
  const b = h('button', {
    class: 'icon-btn',
    onclick() {
      const on = !readAloudOn();
      S.setReadAloud(on);
      if (!on) stopSpeaking();
      update();
      onChange(on);
    },
  });
  function update() {
    const on = readAloudOn();
    b.textContent = on ? '🗣️' : '🤐';
    b.setAttribute('aria-label', on ? 'Turn read-aloud off' : 'Turn read-aloud on');
    b.setAttribute('aria-pressed', String(on));
  }
  update();
  return b;
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
