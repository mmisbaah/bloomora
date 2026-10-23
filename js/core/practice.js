import { skillFor } from './skills.js';

// Prefer weaker objectives and overdue reviews, with different objectives before repeats.
export function practiceTemplates(due, templateFor, byLevel, levels, objectives, rng, limit = 3) {
  const rows = due.map(item => ({ item, template: templateFor(item.src) })).filter(row => row.template);
  const accuracy = key => { const s = objectives[key]; return s ? s.independent / Math.max(1, s.attempts) : 0; };
  rows.sort((a, b) => accuracy(skillFor(a.template)) - accuracy(skillFor(b.template)) || a.item.box - b.item.box || a.item.t - b.item.t);
  const seen = new Set(), chosen = [];
  for (const unique of [true, false]) for (const row of rows) {
    if (chosen.includes(row) || chosen.length >= limit) continue;
    const key = skillFor(row.template);
    if (unique && seen.has(key)) continue;
    chosen.push(row); seen.add(key);
  }
  const pool = byLevel.flat();
  return chosen.map(({ item, template }) => {
    const candidates = pool.filter(r => {
      return skillFor(r) === skillFor(template) && (r.src === item.src || levels[r.levelId]);
    });
    // Source stays attached even when a different presentation practises the same skill.
    const choice = candidates.length ? candidates[Math.floor(rng() * candidates.length)] : template;
    return { ...choice, reviewSrc: item.src };
  });
}
