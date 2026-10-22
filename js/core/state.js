// Player progress, one save per player profile. Kept in localStorage when the browser allows it;
// the game still runs without it. The first profile uses the original save key, so progress
// from before profiles existed carries over as "Player 1".
const INDEX_KEY = 'bloomora-profiles';
const LEGACY_KEY = 'bloomora-lagoon-v2';
const START_PEARLS = 15;
const MAX_PROFILES = 6;
const DAY = 86400000;
// Review spacing in days for each box: a miss goes to box 0, each later success moves it up.
const REVIEW_GAPS = [0, 1, 3, 7];

// band: chosen age band (null until picked). readAloud: null means "use the band's default".
// review: missed puzzles to bring back later. skills: right/wrong counts per puzzle type.
const defaults = () => ({
  levels: {}, pearls: START_PEARLS, muted: false, band: null, readAloud: null, free: {},
  review: [], skills: {}, daily: { last: null, streak: 0, best: 0, done: {} }, owned: [], hat: null,
  music: true, textSize: 'normal', tutorials: {}, lang: 'en', storiesSeen: {},
});

const read = key => {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
};

let index = read(INDEX_KEY) || { list: [{ id: 'p1', name: 'Player 1', emoji: '🐠' }], current: 'p1' };
const keyFor = id => (id === 'p1' ? LEGACY_KEY : `${LEGACY_KEY}:${id}`);
let state = load(index.current);

function load(id) {
  const saved = read(keyFor(id));
  return saved ? { ...defaults(), ...saved, daily: { ...defaults().daily, ...saved.daily } } : defaults();
}
function save() {
  write(keyFor(index.current), state);
  write(INDEX_KEY, index);
}

export const getState = () => state;

// ---------- Profiles ----------

export const profiles = () => index.list;
export const currentProfile = () => index.list.find(p => p.id === index.current) || index.list[0];
export const canAddProfile = () => index.list.length < MAX_PROFILES;

export function switchProfile(id) {
  if (!index.list.some(p => p.id === id)) return;
  index.current = id;
  state = load(id);
  write(INDEX_KEY, index);
}

export function addProfile(name, emoji) {
  if (!canAddProfile()) return null;
  const id = `p${Date.now().toString(36)}`;
  index.list.push({ id, name: name.trim().slice(0, 16) || 'Diver', emoji });
  switchProfile(id);
  save();
  return id;
}

export function removeProfile(id) {
  if (index.list.length <= 1) return;
  index.list = index.list.filter(p => p.id !== id);
  try { localStorage.removeItem(keyFor(id)); } catch (e) { /* ignore */ }
  if (index.current === id) switchProfile(index.list[0].id);
  write(INDEX_KEY, index);
}

// Add a player from a progress code (see core/share.js).
export function importProfile(p) {
  if (!canAddProfile()) return null;
  const id = addProfile(p.name, p.emoji);
  state = { ...defaults(), band: p.band, pearls: p.pearls, levels: p.levels, skills: p.skills, daily: { ...defaults().daily, best: p.bestStreak } };
  save();
  return id;
}

// Read another player's save without switching to it (for the grown-ups progress page).
export function peekProfile(id) {
  return id === index.current ? state : load(id);
}

// ---------- Levels and pearls ----------

export function hasSavedProgress() {
  return Object.keys(state.levels).length > 0;
}

export function replaceState(next) {
  state = { ...defaults(), ...next };
  save();
}

export function levelRecord(id) {
  return state.levels[id] || null;
}

export function recordResult(id, stars, score) {
  const prev = state.levels[id];
  state.levels[id] = {
    stars: Math.max(prev?.stars || 0, stars),
    score: Math.max(prev?.score || 0, score),
  };
  save();
  return { firstClear: !prev, newBest: !!prev && score > prev.score };
}

export function addPearls(n) {
  state.pearls += n;
  save();
}

export function spendPearls(n) {
  if (state.pearls < n) return false;
  state.pearls -= n;
  save();
  return true;
}

export function totalStars(s = state) {
  return Object.values(s.levels).reduce((sum, r) => sum + r.stars, 0);
}

export function setMuted(muted) {
  state.muted = muted;
  save();
}

export function setBand(band) {
  state.band = band;
  save();
}

export function setPref(key, value) {
  state[key] = value;
  save();
}

export function setReadAloud(on) {
  state.readAloud = on;
  save();
}

// ---------- Free Dive ----------

export function freeBest(band, s = state) {
  return s.free?.[band] || null;
}

export function recordFreeDive(band, depth, score) {
  const prev = freeBest(band);
  if (prev && (depth < prev.depth || (depth === prev.depth && score <= prev.score))) return false;
  state.free = { ...state.free, [band]: { depth, score } };
  save();
  return true;
}

// ---------- Daily Dive ----------

export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function dailyDone(band) {
  return !!state.daily.done[`${todayKey()}:${band}`];
}

// Returns the streak after recording today. Playing twice in a day doesn't add to it.
export function recordDaily(band, score) {
  const today = todayKey();
  const yesterday = todayKey(new Date(Date.now() - DAY));
  const d = state.daily;
  const first = !d.done[`${today}:${band}`];
  if (d.last !== today) d.streak = d.last === yesterday ? d.streak + 1 : 1;
  d.last = today;
  d.best = Math.max(d.best, d.streak);
  d.done[`${today}:${band}`] = Math.max(score, d.done[`${today}:${band}`] || 0);
  // Keep only the last few weeks of daily results.
  const keys = Object.keys(d.done).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - 60))) delete d.done[k];
  save();
  return { streak: d.streak, first };
}

export function dailyStreak(s = state) {
  const d = s.daily;
  const alive = d.last === todayKey() || d.last === todayKey(new Date(Date.now() - DAY));
  return alive ? d.streak : 0;
}

// ---------- Skills and review ----------

export function recordSkill(type, right) {
  const k = state.skills[type] || { right: 0, wrong: 0 };
  if (right) k.right++;
  else k.wrong++;
  state.skills[type] = k;
  save();
}

// A missed puzzle goes (back) to box 0 and comes back in the next practice.
export function recordMiss(src, band) {
  if (!src) return;
  const item = state.review.find(r => r.src === src);
  if (item) Object.assign(item, { box: 0, t: Date.now() });
  else state.review.push({ src, band, box: 0, t: Date.now() });
  if (state.review.length > 40) state.review = state.review.slice(-40);
  save();
}

// Solving a review puzzle moves it up a box; after the last box it's mastered and leaves the list.
export function recordReviewSuccess(src) {
  const item = state.review.find(r => r.src === src);
  if (!item) return;
  item.box++;
  item.t = Date.now();
  if (item.box >= REVIEW_GAPS.length) state.review = state.review.filter(r => r !== item);
  save();
}

export function dueReviews(band, s = state) {
  const now = Date.now();
  return s.review.filter(r => r.band === band && now - r.t >= REVIEW_GAPS[r.box] * DAY);
}

// ---------- Sprig's wardrobe ----------

export function buyItem(id, cost) {
  if (state.owned.includes(id) || !spendPearls(cost)) return false;
  state.owned.push(id);
  state.hat = id;
  save();
  return true;
}

export function wearItem(id) {
  state.hat = state.hat === id ? null : id;
  save();
}

export function resetProgress() {
  state = { ...defaults(), muted: state.muted, band: state.band, readAloud: state.readAloud };
  save();
}
