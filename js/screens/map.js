import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';
import * as S from '../core/state.js';
import { BANDS, findBand } from '../data/bands.js';
import { worldsInBand, bossThreshold } from '../data/worlds.js';
import { PUZZLES } from '../puzzles/index.js';
import { muteButton, pearlStat, readAloudButton } from '../ui/widgets.js';
import { pager } from '../ui/pager.js';

const starsText = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const starsIn = worlds => worlds.flatMap(w => w.levels).reduce((sum, l) => sum + (S.levelRecord(l.id)?.stars || 0), 0);

function worldCard(w, nav) {
  const recs = w.levels.map(l => S.levelRecord(l.id));
  const got = recs.reduce((sum, r) => sum + (r?.stars || 0), 0);
  const nextIdx = recs.findIndex(r => !r);
  const types = [...new Set(w.levels.flatMap(l => l.rounds.map(r => r.type)))];

  const nodes = w.levels.map((l, i) => {
    const rec = recs[i];
    const open = i === 0 || !!recs[i - 1];
    const label = `Level ${w.num}-${i + 1}: ${l.name}${rec ? `, ${rec.stars} of 3 stars` : open ? '' : ', locked'}`;
    return h('button', {
      class: `node${rec ? ' done' : ''}${open ? '' : ' locked'}${i === nextIdx && open ? ' next' : ''}`,
      disabled: !open,
      title: `${l.name}: ${l.skill}`,
      'aria-label': label,
      onclick: () => nav.level(w.id, i),
    },
    open ? i + 1 : '🔒',
    rec ? h('span', { class: 'node-stars', 'aria-hidden': 'true' }, starsText(rec.stars)) : null);
  });

  return h('article', { class: 'world-card panel', style: { '--w': w.color } },
    h('div', { class: 'world-head' },
      h('div', { class: 'crest', 'aria-hidden': 'true' }, w.crest),
      h('div', { class: 'world-meta' },
        h('div', { class: 'eyebrow' }, `World ${w.num}`, w.stretch ? h('span', { class: 'chip chip--stretch' }, 'Stretch') : null),
        h('h2', {}, w.name)),
      h('div', { class: 'world-stars' }, `${got}/${w.levels.length * 3} ★`)),
    h('div', { class: 'path' }, nodes),
    h('div', { class: 'world-next' }, nextIdx === -1 ? 'Every level cleared!' : `Next: ${w.levels[nextIdx].name}`),
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
    h('button', { class: 'btn btn--small', disabled: !open, onclick: () => nav.level(boss.id, 0) }, open ? (rec ? 'Again' : 'Go') : 'Locked'));
}

function freeCard(band, nav) {
  const best = S.freeBest(band.id);
  return h('article', { class: 'world-card boss-card free-card panel', style: { '--w': band.color } },
    h('div', { class: 'crest', 'aria-hidden': 'true' }, '🤿'),
    h('div', { class: 'boss-body' },
      h('div', { class: 'eyebrow' }, 'Endless puzzles'),
      h('h2', {}, 'Free Dive'),
      best ? h('div', { class: 'world-stars' }, `Record: depth ${best.depth}`) : null),
    h('button', { class: 'btn btn--kelp btn--small', onclick: () => nav.free(band.id) }, best ? 'Again' : 'Go'));
}

export function mapScreen(app, _params, nav) {
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

  const extras = h('div', { class: 'map-extras' }, freeCard(band, nav), boss ? bossCard(boss, band, nav, stars) : null);
  const pages = pager([...regular.map(w => worldCard(w, nav)), extras], { className: 'worlds', label: 'Page' });

  app.append(h('div', { class: 'screen' },
    h('header', { class: 'top-bar' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back to title', onclick: nav.title }, '←'),
      h('div', { class: 'top-bar-title' }, h('h1', {}, `${band.name} Map`)),
      h('div', { class: 'stat' }, h('span', { class: 'star-glyph' }, '★'), ` ${starsIn(worlds)}/${bandMax}`),
      pearlStat(),
      h('button', { class: 'icon-btn', 'aria-label': 'Collection', title: 'Collection', onclick: nav.collection }, '🏆'),
      h('button', { class: 'icon-btn', 'aria-label': 'For grown-ups', title: 'For grown-ups', onclick: nav.guide }, 'ℹ️'),
      readAloudButton(),
      muteButton()),
    tabs,
    pages.el));
  pages.layout();
}
