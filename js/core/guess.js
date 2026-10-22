import { t, isArabic } from './i18n.js';

// Sprig's rule guesser for the Pattern Maker. Given a few numbers a child typed, find the
// simplest rule that fits all of them and say it in words. Checked from simplest to hardest.
const allEqual = a => a.every(x => x === a[0]);
const diffs = a => a.slice(1).map((x, i) => x - a[i]);
const isInt = x => Number.isInteger(x);
const fmtD = d => (d < 0 ? `take away ${-d}` : `add ${d}`);

export function guessRule(nums) {
  const n = nums.length;
  if (n < 3) return null;
  const d1 = diffs(nums);
  const index = k => nums.map((_, i) => i + k);

  if (allEqual(nums)) return { text: t('Every number is {d}. That’s a pattern too!', { d: nums[0] }), next: c => nums[0] };
  if (allEqual(d1)) return { text: t(d1[0] > 0 ? 'You add {d} each time.' : 'You take away {d} each time.', { d: Math.abs(d1[0]) }), short: fmtD(d1[0]), next: c => c + d1[0] };
  if (nums.every(x => x !== 0)) {
    const ratios = nums.slice(1).map((x, i) => x / nums[i]);
    if (allEqual(ratios) && isInt(ratios[0])) return { text: t('You multiply by {d} each time.', { d: ratios[0] }), next: c => c * ratios[0] };
    const inv = nums.slice(1).map((x, i) => nums[i] / x);
    if (allEqual(inv) && isInt(inv[0]) && inv[0] > 1) return { text: t('You divide by {d} each time.', { d: inv[0] }), next: c => (isInt(c / inv[0]) ? c / inv[0] : null) };
  }
  // Famous patterns, starting from any position.
  const named = [
    ['square numbers', k => k * k, '1 × 1, 2 × 2, 3 × 3 …'],
    ['cube numbers', k => k * k * k, '1 × 1 × 1, 2 × 2 × 2 …'],
    ['triangular numbers', k => (k * (k + 1)) / 2, 'add 2, then 3, then 4 …'],
  ];
  for (const [name, f, how] of named) {
    for (let start = 0; start <= 30; start++) {
      if (index(start).every((k, i) => f(k) === nums[i])) {
        return { text: isArabic() ? t(`Those are ${name}!`) : `Those are ${name}! (${how})`, next: (_c, i) => f(start + i) };
      }
    }
  }
  if (nums.slice(2).every((x, i) => x === nums[i] + nums[i + 1])) {
    return { text: t('Each number is the two before it added together, like the Fibonacci pattern.'), next: (_c, _i, a) => a[a.length - 1] + a[a.length - 2] };
  }
  // Jumps that grow steadily (+2, +4, +6 …).
  if (n >= 4) {
    const d2 = diffs(d1);
    if (allEqual(d2) && d2[0] !== 0) {
      return { text: isArabic() ? t('The jumps grow by {d} each time.', { d: d2[0] }) : `The jumps grow by ${d2[0]} each time (${d1.join(', ')} …).`, next: (_c, _i, a) => { const dd = diffs(a); return a[a.length - 1] + dd[dd.length - 1] + d2[0]; } };
    }
    // Two jumps taking turns (+2, +5, +2, +5 …).
    if (d1.every((d, i) => d === d1[i % 2])) {
      return { text: isArabic() ? t('The jumps take turns.') : `The jumps take turns: ${fmtD(d1[0])}, then ${fmtD(d1[1])}.`, next: (_c, _i, a) => a[a.length - 1] + d1[(a.length - 1) % 2] };
    }
    // Repeating numbers (1, 2, 3, 1, 2, 3 …).
    for (let p = 2; p <= Math.floor(n / 2); p++) {
      if (nums.every((x, i) => x === nums[i % p])) return { text: t('It repeats every {d} numbers.', { d: p }), next: (_c, _i, a) => a[a.length - p] };
    }
  }
  // Multiply then add (×2 + 1 …).
  for (let m = 2; m <= 5; m++) {
    const b = nums[1] - m * nums[0];
    if (b !== 0 && nums.slice(1).every((x, i) => x === m * nums[i] + b)) {
      return { text: isArabic() ? t('You multiply by {m}, then add or take away.', { m }) : `You multiply by ${m}, then ${fmtD(b)}.`, next: c => m * c + b };
    }
  }
  return null;
}

// The next few numbers by a guessed rule.
export function continueWith(rule, nums, count = 3) {
  const out = [...nums];
  for (let i = 0; i < count; i++) {
    const v = rule.next(out[out.length - 1], out.length, out);
    if (v === null || !Number.isFinite(v) || Math.abs(v) > 1e9) break;
    out.push(v);
  }
  return out.slice(nums.length);
}
