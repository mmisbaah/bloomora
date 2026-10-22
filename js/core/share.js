// Complete versioned backups. Older BLOOM1 summary codes remain readable.
import { cleanSave } from './save.js';
const toB64 = text => {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = code => new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(code.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));

export function encodeProgress(profile, data) {
  return 'BLOOM2-' + toB64(JSON.stringify({ version: 2, name: profile.name, emoji: profile.emoji, state: cleanSave(data) }));
}

export function decodeProgress(code) {
  const text = String(code).trim();
  if (text.length > 250000 || !/^BLOOM[12]-[A-Za-z0-9_-]+$/.test(text)) return null;
  try {
    const o = JSON.parse(fromB64(text.slice(7)));
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    let save, name, emoji;
    if (text.startsWith('BLOOM2-')) {
      if (o.version !== 2 || !o.state || typeof o.state !== 'object' || Array.isArray(o.state) || !o.state.levels || typeof o.name !== 'string') return null;
      save = cleanSave(o.state); name = o.name; emoji = o.emoji;
    } else {
      if (!o.l || typeof o.l !== 'object' || Array.isArray(o.l)) return null;
      save = cleanSave({ band: o.b, pearls: o.p,
        levels: Object.fromEntries(Object.entries(o.l).map(([id, stars]) => [id, { stars, score: 0 }])),
        skills: Object.fromEntries(Object.entries(o.s || {}).filter(([, v]) => Array.isArray(v)).map(([key, [right, wrong]]) => [key, { right, wrong }])),
        daily: { best: o.d },
      });
      name = o.n; emoji = o.e;
    }
    return { ...save, name: String(name || 'Diver').slice(0, 16), emoji: typeof emoji === 'string' ? emoji.slice(0, 8) : '🐠', bestStreak: save.daily.best };
  } catch (e) {
    return null;
  }
}
