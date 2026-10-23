// The one settings menu (⚙️). Keeps the top bars short: sound, music, read-aloud, text size,
// "show me how" and leaving a level all live here instead of in separate icons.
import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';
import * as S from '../core/state.js';
import { canSpeak, readAloudOn, stopSpeaking } from '../core/speech.js';
import { openOverlay, closeOverlay } from './widgets.js';
import { t, LANGS, lang, applyLang } from '../core/i18n.js';

export function applyTextSize() {
  document.documentElement.style.fontSize = S.getState().textSize === 'big' ? '115%' : '';
}

function toggleRow(label, on, flip) {
  const b = h('button', { class: `setting-toggle${on ? ' on' : ''}`, role: 'switch', 'aria-checked': String(on), onclick: () => {
    const now = flip();
    b.classList.toggle('on', now);
    b.setAttribute('aria-checked', String(now));
    b.lastChild.textContent = now ? t('On') : t('Off');
  } }, h('span', { class: 'setting-label' }, label), h('span', { class: 'setting-state' }, on ? t('On') : t('Off')));
  return b;
}

// Language picker: one button per language. Changing it redraws the current screen.
function langRow() {
  return h('div', { class: 'setting-toggle setting-lang', role: 'group', 'aria-label': t('Language') },
    h('span', { class: 'setting-label' }, `🌐 ${t('Language')}`),
    h('span', { class: 'lang-picks' }, LANGS.map(l => h('button', {
      class: `lang-pick${l.id === lang() ? ' on' : ''}`, lang: l.id, 'aria-pressed': String(l.id === lang()),
      onclick: () => {
        if (l.id === lang()) return;
        S.setPref('lang', l.id);
        applyLang();
        closeOverlay();
        window.dispatchEvent(new Event('bloomora:lang'));
      },
    }, l.name))));
}

export function openSettings({ onLeave, onShowMe, onGuide } = {}) {
  const st = S.getState();
  const rows = [
    toggleRow(`🔊 ${t('Sound effects')}`, !st.muted, () => {
      const muted = !S.getState().muted;
      S.setMuted(muted);
      audio.muted = muted;
      if (muted) audio.stopMusic(); else if (S.getState().music) audio.startMusic();
      return !muted;
    }),
    toggleRow(`🎵 ${t('Music')}`, st.music, () => {
      const on = !S.getState().music;
      S.setPref('music', on);
      if (on && !S.getState().muted) audio.startMusic(); else audio.stopMusic();
      return on;
    }),
    canSpeak() ? toggleRow(`🗣️ ${t('Read aloud')}`, readAloudOn(), () => {
      const on = !readAloudOn();
      S.setReadAloud(on);
      if (!on) stopSpeaking();
      return on;
    }) : null,
    toggleRow(`🔠 ${t('Big text')}`, st.textSize === 'big', () => {
      const big = S.getState().textSize !== 'big';
      S.setPref('textSize', big ? 'big' : 'normal');
      applyTextSize();
      return big;
    }),
    toggleRow(`🌿 ${t('Relaxed mode')}`, !!st.relaxed, () => {
      const on = !S.getState().relaxed;
      S.setPref('relaxed', on);
      window.dispatchEvent(new Event('bloomora:play-options'));
      return on;
    }),
    langRow(),
  ];
  openOverlay(h('div', { class: 'modal panel pop-in settings' },
    h('h2', {}, t('Settings')),
    h('p', { class: 'settings-note' }, t('Relaxed mode removes hearts and the clock. Help is always free.')),
    h('div', { class: 'settings-rows' }, rows),
    h('div', { class: 'modal-actions' },
      onGuide ? h('button', { class: 'btn btn--ghost btn--small', onclick: () => { closeOverlay(); onGuide(); } }, `ℹ️ ${t('For grown-ups')}`) : null,
      onShowMe ? h('button', { class: 'btn btn--sand btn--small', onclick: () => { closeOverlay(); onShowMe(); } }, `👆 ${t('Show me how')}`) : null,
      onLeave ? h('button', { class: 'btn btn--ghost btn--small', onclick: () => { closeOverlay(); onLeave(); } }, `🚪 ${t('Leave level')}`) : null,
      h('button', { class: 'btn btn--small', onclick: closeOverlay }, t('Done')))));
}

export function settingsButton(opts = {}) {
  return h('button', { class: 'icon-btn', 'aria-label': 'Settings', title: 'Settings', onclick: () => { audio.tap(); openSettings(opts); } }, '⚙️');
}
