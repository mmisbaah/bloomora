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
import { PUZZLES, lookFor, puzzleName, puzzlePrompt, puzzleSay } from '../puzzles/index.js';
import { ghostHand, howText } from '../ui/tutorial.js';
import { CAN_DO } from '../data/cando.js';
import { sprig, setMood, confirmBox, closeOverlay } from '../ui/widgets.js';
import { settingsButton } from '../ui/settings.js';
import { showResults, showFail, showFreeResults, showSimpleResults } from './results.js';
import { noteCleared, noteWorldDone } from './map.js';
import { pic } from '../ui/art.js';
import { t, isArabic, AR_PRAISE } from '../core/i18n.js';
import { workedExample, guideRound } from '../core/learning.js';
import { reasoningCheck } from '../core/reasoning.js';
import { practiceTemplates } from '../core/practice.js';

const PRAISE = ['Splash-tastic!', 'You cracked it!', 'The lagoon glows brighter!', 'Sharp eyes!', 'Pattern found!', 'Sprig is impressed!'];
const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const FREE_ROUNDS = 200;
const DAILY_ROUNDS = 6;
const PRACTICE_ROUNDS = 3;

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
  const state = S.getState();
  const practiceRng = makeRng();
  const practice = practiceTemplates(S.dueReviews(bandId), templateFor, byLevel, state.levels, state.objectives, practiceRng, PRACTICE_ROUNDS);
  return {
    mode: 'practice', world, band: bandId, rng: practiceRng, adaptive: true,
    templates: practice,
    level: { id: `practice-${bandId}`, name: 'Practice Pool', intro: 'These are puzzles that tripped you up before, with new numbers. Let’s make them easy!' },
  };
}

export function levelScreen(app, params, nav) {
  const session = buildSession(params);
  const { world, level, mode, rng } = session;
  const endless = !!session.endless;
  const total = endless ? FREE_ROUNDS : session.templates.length;
  const cfg = findBand(session.band).settings;
  // Minnows have no hearts in levels: they can keep trying. Free Dive still needs an end, so it gets 5.
  const HEARTS = cfg.hearts || (endless ? 5 : 0);
  let unlimited = HEARTS === 0 || !!S.getState().relaxed;
  const timeLimit = cfg.timer && mode === 'level' ? level.timeLimit || 0 : 0;
  const retry = () => (mode === 'level' ? nav.level(params.worldId, params.levelIndex) : nav[mode](session.band));
  const dueSet = new Set(S.dueReviews(session.band).map(r => r.src));

  let hearts = HEARTS, idx = 0, score = 0, streak = 0, mistakes = 0;
  let roundMistake = false, hintStage = 0, ended = false, started = 0;
  // Adaptive difficulty: two rough rounds in a row make the next ones gentler, three clean
  // rounds in a row make them harder. Daily Dive stays fixed so everyone gets the same puzzles.
  let ease = 0, roughRounds = 0, cleanRounds = 0, easeNote = '';
  let api = null, round = null, P = null, puzzleCleanup = null, clock = null, whyBox = null, stopHand = null;
  let timeLeft = timeLimit;
  let usedRelaxed = !!S.getState().relaxed, activeSeconds = 0, lastTick = 0, solved = 0, reflecting = false;
  let stopGuide = null, helpBox = null, assisted = false;
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
    timers.add(t);
  };

  // HUD
  const heartEls = Array.from({ length: HEARTS }, () => h('span', { class: 'heart' }, '❤️'));
  const heartsEl = h('div', { class: 'hearts', hidden: unlimited, role: 'img', 'aria-label': `${HEARTS} hearts left` }, heartEls);
  const dotsEl = endless
    ? h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, t('Depth')), h('span', { class: 'depth' }, '0'))
    : h('div', { class: 'round-dots', 'aria-hidden': 'true' }, Array.from({ length: total }, () => h('span')));
  const scoreEl = h('span', {}, '0');
  const pearlEl = h('span', {}, S.getState().pearls);
  const timeEl = h('span', {}, fmtTime(timeLeft));
  const timerStat = timeLimit ? h('div', { class: 'stat timer', hidden: !!S.getState().relaxed, 'aria-label': 'Time left' }, '⏱ ', timeEl) : null;
  const title = mode === 'level' ? `${world.name} · ${world.num}-${params.levelIndex + 1}` : `${world.name} · ${level.name}`;

  const hud = h('header', { class: 'hud panel' },
    h('div', { class: 'hud-title' }, h('div', { class: 'eyebrow' }, title), h('div', { class: 'hud-level' }, level.name)),
    dotsEl,
    heartsEl,
    timerStat,
    h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, t('Score')), scoreEl),
    h('div', { class: 'stat' }, h('i', { class: 'pearl' }), pearlEl),
    endless ? h('button', { class: 'btn btn--small btn--ghost', onclick: () => { if (!ended && started) finishEndless(); } }, t('End dive')) : null,
    settingsButton({ onLeave: askQuit, onShowMe: () => showMeHow(true) }));

  const eyebrow = h('div', { class: 'eyebrow' });
  const promptEl = h('h2', { class: 'prompt' });
  const hintBtn = h('button', { class: 'btn btn--sand btn--small', hidden: true, onclick: useHint });
  const puzzleRoot = h('div', { class: 'puzzle' });
  // Everything in the play area goes in .fit, which is scaled down when it's taller than the space.
  const fitBox = h('div', { class: 'fit' });
  puzzleRoot.append(fitBox);
  const fit = () => {
    if (!puzzleRoot.isConnected || !puzzleRoot.clientWidth || !puzzleRoot.clientHeight) return;
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
  const sprigEl = sprig();
  app.append(h('div', { class: 'screen level-screen' }, hud, stage, h('div', { class: 'sprig-bar' }, sprigEl, speech)));

  function say(text, kind = '') {
    speechText.textContent = text;
    speech.dataset.kind = kind;
    setMood(sprigEl, { good: 'happy', bad: 'oops', hint: 'think' }[kind] || 'calm');
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
    heartsEl?.setAttribute('aria-label', `${hearts} heart${hearts === 1 ? '' : 's'} left`);
  }

  function drawHintBtn() {
    hintBtn.hidden = false;
    hintBtn.textContent = t(['Clue · free', 'Worked example', 'Guide me', 'Guidance on'][hintStage]);
    hintBtn.disabled = hintStage >= 3;
  }

  function applyPlayOptions() {
    const relaxed = !!S.getState().relaxed;
    usedRelaxed ||= relaxed;
    unlimited = HEARTS === 0 || relaxed;
    heartsEl.hidden = unlimited;
    if (timerStat) timerStat.hidden = relaxed;
  }
  window.addEventListener('bloomora:play-options', applyPlayOptions);
  const resetTick = () => { lastTick = performance.now(); };
  document.addEventListener('visibilitychange', resetTick);

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
    // The first time a child enters a world, a short story card sets the scene.
    if (mode === 'level' && world.story && !S.getState().storiesSeen?.[world.id]) {
      S.setPref('storiesSeen', { ...S.getState().storiesSeen, [world.id]: true });
      eyebrow.textContent = world.boss ? t('Boss level') : t('World {n}', { n: world.num });
      promptEl.textContent = world.name;
      fitBox.replaceChildren(h('div', { class: 'intro chapter' },
        h('div', { class: 'chapter-friend sleeping', 'aria-hidden': 'true' }, pic(world.reward.emoji, { cls: 'chapter-pic' }), h('span', { class: 'zzz' }, 'z z z')),
        h('p', { class: 'chapter-text' }, world.story.open),
        h('button', { class: 'btn btn--big', onclick: () => { audio.tap(); showIntro(); } }, t('Let’s go!'))));
      say(world.story.open);
      return;
    }
    eyebrow.textContent = mode === 'level' ? t('Level {w}-{n}', { w: world.num, n: params.levelIndex + 1 }) : level.name;
    promptEl.textContent = level.name;
    const list = endless ? session.types : session.templates;
    const types = [...new Map(list.map(r => [puzzleName(PUZZLES[r.type]), lookFor(r.type)])).entries()];
    const lives = unlimited ? t('no hearts to lose, so take your time') : t('{n} hearts', { n: HEARTS });
    const starRule = cfg.stars[0] ? t('1 mistake or fewer earns 3 stars') : t('no mistakes earns 3 stars');
    const puzzles = t('{n} puzzles', { n: total });
    const days = S.dailyStreak();
    const rules = {
      free: `${lives} · ${t('puzzles get harder the deeper you go')}`,
      daily: `${puzzles} · ${lives} · ${t('streak: {n} days', { n: days })}`,
      practice: `${puzzles} · ${lives} · ${t('new numbers every time')}`,
      level: timeLimit && !S.getState().relaxed
        ? `${puzzles} · ${lives} · ${t('{t} on the tide clock', { t: fmtTime(timeLimit) })}`
        : `${puzzles} · ${lives} · ${starRule}`,
    }[mode];
    const best = mode === 'level' ? S.levelRecord(level.id) : null;
    const deepest = endless ? S.freeBest(session.band) : null;
    fitBox.replaceChildren(h('div', { class: 'intro' },
      h('h3', {}, level.name),
      h('div', { class: 'intro-tags' }, types.slice(0, 6).map(([name, look]) => h('span', { class: 'chip chip--type', style: { '--type': look.color } }, `${look.icon} ${name}`))),
      h('p', { class: 'intro-rules' }, rules),
      best ? h('p', { class: 'intro-rules' }, t('Your best: {stars} · {score} points', { stars: '★'.repeat(best.stars), score: best.score })) : null,
      deepest ? h('p', { class: 'intro-rules' }, `Your record: depth ${deepest.depth} · ${deepest.score} points`) : null,
      h('button', { class: 'btn btn--big', onclick: begin }, t('Start'))));
    say(isArabic() ? t('Look at the pattern carefully. What changes each time?') : level.intro);
    drawDots();
  }

  function begin() {
    audio.tap();
    started = performance.now();
    lastTick = performance.now();
    clock = setInterval(() => {
        const now = performance.now(), delta = (now - lastTick) / 1000;
        lastTick = now;
        if (ended || reflecting || document.hidden || document.querySelector('.overlay') || stopHand) return;
        activeSeconds += delta;
        if (timeLimit && !S.getState().relaxed) {
          timeLeft = Math.max(0, timeLeft - delta);
          timeEl.textContent = fmtTime(Math.ceil(timeLeft));
          timerStat.classList.toggle('low', timeLeft <= 20);
        }
        if (timeLimit && !S.getState().relaxed && timeLeft <= 0) {
          if (api) api.locked = true;
          fail(t('The tide went out before you finished. Try to move a little faster!'));
        }
      }, 250);
    runRound();
  }

  // ---- Rounds ----
  function runRound() {
    stopGuide?.();
    stopGuide = null;
    helpBox = null;
    assisted = false;
    const template = endless ? session.next(idx) : session.templates[idx];
    const e = session.adaptive ? ease : 0;
    round = { ...vary(template, rng, session.band, { ease: e }), optionCount: Math.max(2, cfg.options - (e < 0 ? 1 : 0)) };
    P = PUZZLES[round.type];
    roundMistake = false;
    hintStage = 0;
    whyBox = null;
    drawHintBtn();
    drawDots();
    const look = lookFor(P.id);
    eyebrow.textContent = `${look.icon} ${puzzleName(P)}`;
    stage.style.setProperty('--type', look.color);
    promptEl.textContent = puzzlePrompt(P, round);
    fitBox.replaceChildren();
    puzzleRoot.className = `puzzle puzzle--${P.id}`;
    fitBox.classList.remove('swim-out'); // otherwise the last puzzle's fade-out keeps this one invisible
    replay(fitBox, 'swim-in');
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
      fit();
    };
    api = a;
    puzzleCleanup = P.mount(fitBox, round, a) || null;
    labelKeys();
    const line = easeNote || puzzleSay(P, round);
    easeNote = '';
    say(line);
    speak(`${promptEl.textContent} ${line}`);
    if (!S.getState().tutorials?.[P.id]) {
      S.setPref('tutorials', { ...S.getState().tutorials, [P.id]: true });
      later(() => showMeHow(false), 500);
    }
  }

  // Keyboard play: when there's no number pad, keys 1–9 press the answer buttons in order.
  let keyed = [];
  function labelKeys() {
    keyed = fitBox.querySelector('.numpad') ? [] : [...fitBox.querySelectorAll('.option, .parade-option, .rule-card, button.stone')].slice(0, 9);
    keyed.forEach((b, i) => { b.dataset.key = i + 1; });
  }
  const onKey = e => {
    if (!/^[1-9]$/.test(e.key) || !keyed.length || !api || api.locked || ended || document.querySelector('.overlay')) return;
    const b = keyed[Number(e.key) - 1];
    if (b && !b.disabled) { e.preventDefault(); b.click(); }
  };
  document.addEventListener('keydown', onKey);

  // The ghost hand shows where to look and where to answer. It never answers for the child.
  function showMeHow(fromMenu) {
    if (!api || api.locked || ended) {
      if (fromMenu) toast(t('Start a puzzle first, then I can show you how.'));
      return;
    }
    stopHand?.();
    say(howText(P.id) || puzzleSay(P, round), 'hint');
    stopHand = ghostHand(stage, fitBox, () => { stopHand = null; });
  }

  function onCorrect(a, note) {
    if (a.locked || ended) return;
    a.locked = true;
    solved++;
    audio.correct();
    const reviewSrc = round.reviewSrc || round.src;
    if (!roundMistake) {
      S.recordSkill(round.type, true);
      S.recordLearning(round, { right: true, assisted });
    }
    if (roundMistake || assisted) S.recordMiss(reviewSrc, session.band);
    else if (dueSet.has(reviewSrc)) { S.recordReviewSuccess(reviewSrc); dueSet.delete(reviewSrc); }
    updateEase();
    streak = roundMistake || assisted ? 0 : streak + 1;
    const pts = 100 + (streak > 1 ? (streak - 1) * 25 : 0);
    score += pts;
    scoreEl.textContent = score;
    floatText(streak > 1 ? `+${pts}  combo ×${streak}` : `+${pts}`, stage);
    // Puzzle feedback notes are English-only, so other languages get praise on its own.
    say(isArabic() ? pick(AR_PRAISE) : note ? `${pick(PRAISE)} ${note}` : pick(PRAISE), 'good');
    later(() => {
      const sequencePuzzle = ['build', 'predict', 'missing', 'oddOne', 'rule', 'story', 'table'].includes(round.type);
      const canReflect = mode === 'level' && sequencePuzzle && session.band !== 'minnows' && (idx + 1) % 3 === 0 && round.seq && !round.seq.format && ['arith', 'geo', 'square', 'tri', 'fib'].includes(round.seq.kind);
      if (!canReflect) { nextRound(); return; }
      puzzleCleanup?.(); puzzleCleanup = null;
      stopGuide?.(); stopGuide = null;
      stopHand?.(); stopHand = null;
      reflecting = true;
      hintBtn.hidden = true;
      reasoningCheck(fitBox, round, { say,
        onDone: () => { if (!reflecting || ended) return; reflecting = false; nextRound(); },
        onAnswer: right => S.recordReasoning(round, right),
      });
    }, whyBox ? 2200 : 1500);
  }

  function updateEase() {
    if (!session.adaptive) return;
    if (roundMistake || assisted) { roughRounds++; cleanRounds = 0; } else { cleanRounds++; roughRounds = 0; }
    if (roughRounds >= 2 && ease > -1) {
      ease--;
      roughRounds = 0;
      easeNote = t('Let’s try a gentler one.');
    } else if (cleanRounds >= 3 && ease < 1) {
      ease++;
      cleanRounds = 0;
      easeNote = t('You’re on fire! Here’s a trickier one.');
    }
  }

  function onWrong(a, note) {
    if (a.locked || ended) return;
    audio.wrong();
    const firstMiss = !roundMistake;
    if (firstMiss) {
      S.recordSkill(round.type, false);
      S.recordLearning(round, { right: false, assisted });
      S.recordMiss(round.reviewSrc || round.src, session.band);
      if (!unlimited) hearts--;
      mistakes++;
    }
    roundMistake = true;
    streak = 0;
    replay(stage, 'shake');
    drawHearts(firstMiss && !unlimited);
    const feedback = isArabic() || !note ? t('Not quite. Look again!') : note;
    say(`${feedback} ${t('Take your time. Corrections on this puzzle cost no more hearts.')}`, 'bad');
    if (!unlimited && hearts <= 0) {
      a.locked = true;
      S.recordMiss(round.reviewSrc || round.src, session.band);
      later(() => (endless ? finishEndless() : fail(t('Out of hearts! The tide carried your shells away.'))), 1000);
    }
  }

  function nextRound() {
    puzzleCleanup?.();
    puzzleCleanup = null;
    stopHand?.();
    idx++;
    if (idx < total) {
      // The finished puzzle swims off to the left before the next one arrives.
      audio.whoosh();
      replay(fitBox, 'swim-out');
      later(runRound, 260);
    }
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
    say(t('The lagoon is blooming! Look at all that light.'), 'good');
  }

  function finish() {
    wrapUp();
    const secs = activeSeconds;
    const par = level.par || total * 35;
    const speedBonus = cfg.speedBonus && !usedRelaxed;
    const timeBonus = speedBonus ? Math.max(0, Math.round((par - secs) * 5)) : 0;
    const stars = mistakes <= cfg.stars[0] ? 3 : mistakes <= cfg.stars[1] ? 2 : 1;
    const totalScore = score + timeBonus;
    const wasDone = world.levels.every(l => S.levelRecord(l.id));
    const rec = S.recordResult(level.id, stars, totalScore);
    noteCleared(world.id, params.levelIndex);
    if (!wasDone && world.levels.every(l => S.levelRecord(l.id))) noteWorldDone(world.id);
    const pearls = stars * 5 + (rec.firstClear ? 10 : 0);
    S.addPearls(pearls);
    pearlEl.textContent = S.getState().pearls;
    const next = params.levelIndex + 1 < world.levels.length ? params.levelIndex + 1 : null;
    const young = session.band === 'minnows' || session.band === 'turtles';
    showResults({
      can: CAN_DO[level.id], young,
      levelName: level.name, stars, score, timeBonus, secs, speedBonus, starRule: cfg.stars, total: totalScore, pearls, newBest: rec.newBest,
      onRetry: retry,
      onMap: nav.map,
      onNext: next !== null ? () => nav.level(params.worldId, next) : null,
      onMake: nav.maker,
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
      text: left ? `Good work. Take a break! ${left} puzzle${left === 1 ? '' : 's'} still want more practice when you return.` : 'Every tricky puzzle is cleared for now. Take a break and come back later!',
      rows: [['Puzzles', total], ['Mistakes', mistakes], ['Pearls found', `+${pearls}`]],
      onRetry: left ? retry : null, onMap: nav.map,
    });
  }

  function finishEndless() {
    if (ended) return;
    ended = true;
    stopClock();
    puzzleCleanup?.();
    puzzleCleanup = null;
    hintBtn.hidden = true;
    const prev = S.freeBest(session.band);
    const isRecord = S.recordFreeDive(session.band, solved, score);
    const pearls = Math.min(30, solved * 2);
    S.addPearls(pearls);
    pearlEl.textContent = S.getState().pearls;
    audio.bloom();
    if (solved > 0) confetti();
    showFreeResults({ depth: solved, score, pearls, isRecord, prev, onRetry: retry, onMap: nav.map });
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

  // Help is always free. The child still makes every final move.
  function useHint() {
    if (!api || api.locked || ended) return;
    assisted = true;
    if (hintStage === 0) {
      hintStage = 1;
      say(isArabic() ? howText(P.id) : P.nudge ? P.nudge(round) : P.hint(round), 'hint');
    } else if (hintStage === 1) {
      hintStage = 2;
      helpBox = workedExample(round);
      fitBox.append(helpBox);
      say(t('Try this example, then return to your puzzle.'), 'hint');
    } else if (hintStage === 2) {
      hintStage = 3;
      helpBox?.remove();
      stopGuide = guideRound(fitBox, round);
      say(t('Follow the outlined step, then check your answer.'), 'hint');
    }
    drawHintBtn();
    fit();
  }

  function askQuit() {
    if (ended || !started) {
      nav.map();
      return;
    }
    confirmBox({
      title: t('Leave this level?'),
      body: t('You’ll lose your progress in this level.'),
      ok: t('Leave'),
      cancel: t('Keep playing'),
      onOk: nav.map,
    });
  }

  showIntro();

  return () => {
    ended = true;
    stopClock();
    timers.forEach(clearTimeout);
    stopHand?.();
    puzzleCleanup?.();
    stopSpeaking();
    stopGuide?.();
    fitWatch.disconnect();
    window.removeEventListener('bloomora:play-options', applyPlayOptions);
    document.removeEventListener('visibilitychange', resetTick);
    document.removeEventListener('keydown', onKey);
    closeOverlay();
  };
}
