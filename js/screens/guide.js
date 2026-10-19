// "For grown-ups": how the age bands were set, what each level practises, and the sources.
// Split into tabs and measured pages so it never scrolls.
import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';
import { BANDS, SOURCES } from '../data/bands.js';
import { worldsInBand } from '../data/worlds.js';
import { templateFor, templateLabel } from '../data/templates.js';
import * as S from '../core/state.js';
import { PUZZLES } from '../puzzles/index.js';
import { muteButton } from '../ui/widgets.js';
import { pager } from '../ui/pager.js';

const settingChips = s => [
  `${s.hearts} hearts`,
  s.hintCost ? `Hints cost ${s.hintCost} pearls` : 'Free hints',
  `${s.options} answer choices`,
  s.timer ? 'Timed boss level' : 'No clock',
  s.speedBonus ? 'Speed bonus' : 'No speed bonus',
  s.readAloud ? 'Read-aloud on' : 'Read-aloud off',
  s.stars[0] ? `3 stars with ${s.stars[0]} slip` : '3 stars: no mistakes',
];

const OVERVIEW = [
  'Bloomora splits its 46 levels into four age bands. Each topic sits in the band where the US Common Core and England’s national curriculum first teach it. Where the two disagree, the game uses the earlier year and labels the later one as a preview.',
  'Bands also change how forgiving the game is. Younger players get more hearts, free hints, fewer answer choices, read-aloud and no clock. Older players get a timed boss and speed bonuses. Any child can open any band from the map.',
  'After a wrong answer, a “show me why” picture appears: the jumps between pools, the weight on each side of a scale, or one tile that was missed. Hints come in two steps, a nudge first and then the full hint. If a child struggles twice in a row the next puzzles get gentler, and three clean puzzles in a row make them harder. Missed puzzles come back later in the Practice Pool and in Free Dive.',
  'Problems are generated fresh on every play. Each level keeps its skill (the same step size, the same kind of equation, the same mirror size, the same repeating structure), but the numbers, starting point, creatures and mirror pictures change, always inside the level’s limits. Free Dive keeps generating puzzles from a band until the hearts run out.',
  'Codes: “CC 3.OA.A.4” is a Common Core standard. “Eng Y3” is a year group in England. “KS3” and “KS4” are England’s Key Stages 3 (ages 11–14) and 4 (ages 14–16). “Research” marks a choice based on studies of how children learn patterns. An asterisk (*) means the code could not be checked against the official text while the game was built, so a teacher should confirm it.',
];

// One card per player: stars per band, streaks, accuracy by puzzle type, and what needs practice.
function progressItems() {
  return S.profiles().map(p => {
    const d = S.peekProfile(p.id);
    const bandRows = BANDS.map(b => {
      const levels = worldsInBand(b.id).flatMap(w => w.levels);
      const got = levels.reduce((n, l) => n + (d.levels[l.id]?.stars || 0), 0);
      const cleared = levels.filter(l => d.levels[l.id]).length;
      const free = S.freeBest(b.id, d);
      return h('span', { class: 'chip' }, `${b.emoji} ${b.ages}: ${cleared}/${levels.length} levels · ★ ${got}${free ? ` · dive ${free.depth}` : ''}`);
    });
    const skills = Object.entries(d.skills || {})
      .map(([type, k]) => ({ name: PUZZLES[type]?.name || type, pct: Math.round((100 * k.right) / Math.max(1, k.right + k.wrong)), n: k.right + k.wrong }))
      .sort((a, b) => a.pct - b.pct);
    const review = (d.review || []).map(r => {
      const t = templateFor(r.src);
      return t ? `${templateLabel(r.src)} (${PUZZLES[t.type].name})` : null;
    }).filter(Boolean);
    return h('div', { class: 'guide-card panel' },
      h('h3', {}, `${p.emoji} ${p.name}`),
      h('p', {}, `★ ${S.totalStars(d)} stars · ${d.pearls} pearls · daily streak ${S.dailyStreak(d)} (best ${d.daily?.best || 0})`),
      h('div', { class: 'guide-chips' }, bandRows),
      h('div', { class: 'eyebrow' }, 'First-try accuracy by puzzle'),
      skills.length
        ? h('div', { class: 'guide-chips' }, skills.map(k => h('span', { class: `chip${k.pct < 60 ? ' chip--stretch' : ''}` }, `${k.name} ${k.pct}% (${k.n})`)))
        : h('p', { class: 'guide-meta' }, 'No puzzles played yet.'),
      h('div', { class: 'eyebrow' }, 'Waiting in the Practice Pool'),
      h('p', { class: 'guide-meta' }, review.length ? [...new Set(review)].slice(0, 8).join(' · ') : 'Nothing right now.'));
  });
}

function bandItems(b) {
  const head = h('div', { class: 'guide-card guide-card--head panel', style: { '--w': b.color } },
    h('div', { class: 'eyebrow' }, b.grades),
    h('h2', {}, `${b.emoji} ${b.name} · ages ${b.ages}`),
    h('p', {}, b.focus),
    h('div', { class: 'guide-chips' }, settingChips(b.settings).map(t => h('span', { class: 'chip' }, t))));
  const why = b.why.map(t => h('div', { class: 'guide-card panel' }, h('div', { class: 'eyebrow' }, 'Why'), h('p', {}, t)));
  const levels = worldsInBand(b.id).flatMap(w => w.levels.map((l, i) => h('div', { class: 'guide-card panel' },
    h('div', { class: 'eyebrow' }, w.boss ? 'Boss level' : `Level ${w.num}-${i + 1}`, w.stretch ? h('span', { class: 'chip chip--stretch' }, 'Stretch') : null),
    h('h3', {}, l.name),
    h('p', {}, l.skill),
    h('p', { class: 'guide-meta' }, [...new Set(l.rounds.map(r => PUZZLES[r.type].name))].join(' · ')),
    h('div', { class: 'guide-chips' }, l.std.map(s => h('span', { class: 'chip' }, s))))));
  return [head, ...why, ...levels];
}

export function guideScreen(app, _params, nav) {
  const tabs = [
    { id: 'overview', label: 'How it works', items: () => OVERVIEW.map(t => h('div', { class: 'guide-card panel' }, h('p', {}, t))) },
    { id: 'progress', label: 'Progress', items: progressItems },
    ...BANDS.map(b => ({ id: b.id, label: `${b.emoji} ${b.ages}`, items: () => bandItems(b) })),
    { id: 'sources', label: 'Sources', items: () => SOURCES.map(s => h('div', { class: 'guide-card panel' }, h('a', { href: s.url, target: '_blank', rel: 'noopener' }, s.label))) },
  ];
  const body = h('div', { class: 'guide-body' });
  const tabBar = h('div', { class: 'band-tabs', role: 'tablist', 'aria-label': 'Guide sections' });

  function open(tab) {
    [...tabBar.children].forEach(b => {
      const on = b.dataset.id === tab.id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    });
    const p = pager(tab.items(), { className: 'guide-list', label: 'Page' });
    body.replaceChildren(p.el);
    p.layout();
  }

  tabs.forEach(t => tabBar.append(h('button', {
    class: 'band-tab', role: 'tab', 'data-id': t.id,
    onclick: () => { audio.tap(); open(t); },
  }, t.label)));

  app.append(h('div', { class: 'screen guide' },
    h('header', { class: 'top-bar' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: nav.back }, '←'),
      h('div', { class: 'top-bar-title' }, h('h1', {}, 'For grown-ups')),
      muteButton()),
    tabBar,
    body));
  open(tabs[0]);
}
