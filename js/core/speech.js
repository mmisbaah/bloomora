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

// Words for the symbols and creatures that show up in prompts, so "3 × 🦀" is read as "3 times crab".
const SAY = {
  '×': ' times ', '−': ' minus ', '→': ' to ', '±': ' plus or minus ', '…': '. ', '✓': '',
  '🐚': ' shell ', '🦀': ' crab ', '🐙': ' octopus ', '🐡': ' pufferfish ', '🦞': ' lobster ', '🐢': ' turtle ',
  '🦑': ' squid ', '🐠': ' fish ', '🐟': ' fish ', '⭐': ' star ', '🪸': ' coral ', '🌿': ' kelp ', '🦐': ' shrimp ',
  '🪼': ' jellyfish ', '🔺': ' triangle ', '🔷': ' diamond ', '🟡': ' yellow circle ', '🟣': ' purple circle ',
  '🟩': ' green square ', '🔶': ' orange diamond ', '💡': '',
};
export function speakable(text) {
  let out = text;
  for (const [sym, word] of Object.entries(SAY)) out = out.split(sym).join(word);
  // Any other emoji: drop it rather than have the voice spell out its name.
  return out.replace(/\p{Extended_Pictographic}\uFE0F?/gu, ' ').replace(/\s+/g, ' ').trim();
}

export function speak(text) {
  if (!readAloudOn() || !text) return;
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(speakable(text));
    u.rate = 0.92;
    u.pitch = 1.15;
    u.lang = S.getState().lang === 'ar' ? 'ar' : 'en';
    synth.speak(u);
  } catch (e) { /* speech is optional */ }
}

export function stopSpeaking() {
  try { synth?.cancel(); } catch (e) { /* ignore */ }
}
