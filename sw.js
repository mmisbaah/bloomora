// Offline support: the first visit saves every game file, so later visits work without internet.
// Bump VERSION whenever files change so players get the new ones. tests/offline.test.mjs checks
// that FILES lists everything the game loads.
const VERSION = 'bloomora-v8';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/base.css',
  'css/puzzles.css',
  'css/screens.css',
  'js/core/answer.js',
  'js/core/audio.js',
  'js/core/dom.js',
  'js/core/explain.js',
  'js/core/fx.js',
  'js/core/generate.js',
  'js/core/guess.js',
  'js/core/learning.js',
  'js/core/reasoning.js',
  'js/core/skills.js',
  'js/core/practice.js',
  'js/core/i18n.js',
  'js/core/numpad.js',
  'js/core/render.js',
  'js/core/sequences.js',
  'js/core/share.js',
  'js/core/speech.js',
  'js/core/state.js',
  'js/core/save.js',
  'js/data/bands.js',
  'js/data/cando.js',
  'js/data/shop.js',
  'js/data/templates.js',
  'js/data/worlds.js',
  'js/main.js',
  'js/puzzles/balance.js',
  'js/puzzles/build.js',
  'js/puzzles/index.js',
  'js/puzzles/machine.js',
  'js/puzzles/mirror.js',
  'js/puzzles/missing.js',
  'js/puzzles/oddOne.js',
  'js/puzzles/pick.js',
  'js/puzzles/predict.js',
  'js/puzzles/rule.js',
  'js/puzzles/shapes.js',
  'js/puzzles/sort.js',
  'js/puzzles/sticks.js',
  'js/puzzles/story.js',
  'js/puzzles/table.js',
  'js/puzzles/twins.js',
  'js/screens/bands.js',
  'js/screens/collection.js',
  'js/screens/guide.js',
  'js/screens/level.js',
  'js/screens/maker.js',
  'js/screens/map.js',
  'js/screens/players.js',
  'js/screens/results.js',
  'js/screens/shop.js',
  'js/screens/title.js',
  'js/ui/art.js',
  'js/ui/lagoon.js',
  'js/ui/pager.js',
  'js/ui/settings.js',
  'js/ui/tutorial.js',
  'js/ui/widgets.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Game files come from the cache first. Anything else (like the web fonts) is fetched normally
// and kept for next time, so it also works offline after one online visit.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(hit => hit || fetch(event.request).then(res => {
      if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
        const copy = res.clone();
        caches.open(VERSION).then(cache => cache.put(event.request, copy));
      }
      return res;
    })),
  );
});
