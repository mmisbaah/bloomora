import { h } from '../core/dom.js';
import { t } from '../core/i18n.js';

// Each cleared level restores one patch. The scene is derived from saved progress.
export function lagoonScene(cleared, total) {
  const patches = Array.from({ length: total }, (_, i) => {
    const x = 18 + i * 264 / Math.max(1, total - 1);
    const lit = i < cleared;
    return `<g transform="translate(${x},55)" opacity="${lit ? 1 : 0.28}">
      <ellipse cy="10" rx="18" ry="4" fill="${lit ? '#f6d68b' : '#64777b'}"/>
      <path d="M0 8V-20M0-4L-10-14M0-10L9-23M-10-14V-23M9-23L14-27" fill="none" stroke="${lit ? '#ff9878' : '#82959a'}" stroke-width="5" stroke-linecap="round"/>
      ${lit ? '<circle cy="-30" r="3" fill="#fff1bf"/>' : ''}</g>`;
  }).join('');
  const scene = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  scene.setAttribute('viewBox', '0 0 300 72');
  scene.setAttribute('aria-hidden', 'true');
  scene.innerHTML = `<path d="M0 65 Q80 45 150 64 T300 62 V72 H0Z" fill="#1f7f8c" opacity=".5"/>${patches}${cleared === total ? '<path d="M137 13q10-12 23 0-13 12-23 0l-9-6v12z" fill="#8fd3e8"/>' : ''}`;
  return h('div', { class: 'lagoon-restoration', role: 'img', 'aria-label': t('{n} of {total} coral patches restored', { n: cleared, total }) }, scene,
    h('span', { class: 'restoration-label' }, t('{n} of {total} coral patches restored', { n: cleared, total })));
}
