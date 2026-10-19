// Round templates with their defaults merged in. Each one carries `src` ("world:level:round")
// so a missed puzzle can be found again for practice.
import { WORLDS, findWorld, worldsInBand } from './worlds.js';

export function levelTemplates(world, levelIndex) {
  const level = world.levels[levelIndex];
  return level.rounds.map((r, i) => ({ ...world.defaults, ...level.defaults, ...r, src: `${world.id}:${levelIndex}:${i}` }));
}

// Every regular (non-boss) template in a band, grouped by level in play order.
export function bandTemplatesByLevel(bandId) {
  return worldsInBand(bandId).filter(w => !w.boss).flatMap(w => w.levels.map((_, li) => levelTemplates(w, li)));
}

export function templateFor(src) {
  const [wid, li, ri] = src.split(':');
  const w = findWorld(wid);
  return w?.levels[+li] ? levelTemplates(w, +li)[+ri] || null : null;
}

// "Fives Alive · Rule Card" style label for the grown-ups page.
export function templateLabel(src) {
  const [wid, li] = src.split(':');
  const w = findWorld(wid);
  return w?.levels[+li]?.name || src;
}

export const ALL_TEMPLATES = () => WORLDS.flatMap(w => w.levels.flatMap((_, li) => levelTemplates(w, li)));
