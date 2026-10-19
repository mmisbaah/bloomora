// Read-aloud for early readers, using the browser's built-in speech synthesis when it exists.
import * as S from './state.js';
import { findBand } from '../data/bands.js';

const synth = window.speechSynthesis;

export const canSpeak = () => !!synth && typeof window.SpeechSynthesisUtterance === 'function';

export function readAloudOn() {
  const st = S.getState();
  if (st.muted || !canSpeak()) return false;
  return st.readAloud ?? findBand(st.band).settings.readAloud;
}

export function speak(text) {
  if (!readAloudOn() || !text) return;
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.pitch = 1.15;
    synth.speak(u);
  } catch (e) { /* speech is optional */ }
}

export function stopSpeaking() {
  try { synth?.cancel(); } catch (e) { /* ignore */ }
}
