// "For grown-ups": how the age bands were set, what each level practises, and the sources.
// Split into tabs and measured pages so it never scrolls.
import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';
import { BANDS, SOURCES } from '../data/bands.js';
import { worldsInBand, WORLDS, LEVEL_COUNT } from '../data/worlds.js';
import { encodeProgress, decodeProgress } from '../core/share.js';
import { openOverlay, closeOverlay } from '../ui/widgets.js';
import { toast } from '../core/fx.js';
import { templateFor, templateLabel } from '../data/templates.js';
import * as S from '../core/state.js';
import { PUZZLES } from '../puzzles/index.js';
import { settingsButton } from '../ui/settings.js';
import { pager } from '../ui/pager.js';
import { skillLabel } from '../core/skills.js';

const settingChips = s => [
  s.hearts ? `${s.hearts} hearts` : 'No hearts to lose',
  s.hintCost ? `Hints cost ${s.hintCost} pearls` : 'Free hints',
  `${s.options} answer choices`,
  s.timer ? 'Timed boss level' : 'No clock',
  s.speedBonus ? 'Speed bonus' : 'No speed bonus',
  s.readAloud ? 'Read-aloud on' : 'Read-aloud off',
  s.stars[0] ? `3 stars with ${s.stars[0]} slip` : '3 stars: no mistakes',
];

const OVERVIEW = [
  `Bloomora splits its ${LEVEL_COUNT} levels into four age bands. Each topic sits in the band where the US Common Core and England’s national curriculum first teach it. Where the two disagree, the game uses the earlier year and labels the later one as a preview.`,
  'Bands also change how forgiving the game is. Younger players get more hearts (the youngest get none to lose), free hints, fewer answer choices, read-aloud and no clock. Older players get a timed boss and speed bonuses. Any child can open any band from the map.',
  'After a wrong answer, a “show me why” picture appears. Corrections cost at most one heart per puzzle. Help is free for everyone: a clue, a worked example, then guided steps. Relaxed mode removes hearts and timers. Missed skills return in short Practice Pool sessions of up to three puzzles. Using help does not count as independent mastery.',
  'Problems are generated fresh on every play. Each level keeps its skill (the same step size, the same kind of equation, the same mirror size, the same repeating structure), but the numbers, starting point, creatures and mirror pictures change, always inside the level’s limits. Free Dive keeps generating puzzles from a band until the hearts run out.',
  'Beyond number sequences, levels use growing stick shapes, short pattern stories, tables and bar graphs, money, clock times, halves and decimals. Pattern Maker turns things around: the child makes a pattern and Sprig has to guess the rule, which gets children describing rules in their own words.',
  'Accessibility: right and wrong answers are marked with ✓ and ✗, not just colour. Keys 1–9 choose answers and numbers can be typed. ⚙️ Settings has big text, read-aloud, sound and music switches, and Arabic with a right-to-left layout (level names and intros stay in English for now).',
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
    const objectives = Object.values(d.objectives || {}).sort((a, b) => a.independent / Math.max(1, a.attempts) - b.independent / Math.max(1, b.attempts));
    const review = (d.review || []).map(r => {
      const t = templateFor(r.src);
      return t ? `${skillLabel(t)} · ${templateLabel(r.src)}` : null;
    }).filter(Boolean);
    // Two cards per player so each one fits a short screen.
    return [h('div', { class: 'guide-card panel' },
      h('h3', {}, `${p.emoji} ${p.name}`),
      h('p', {}, `★ ${S.totalStars(d)} stars · ${d.pearls} pearls · daily streak ${S.dailyStreak(d)} (best ${d.daily?.best || 0})`),
      h('div', { class: 'guide-chips' }, bandRows)),
    h('div', { class: 'guide-card panel' },
      h('h3', {}, `${p.emoji} ${p.name}: puzzles`),
      h('div', { class: 'eyebrow' }, 'First-try accuracy by puzzle'),
      skills.length
        ? h('div', { class: 'guide-chips' }, skills.map(k => h('span', { class: `chip${k.pct < 60 ? ' chip--stretch' : ''}` }, `${k.name} ${k.pct}% (${k.n})`)))
        : h('p', { class: 'guide-meta' }, 'No puzzles played yet.'),
      h('div', { class: 'eyebrow' }, 'Waiting in the Practice Pool'),
      h('p', { class: 'guide-meta' }, review.length ? [...new Set(review)].slice(0, 8).join(' · ') : 'Nothing right now.')),
    h('div', { class: 'guide-card panel' },
      h('h3', {}, `${p.emoji} ${p.name}: learning goals`),
      h('p', { class: 'guide-meta' }, 'Independent means correct without hints or corrections. Practice is at most three puzzles, then a break.'),
      objectives.length ? h('div', { class: 'guide-chips' }, objectives.slice(0, 6).map(k => h('span', { class: 'chip' }, `${k.label}: ${k.independent}/${k.attempts} independent · ${k.helped} with help`))) : h('p', {}, 'Play to discover which skills need practice.'))];
  }).flat();
}

function bandItems(b) {
  const head = h('div', { class: 'guide-card guide-card--head panel', style: { '--w': b.color } },
    h('div', { class: 'eyebrow' }, b.grades),
    h('h2', {}, `${b.emoji} ${b.name} · ages ${b.ages}`),
    h('p', {}, b.focus));
  const settings = h('div', { class: 'guide-card panel' },
    h('div', { class: 'eyebrow' }, 'Game settings for this band'),
    h('div', { class: 'guide-chips' }, settingChips(b.settings).map(t => h('span', { class: 'chip' }, t))));
  const why = b.why.map(t => h('div', { class: 'guide-card panel' }, h('div', { class: 'eyebrow' }, 'Why'), h('p', {}, t)));
  const levels = worldsInBand(b.id).flatMap(w => w.levels.map((l, i) => h('div', { class: 'guide-card panel' },
    h('div', { class: 'eyebrow' }, w.boss ? 'Boss level' : `Level ${w.num}-${i + 1}`, w.stretch ? h('span', { class: 'chip chip--stretch' }, 'Stretch') : null),
    h('h3', {}, l.name),
    h('p', {}, l.skill),
    h('p', { class: 'guide-meta' }, [...new Set(l.rounds.map(r => PUZZLES[r.type].name))].join(' · ')),
    h('div', { class: 'guide-chips' }, l.std.map(s => h('span', { class: 'chip' }, s))))));
  return [head, settings, ...why, ...levels];
}

// ---------- Share and class view ----------

function codeBox(title, code) {
  const area = h('textarea', { class: 'code-box', readonly: true, rows: 4, 'aria-label': 'Progress code' }, code);
  openOverlay(h('div', { class: 'modal panel pop-in' },
    h('h2', {}, title),
    h('p', {}, 'Copy this code. Paste it into Bloomora on another device, or send it to a teacher.'),
    area,
    h('div', { class: 'modal-actions' },
      h('button', { class: 'btn btn--ghost', onclick: closeOverlay }, 'Close'),
      h('button', { class: 'btn', onclick: async () => {
        area.select();
        try { await navigator.clipboard.writeText(code); toast('Code copied'); } catch (e) { document.execCommand?.('copy'); toast('Code selected: copy it now'); }
      } }, 'Copy'))));
}

function pasteBox({ title, text, ok, onOk }) {
  const area = h('textarea', { class: 'code-box', rows: 5, placeholder: 'BLOOM2-…', 'aria-label': 'Paste codes here' });
  openOverlay(h('div', { class: 'modal panel pop-in' },
    h('h2', {}, title), h('p', {}, text), area,
    h('div', { class: 'modal-actions' },
      h('button', { class: 'btn btn--ghost', onclick: closeOverlay }, 'Cancel'),
      h('button', { class: 'btn', onclick: () => onOk(area.value) }, ok))));
  area.focus();
}

// Which puzzle types a child gets right least often on the first try.
function weakest(skills) {
  const rows = Object.entries(skills).map(([t, k]) => [PUZZLES[t]?.name || t, k.right / Math.max(1, k.right + k.wrong), k.right + k.wrong]).filter(r => r[2] >= 3);
  rows.sort((a, b) => a[1] - b[1]);
  return rows.length ? `${rows[0][0]} (${Math.round(rows[0][1] * 100)}%)` : '–';
}

function classView(raw) {
  const kids = raw.split(/\s+/).map(decodeProgress).filter(Boolean);
  if (!kids.length) { toast('No progress codes found. Use a BLOOM1- or BLOOM2- code.'); return; }
  const lastWorld = k => {
    const done = WORLDS.filter(w => w.levels.some(l => k.levels[l.id]));
    return done.length ? done[done.length - 1].name : '–';
  };
  // One card per child, paged so a class of 30 still fits without scrolling.
  const cards = kids.map(k => h('div', { class: 'class-kid' },
    h('div', { class: 'class-name' }, `${k.emoji} ${k.name}`),
    h('div', { class: 'guide-chips' },
      h('span', { class: 'chip' }, `★ ${Object.values(k.levels).reduce((n, r) => n + r.stars, 0)}`),
      h('span', { class: 'chip' }, `${Object.keys(k.levels).length}/${LEVEL_COUNT} levels`),
      h('span', { class: 'chip' }, `Furthest: ${lastWorld(k)}`),
      h('span', { class: 'chip chip--stretch' }, `Needs practice: ${weakest(k.skills)}`))));
  const pages = pager(cards, { className: 'class-list', label: 'Page' });
  openOverlay(h('div', { class: 'modal panel pop-in class-view' },
    h('h2', {}, `Class view · ${kids.length} player${kids.length === 1 ? '' : 's'}`),
    pages.el,
    h('div', { class: 'modal-actions' }, h('button', { class: 'btn', onclick: closeOverlay }, 'Done'))));
  pages.layout();
}

function shareItems(nav) {
  return [
    h('div', { class: 'guide-card panel' },
      h('div', { class: 'eyebrow' }, 'Share progress'),
      h('p', {}, 'Progress is saved only in this browser on this device. Clearing browser data can erase it. Keep a progress code as a backup: it includes stars, scores, pearls, wardrobe, records, practice history and settings. Nothing is sent anywhere unless you copy the code.'),
      h('div', { class: 'guide-chips' }, S.profiles().map(p => h('button', { class: 'btn btn--small btn--ghost', onclick: () => codeBox(`${p.emoji} ${p.name}’s code`, encodeProgress(p, S.peekProfile(p.id))) }, `${p.emoji} ${p.name}`)))),
    h('div', { class: 'guide-card panel' },
      h('div', { class: 'eyebrow' }, 'For teachers'),
      h('p', {}, 'Ask each child (or parent) for their code, paste them all in, and see the class side by side: stars, levels cleared, the furthest world, and the puzzle type each child finds hardest.'),
      h('button', { class: 'btn btn--small', onclick: () => pasteBox({ title: 'Class view', text: 'Paste one or more progress codes. Spaces or new lines between them are fine.', ok: 'Show class', onOk: classView }) }, '📋 Open class view')),
    h('div', { class: 'guide-card panel' },
      h('div', { class: 'eyebrow' }, 'Move a player to this device'),
      h('p', {}, 'Paste a BLOOM2 code to restore the full player. Older BLOOM1 codes restore the stars and summary they originally contained.'),
      h('button', { class: 'btn btn--small btn--ghost', disabled: !S.canAddProfile(), onclick: () => pasteBox({ title: 'Add a player from a code', text: 'Paste one progress code.', ok: 'Add player', onOk: v => {
        const p = decodeProgress(v);
        if (!p) { toast('That code didn’t work. Use a BLOOM1- or BLOOM2- code.'); return; }
        S.importProfile(p);
        closeOverlay();
        toast(`${p.name} has joined!`);
        nav.title();
      } }) }, S.canAddProfile() ? 'Paste a code' : 'Player list is full')),
    h('div', { class: 'guide-card panel' },
      h('div', { class: 'eyebrow' }, 'About class accounts'),
      h('p', {}, 'Codes keep the game private and offline. A live class dashboard, where results arrive by themselves, would need accounts and a server, which this version deliberately doesn’t have.')),
  ];
}

export function guideScreen(app, _params, nav) {
  const tabs = [
    { id: 'overview', label: 'How it works', items: () => OVERVIEW.map(t => h('div', { class: 'guide-card panel' }, h('p', {}, t))) },
    { id: 'progress', label: 'Progress', items: progressItems },
    { id: 'share', label: 'Share & class', items: () => shareItems(nav) },
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
      settingsButton()),
    tabBar,
    body));
  open(tabs[0]);
}
