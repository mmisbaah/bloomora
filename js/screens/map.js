import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';
import * as S from '../core/state.js';
import { BANDS, findBand } from '../data/bands.js';
import { worldsInBand, bossThreshold, findWorld } from '../data/worlds.js';
import { confetti } from '../core/fx.js';
import { PUZZLES } from '../puzzles/index.js';
import { pearlStat, sprig, openOverlay, closeOverlay } from '../ui/widgets.js';
import { settingsButton } from '../ui/settings.js';
import { pager } from '../ui/pager.js';
import { pic } from '../ui/art.js';
import { t } from '../core/i18n.js';

// Set by the play screen when a level is cleared, so the map can show Sprig swimming onward.
let lastClear = null;
// A world finished for the first time: its sleeping friend wakes up when the map opens.
let wakeWorld = null;
export function noteWorldDone(worldId) {
  wakeWorld = worldId;
}

function wakeScene(world) {
  audio.wake();
  confetti();
  openOverlay(h('div', { class: 'modal panel pop-in wake' },
    h('div', { class: 'eyebrow' }, t('{world} is complete', { world: world.name })),
    h('div', { class: 'chapter-friend waking', 'aria-hidden': 'true' }, pic(world.reward.emoji, { cls: 'chapter-pic' })),
    h('h2', {}, t('{name} woke up!', { name: world.reward.name })),
    h('p', {}, `${world.story?.close || ''} ${world.reward.line}`),
    h('p', { class: 'wake-note' }, t('Find your new friend in the 🏆 collection.')),
    h('div', { class: 'modal-actions' }, h('button', { class: 'btn', onclick: closeOverlay }, t('Hooray!')))));
}

export function noteCleared(worldId, index) {
  lastClear = { worldId, index };
}

function svgEl(tag, attrs, ...kids) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...kids);
  return el;
}

const starsText = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const starsIn = worlds => worlds.flatMap(w => w.levels).reduce((sum, l) => sum + (S.levelRecord(l.id)?.stars || 0), 0);

function worldCard(w, nav) {
  const recs = w.levels.map(l => S.levelRecord(l.id));
  const got = recs.reduce((sum, r) => sum + (r?.stars || 0), 0);
  const nextIdx = recs.findIndex(r => !r);
  const types = [...new Set(w.levels.flatMap(l => l.rounds.map(r => r.type)))];

  // Stepping stones along a winding path. Positions are percentages of the path box.
  const n = w.levels.length;
  const pts = w.levels.map((_, i) => ({ x: 7 + (86 * i) / Math.max(1, n - 1), y: i % 2 ? 66 : 30 }));
  const curve = pts.map((p, i) => (i ? `S ${(pts[i - 1].x + p.x) / 2} ${p.y} ${p.x} ${p.y}` : `M ${p.x} ${p.y}`)).join(' ');
  const trail = svgEl('svg', { class: 'trail', viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
    svgEl('path', { d: curve, class: 'trail-line' }));

  const nodes = w.levels.map((l, i) => {
    const rec = recs[i];
    const open = i === 0 || !!recs[i - 1];
    const label = `Level ${w.num}-${i + 1}: ${l.name}${rec ? `, ${rec.stars} of 3 stars` : open ? '' : ', locked'}`;
    return h('button', {
      class: `node${rec ? ' done' : ''}${open ? '' : ' locked'}${i === nextIdx && open ? ' next' : ''}`,
      style: { left: `${pts[i].x}%`, top: `${pts[i].y}%` },
      disabled: !open,
      title: `${l.name}: ${l.skill}`,
      'aria-label': label,
      onclick: () => nav.level(w.id, i),
    },
    h('span', { class: 'node-num' }, i + 1),
    rec ? h('span', { class: 'node-stars', 'aria-hidden': 'true' }, starsText(rec.stars)) : null);
  });

  // Sprig waits on the next stone to play. Right after a clear, Sprig swims there from the old stone.
  const here = nextIdx === -1 ? n - 1 : nextIdx;
  const marker = h('div', { class: 'trail-sprig' }, sprig());
  const place = i => Object.assign(marker.style, { left: `${pts[i].x}%`, top: `${pts[i].y}%` });
  if (lastClear && lastClear.worldId === w.id && lastClear.index !== here) {
    place(lastClear.index);
    marker.classList.add('swimming');
    requestAnimationFrame(() => requestAnimationFrame(() => place(here)));
    lastClear = null;
  } else place(here);

  return h('article', { class: 'world-card panel', style: { '--w': w.color } },
    h('div', { class: 'world-head' },
      h('div', { class: 'crest' }, pic(w.crest)),
      h('div', { class: 'world-meta' },
        h('div', { class: 'eyebrow' }, t('World {n}', { n: w.num }), w.stretch ? h('span', { class: 'chip chip--stretch' }, 'Stretch') : null),
        h('h2', {}, w.name)),
      h('div', { class: 'world-stars' }, `${got}/${w.levels.length * 3} ★`)),
    h('div', { class: 'trail-box' }, trail, nodes, marker),
    h('div', { class: 'world-next' }, nextIdx === -1 ? t('Every level cleared!') : t('Next: {name}', { name: w.levels[nextIdx].name })),
    h('div', { class: 'world-foot' }, types.map(t => h('span', { class: 'chip' }, PUZZLES[t].name))));
}

function bossCard(boss, band, nav, stars) {
  const level = boss.levels[0];
  const rec = S.levelRecord(level.id);
  const need = bossThreshold(band.id);
  const open = stars >= need;
  const pct = Math.min(100, Math.round((stars / need) * 100));
  const timed = band.settings.timer && level.timeLimit;
  return h('article', { class: 'world-card boss-card panel', style: { '--w': boss.color } },
    h('div', { class: 'crest', 'aria-hidden': 'true' }, boss.crest),
    h('div', { class: 'boss-body' },
      h('div', { class: 'eyebrow' }, open ? `Final challenge${timed ? ' · Timed' : ''}` : `Locked · ${stars}/${need} ★`),
      h('h2', {}, boss.name),
      open ? (rec ? h('div', { class: 'world-stars' }, starsText(rec.stars)) : null)
        : h('div', { class: 'meter', role: 'img', 'aria-label': `${pct}% of the way` }, h('span', { style: { width: `${pct}%` } }))),
    h('button', { class: 'btn btn--small', disabled: !open, onclick: () => nav.level(boss.id, 0) }, open ? (rec ? t('Again') : t('Go')) : t('Locked')));
}

function dailyCard(band, nav) {
  const done = S.dailyDone(band.id);
  const days = S.dailyStreak();
  return h('article', { class: 'world-card boss-card panel', style: { '--w': 'var(--coral)' } },
    h('div', { class: 'crest', 'aria-hidden': 'true' }, '📅'),
    h('div', { class: 'boss-body' },
      h('div', { class: 'eyebrow' }, done ? t('Done today ✓') : t('New every day')),
      h('h2', {}, t('Daily Dive')),
      h('div', { class: 'world-stars' }, days ? t('🔥 {n}-day streak', { n: days }) : t('Start a streak!'))),
    h('button', { class: `btn btn--small${done ? ' btn--ghost' : ''}`, onclick: () => nav.daily(band.id) }, done ? t('Again') : t('Go')));
}

function practiceCard(band, nav) {
  const due = S.dueReviews(band.id).length;
  if (!due) return null;
  return h('article', { class: 'world-card boss-card panel', style: { '--w': 'var(--sand)' } },
    h('div', { class: 'crest', 'aria-hidden': 'true' }, '🎯'),
    h('div', { class: 'boss-body' },
      h('div', { class: 'eyebrow' }, t('{n} to practise', { n: due })),
      h('h2', {}, t('Practice Pool'))),
    h('button', { class: 'btn btn--sand btn--small', onclick: () => nav.practice(band.id) }, t('Go')));
}

function freeCard(band, nav) {
  const best = S.freeBest(band.id);
  return h('article', { class: 'world-card boss-card free-card panel', style: { '--w': band.color } },
    h('div', { class: 'crest', 'aria-hidden': 'true' }, '🤿'),
    h('div', { class: 'boss-body' },
      h('div', { class: 'eyebrow' }, t('Endless puzzles')),
      h('h2', {}, t('Free Dive')),
      best ? h('div', { class: 'world-stars' }, t('Record: depth {n}', { n: best.depth })) : null),
    h('button', { class: 'btn btn--kelp btn--small', onclick: () => nav.free(band.id) }, best ? t('Again') : t('Go')));
}

function makerCard(band, nav) {
  return h('article', { class: 'world-card boss-card free-card panel', style: { '--w': 'var(--lilac)' } },
    h('div', { class: 'crest', 'aria-hidden': 'true' }, '🧪'),
    h('div', { class: 'boss-body' },
      h('div', { class: 'eyebrow' }, t('Your turn')),
      h('h2', {}, t('Pattern Maker')),
      h('div', { class: 'world-stars' }, t('Stump Sprig!'))),
    h('button', { class: 'btn btn--small', onclick: nav.maker }, t('Make')));
}

export function mapScreen(app, _params, nav) {
  if (wakeWorld) {
    const w = findWorld(wakeWorld);
    wakeWorld = null;
    if (w) setTimeout(() => { if (screenEl.isConnected) wakeScene(w); }, 600);
  }
  const band = findBand(S.getState().band);
  const worlds = worldsInBand(band.id);
  const regular = worlds.filter(w => !w.boss);
  const boss = worlds.find(w => w.boss);
  const stars = starsIn(regular);
  const bandMax = worlds.reduce((n, w) => n + w.levels.length * 3, 0);

  const tabs = h('div', { class: 'band-tabs', role: 'tablist', 'aria-label': 'Age band' },
    BANDS.map(b => h('button', {
      class: `band-tab${b.id === band.id ? ' active' : ''}`,
      role: 'tab',
      'aria-selected': String(b.id === band.id),
      'aria-label': `${b.name}, ages ${b.ages}`,
      style: { '--w': b.color },
      onclick: () => {
        if (b.id === band.id) return;
        audio.tap();
        S.setBand(b.id);
        S.setReadAloud(null);
        nav.map();
      },
    }, h('span', { 'aria-hidden': 'true' }, b.emoji), ' ', h('span', { class: 'band-tab-ages' }, b.ages))));

  const extras = [dailyCard(band, nav), practiceCard(band, nav), freeCard(band, nav), makerCard(band, nav), boss ? bossCard(boss, band, nav, stars) : null].filter(Boolean);
  const pages = pager([...regular.map(w => worldCard(w, nav)), ...extras], { className: 'worlds', label: 'Page' });

  const screenEl = h('div', { class: 'screen' },
    h('header', { class: 'top-bar' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back to title', onclick: nav.title }, '←'),
      h('div', { class: 'top-bar-title' }, h('h1', {}, t('{band} Map', { band: band.name }))),
      h('div', { class: 'stat' }, h('span', { class: 'star-glyph' }, '★'), ` ${starsIn(worlds)}/${bandMax}`),
      pearlStat(),
      h('button', { class: 'icon-btn', 'aria-label': 'Collection', title: 'Collection', onclick: nav.collection }, '🏆'),
      h('button', { class: 'icon-btn', 'aria-label': 'Sprig’s wardrobe', title: 'Sprig’s wardrobe', onclick: nav.shop }, '🎩'),
      settingsButton({ onGuide: nav.guide })),
    tabs,
    pages.el);
  app.append(screenEl);
  pages.layout();
}
