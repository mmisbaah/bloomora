// Pattern Maker: the child makes a number pattern and Sprig tries to guess the rule.
// Turning the tables like this makes children describe rules, not just follow them.
import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';
import { confetti } from '../core/fx.js';
import { fmt } from '../core/sequences.js';
import { numpad } from '../core/numpad.js';
import { speak, stopSpeaking } from '../core/speech.js';
import { guessRule, continueWith } from '../core/guess.js';
import { sprig, setMood } from '../ui/widgets.js';
import { settingsButton } from '../ui/settings.js';
import { t, isArabic } from '../core/i18n.js';

const MAX = 6;
const IDEAS = ['2, 4, 6', '1, 4, 9', '5, 10, 20', '1, 1, 2, 3', '50, 45, 40'];

export function makerScreen(app, _params, nav) {
  const nums = [];
  const row = h('div', { class: 'maker-row', 'aria-live': 'polite' });
  const typing = h('span', { class: 'maker-typing' });
  const guessBtn = h('button', { class: 'btn', disabled: true, onclick: guess }, t('🤔 Sprig, guess my rule!'));
  const clearBtn = h('button', { class: 'btn btn--ghost btn--small', onclick: clear }, t('Start over'));
  const speechText = h('p', { class: 'speech-text' });
  const sprigEl = sprig();

  function say(text, mood = 'calm') {
    speechText.textContent = text;
    setMood(sprigEl, mood);
    speak(text);
  }

  function draw(extra = []) {
    row.replaceChildren(
      ...nums.map(v => h('span', { class: 'maker-num' }, fmt(v))),
      ...extra.map((v, i) => h('span', { class: 'maker-num maker-num--guess', style: { animationDelay: `${i * 220}ms` } }, fmt(v))),
      ...(nums.length < MAX && !extra.length ? [h('span', { class: 'maker-num maker-num--slot' }, typing)] : []));
    guessBtn.disabled = nums.length < 3;
  }

  const pad = numpad({
    negative: true,
    maxLen: 5,
    onChange: v => { typing.textContent = v || '?'; },
    onSubmit: v => {
      if (nums.length >= MAX) return;
      nums.push(v);
      pad.clear();
      typing.textContent = '?';
      audio.bubble();
      draw();
      if (nums.length === 3) say(t('Three numbers! Add more to make it trickier, or ask me to guess.'));
    },
  });

  function guess() {
    const rule = guessRule(nums);
    if (rule) {
      const next = continueWith(rule, nums);
      draw(next);
      audio.correct();
      say(`${rule.text} ${t('So next comes {next}. Did I get it?', { next: next.map(v => fmt(v)).join(isArabic() ? '، ' : ', ') })}`, 'happy');
    } else {
      draw();
      audio.bloom();
      confetti();
      say(t('You stumped me! I can’t find a rule. Can you explain your pattern to someone?'), 'oops');
    }
  }

  function clear() {
    nums.length = 0;
    pad.clear();
    typing.textContent = '?';
    draw();
    say(`${t('Make a pattern and I’ll guess the rule.')} ${isArabic() ? 'جرّب' : 'Try'} ${IDEAS[Math.floor(Math.random() * IDEAS.length)]} …`);
  }

  // Same shrink-to-fit as the play screen, so short landscape phones never scroll.
  const fitBox = h('div', { class: 'fit maker-fit' }, row, h('div', { class: 'maker-controls' }, pad.el, h('div', { class: 'maker-actions' }, guessBtn, clearBtn)));
  typing.textContent = '?';
  app.append(h('div', { class: 'screen maker-screen' },
    h('header', { class: 'top-bar' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back to map', onclick: nav.map }, '←'),
      h('div', { class: 'top-bar-title' }, h('h1', {}, t('Pattern Maker'))),
      settingsButton()),
    h('section', { class: 'stage panel maker-stage', style: { '--type': 'var(--lilac)' } },
      h('div', { class: 'eyebrow' }, t('🧪 Your turn to make one')),
      h('div', { class: 'puzzle' }, fitBox)),
    h('div', { class: 'sprig-bar' }, sprigEl, h('div', { class: 'speech panel' }, h('div', { class: 'speech-name' }, 'Sprig'), speechText))));
  clear();
  const box = fitBox.parentElement;
  const fit = () => {
    fitBox.style.transform = '';
    const k = Math.min(1, box.clientHeight / fitBox.offsetHeight, box.clientWidth / fitBox.scrollWidth);
    if (k < 1) fitBox.style.transform = `scale(${Math.max(0.5, k)})`;
  };
  const watch = new ResizeObserver(() => requestAnimationFrame(fit));
  watch.observe(fitBox);
  watch.observe(box);

  return () => { pad.destroy?.(); stopSpeaking(); watch.disconnect(); };
}
