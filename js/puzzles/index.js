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

export const PUZZLES = { build, predict, missing, rule, oddOne, shapes, sort, balance, machine, mirror, twins, pick };
