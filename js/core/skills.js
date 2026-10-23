// Stable learning objectives, independent of the visual puzzle used to teach them.
export function skillFor(r) {
  if (r.type === 'mirror') return `mirror:${r.axis || 'v'}`;
  if (r.type === 'shapes') return `repeat:${r.unit.map(s => r.unit.indexOf(s)).join('-')}`;
  if (r.type === 'sort') return `order:${r.desc ? 'descending' : 'ascending'}`;
  if (r.type === 'pick') return `number:${r.rule}:${r.k || 0}`;
  if (r.type === 'sticks') return `sticks:${r.shape}`;
  if (r.type === 'balance') return `equation:${r.left.x}:${r.right.x}:${!!r.left.k}`;
  if (r.type === 'machine') return `machine:${r.inverse ? 'inverse' : 'forward'}:${r.m}:${Math.sign(r.b)}`;
  if (r.type === 'twins') return `compare:${r.k}`;
  const s = r.seq;
  if (s) return `sequence:${s.kind}:${s.d ?? s.r ?? ''}:${s.format || 'whole'}:${r.nth ? 'nth' : 'continue'}`;
  return r.type;
}

export function skillLabel(r) {
  if (r.type === 'mirror') return r.axis === 'h' ? 'Reflect across a horizontal line' : 'Reflect across a vertical line';
  if (r.type === 'shapes') return `Repeat a ${r.unit.length}-part pattern`;
  if (r.type === 'sort') return r.desc ? 'Order from largest to smallest' : 'Order from smallest to largest';
  if (r.type === 'pick') return r.rule === 'multiple' ? `Find multiples of ${r.k}` : `Recognise ${r.rule} numbers`;
  if (r.type === 'sticks') return `Growing ${r.shape} made of sticks`;
  if (r.type === 'balance') return r.right.x ? 'Balance unknowns on both sides' : r.left.k ? 'Solve a two-step balance' : 'Balance equal groups';
  if (r.type === 'machine') return r.inverse ? 'Work backwards through a machine' : 'Find a machine rule';
  if (r.type === 'twins') return `Compare patterns using ×${r.k}`;
  const s = r.seq;
  if (!s) return r.type;
  const topic = s.kind === 'arith' ? `${s.d < 0 ? 'Count backwards' : 'Count on'} in ${Math.abs(s.d)}s` : ({ geo: `Multiply by ${s.r}`, square: 'Square numbers', cube: 'Cube numbers', tri: 'Triangular numbers', fib: 'Add the previous two terms' }[s.kind] || s.kind);
  return `${topic}${s.format ? ` (${s.format})` : ''}${r.nth ? ' · nth term' : ''}`;
}
