// Entry point: background effects, the screen router, and state hand-off across live updates.
import { audio } from './core/audio.js';
import { startBubbles, initConfetti } from './core/fx.js';
import * as S from './core/state.js';
import { closeOverlay } from './ui/widgets.js';
import { titleScreen } from './screens/title.js';
import { mapScreen } from './screens/map.js';
import { levelScreen } from './screens/level.js';
import { collectionScreen } from './screens/collection.js';
import { bandsScreen } from './screens/bands.js';
import { guideScreen } from './screens/guide.js';
import { playersScreen } from './screens/players.js';
import { shopScreen } from './screens/shop.js';

const app = document.getElementById('app');
let cleanup = null;
let lastScreen = null;

function show(screen, params = {}) {
  if (screen !== guideScreen) lastScreen = [screen, params];
  cleanup?.();
  cleanup = null;
  closeOverlay();
  app.replaceChildren();
  window.scrollTo(0, 0);
  audio.muted = S.getState().muted; // each player keeps their own sound setting
  cleanup = screen(app, params, nav) || null;
}

const nav = {
  title: () => show(titleScreen),
  map: () => show(mapScreen),
  collection: () => show(collectionScreen),
  bands: () => show(bandsScreen),
  guide: () => show(guideScreen),
  players: () => show(playersScreen),
  shop: () => show(shopScreen),
  back: () => (lastScreen && lastScreen[0] !== levelScreen ? show(...lastScreen) : show(mapScreen)),
  level: (worldId, levelIndex) => show(levelScreen, { worldId, levelIndex }),
  free: band => show(levelScreen, { free: band }),
  daily: band => show(levelScreen, { daily: band }),
  practice: band => show(levelScreen, { practice: band }),
};

function start(saved) {
  // If storage was unavailable, keep progress that a live update handed over.
  if (saved?.levels && !S.hasSavedProgress()) S.replaceState(saved);
  audio.muted = S.getState().muted;
  startBubbles(document.getElementById('bubbles'));
  initConfetti(document.getElementById('confetti'));
  nav.title();
}

window.claude?.hot?.snapshot?.(() => S.getState());
if (window.claude?.hot?.ready) window.claude.hot.ready(start);
else start(window.claude?.hot?.data ?? {});

// Offline play when hosted (GitHub Pages or any web server). Skipped where service workers
// aren't allowed, such as file:// pages or sandboxed previews.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline play just isn't available here */ });
  });
}
