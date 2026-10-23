import assert from 'node:assert/strict';
const storage = new Map();
globalThis.localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) };
const S = await import('../js/core/state.js');
const { encodeProgress, decodeProgress } = await import('../js/core/share.js');
const { cleanSave } = await import('../js/core/save.js');
const { skillFor } = await import('../js/core/skills.js');
const { practiceTemplates } = await import('../js/core/practice.js');
const { ALL_TEMPLATES, templateFor, bandTemplatesByLevel } = await import('../js/data/templates.js');
const stamp = Date.now();
S.replaceState({ band: 'turtles', pearls: 31, relaxed: true, music: false, muted: true, readAloud: true, lang: 'ar', textSize: 'big',
  levels: { 'reef-1': { stars: 3, score: 1234 } }, owned: ['bow'], hat: 'bow',
  free: { turtles: { depth: 14, score: 2450 } }, skills: { mirror: { right: 2, wrong: 1 } },
  objectives: { 'mirror:v': { label: 'Reflect vertically', attempts: 3, independent: 1, helped: 1, wrong: 1 } },
  reasoning: { 'mirror:v': { right: 1, wrong: 1 } },
  review: [{ src: 'reef:0:0', band: 'turtles', box: 2, t: stamp }],
  daily: { last: S.todayKey(), streak: 3, best: 5, done: { [`${S.todayKey()}:turtles`]: 600 } },
  tutorials: { mirror: true }, storiesSeen: { reef: true },
});
const before = structuredClone(S.getState());
const code = encodeProgress({ name: 'نور', emoji: '🐢' }, before);
assert.ok(code.startsWith('BLOOM2-'));
const restored = decodeProgress(code);
assert.equal(restored.name, 'نور');
S.importProfile(restored);
assert.deepEqual(S.getState(), before, 'complete import must preserve every save field');
const loaded = await import('../js/core/state.js?reload');
assert.deepEqual(loaded.getState(), before, 'backup must survive a device save and reload');
const legacy = 'BLOOM1-' + Buffer.from(JSON.stringify({ n: 'Old diver', e: '🐠', b: 'turtles', p: 20, l: { 'reef-1': 3 }, s: { mirror: [2, 1] }, d: 4 })).toString('base64url');
const old = decodeProgress(legacy);
assert.equal(old.levels['reef-1'].stars, 3);
assert.equal(old.daily.best, 4);
assert.deepEqual(old.skills.mirror, { right: 2, wrong: 1 });
for (const input of ['', 'BLOOM2-null', 'BLOOM2-e30', 'BLOOM1-%%%%', 'BLOOM3-aaaa', 'BLOOM2-' + 'x'.repeat(250001)]) assert.equal(decodeProgress(input), null);
const corrupt = cleanSave({ pearls: -20, levels: { broken: { stars: 99 } }, review: [null, { src: 'a:0:0', band: 'turtles', box: 99, t: stamp }], hat: 'unowned', objectives: null, daily: null });
assert.equal(corrupt.pearls, 0); assert.deepEqual(corrupt.levels, {}); assert.deepEqual(corrupt.review, []); assert.equal(corrupt.hat, null);
const dateNow = Date.now; Date.now = () => stamp;
const first = S.addProfile('A', '🐠'), second = S.addProfile('B', '🐢');
assert.notEqual(first, second); Date.now = dateNow;
S.replaceState({ band: 'turtles' });
const vertical = { type: 'mirror', axis: 'v' }, horizontal = { type: 'mirror', axis: 'h' };
S.recordLearning(vertical, { right: true, assisted: true });
S.recordLearning(horizontal, { right: true });
assert.equal(S.getState().objectives[skillFor(vertical)].independent, 0);
assert.equal(S.getState().objectives[skillFor(horizontal)].independent, 1);
assert.notEqual(skillFor({ seq: { kind: 'arith', d: 2 } }), skillFor({ seq: { kind: 'arith', d: -2 } }));
S.recordMiss('reef:0:0', 'turtles');
assert.equal(S.dueReviews('turtles').length, 1);
S.recordReviewSuccess('reef:0:0');
assert.equal(S.dueReviews('turtles').length, 0, 'successful review must be spaced into the next day');
S.recordMiss('reef:0:0', 'turtles');
assert.equal(S.dueReviews('turtles')[0].box, 0);
const candidates = ALL_TEMPLATES().filter(r => r.src.startsWith('reef:'));
const due = candidates.slice(0, 8).map(r => ({ src: r.src, box: 0, t: stamp }));
const practice = practiceTemplates(due, templateFor, bandTemplatesByLevel('turtles'), {}, {}, () => .5);
assert.equal(practice.length, 3);
for (const r of practice) assert.equal(skillFor(r), skillFor(templateFor(r.reviewSrc)));
const allTemplates = ALL_TEMPLATES();
for (const r of allTemplates) assert.equal(typeof skillFor(r), 'string');
console.log('PASS full and legacy backups, malformed codes, persistence, profile isolation, objective tracking, spacing and short practice');
