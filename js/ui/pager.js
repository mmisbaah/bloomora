// Splits a list of items into pages that fit their box, so no screen ever scrolls.
// Pages are measured against the real screen and re-measured when the window size changes.
import { h } from '../core/dom.js';
import { audio } from '../core/audio.js';
import { t } from '../core/i18n.js';

export function pager(items, { className = '', label = 'Page' } = {}) {
  const list = h('div', { class: `pager-list ${className}` });
  const prev = h('button', { class: 'pager-btn', 'aria-label': `Previous ${label.toLowerCase()}`, onclick: () => go(page - 1) }, '‹');
  // The next button says "More" and bobs until the child has turned a page, so the extra
  // pages don't go unnoticed. It also says how many more items are waiting.
  const moreCount = h('span', { class: 'pager-more' });
  const next = h('button', { class: 'pager-btn pager-next', 'aria-label': `Next ${label.toLowerCase()}`, onclick: () => go(page + 1) }, moreCount, '›');
  let turned = false;
  const dots = h('div', { class: 'pager-dots', 'aria-hidden': 'true' });
  const status = h('span', { class: 'sr-only', 'aria-live': 'polite' });
  const controls = h('div', { class: 'pager-controls' }, prev, dots, next, status);
  const el = h('div', { class: 'pager' }, list, controls);
  let pages = [items], page = 0, frame = 0;

  function layout() {
    if (!el.isConnected) return;
    const keep = pages[page]?.[0];
    controls.hidden = false; // measure with the controls taking their space
    list.replaceChildren();
    pages = [];
    let cur = [];
    for (const it of items) {
      list.append(it);
      if (cur.length && list.scrollHeight > list.clientHeight + 1) {
        it.remove();
        pages.push(cur);
        list.replaceChildren(it);
        cur = [];
      }
      cur.push(it);
    }
    if (cur.length) pages.push(cur);
    page = Math.max(0, pages.findIndex(p => p.includes(keep)));
    controls.hidden = pages.length <= 1;
    show();
  }

  function show() {
    list.replaceChildren(...pages[page]);
    dots.replaceChildren(...pages.map((_, i) => h('span', { class: i === page ? 'on' : null })));
    prev.disabled = page === 0;
    next.disabled = page === pages.length - 1;
    const after = pages.slice(page + 1).reduce((n, p) => n + p.length, 0);
    moreCount.textContent = after ? t('{n} more', { n: after }) : '';
    next.classList.toggle('nudge', !turned && after > 0);
    status.textContent = `${label} ${page + 1} of ${pages.length}`;
  }

  function go(p) {
    if (p < 0 || p >= pages.length) return;
    const dir = p > page ? 'left' : 'right';
    page = p;
    turned = true;
    audio.bubble();
    show();
    list.classList.remove('slide-left', 'slide-right');
    void list.offsetWidth;
    list.classList.add(`slide-${dir}`);
  }

  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(layout);
  };
  const onResize = () => {
    if (!el.isConnected) {
      window.removeEventListener('resize', onResize);
      return;
    }
    schedule();
  };
  window.addEventListener('resize', onResize);
  document.fonts?.ready.then(schedule);

  // Swipe left / right to turn pages.
  let startX = null;
  list.addEventListener('pointerdown', e => { startX = e.clientX; });
  list.addEventListener('pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 60) go(page + (dx < 0 ? 1 : -1));
  });

  return { el, layout: schedule };
}
