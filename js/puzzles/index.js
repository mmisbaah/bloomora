// Puzzle registry. Each puzzle exports { id, name, prompt(r), say(r), nudge(r), hint(r), mount(root, r, api) }.
// nudge is the first, gentler hint; hint is the fuller one. mount() may return a cleanup function.
// The api gives: locked, correct(note), wrong(note), say(text, kind), showWhy(element).
import build from './build.js';
import predict from './predict.js';
import missing from './missing.js';
import rule from './rule.js';
import oddOne from './oddOne.js';
import shapes from './shapes.js';
import sort from './sort.js';
import balance from './balance.js';
import machine from './machine.js';
import mirror from './mirror.js';
import twins from './twins.js';
import pick from './pick.js';
import sticks from './sticks.js';
import story from './story.js';
import table from './table.js';
import { isArabic, AR_PUZZLES } from '../core/i18n.js';

export const PUZZLES = { build, predict, missing, rule, oddOne, shapes, sort, balance, machine, mirror, twins, pick, sticks, story, table };

// Each puzzle type gets its own icon and colour, so children learn to recognise them at a glance.
export const LOOK = {
  build: { icon: '🪣', color: 'var(--kelp)' },
  predict: { icon: '🔭', color: 'var(--sky)' },
  missing: { icon: '🪨', color: 'var(--sand)' },
  rule: { icon: '🃏', color: 'var(--lilac)' },
  oddOne: { icon: '🔍', color: 'var(--coral)' },
  shapes: { icon: '🎏', color: 'var(--coral)' },
  sort: { icon: '📶', color: 'var(--kelp)' },
  balance: { icon: '⚖️', color: 'var(--sand)' },
  machine: { icon: '⚙️', color: 'var(--sky)' },
  mirror: { icon: '🪞', color: 'var(--lilac)' },
  twins: { icon: '🌊', color: 'var(--sky)' },
  pick: { icon: '🥅', color: 'var(--kelp)' },
  sticks: { icon: '🥢', color: 'var(--sand)' },
  story: { icon: '📖', color: 'var(--lilac)' },
  table: { icon: '📊', color: 'var(--sky)' },
};
// Localised text for a puzzle: Arabic when chosen, otherwise the puzzle's own English.
export const puzzleName = P => (isArabic() && AR_PUZZLES[P.id]?.name) || P.name;
export const puzzlePrompt = (P, r) => (isArabic() && AR_PUZZLES[P.id] ? AR_PUZZLES[P.id].prompt(r) : r.prompt || P.prompt(r));
export const puzzleSay = (P, r) => (isArabic() && AR_PUZZLES[P.id] ? AR_PUZZLES[P.id].say(r) : r.say || P.say(r));

export const lookFor = id => LOOK[id] || { icon: '🧩', color: 'var(--sand)' };
