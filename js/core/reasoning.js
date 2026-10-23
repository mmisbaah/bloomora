import { h, shuffle } from './dom.js';
import { ruleCards, seqFn, fmt } from './sequences.js';
import { t } from './i18n.js';

// A separate, untimed explanation check. It never removes hearts or changes level stars.
export function reasoningCheck(root, round, { say, onDone, onAnswer }) {
  const cards = ruleCards(round.seq);
  const right = cards.find(c => c.correct), wrong = cards.find(c => !c.correct);
  if (!right || !wrong) { onDone(); return; }
  const f = seqFn(round.seq);
  const feedback = h('p', { role: 'status', class: 'reason-feedback' });
  let answered = false;
  const next = h('button', { class: 'btn', hidden: true, onclick: onDone }, t('Keep diving'));
  const choices = h('div', { class: 'cards' }, shuffle([right, wrong]).map(c => h('button', {
    class: 'rule-card', 'data-reason-correct': String(c.correct), onclick: event => {
      if (answered) return;
      onAnswer(!!c.correct);
      if (c.correct) {
        answered = true;
        event.currentTarget.classList.add('is-right');
        feedback.textContent = t('Yes. A rule must work for every step. Try explaining it in your own words.');
        say(feedback.textContent, 'good');
        next.hidden = false;
        choices.querySelectorAll('button').forEach(b => { b.disabled = true; });
        next.focus();
      } else {
        event.currentTarget.disabled = true;
        feedback.textContent = t('Test both rules on the second jump as well. Which one still works?');
        say(feedback.textContent, 'hint');
      }
    },
  }, localRule(c.text))));
  root.replaceChildren(h('div', { class: 'reasoning-check intro' },
    h('h3', {}, t('Why does it work?')),
    h('p', {}, t('Compare these rules. Which explains every step?')),
    h('div', { class: 'xs-groups', dir: 'ltr' }, [0, 1, 2].map(i => h('span', { class: 'xs-group' }, `${t('Pool {n}', { n: round.from + i })}: ${fmt(f(round.from + i))}`))),
    choices, feedback, next,
    h('button', { class: 'btn btn--ghost btn--small', onclick: onDone }, t('Explore this later'))));
  say(t('Compare these rules. Which explains every step?'), 'hint');
}

function localRule(text) {
  for (const rule of ['Add', 'Take away', 'Multiply by']) {
    const prefix = `${rule} `;
    if (text.startsWith(prefix) && text.endsWith(' each time')) {
      return t(`${rule} {n} each time`, { n: text.slice(prefix.length, -10) });
    }
  }
  return t(text);
}
