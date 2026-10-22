// Sprig's wardrobe: spend pearls on hats. The hat being worn shows on Sprig everywhere.
import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';
import { toast } from '../core/fx.js';
import * as S from '../core/state.js';
import { HATS } from '../data/shop.js';
import {sprig, pearlStat } from '../ui/widgets.js';
import { settingsButton } from '../ui/settings.js';
import { pager } from '../ui/pager.js';

export function shopScreen(app, _params, nav) {
  const st = S.getState();
  const cards = HATS.map(item => {
    const owned = st.owned.includes(item.id);
    const wearing = st.hat === item.id;
    const label = wearing ? 'Take off' : owned ? 'Wear' : `${item.cost} pearls`;
    return h('div', { class: `shop-card panel${wearing ? ' current' : ''}` },
      h('span', { class: 'shop-emoji', 'aria-hidden': 'true' }, item.emoji),
      h('span', { class: 'shop-name' }, item.name),
      h('button', {
        class: `btn btn--small${owned ? ' btn--kelp' : ''}`,
        'aria-label': `${label}: ${item.name}`,
        disabled: !owned && st.pearls < item.cost,
        onclick: () => {
          if (owned) {
            S.wearItem(item.id);
            audio.tap();
          } else if (S.buyItem(item.id, item.cost)) {
            audio.coin();
            toast(`Sprig is wearing the ${item.name.toLowerCase()}!`);
          }
          nav.shop();
        },
      }, owned ? label : h('span', {}, h('i', { class: 'pearl' }), ` ${item.cost}`)));
  });
  const pages = pager(cards, { className: 'shop', label: 'Page' });
  app.append(h('div', { class: 'screen' },
    h('header', { class: 'top-bar' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back to map', onclick: nav.map }, '←'),
      h('div', { class: 'top-bar-title' }, h('h1', {}, 'Sprig’s Wardrobe')),
      pearlStat(),
      settingsButton()),
    h('div', { class: 'sprig-bar' }, sprig(),
      h('div', { class: 'speech panel' }, h('p', { class: 'speech-text' }, 'Pick something for me to wear! You earn pearls by clearing levels, Daily Dives and practice.'))),
    pages.el));
  pages.layout();
}
