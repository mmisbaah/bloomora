// Random problem generation. Level data rounds are templates: vary() returns a fresh round of the
// same type and skill (same step size, same equation shape, same mirror size, same pattern
// structure) with new numbers, positions, creatures and pictures. Every candidate is checked
// against limits taken from the template and the age band, and the template itself is the
// fallback, so a generated round is never harder than its band allows.
import { seqFn, pickTest } from './sequences.js';

// Difficulty nudge for the round being generated: -1 gentler, 0 as designed, +1 harder.
// Set by vary() for each call so the helpers below can read it.
let EASE = 0;

// Seeded PRNG (mulberry32) so a whole level can be reproduced from one number.
export function makeRng(seed = (Date.now() ^ Math.floor(Math.random() * 2 ** 31)) >>> 0) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.seed = seed;
  return next;
}

const int = (R, lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
const pickR = (R, arr) => arr[Math.floor(R() * arr.length)];
function shuffleR(R, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Largest number a band may show. Countable drawings have their own limits (see core/render.js).
const BAND_CAP = { minnows: 100, turtles: 1000, dolphins: 1000, orcas: 10000 };
const STYLE_CAP = { count: 20, groups: 40, squares: 100, triangle: 45 };
// Stones (missing, oddOne) show plain numbers, so only rounds that draw pools use the drawing limits.
const DRAWS = new Set(['build', 'predict', 'rule']);
const capFor = (r, band) => (DRAWS.has(r.type) && STYLE_CAP[r.style]) || BAND_CAP[band] || 1000;
// How far numbers may grow past the template. Builds cost one press per step, so they grow least.
const GROWTH = { build: 1.6, predict: 2.5, rule: 2.5, missing: 2.5, oddOne: 2.5, story: 2.5, table: 2.5 };

// ---------- Sequence rounds: build, predict, missing, oddOne, rule ----------

// First and last pool a round shows or asks about.
function span(r) {
  switch (r.type) {
    case 'build': return [r.from, r.from + r.show];
    case 'predict': case 'story': case 'table': return [r.from, r.ask];
    case 'rule': return [r.from, r.from + r.show - 1];
    default: return [r.from, r.from + r.count - 1]; // missing, oddOne
  }
}

function values(f, [lo, hi]) {
  const out = [];
  for (let n = lo; n <= hi; n++) out.push(f(n));
  return out;
}

// A new sequence of the same kind and step. Pure multiples (3, 6, 9 …) keep their rule and slide
// along the beach instead; offset patterns (2, 5, 8 …) get a new start that stays off the multiples.
function newSeq(s, r, R) {
  if (r.cards) return s; // hand-written rule cards name this exact rule
  if (s.kind === 'arith') {
    const d = s.d, ad = Math.abs(d);
    if (d > 0 && s.a === d) return s;
    if (s.a % ad === 0) {
      const k = s.a / ad;
      return { ...s, a: ad * int(R, Math.max(1, k - 3), k + 3) };
    }
    let a;
    do { a = int(R, Math.max(1, s.a - 4), s.a + 6); } while (a % ad === 0);
    return { ...s, a };
  }
  if (s.kind === 'geo') return { ...s, a: int(R, 1, Math.max(2, s.a + 2)) };
  return s;
}

function slides(s) {
  return s.kind !== 'arith' && s.kind !== 'geo' ? true : s.kind === 'arith' && s.d > 0 && s.a === s.d;
}

function place(c, r, R) {
  // Hand-written cards use n-formulas, which hold for any starting pool.
  if (slides(c.seq) || c.cards || c.nth) c.from = int(R, 1, r.from + 3);
  if (c.type === 'predict' || c.type === 'story' || c.type === 'table') {
    const jump = r.ask - (r.from + r.show - 1);
    const lo = EASE < 0 ? Math.max(1, jump - 2) : EASE > 0 ? jump : Math.max(1, jump - 1);
    const hi = EASE < 0 ? Math.max(1, jump - 1) : EASE > 0 ? jump + 2 : jump + 1;
    c.ask = c.from + c.show - 1 + int(R, lo, hi);
  }
  if (c.type === 'missing') c.gap = int(R, c.from + 1, c.from + c.count - 2);
}

// Pick a wrong value for one stone that can't be mistaken for any real stone.
function brokenStone(c, f, R) {
  const at = int(R, c.from + 2, c.from + c.count - 1);
  const real = f(at);
  const shown = values(f, span(c));
  const jump = Math.abs(real - f(at - 1)) || 1;
  const sizes = [...new Set([1, 2, 3, Math.ceil(jump / 2)])];
  const options = sizes.flatMap(k => [real + k, real - k]).filter(v => (c.negative || v >= 1) && !shown.includes(v));
  return options.length ? { at, value: pickR(R, options) } : null;
}

function buildFits(c, f, r) {
  const mode = c.mode || 'one';
  const t = c.from + c.show, t0 = r.from + r.show;
  const target = f(t), target0 = seqFn(r.seq)(t0);
  if (mode === 'one') return target <= Math.max(10, target0 + 3);
  if (mode === 'group') {
    const d = c.group || c.seq.d;
    return target % d === 0 && target / d <= Math.max(6, target0 / d + 2);
  }
  return t <= Math.min(8, t0 + 3); // border / row: presses = pool number
}

function varySeq(r, R, band) {
  const f0 = seqFn(r.seq);
  const vals0 = values(f0, span(r));
  const max0 = Math.max(...vals0.map(Math.abs));
  const step = r.seq.kind === 'arith' ? Math.abs(r.seq.d) : 0;
  // Gentler rounds never grow past the template; harder ones may grow further.
  const growth = EASE < 0 ? 1 : EASE > 0 ? GROWTH[r.type] * 1.4 : GROWTH[r.type];
  const extra = EASE < 0 ? 0 : 3 * step;
  const cap = Math.min(Math.max(max0 * growth, max0 + extra), Math.max(capFor(r, band), max0));

  // Collect distinct valid candidates, then pick one evenly, so tight templates still alternate.
  const found = new Map();
  for (let tries = 0; tries < 60; tries++) {
    const c = { ...r, seq: newSeq(r.seq, r, R) };
    place(c, r, R);
    const f = seqFn(c.seq);
    const vals = values(f, span(c));
    if (vals.some(v => !Number.isInteger(v) || (!c.negative && v < 1)) || Math.max(...vals.map(Math.abs)) > cap) continue;
    if (c.negative && !vals.some(v => v < 0)) continue; // a "below zero" round must actually go below zero
    if (c.type === 'build' && !buildFits(c, f, r)) continue;
    if (c.type === 'oddOne') {
      c.bad = brokenStone(c, f, R);
      if (!c.bad) continue;
    }
    found.set(JSON.stringify(c), c);
    if (found.size >= 12) break;
  }
  return reskin(found.size ? pickR(R, [...found.values()]) : r, R);
}

// Countable pools get a random sea creature, but only when the level uses a plain item name
// (a level about "starfish arms" keeps its starfish).
const ITEMS = [
  ['🐚', 'shell', 'shells'], ['⭐', 'starfish', 'starfish'], ['🐠', 'fish', 'fish'], ['🦀', 'crab', 'crabs'],
  ['🪸', 'coral', 'corals'], ['🌸', 'anemone', 'anemones'], ['🌿', 'kelp leaf', 'kelp leaves'], ['🐢', 'turtle', 'turtles'],
];
function reskin(c, R) {
  if (c.style !== 'count' && c.style !== 'groups') return c;
  if (!ITEMS.some(([e, one]) => e === c.item && one === c.itemName)) return c;
  const [item, itemName, itemPlural] = pickR(R, ITEMS);
  return { ...c, item, itemName, itemPlural };
}

// ---------- Pattern parade ----------

const CREATURES = ['🐚', '🐠', '🐡', '🦀', '⭐', '🐙', '🦑', '🐢', '🦐', '🪼', '🐳', '🦞'];
const SHAPES = ['🔺', '🔷', '🟡', '🟣', '🟩', '🔶'];

function varyShapes(r, R) {
  // Same structure (AB, AAB, ABC …), new pieces. Difficulty depends on structure, not on which emoji.
  const distinct = [...new Set(r.unit)];
  const pool = distinct.every(s => SHAPES.includes(s)) ? SHAPES : CREATURES;
  const picks = shuffleR(R, pool).slice(0, distinct.length);
  const map = Object.fromEntries(distinct.map((s, i) => [s, picks[i]]));
  const len = r.unit.length;
  return {
    ...r,
    unit: r.unit.map(s => map[s]),
    shown: int(R, Math.max(len + 2, r.shown - 2), r.shown + 2),
  };
}

// ---------- Line-up ----------

function varySort(r, R, band) {
  const n = r.values.length;
  const isCube = v => Math.round(Math.cbrt(v)) ** 3 === v;
  let pool;
  if (r.values.every(isCube)) {
    pool = [1, 2, 3, 4, 5, 6, 7].map(k => k ** 3);
  } else {
    const g = r.values.reduce(gcd);
    const lo = Math.max(1, Math.floor(Math.min(...r.values) * 0.6));
    const hi = Math.min(Math.max(Math.max(...r.values) + g * 2, Math.ceil(Math.max(...r.values) * 1.3)),
      Math.max(band === 'minnows' ? 20 : 1000, Math.max(...r.values)));
    pool = [];
    for (let v = Math.ceil(lo / g) * g; v <= hi; v += g) pool.push(v);
  }
  if (pool.length < n) return r;
  return { ...r, values: shuffleR(R, pool).slice(0, n) };
}

// ---------- Balance scales ----------

const CRITTERS = ['🦀', '🐙', '🐡', '🦞', '🐢', '🦑'];

function varyBalance(r, R, band) {
  // Keep the equation's shape: the same number of creatures on each side, and loose shells
  // only where the template had them. One-step stays one-step, both-sides stays both-sides.
  const { left: L, right: Rt } = r;
  const base = band === 'turtles' ? 10 : 12;
  const wMax = EASE < 0 ? Math.min(base, 6) : EASE > 0 ? base + 3 : base;
  for (let tries = 0; tries < 40; tries++) {
    const w = int(R, 2, wMax);
    const lk = L.k ? int(R, 1, 9) : 0;
    const rk = L.x * w + lk - Rt.x * w;
    if (rk <= lk || rk > 80) continue;
    const c = { ...r, critter: pickR(R, CRITTERS), left: { x: L.x, k: lk }, right: { x: Rt.x, k: rk } };
    if (!same(c.left, L) || !same(c.right, Rt)) return c;
  }
  return r;
}

// ---------- Current machines ----------

function varyMachine(r, R) {
  // The multiplier stays (a "×3 machine" level keeps ×3); the add-on and the numbers change.
  const f0 = x => r.m * x + r.b;
  const cap = Math.max(f0(r.ask) * 1.3, 30);
  const lo = Math.min(...r.examples) === 0 ? 0 : 1;
  for (let tries = 0; tries < 40; tries++) {
    const b = r.b === 0 ? 0 : Math.sign(r.b) * int(R, 1, Math.max(5, Math.abs(r.b) + 3));
    const inputs = shuffleR(R, [0, 1, 2, 3, 4, 5, 6, 7].filter(x => x >= lo)).slice(0, 3).sort((x, y) => x - y);
    const ask = EASE < 0 ? int(R, inputs[2] + 1, inputs[2] + 3) : EASE > 0 ? int(R, inputs[2] + 4, inputs[2] + 10) : int(R, inputs[2] + 2, inputs[2] + 7);
    const f = x => r.m * x + b;
    if ([...inputs, ask].some(x => f(x) < 1) || f(ask) > cap) continue;
    return { ...r, b, examples: inputs, ask };
  }
  return r;
}

// ---------- Mirror pool ----------

function varyMirror(r, R) {
  // Grow a connected blob of the same size as the template's picture, touching the mirror line.
  const rows = r.pattern.length, cols = r.pattern[0].length;
  const target = r.pattern.join('').split('#').length - 1;
  const axis = r.axis || 'v';
  for (let tries = 0; tries < 30; tries++) {
    const on = new Set();
    const key = (y, x) => `${y},${x}`;
    // Seed on the edge next to the line so the reflection meets it.
    const seed = axis === 'v' ? [int(R, 0, rows - 1), cols - 1] : [rows - 1, int(R, 0, cols - 1)];
    on.add(key(...seed));
    let guard = 0;
    while (on.size < target && guard++ < 500) {
      const [y, x] = pickR(R, [...on]).split(',').map(Number);
      const [dy, dx] = pickR(R, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]);
      const ny = y + dy, nx = x + dx;
      if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) on.add(key(ny, nx));
    }
    const pattern = Array.from({ length: rows }, (_, y) =>
      Array.from({ length: cols }, (_, x) => (on.has(key(y, x)) ? '#' : '.')).join(''));
    if (!same(pattern, r.pattern)) return { ...r, pattern };
  }
  return r;
}

// ---------- Twin currents (comparing two patterns) ----------

function varyTwins(r, R, band) {
  // Two "add" rules from 0, one a whole-number multiple of the other (Common Core 5.OA.B.3).
  const aMax = band === 'orcas' ? 7 : 5;
  const ks = r.ks || [2, 3];
  for (let tries = 0; tries < 20; tries++) {
    const c = { ...r, a: int(R, 1, aMax), k: pickR(R, ks) };
    if (!same(c, r)) return c;
  }
  return r;
}

// ---------- Pick (odd / even / multiples) ----------

function varyPick(r, R) {
  const test = pickTest(r.rule, r.k);
  const lo = r.min || 1;
  const pool = [];
  for (let v = lo; v <= r.max; v++) pool.push(v);
  for (let tries = 0; tries < 50; tries++) {
    const values = shuffleR(R, pool).slice(0, r.count);
    const hits = values.filter(test).length;
    if (hits >= 2 && hits <= r.count - 2) return { ...r, values };
  }
  return r;
}

// ---------- Stick shapes and stories ----------

function varySticks(r, R) {
  // The shape stays; how far ahead the question asks moves with the difficulty.
  const near = r.show + 1;
  const lo = EASE < 0 ? near : Math.max(near, r.ask - 1);
  const hi = EASE < 0 ? Math.max(near, r.ask - 1) : EASE > 0 ? r.ask + 3 : r.ask + 1;
  return { ...r, ask: int(R, lo, hi) };
}

const NAMES = ['Mia', 'Omar', 'Lena', 'Kai', 'Zara', 'Leo', 'Aya', 'Sam', 'Noor', 'Theo', 'Ivy', 'Yusuf'];
function varyStory(r, R, band) {
  return { ...varySeq(r, R, band), name: pickR(R, NAMES) };
}

// ---------- Registry ----------

const VARY = {
  build: varySeq, predict: varySeq, missing: varySeq, oddOne: varySeq, rule: varySeq,
  shapes: varyShapes, sort: varySort, balance: varyBalance, machine: varyMachine, mirror: varyMirror,
  twins: varyTwins, pick: varyPick, sticks: varySticks, story: varyStory, table: varySeq,
};

export function vary(round, R, band, { ease = 0 } = {}) {
  const fn = VARY[round.type];
  if (!fn || round.fixed) return round;
  EASE = ease;
  try {
    return fn(round, R, band);
  } catch (e) {
    console.warn('Could not vary round, using template', e);
    return round;
  }
}
