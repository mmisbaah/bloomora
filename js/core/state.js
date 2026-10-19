// Player progress. Kept in localStorage when the browser allows it; the game still runs without it.
const KEY = 'bloomora-lagoon-v2';
const START_PEARLS = 15;

// band: chosen age band id (null until picked). readAloud: null means "use the band's default".
const defaults = () => ({ levels: {}, pearls: START_PEARLS, muted: false, band: null, readAloud: null, free: {} });

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults(), ...JSON.parse(raw) };
  } catch (e) { /* storage blocked */ }
  return defaults();
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ }
}

export const getState = () => state;

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

export function totalStars() {
  return Object.values(state.levels).reduce((sum, r) => sum + r.stars, 0);
}

export function setMuted(muted) {
  state.muted = muted;
  save();
}

export function freeBest(band) {
  return state.free?.[band] || null;
}

export function recordFreeDive(band, depth, score) {
  const prev = freeBest(band);
  if (prev && (depth < prev.depth || (depth === prev.depth && score <= prev.score))) return false;
  state.free = { ...state.free, [band]: { depth, score } };
  save();
  return true;
}

export function setBand(band) {
  state.band = band;
  save();
}

export function setReadAloud(on) {
  state.readAloud = on;
  save();
}

export function resetProgress() {
  state = { ...defaults(), muted: state.muted, band: state.band, readAloud: state.readAloud };
  save();
}
