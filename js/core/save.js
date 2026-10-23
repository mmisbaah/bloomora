// Validate device saves and imported backups without trusting arbitrary JSON fields.
const bands = ['minnows', 'turtles', 'dolphins', 'orcas'];
const object = o => o !== null && typeof o === 'object' && !Array.isArray(o);
const count = n => Number.isFinite(n) ? Math.max(0, Math.min(1e9, Math.floor(n))) : 0;
const entries = o => object(o) ? Object.entries(o).filter(([k]) => !['__proto__', 'constructor', 'prototype'].includes(k)).slice(0, 1000) : [];
const records = (o, fn) => Object.fromEntries(entries(o).map(([k, v]) => [k, fn(v)]).filter(([, v]) => v !== null));
const pair = v => object(v) ? { right: count(v.right), wrong: count(v.wrong) } : null;
const flags = o => records(o, v => v ? true : null);
const day = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;

export function cleanSave(o = {}) {
  if (!object(o)) o = {};
  const daily = object(o.daily) ? o.daily : {};
  const owned = Array.isArray(o.owned) ? [...new Set(o.owned.filter(v => typeof v === 'string' && v.length < 80))].slice(0, 100) : [];
  return {
    levels: records(o.levels, v => object(v) && Number.isInteger(v.stars) && v.stars >= 1 && v.stars <= 3 ? { stars: v.stars, score: count(v.score) } : null),
    pearls: Number.isFinite(o.pearls) ? count(o.pearls) : 15,
    band: bands.includes(o.band) ? o.band : null,
    muted: o.muted === true, music: o.music !== false, readAloud: typeof o.readAloud === 'boolean' ? o.readAloud : null,
    relaxed: o.relaxed === true, textSize: o.textSize === 'big' ? 'big' : 'normal', lang: o.lang === 'ar' ? 'ar' : 'en',
    owned, hat: owned.includes(o.hat) ? o.hat : null,
    free: records(o.free, v => object(v) ? { depth: count(v.depth), score: count(v.score) } : null),
    skills: records(o.skills, pair), reasoning: records(o.reasoning, pair),
    objectives: records(o.objectives, v => object(v) ? {
      label: String(v.label || '').slice(0, 120), attempts: count(v.attempts), independent: count(v.independent), helped: count(v.helped), wrong: count(v.wrong),
    } : null),
    tutorials: flags(o.tutorials), storiesSeen: flags(o.storiesSeen),
    review: (Array.isArray(o.review) ? o.review : []).filter(v => object(v) && typeof v.src === 'string' && /^[\w-]+:\d+:\d+$/.test(v.src) && bands.includes(v.band) && Number.isInteger(v.box) && v.box >= 0 && v.box < 4 && Number.isFinite(v.t) && v.t >= 0).slice(-40).map(v => ({ src: v.src, band: v.band, box: v.box, t: v.t })),
    daily: { last: day(daily.last), streak: count(daily.streak), best: count(daily.best), done: records(daily.done, count) },
  };
}
