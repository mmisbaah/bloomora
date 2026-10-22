// Progress codes: a player's progress packed into a short text code. A parent can move a child
// to another device with it, and a teacher can paste several codes to see a class summary.
// Nothing leaves the device unless someone copies the code; there is no server.
const PREFIX = 'BLOOM1-';

const toB64 = text => btoa(String.fromCharCode(...new TextEncoder().encode(text))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = code => new TextDecoder().decode(Uint8Array.from(atob(code.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));

export function encodeProgress(profile, data) {
  const levels = Object.fromEntries(Object.entries(data.levels).map(([id, r]) => [id, r.stars]));
  const skills = Object.fromEntries(Object.entries(data.skills || {}).map(([t, k]) => [t, [k.right, k.wrong]]));
  return PREFIX + toB64(JSON.stringify({ n: profile.name, e: profile.emoji, b: data.band, p: data.pearls, l: levels, s: skills, d: data.daily?.best || 0 }));
}

export function decodeProgress(code) {
  const text = String(code).trim();
  if (!text.startsWith(PREFIX)) return null;
  try {
    const o = JSON.parse(fromB64(text.slice(PREFIX.length)));
    if (typeof o !== 'object' || !o.l) return null;
    return {
      name: String(o.n || 'Diver').slice(0, 16),
      emoji: typeof o.e === 'string' ? o.e.slice(0, 4) : '🐠',
      band: o.b || null,
      pearls: Number.isFinite(o.p) ? o.p : 0,
      bestStreak: Number.isFinite(o.d) ? o.d : 0,
      levels: Object.fromEntries(Object.entries(o.l).filter(([, v]) => v >= 1 && v <= 3).map(([id, stars]) => [id, { stars, score: 0 }])),
      skills: Object.fromEntries(Object.entries(o.s || {}).map(([t, [right, wrong]]) => [t, { right: +right || 0, wrong: +wrong || 0 }])),
    };
  } catch (e) {
    return null;
  }
}
