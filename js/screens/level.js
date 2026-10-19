// The play screen: HUD, the current puzzle, and Sprig's speech bar. Runs a level's rounds in order.
import { h, pick, replay } from '../core/dom.js';
import { audio } from '../core/audio.js';
import { confetti, floatText, toast } from '../core/fx.js';
import * as S from '../core/state.js';
import { findWorld, worldsInBand } from '../data/worlds.js';
import { makeRng, vary } from '../core/generate.js';
import { findBand } from '../data/bands.js';
import { speak, stopSpeaking } from '../core/speech.js';
import { PUZZLES } from '../puzzles/index.js';
import { sprig, muteButton, readAloudButton, confirmBox, closeOverlay } from '../ui/widgets.js';
import { showResults, showFail, showFreeResults } from './results.js';

const PRAISE = ['Splash-tastic!', 'You cracked it!', 'The lagoon glows brighter!', 'Sharp eyes!', 'Pattern found!', 'Sprig is impressed!'];
const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const FREE_ROUNDS = 200;

// Free Dive: an endless level built from every regular round template in one band. The pool of
// templates widens as the player goes, so it starts with the band's first levels.
function freeDive(bandId) {
  const band = findBand(bandId);
  const levels = worldsInBand(bandId).filter(w => !w.boss).flatMap(w =>
    w.levels.map(l => l.rounds.map(r => ({ ...w.defaults, ...l.defaults, ...r }))));
  const world = { id: `free-${bandId}`, band: bandId, name: `${band.name} Free Dive`, num: '∞', defaults: {}, levels: [] };
  const level = {
    id: `free-${bandId}`, name: 'Free Dive', endless: true,
    intro: 'Fresh puzzles keep coming until your hearts run out. How deep can you go?',
    templates: i => levels.slice(0, Math.min(levels.length, 2 + Math.floor(i / 2))).flat(),
    rounds: [],
  };
  world.levels.push(level);
  return { world, level };
}

export function levelScreen(app, { worldId, levelIndex, free }, nav) {
  const { world, level } = free ? freeDive(free) : { world: findWorld(worldId), level: findWorld(worldId).levels[levelIndex] };
  const endless = !!level.endless;
  // Difficulty comes from the level's age band: hearts, hint price, clock, answer choices, star rules.
  const cfg = findBand(world.band).settings;
  // Every play gets freshly generated problems from the level's templates.
  const rng = makeRng();
  const rounds = endless
    ? Array.from({ length: FREE_ROUNDS }, (_, i) => vary(pickTemplate(level.templates(i)), rng, world.band))
    : level.rounds.map(r => vary({ ...world.defaults, ...level.defaults, ...r }, rng, world.band));
  function pickTemplate(list) { return list[Math.floor(rng() * list.length)]; }
  const total = rounds.length;
  const retry = () => (endless ? nav.free(world.band) : nav.level(worldId, levelIndex));
  const HEARTS = cfg.hearts;
  const HINT_COST = cfg.hintCost;
  const timeLimit = cfg.timer ? level.timeLimit || 0 : 0;

  let hearts = HEARTS, idx = 0, score = 0, streak = 0, mistakes = 0;
  let roundMistake = false, hinted = false, ended = false, started = 0;
  let api = null, puzzleCleanup = null, currentHint = () => '', clock = null;
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
    : h('div', { class: 'round-dots', 'aria-hidden': 'true' }, rounds.map(() => h('span')));
  const scoreEl = h('span', {}, '0');
  const pearlEl = h('span', {}, S.getState().pearls);
  const timeEl = h('span', {}, fmtTime(timeLeft));
  const timerStat = timeLimit ? h('div', { class: 'stat timer', 'aria-label': 'Time left' }, '⏱ ', timeEl) : null;

  const hud = h('header', { class: 'hud panel' },
    h('button', { class: 'icon-btn', 'aria-label': 'Leave level', onclick: askQuit }, '✕'),
    h('div', { class: 'hud-title' },
      h('div', { class: 'eyebrow' }, endless ? world.name : `${world.name} · ${world.num}-${levelIndex + 1}`),
      h('div', { class: 'hud-level' }, level.name)),
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
    hintBtn.textContent = hinted || !HINT_COST ? 'Hint' : `Hint · ${HINT_COST} pearls`;
  }

  // ---- Intro ----
  function showIntro() {
    eyebrow.textContent = endless ? 'Endless · fresh puzzles' : `Level ${world.num}-${levelIndex + 1}`;
    promptEl.textContent = level.name;
    const types = [...new Set((endless ? level.templates(999) : level.rounds).map(r => PUZZLES[r.type].name))];
    const starRule = cfg.stars[0] ? `${cfg.stars[0]} mistake or fewer earns 3 stars` : 'no mistakes earns 3 stars';
    const rules = endless
      ? `${HEARTS} hearts · puzzles get harder the deeper you go · new numbers every time`
      : timeLimit
        ? `${total} puzzles · ${HEARTS} hearts · ${fmtTime(timeLimit)} on the tide clock · new numbers every time`
        : `${total} puzzles · ${HEARTS} hearts · ${starRule} · new numbers every time`;
    const best = endless ? null : S.levelRecord(level.id);
    const deepest = endless ? S.freeBest(world.band) : null;
    fitBox.replaceChildren(h('div', { class: 'intro' },
      h('h3', {}, level.name),
      h('div', { class: 'intro-tags' }, types.map(t => h('span', { class: 'chip' }, t))),
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
    const round = { optionCount: cfg.options, ...rounds[idx] };
    const P = PUZZLES[round.type];
    roundMistake = false;
    hinted = false;
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
    api = a;
    currentHint = () => P.hint(round);
    puzzleCleanup = P.mount(fitBox, round, a) || null;
    const line = round.say || P.say(round);
    say(line);
    speak(`${promptEl.textContent} ${line}`);
  }

  function onCorrect(a, note) {
    if (a.locked || ended) return;
    a.locked = true;
    audio.correct();
    streak = roundMistake ? 0 : streak + 1;
    const pts = 100 + (streak > 1 ? (streak - 1) * 25 : 0);
    score += pts;
    scoreEl.textContent = score;
    floatText(streak > 1 ? `+${pts}  combo ×${streak}` : `+${pts}`, stage);
    say(note ? `${pick(PRAISE)} ${note}` : pick(PRAISE), 'good');
    later(nextRound, 1500);
  }

  function onWrong(a, note) {
    if (a.locked || ended) return;
    audio.wrong();
    hearts--;
    mistakes++;
    roundMistake = true;
    streak = 0;
    replay(stage, 'shake');
    drawHearts(true);
    say(note || 'Not quite. Look again!', 'bad');
    if (hearts <= 0) {
      a.locked = true;
      later(() => (endless ? finishEndless() : fail('Out of hearts! The tide carried your shells away.')), 1000);
    }
  }

  function nextRound() {
    puzzleCleanup?.();
    puzzleCleanup = null;
    idx++;
    if (idx >= total) (endless ? finishEndless() : finish());
    else runRound();
  }

  function stopClock() {
    clearInterval(clock);
    clock = null;
  }

  function finish() {
    ended = true;
    stopClock();
    drawDots();
    hintBtn.hidden = true;
    const secs = (performance.now() - started) / 1000;
    const par = level.par || total * 35;
    const timeBonus = cfg.speedBonus ? Math.max(0, Math.round((par - secs) * 5)) : 0;
    const stars = mistakes <= cfg.stars[0] ? 3 : mistakes <= cfg.stars[1] ? 2 : 1;
    const totalScore = score + timeBonus;
    const rec = S.recordResult(level.id, stars, totalScore);
    const pearls = stars * 5 + (rec.firstClear ? 10 : 0);
    S.addPearls(pearls);
    pearlEl.textContent = S.getState().pearls;
    audio.bloom();
    confetti();
    say('The lagoon is blooming! Look at all that light.', 'good');

    const next = levelIndex + 1 < world.levels.length ? levelIndex + 1 : null;
    showResults({
      levelName: level.name, stars, score, timeBonus, secs, speedBonus: cfg.speedBonus, starRule: cfg.stars, total: totalScore, pearls, newBest: rec.newBest,
      onRetry: retry,
      onMap: nav.map,
      onNext: next !== null ? () => nav.level(worldId, next) : null,
    });
  }

  function finishEndless() {
    if (ended) return;
    ended = true;
    puzzleCleanup?.();
    puzzleCleanup = null;
    hintBtn.hidden = true;
    const prev = S.freeBest(world.band);
    const isRecord = S.recordFreeDive(world.band, idx, score);
    const pearls = Math.min(30, idx * 2);
    S.addPearls(pearls);
    pearlEl.textContent = S.getState().pearls;
    audio.bloom();
    if (idx > 0) confetti();
    showFreeResults({
      depth: idx, score, pearls, isRecord, prev,
      onRetry: retry,
      onMap: nav.map,
    });
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

  function useHint() {
    if (!api || api.locked || ended) return;
    if (!hinted && HINT_COST) {
      if (!S.spendPearls(HINT_COST)) {
        toast(`A hint costs ${HINT_COST} pearls. Clear levels to find more.`);
        return;
      }
      hinted = true;
      audio.coin();
      pearlEl.textContent = S.getState().pearls;
      drawHintBtn();
    }
    say(currentHint(), 'hint');
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
