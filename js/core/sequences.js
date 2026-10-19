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
    case 'arith': return s.d > 0 ? `Each pool adds ${s.d}.` : `Each pool takes away ${-s.d}.`;
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
export function distractors(answer, candidates, count = 3) {
  const out = [];
  for (const c of candidates) {
    if (Number.isInteger(c) && c > 0 && c !== answer && !out.includes(c)) out.push(c);
    if (out.length === count) return out;
  }
  for (let k = 1; out.length < count; k++) {
    for (const c of [answer + k, answer - k]) {
      if (c > 0 && c !== answer && !out.includes(c) && out.length < count) out.push(c);
    }
  }
  return out;
}
