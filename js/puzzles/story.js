// Pattern word problems: a short lagoon story with a few known steps, then a question about a
// later one. Common Core 4.OA.A.3 (multistep word problems) and England's "solve problems" strands.
import { h } from '../core/dom.js';
import { seqFn, hintFor, fmt } from '../core/sequences.js';
import { answerArea } from '../core/answer.js';
import { jumpStrip, why } from '../core/explain.js';
import { isArabic, AR_PLOTS } from '../core/i18n.js';

// {name} is filled in by the generator. step: what one step is called. thing: the unit after a number.
export const PLOTS = {
  jar: { open: '{name} drops pearls into a jar every day.', step: 'Day', thing: 'pearls', q: 'How many pearls will be in the jar on day {ask}?' },
  kelp: { open: '{name} measures a kelp plant every week.', step: 'Week', thing: 'cm tall', q: 'How tall will the kelp be in week {ask}?' },
  sub: { open: '{name}’s submarine is rising to the surface.', step: 'Minute', thing: 'metres deep', q: 'How deep will it be at minute {ask}?' },
  jelly: { open: 'The jellyfish in {name}’s tank keep multiplying.', step: 'Hour', thing: 'jellyfish', q: 'How many jellyfish will there be at hour {ask}?' },
  tables: { open: '{name} pushes tables together for a party. Each table adds more seats.', step: 'Tables:', thing: 'seats', q: 'How many seats with {ask} tables?' },
  piggy: { open: '{name} saves the same amount every week.', step: 'Week', thing: 'saved', q: 'How much will {name} have saved in week {ask}?' },
  ferry: { open: 'The island ferry leaves the dock at regular times.', step: 'Ferry', thing: '', q: 'When does ferry {ask} leave?' },
  climb: { open: '{name} climbs the lighthouse stairs at a steady pace.', step: 'Minute', thing: 'steps', q: 'How many steps will {name} have climbed after {ask} minutes?' },
};

const plotFor = r => (isArabic() ? AR_PLOTS : PLOTS)[r.plot];
const fill = (text, r) => text.replaceAll('{name}', r.name || 'Sprig').replaceAll('{ask}', r.ask);

export function storyText(r) {
  const p = plotFor(r);
  const f = seqFn(r.seq);
  const lines = [];
  for (let n = r.from; n < r.from + r.show; n++) lines.push(`${p.step} ${n}: ${fmt(f(n), r.seq.format)}${p.thing ? ` ${p.thing}` : ''}`);
  return { open: fill(p.open, r), lines, q: fill(p.q, r) };
}

export default {
  id: 'story',
  name: 'Lagoon Tales',
  prompt: () => 'What happens next in the story?',
  say: () => 'Read the story. What changes each time?',
  nudge: () => 'Look at how the number changes from one line to the next.',
  hint: r => `${hintFor(r.seq)} Keep going until you reach ${PLOTS[r.plot].step.replace(':', '').toLowerCase()} ${r.ask}.`,
  mount(root, r, api) {
    const f = seqFn(r.seq);
    const answer = f(r.ask);
    const t = storyText(r);
    const last = r.from + r.show - 1;
    const card = h('div', { class: 'story-card', dir: isArabic() ? 'rtl' : 'ltr' },
      h('p', { class: 'story-open' }, t.open),
      h('ul', { class: 'story-lines' }, t.lines.map(l => h('li', {}, l))),
      h('p', { class: 'story-ask' }, t.q, ' ', h('span', { class: 'story-q' }, '?')));
    const guess = card.querySelector('.story-q');
    const area = answerArea(r, api, {
      answer,
      tempting: [f(r.ask - 1), f(r.ask + 1), f(last) + (f(last) - f(last - 1)), answer + 1, answer - 1],
      onTyping: v => { guess.textContent = v || '?'; },
      onRight: () => { guess.textContent = fmt(answer, r.seq.format); api.correct(`That’s it: ${fmt(answer, r.seq.format)}${PLOTS[r.plot].thing ? ` ${PLOTS[r.plot].thing}` : ''}.`); },
      onWrong: v => {
        api.wrong(`Not ${fmt(v, r.seq.format)}. Find the change, then keep counting on.`);
        const hide = [];
        for (let n = last + 1; n <= r.ask; n++) hide.push(n);
        api.showWhy(why('Follow the story step by step', jumpStrip(r.seq, Math.max(r.from, last - 1), r.ask, { hide })));
      },
    });
    root.append(card, area.el);
    return area.destroy;
  },
};
