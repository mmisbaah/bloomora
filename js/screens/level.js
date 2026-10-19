// The play screen: HUD, the current puzzle, and Sprig's speech bar.
// Runs four kinds of session: a normal level, Free Dive (endless), Daily Dive (same puzzles for
// everyone in a band each day) and Practice (puzzles this player missed before).
import { h, pick, replay } from '../core/dom.js';
import { audio } from '../core/audio.js';
import { confetti, floatText, toast } from '../core/fx.js';
import * as S from '../core/state.js';
import { findWorld } from '../data/worlds.js';
import { levelTemplates, bandTemplatesByLevel, templateFor } from '../data/templates.js';
import { makeRng, vary } from '../core/generate.js';
import { findBand } from '../data/bands.js';
import { speak, stopSpeaking } from '../core/speech.js';
import { PUZZLES } from '../puzzles/index.js';
import { sprig, muteButton, readAloudButton, confirmBox, closeOverlay } from '../ui/widgets.js';
import { showResults, showFail, showFreeResults, showSimpleResults } from './results.js';

const PRAISE = ['Splash-tastic!', 'You cracked it!', 'The lagoon glows brighter!', 'Sharp eyes!', 'Pattern found!', 'Sprig is impressed!'];
const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const FREE_ROUNDS = 200;
const DAILY_ROUNDS = 6;
const PRACTICE_ROUNDS = 6;

// Small string hash so every player in a band gets the same Daily Dive on the same day.
function hashSeed(text) {
  let h1 = 2166136261;
  for (const ch of text) h1 = Math.imul(h1 ^ ch.charCodeAt(0), 16777619);
  return h1 >>> 0;
}

function shuffleWith(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Describe what this screen should run: which templates, in what order, and how it ends.
function buildSession(params) {
  if (params.worldId) {
    const world = findWorld(params.worldId);
    const level = world.levels[params.levelIndex];
    return { mode: 'level', world, level, band: world.band, rng: makeRng(), adaptive: true, templates: levelTemplates(world, params.levelIndex) };
  }
  const bandId = params.free || params.daily || params.practice;
  const band = findBand(bandId);
  const world = { id: `${bandId}-extra`, band: bandId, name: band.name, num: '∞', defaults: {} };
  const byLevel = bandTemplatesByLevel(bandId);

  if (params.free) {
    const rng = makeRng();
    const due = S.dueReviews(bandId).map(r => templateFor(r.src)).filter(Boolean);
    // The template pool widens as the player goes deeper, and missed puzzles come back now and then.
    const next = i => {
      if (due.length && rng() < 0.3) return due[Math.floor(rng() * due.length)];
      const pool = byLevel.slice(0, Math.min(byLevel.length, 2 + Math.floor(i / 2))).flat();
      return pool[Math.floor(rng() * pool.length)];
    };
    return {
      mode: 'free', world, band: bandId, rng, adaptive: true, endless: true, next,
      level: { id: `free-${bandId}`, name: 'Free Dive', intro: 'Fresh puzzles keep coming until your hearts run out. How deep can you go?' },
      types: byLevel.flat(),
    };
  }
  if (params.daily) {
    const rng = makeRng(hashSeed(`${S.todayKey()}:${bandId}`));
    return {
      mode: 'daily', world, band: bandId, rng, adaptive: false,
      templates: shuffleWith(rng, byLevel.flat()).slice(0, DAILY_ROUNDS),
      level: { id: `daily-${bandId}`, name: 'Daily Dive', intro: 'Today’s six puzzles are the same for every diver in your group. Can you keep your streak going?' },
    };
  }
  const due = S.dueReviews(bandId).map(r => templateFor(r.src)).filter(Boolean);
  return {
    mode: 'practice', world, band: bandId, rng: makeRng(), adaptive: true,
    templates: due.slice(0, PRACTICE_ROUNDS),
    level: { id: `practice-${bandId}`, name: 'Practice Pool', intro: 'These are puzzles that tripped you up before, with new numbers. Let’s make them easy!' },
  };
}

export function levelScreen(app, params, nav) {
  const session = buildSession(params);
  const { world, level, mode, rng } = session;
  const endless = !!session.endless;
  const total = endless ? FREE_ROUNDS : session.templates.length;
  const cfg = findBand(session.band).settings;
  const HEARTS = cfg.hearts;
  const HINT_COST = cfg.hintCost;
  const timeLimit = cfg.timer && mode === 'level' ? level.timeLimit || 0 : 0;
  const retry = () => (mode === 'level' ? nav.level(params.worldId, params.levelIndex) : nav[mode](session.band));
  const dueSet = new Set(S.dueReviews(session.band).map(r => r.src));

  let hearts = HEARTS, idx = 0, score = 0, streak = 0, mistakes = 0;
  let roundMistake = false, hintStage = 0, ended = false, started = 0;
  // Adaptive difficulty: two rough rounds in a row make the next ones gentler, three clean
  // rounds in a row make them harder. Daily Dive stays fixed so everyone gets the same puzzles.
  let ease = 0, roughRounds = 0, cleanRounds = 0, easeNote = '';
  let api = null, round = null, P = null, puzzleCleanup = null, clock = null, whyBox = null;
  let timeLeft = timeLimit;
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
    timers.add(t);
  };

  // HUD
  const heartEls = Array.from({ length: HEARTS }, () => h('span', { class: 'heart' }, '❤️'));
  const heartsEl = h('div', { class: 'hearts', role: 'img', 'aria-label': `${HEARTS} hearts left` }, heartEls);
  const dotsEl = endless
    ? h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Depth'), h('span', { class: 'depth' }, '0'))
    : h('div', { class: 'round-dots', 'aria-hidden': 'true' }, Array.from({ length: total }, () => h('span')));
  const scoreEl = h('span', {}, '0');
  const pearlEl = h('span', {}, S.getState().pearls);
  const timeEl = h('span', {}, fmtTime(timeLeft));
  const timerStat = timeLimit ? h('div', { class: 'stat timer', 'aria-label': 'Time left' }, '⏱ ', timeEl) : null;
  const title = mode === 'level' ? `${world.name} · ${world.num}-${params.levelIndex + 1}` : `${world.name} · ${level.name}`;

  const hud = h('header', { class: 'hud panel' },
    h('button', { class: 'icon-btn', 'aria-label': 'Leave level', onclick: askQuit }, '✕'),
    h('div', { class: 'hud-title' }, h('div', { class: 'eyebrow' }, title), h('div', { class: 'hud-level' }, level.name)),
    dotsEl,
    heartsEl,
    timerStat,
    h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Score'), scoreEl),
    h('div', { class: 'stat' }, h('i', { class: 'pearl' }), pearlEl),
    readAloudButton(on => { if (on) speak(speechText.textContent); }),
    muteButton());

  const eyebrow = h('div', { class: 'eyebrow' });
  const promptEl = h('h2', { class: 'prompt' });
  const hintBtn = h('button', { class: 'btn btn--sand btn--small', hidden: true, onclick: useHint });
  const puzzleRoot = h('div', { class: 'puzzle' });
  // Everything in the play area goes in .fit, which is scaled down when it's taller than the space.
  const fitBox = h('div', { class: 'fit' });
  puzzleRoot.append(fitBox);
  const fit = () => {
    fitBox.style.transform = '';
    const s = Math.min(1, puzzleRoot.clientHeight / fitBox.offsetHeight, puzzleRoot.clientWidth / fitBox.scrollWidth);
    if (s < 1) fitBox.style.transform = `scale(${Math.max(0.5, s)})`;
  };
  const fitWatch = new ResizeObserver(() => requestAnimationFrame(fit));
  fitWatch.observe(fitBox);
  fitWatch.observe(puzzleRoot);
  const stage = h('section', { class: 'stage panel' },
    h('div', { class: 'stage-head' }, h('div', {}, eyebrow, promptEl), hintBtn),
    puzzleRoot);

  const speechText = h('p', { class: 'speech-text' });
  const speech = h('div', { class: 'speech panel', 'aria-live': 'polite' }, h('div', { class: 'speech-name' }, 'Sprig'), speechText);
  app.append(h('div', { class: 'screen level-screen' }, hud, stage, h('div', { class: 'sprig-bar' }, sprig(), speech)));

  function say(text, kind = '') {
    speechText.textContent = text;
    speech.dataset.kind = kind;
    replay(speech, 'pop-in');
    speak(text);
  }

  function drawDots() {
    if (endless) {
      dotsEl.querySelector('.depth').textContent = idx;
      return;
    }
    [...dotsEl.children].forEach((d, i) => { d.className = i < idx ? 'done' : i === idx ? 'now' : ''; });
  }

  function drawHearts(justLost) {
    heartEls.forEach((el, i) => {
      el.classList.toggle('lost', i >= hearts);
      if (justLost && i === hearts) replay(el, 'losing');
    });
    heartsEl.setAttribute('aria-label', `${hearts} heart${hearts === 1 ? '' : 's'} left`);
  }

  function drawHintBtn() {
    hintBtn.hidden = false;
    hintBtn.textContent = hintStage === 0 ? (HINT_COST ? `Hint · ${HINT_COST} pearls` : 'Hint') : 'More help';
  }

  // ---- Intro ----
  function showIntro() {
    if (!total) {
      fitBox.replaceChildren(h('div', { class: 'intro' },
        h('h3', {}, 'Nothing to practise!'),
        h('p', { class: 'intro-rules' }, 'You haven’t missed any puzzles lately. Come back after a few levels.'),
        h('button', { class: 'btn btn--big', onclick: nav.map }, 'Back to the map')));
      say('Great work. There’s nothing to practise right now.');
      return;
    }
    eyebrow.textContent = mode === 'level' ? `Level ${world.num}-${params.levelIndex + 1}` : level.name;
    promptEl.textContent = level.name;
    const list = endless ? session.types : session.templates;
    const types = [...new Set(list.map(r => PUZZLES[r.type].name))];
    const starRule = cfg.stars[0] ? `${cfg.stars[0]} mistake or fewer earns 3 stars` : 'no mistakes earns 3 stars';
    const days = S.dailyStreak();
    const rules = {
      free: `${HEARTS} hearts · puzzles get harder the deeper you go`,
      daily: `${total} puzzles · ${HEARTS} hearts · streak: ${days} day${days === 1 ? '' : 's'}`,
      practice: `${total} puzzle${total === 1 ? '' : 's'} · ${HEARTS} hearts · new numbers every time`,
      level: timeLimit
        ? `${total} puzzles · ${HEARTS} hearts · ${fmtTime(timeLimit)} on the tide clock`
        : `${total} puzzles · ${HEARTS} hearts · ${starRule}`,
    }[mode];
    const best = mode === 'level' ? S.levelRecord(level.id) : null;
    const deepest = endless ? S.freeBest(session.band) : null;
    fitBox.replaceChildren(h('div', { class: 'intro' },
      h('h3', {}, level.name),
      h('div', { class: 'intro-tags' }, types.slice(0, 6).map(t => h('span', { class: 'chip' }, t))),
      h('p', { class: 'intro-rules' }, rules),
      best ? h('p', { class: 'intro-rules' }, `Your best: ${'★'.repeat(best.stars)} · ${best.score} points`) : null,
      deepest ? h('p', { class: 'intro-rules' }, `Your record: depth ${deepest.depth} · ${deepest.score} points`) : null,
      h('button', { class: 'btn btn--big', onclick: begin }, 'Start')));
    say(level.intro);
    drawDots();
  }

  function begin() {
    audio.tap();
    started = performance.now();
    if (timeLimit) {
      clock = setInterval(() => {
        if (ended) return;
        timeLeft--;
        timeEl.textContent = fmtTime(Math.max(0, timeLeft));
        timerStat.classList.toggle('low', timeLeft <= 20);
        if (timeLeft <= 0) {
          if (api) api.locked = true;
          fail('The tide went out before you finished. Try to move a little faster!');
        }
      }, 1000);
    }
    runRound();
  }

  // ---- Rounds ----
  function runRound() {
    const template = endless ? session.next(idx) : session.templates[idx];
    const e = session.adaptive ? ease : 0;
    round = { ...vary(template, rng, session.band, { ease: e }), optionCount: Math.max(2, cfg.options - (e < 0 ? 1 : 0)) };
    P = PUZZLES[round.type];
    roundMistake = false;
    hintStage = 0;
    whyBox = null;
    drawHintBtn();
    drawDots();
    eyebrow.textContent = endless ? `Puzzle ${idx + 1} · ${P.name}` : `Puzzle ${idx + 1} of ${total} · ${P.name}`;
    promptEl.textContent = round.prompt || P.prompt(round);
    fitBox.replaceChildren();
    puzzleRoot.className = `puzzle puzzle--${P.id}`;
    puzzleRoot.bloomoraRound = round; // lets automated tests read the generated round

    const a = { locked: false };
    a.correct = note => onCorrect(a, note);
    a.wrong = note => onWrong(a, note);
    a.say = say;
    a.showWhy = el => {
      if (a !== api) return;
      whyBox?.remove();
      whyBox = el;
      fitBox.append(el);
    };
    api = a;
    puzzleCleanup = P.mount(fitBox, round, a) || null;
    const line = easeNote || round.say || P.say(round);
    easeNote = '';
    say(line);
    speak(`${promptEl.textContent} ${line}`);
  }

  function onCorrect(a, note) {
    if (a.locked || ended) return;
    a.locked = true;
    audio.correct();
    if (!roundMistake) S.recordSkill(round.type, true);
    if (roundMistake) S.recordMiss(round.src, session.band);
    else if (dueSet.has(round.src)) S.recordReviewSuccess(round.src);
    updateEase();
    streak = roundMistake ? 0 : streak + 1;
    const pts = 100 + (streak > 1 ? (streak - 1) * 25 : 0);
    score += pts;
    scoreEl.textContent = score;
    floatText(streak > 1 ? `+${pts}  combo ×${streak}` : `+${pts}`, stage);
    say(note ? `${pick(PRAISE)} ${note}` : pick(PRAISE), 'good');
    later(nextRound, whyBox ? 2200 : 1500);
  }

  function updateEase() {
    if (!session.adaptive) return;
    if (roundMistake) { roughRounds++; cleanRounds = 0; } else { cleanRounds++; roughRounds = 0; }
    if (roughRounds >= 2 && ease > -1) {
      ease--;
      roughRounds = 0;
      easeNote = 'Let’s try a gentler one.';
    } else if (cleanRounds >= 3 && ease < 1) {
      ease++;
      cleanRounds = 0;
      easeNote = 'You’re on fire! Here’s a trickier one.';
    }
  }

  function onWrong(a, note) {
    if (a.locked || ended) return;
    audio.wrong();
    if (!roundMistake) S.recordSkill(round.type, false);
    hearts--;
    mistakes++;
    roundMistake = true;
    streak = 0;
    replay(stage, 'shake');
    drawHearts(true);
    say(note || 'Not quite. Look again!', 'bad');
    if (hearts <= 0) {
      a.locked = true;
      S.recordMiss(round.src, session.band);
      later(() => (endless ? finishEndless() : fail('Out of hearts! The tide carried your shells away.')), 1000);
    }
  }

  function nextRound() {
    puzzleCleanup?.();
    puzzleCleanup = null;
    idx++;
    if (idx < total) runRound();
    else if (endless) finishEndless();
    else if (mode === 'daily') finishDaily();
    else if (mode === 'practice') finishPractice();
    else finish();
  }

  function stopClock() {
    clearInterval(clock);
    clock = null;
  }

  function wrapUp() {
    ended = true;
    stopClock();
    drawDots();
    hintBtn.hidden = true;
    puzzleCleanup?.();
    puzzleCleanup = null;
    audio.bloom();
    confetti();
    say('The lagoon is blooming! Look at all that light.', 'good');
  }

  function finish() {
    wrapUp();
    const secs = (performance.now() - started) / 1000;
    const par = level.par || total * 35;
    const timeBonus = cfg.speedBonus ? Math.max(0, Math.round((par - secs) * 5)) : 0;
    const stars = mistakes <= cfg.stars[0] ? 3 : mistakes <= cfg.stars[1] ? 2 : 1;
    const totalScore = score + timeBonus;
    const rec = S.recordResult(level.id, stars, totalScore);
    const pearls = stars * 5 + (rec.firstClear ? 10 : 0);
    S.addPearls(pearls);
    pearlEl.textContent = S.getState().pearls;
    const next = params.levelIndex + 1 < world.levels.length ? params.levelIndex + 1 : null;
    showResults({
      levelName: level.name, stars, score, timeBonus, secs, speedBonus: cfg.speedBonus, starRule: cfg.stars, total: totalScore, pearls, newBest: rec.newBest,
      onRetry: retry,
      onMap: nav.map,
      onNext: next !== null ? () => nav.level(params.worldId, next) : null,
    });
  }

  function finishDaily() {
    wrapUp();
    const { streak: days, first } = S.recordDaily(session.band, score);
    const pearls = first ? 10 + Math.max(0, 3 - mistakes) * 3 : 0;
    if (pearls) S.addPearls(pearls);
    pearlEl.textContent = S.getState().pearls;
    showSimpleResults({
      eyebrow: 'Daily Dive done', title: `🔥 ${days}-day streak`,
      text: first ? 'Come back tomorrow for six new puzzles.' : 'You already finished today’s dive, so this replay doesn’t change your streak.',
      rows: [['Score', score], ['Mistakes', mistakes], ['Pearls found', `+${pearls}`]],
      onRetry: retry, onMap: nav.map,
    });
  }

  function finishPractice() {
    wrapUp();
    const pearls = Math.max(0, total - mistakes) * 3;
    S.addPearls(pearls);
    pearlEl.textContent = S.getState().pearls;
    const left = S.dueReviews(session.band).length;
    showSimpleResults({
      eyebrow: 'Practice done', title: mistakes ? 'Getting stronger!' : 'Nailed it!',
      text: left ? `${left} puzzle${left === 1 ? '' : 's'} still want more practice. They’ll come back soon.` : 'Every tricky puzzle is cleared for now.',
      rows: [['Puzzles', total], ['Mistakes', mistakes], ['Pearls found', `+${pearls}`]],
      onRetry: left ? retry : null, onMap: nav.map,
    });
  }

  function finishEndless() {
    if (ended) return;
    ended = true;
    puzzleCleanup?.();
    puzzleCleanup = null;
    hintBtn.hidden = true;
    const prev = S.freeBest(session.band);
    const isRecord = S.recordFreeDive(session.band, idx, score);
    const pearls = Math.min(30, idx * 2);
    S.addPearls(pearls);
    pearlEl.textContent = S.getState().pearls;
    audio.bloom();
    if (idx > 0) confetti();
    showFreeResults({ depth: idx, score, pearls, isRecord, prev, onRetry: retry, onMap: nav.map });
  }

  function fail(reason) {
    if (ended) return;
    ended = true;
    stopClock();
    puzzleCleanup?.();
    puzzleCleanup = null;
    audio.fail();
    showFail({ reason, onRetry: retry, onMap: nav.map });
  }

  // Two-step hints: first a gentle nudge (paid for in pearls in older bands), then the full hint free.
  function useHint() {
    if (!api || api.locked || ended) return;
    if (hintStage === 0) {
      if (HINT_COST && !S.spendPearls(HINT_COST)) {
        toast(`A hint costs ${HINT_COST} pearls. Clear levels to find more.`);
        return;
      }
      if (HINT_COST) audio.coin();
      pearlEl.textContent = S.getState().pearls;
      hintStage = 1;
      say(P.nudge ? P.nudge(round) : P.hint(round), 'hint');
    } else {
      hintStage = 2;
      say(P.hint(round), 'hint');
    }
    drawHintBtn();
  }

  function askQuit() {
    if (ended || !started) {
      nav.map();
      return;
    }
    confirmBox({
      title: 'Leave this level?',
      body: 'You’ll lose your progress in this level.',
      ok: 'Leave',
      cancel: 'Keep playing',
      onOk: nav.map,
    });
  }

  showIntro();

  return () => {
    ended = true;
    stopClock();
    timers.forEach(clearTimeout);
    puzzleCleanup?.();
    stopSpeaking();
    fitWatch.disconnect();
    closeOverlay();
  };
}
