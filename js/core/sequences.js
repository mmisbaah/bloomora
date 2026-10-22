// Number patterns. Every answer in the game is computed from these, so level data can't drift
// out of sync with the math. Terms are 1-based: term(n) is the value in Pool n.

export function seqFn(s) {
  switch (s.kind) {
    case 'arith': return n => s.a + s.d * (n - 1);
    case 'geo': return n => s.a * s.r ** (n - 1);
    case 'square': return n => n * n;
    case 'cube': return n => n * n * n;
    case 'tri': return n => (n * (n + 1)) / 2;
    case 'fib': return n => {
      let x = 1, y = 1;
      for (let i = 1; i < n; i++) [x, y] = [y, x + y];
      return x;
    };
    default: throw new Error(`Unknown sequence kind: ${s.kind}`);
  }
}

export function hintFor(s) {
  switch (s.kind) {
    case 'arith':
      if (s.format) return s.d > 0 ? `Each step adds ${fmtJump(s.d, s.format)}.` : `Each step takes away ${fmtJump(-s.d, s.format)}.`;
      return s.d > 0 ? `Each pool adds ${s.d}.` : `Each pool takes away ${-s.d}.`;
    case 'geo': return `Each pool is ${s.r} times the one before.`;
    case 'square': return 'Pool n is an n × n square. Pool 4 is 4 × 4 = 16.';
    case 'cube': return 'Pool n is an n × n × n cube. Pool 2 is 2 × 2 × 2 = 8.';
    case 'tri': return 'Each pool adds a new row one longer than the last: +2, +3, +4, +5…';
    case 'fib': return 'Add the two pools before to get the next one, like 3 + 5 = 8.';
    default: return 'Look at how each pool changes.';
  }
}

export function ruleCards(s) {
  switch (s.kind) {
    case 'arith': {
      const d = s.d, ad = Math.abs(d);
      return [
        { text: d > 0 ? `Add ${d} each time` : `Take away ${ad} each time`, correct: true },
        { text: d > 0 ? `Add ${d + 1} each time` : `Take away ${ad + 1} each time`, correct: false },
        { text: 'Double the number each time', correct: false },
        { text: d > 0 ? `Take away ${d} each time` : `Add ${ad} each time`, correct: false },
      ];
    }
    case 'geo': {
      const firstJump = s.a * s.r - s.a;
      return dedupe([
        { text: `Multiply by ${s.r} each time`, correct: true },
        { text: `Add ${firstJump} each time`, correct: false },
        { text: `Multiply by ${s.r + 1} each time`, correct: false },
        { text: `Add ${s.r} each time`, correct: false },
      ]);
    }
    case 'square':
      return [
        { text: 'Pool n is an n × n square', correct: true },
        { text: 'Add 3 tiles each time', correct: false },
        { text: 'Pool n has n × 2 tiles', correct: false },
        { text: 'Double the tiles each time', correct: false },
      ];
    case 'tri':
      return [
        { text: 'Add a new row that is one longer each time (+2, +3, +4…)', correct: true },
        { text: 'Add 3 each time', correct: false },
        { text: 'Pool n is an n × n square', correct: false },
        { text: 'Double the number each time', correct: false },
      ];
    case 'fib':
      return [
        { text: 'Add the two pools before it', correct: true },
        { text: 'Double the number each time', correct: false },
        { text: 'Add 2 each time', correct: false },
        { text: 'Add 1, then 2, then 3, then 4…', correct: false },
      ];
    default:
      return [];
  }
}

function dedupe(cards) {
  const seen = new Set();
  return cards.filter(c => (seen.has(c.text) ? false : seen.add(c.text)));
}

// Wrong answers for multiple choice: try the "tempting" candidates first, then pad with near misses.
export function distractors(answer, candidates, count = 3, { negative = false } = {}) {
  const ok = c => Number.isInteger(c) && (negative || c > 0) && c !== answer;
  const out = [];
  for (const c of candidates) {
    if (ok(c) && !out.includes(c)) out.push(c);
    if (out.length === count) return out;
  }
  for (let k = 1; out.length < count; k++) {
    for (const c of [answer + k, answer - k]) {
      if (ok(c) && !out.includes(c) && out.length < count) out.push(c);
    }
  }
  return out;
}

// Rules for the "pick" puzzle (tap every even number, every multiple of 5 …).
export function pickTest(rule, k) {
  if (rule === 'even') return v => v % 2 === 0;
  if (rule === 'odd') return v => Math.abs(v % 2) === 1;
  return v => v % k === 0;
}

export function pickLabel(rule, k) {
  if (rule === 'even') return 'even number';
  if (rule === 'odd') return 'odd number';
  return `multiple of ${k}`;
}

// Numbers as children read them: a real minus sign for negatives. Some sequences store whole
// numbers but show them as a clock time (minutes), money (cents), tenths or halves, so every
// answer stays an exact integer underneath.
const pad2 = n => String(n).padStart(2, '0');
export function fmt(n, format) {
  if (n < 0) return `−${fmt(-n, format)}`;
  switch (format) {
    case 'time': return `${Math.floor(n / 60) % 12 || 12}:${pad2(n % 60)}`;
    case 'money': return `$${Math.floor(n / 100)}.${pad2(n % 100)}`;
    case 'cents': return `${n}¢`;
    case 'tenth': return `${Math.floor(n / 10)}.${n % 10}`;
    case 'half': return n % 2 ? `${n > 1 ? Math.floor(n / 2) : ''}½` : `${n / 2}`;
    default: return `${n}`;
  }
}

// A jump written in the same units: "15 minutes", "25¢", "0.3", "½".
export function fmtJump(d, format) {
  switch (format) {
    case 'time': return d % 60 ? `${d} minutes` : `${d / 60} hour${d === 60 ? '' : 's'}`;
    case 'money': return d < 100 ? `${d}¢` : fmt(d, 'money');
    case 'cents': return `${d}¢`;
    case 'tenth': case 'half': return fmt(d, format);
    default: return `${d}`;
  }
}

// Rule cards written as an nth-term formula, e.g. "Pool n has 3n + 1".
export function nthCards(s) {
  const formula = (m, c) => {
    const mn = m === 1 ? 'n' : `${m}n`;
    return c === 0 ? mn : c > 0 ? `${mn} + ${c}` : `${mn} − ${-c}`;
  };
  const d = s.d, c = s.a - s.d;
  const right = formula(d, c);
  const wrong = [formula(d, s.a), `n + ${d}`, formula(d + 1, c - 1), formula(d, 0), formula(d, c + 1)]
    .filter((t, i, all) => t !== right && all.indexOf(t) === i);
  return [{ text: `Pool n has ${right}`, correct: true }, ...wrong.slice(0, 3).map(t => ({ text: `Pool n has ${t}`, correct: false }))];
}
