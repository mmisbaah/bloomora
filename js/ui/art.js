// Drawn art. Every creature and shape is a small SVG in one flat, rounded style, so the game looks
// the same on every device (emoji differ between iPhone, Android and Windows, and some old devices
// can't show them at all). Anything without a drawing falls back to its emoji.

const INK = '#0a2230';
const eye = (x, y, r = 3.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.32}" fill="#fff"/>`;
const smile = (x, y, w = 6) => `<path d="M${x - w / 2} ${y} q${w / 2} ${w * 0.55} ${w} 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
const cheek = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="2" fill="#ff8fa3" opacity=".55"/>`;

function star(cx, cy, outer, inner, n = 5) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

// Each drawing uses a 64×64 box.
const DRAW = {
  shell: () => `
    <path d="M32 54C17 54 7 42 9 27C14 15 24 10 32 10S50 15 55 27C57 42 47 54 32 54Z" fill="#f9c784"/>
    <path d="M32 54L14 24M32 54L22 15M32 54V11M32 54L42 15M32 54L50 24" stroke="#e09f3e" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M24 54h16l-3 6h-10z" fill="#e09f3e"/>`,
  fish: (c = '#ff9f43') => `
    <path d="M46 32L59 21V43Z" fill="${c}"/>
    <ellipse cx="29" cy="32" rx="19" ry="13" fill="${c}"/>
    <path d="M24 20q4 12 0 24" stroke="#fff" stroke-width="3.5" fill="none" opacity=".8"/>
    <path d="M27 19l6-7 4 8z" fill="${c}"/>
    ${eye(17, 29)}${smile(15, 36, 5)}`,
  fish2: () => DRAW.fish('#4cc9f0'),
  crab: (c = '#ff6b5b') => `
    <path d="M14 44l-6 6M18 47l-4 7M50 44l6 6M46 47l4 7" stroke="${c}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="32" cy="40" rx="17" ry="11" fill="${c}"/>
    <path d="M18 34L12 24M46 34L52 24" stroke="${c}" stroke-width="4" stroke-linecap="round"/>
    <path d="M6 20a7 7 0 1 1 10 6l-4-6z" fill="${c}"/><path d="M58 20a7 7 0 1 0-10 6l4-6z" fill="${c}"/>
    <path d="M26 30v-8M38 30v-8" stroke="${c}" stroke-width="3"/>
    ${eye(26, 21, 3.4)}${eye(38, 21, 3.4)}${smile(32, 41, 7)}`,
  lobster: () => DRAW.crab('#e63946'),
  octopus: () => `
    <path d="M18 36q-6 12-12 12M24 40q-3 12-9 16M32 41v17M40 40q3 12 9 16M46 36q6 12 12 12" stroke="#c77dff" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="32" cy="26" r="17" fill="#c77dff"/>
    ${eye(26, 26)}${eye(38, 26)}${smile(32, 33, 6)}${cheek(21, 32)}${cheek(43, 32)}`,
  turtle: () => `
    <ellipse cx="18" cy="48" rx="6" ry="4" fill="#8bd3a8"/><ellipse cx="44" cy="48" rx="6" ry="4" fill="#8bd3a8"/>
    <circle cx="53" cy="32" r="7" fill="#8bd3a8"/>${eye(55, 30, 2.4)}
    <ellipse cx="30" cy="36" rx="20" ry="14" fill="#3a9a73"/>
    <path d="M30 24l7 5v8l-7 5-7-5v-8z" fill="#6cc59f"/><circle cx="17" cy="35" r="4" fill="#6cc59f"/><circle cx="43" cy="35" r="4" fill="#6cc59f"/>`,
  star: () => `<polygon points="${star(32, 34, 26, 12)}" fill="#ffd166" stroke="#f4a261" stroke-width="2.5" stroke-linejoin="round"/>${eye(27, 31, 2.6)}${eye(37, 31, 2.6)}${smile(32, 38, 5)}`,
  coral: () => `
    <path d="M32 58V30M32 40L20 26M20 26V14M20 26L12 20M32 34L44 22M44 22V12M44 22L52 18M32 46L42 40" stroke="#ff7a8a" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  anemone: () => `
    <path d="M18 56h28l-3-14H21z" fill="#ff7a8a"/>
    <g stroke="#ffb3c1" stroke-width="5" stroke-linecap="round" fill="none"><path d="M24 42q-8-10-6-20"/><path d="M29 42q-3-14 0-26"/><path d="M35 42q3-14 0-26"/><path d="M40 42q8-10 6-20"/></g>`,
  seafan: () => `<g stroke="#f4a261" stroke-width="3" stroke-linecap="round"><path d="M32 58V30"/><path d="M32 34L14 14M32 34L22 10M32 34L32 8M32 34L42 10M32 34L50 14"/></g><path d="M12 16Q32-6 52 16" stroke="#f4a261" stroke-width="3" fill="none"/>`,
  jelly: () => `
    <path d="M22 38q-2 10 2 18M28 40q2 10-2 16M36 40q-2 10 2 16M42 38q2 10-2 18" stroke="#d0b8ff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M12 38C12 20 22 10 32 10S52 20 52 38Z" fill="#b8a1ff"/>
    ${eye(26, 28)}${eye(38, 28)}${smile(32, 33, 5)}`,
  puffer: () => `
    <g fill="#f4a261">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<polygon points="32,6 29,13 35,13" transform="rotate(${a} 32 32)"/>`).join('')}</g>
    <circle cx="32" cy="32" r="18" fill="#ffd166"/>
    <path d="M50 32l8-6v12z" fill="#ffd166"/>${eye(25, 29)}${eye(37, 29)}<circle cx="31" cy="39" r="3" fill="${INK}"/>`,
  squid: () => `
    <path d="M24 44q-4 8 0 14M30 46v12M34 46v12M40 44q4 8 0 14" stroke="#ff9ebb" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M32 6C44 18 44 34 42 46H22C20 34 20 18 32 6Z" fill="#ff9ebb"/>
    <path d="M22 18l-8-2 7 10zM42 18l8-2-7 10z" fill="#ff9ebb"/>${eye(27, 34)}${eye(37, 34)}`,
  shrimp: () => `
    <path d="M44 14C58 22 54 46 34 50C22 52 14 46 12 38" stroke="#ff8a65" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M12 38l-6 4M14 42l-4 8" stroke="#ff8a65" stroke-width="3" stroke-linecap="round"/>
    <path d="M44 14l10-8M46 16l12-2" stroke="#ff8a65" stroke-width="2"/>${eye(46, 20, 2.6)}`,
  kelp: () => `<g fill="#6cc59f"><path d="M30 60C24 44 38 36 30 20C26 12 30 6 32 4C38 14 34 22 38 32C42 44 34 52 34 60Z"/><ellipse cx="22" cy="28" rx="8" ry="4" transform="rotate(-30 22 28)"/><ellipse cx="42" cy="40" rx="8" ry="4" transform="rotate(30 42 40)"/></g>`,
  whale: () => `
    <path d="M32 14q-4-8-8-6M32 14q4-8 8-6" stroke="#8fd3e8" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M6 34C6 22 18 18 32 18C48 18 54 28 54 34L62 26V44L54 40C50 50 40 52 28 52C14 52 6 44 6 34Z" fill="#4d96ff"/>
    <path d="M10 40C18 48 34 48 46 42" stroke="#cfe8ff" stroke-width="4" fill="none"/>${eye(18, 32)}${smile(16, 39, 5)}`,
  dolphin: () => `
    <path d="M8 40C14 22 34 14 48 20L56 12V26C60 32 58 38 54 40C44 46 26 48 8 40Z" fill="#8fd3e8"/>
    <path d="M30 22l6-10 4 10z" fill="#8fd3e8"/><path d="M24 44l-4 10 10-6z" fill="#8fd3e8"/>${eye(46, 28, 2.6)}${smile(52, 34, 4)}`,
  shark: () => `
    <path d="M6 36C14 24 36 20 50 28L60 20V44L50 38C38 46 18 46 6 36Z" fill="#9aa9b6"/>
    <path d="M28 24l6-14 6 16z" fill="#9aa9b6"/><path d="M14 38C24 42 36 42 46 38" stroke="#e6edf2" stroke-width="4" fill="none"/>${eye(18, 32, 2.6)}`,
  seal: () => `
    <path d="M10 50C8 34 22 20 36 22C50 24 56 38 52 50Z" fill="#a3a8b5"/>
    <path d="M48 50l12-4-6 10zM14 50l-8-4 4 10z" fill="#8a8f9c"/>${eye(30, 32)}${eye(42, 32)}<ellipse cx="36" cy="40" rx="4" ry="3" fill="${INK}"/>
    <path d="M28 41h-8M28 44h-7M44 41h8M44 44h7" stroke="${INK}" stroke-width="1.4"/>`,
  ice: () => `<rect x="12" y="12" width="40" height="40" rx="9" fill="#cdeffd" stroke="#8fd3e8" stroke-width="3"/><path d="M20 22h10M20 28h6" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
  // Shapes for pattern parades
  triangle: () => `<polygon points="32,8 58,54 6,54" fill="#ff6b5b" stroke="#c9472f" stroke-width="3" stroke-linejoin="round"/>`,
  diamond: () => `<polygon points="32,6 58,32 32,58 6,32" fill="#4d96ff" stroke="#2b6fd6" stroke-width="3" stroke-linejoin="round"/>`,
  ydot: () => `<circle cx="32" cy="32" r="24" fill="#ffd166" stroke="#e0a800" stroke-width="3"/>`,
  pdot: () => `<circle cx="32" cy="32" r="24" fill="#b388ff" stroke="#7c4dff" stroke-width="3"/>`,
  gsquare: () => `<rect x="9" y="9" width="46" height="46" rx="8" fill="#6cc59f" stroke="#348a66" stroke-width="3"/>`,
  odiamond: () => `<polygon points="32,6 58,32 32,58 6,32" fill="#ff9f43" stroke="#d17a1a" stroke-width="3" stroke-linejoin="round"/>`,
  gdot: () => `<circle cx="32" cy="32" r="24" fill="#6cc59f" stroke="#348a66" stroke-width="3"/>`,
};

const EMOJI = {
  '🐚': 'shell', '🐠': 'fish', '🐟': 'fish2', '🦀': 'crab', '🦞': 'lobster', '🐙': 'octopus', '🐢': 'turtle',
  '⭐': 'star', '🪸': 'coral', '🌸': 'anemone', '🌾': 'seafan', '🪼': 'jelly', '🐡': 'puffer', '🦑': 'squid',
  '🦐': 'shrimp', '🌿': 'kelp', '🐋': 'whale', '🐳': 'whale', '🐬': 'dolphin', '🦈': 'shark', '🦭': 'seal',
  '🧊': 'ice', '🔺': 'triangle', '🔷': 'diamond', '🟡': 'ydot', '🟣': 'pdot', '🟩': 'gsquare', '🔶': 'odiamond', '🟢': 'gdot',
};

export const hasArt = emoji => emoji in EMOJI;

function svg(inner, cls, label) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('viewBox', '0 0 64 64');
  el.setAttribute('class', `art ${cls || ''}`);
  if (label) {
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', label);
  } else el.setAttribute('aria-hidden', 'true');
  el.innerHTML = inner;
  return el;
}

// pic('🦀') → drawn crab; anything without a drawing stays an emoji in a span.
export function pic(emoji, { cls = '', label = '' } = {}) {
  const name = EMOJI[emoji];
  if (!name) {
    const s = document.createElement('span');
    s.className = `art art--emoji ${cls}`;
    s.textContent = emoji;
    if (!label) s.setAttribute('aria-hidden', 'true');
    return s;
  }
  return svg(DRAW[name](), cls, label);
}

// Sprig, the lantern sprout, with moods: calm, happy, oops, think.
export function sprigArt(mood = 'calm') {
  const el = svg(`
    <defs><radialGradient id="sprigGlow" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff8dc"/><stop offset=".55" stop-color="#f6d68b"/><stop offset="1" stop-color="#c9993f"/></radialGradient></defs>
    <g class="sprig-leafg"><path d="M33 13C34 4 42 0 50 2C49 10 42 14 33 13Z" fill="#6cc59f"/><path d="M33 13C38 8 43 5 48 4" stroke="#348a66" stroke-width="1.5" fill="none"/></g>
    <ellipse cx="32" cy="38" rx="24" ry="23" fill="url(#sprigGlow)"/>
    <g class="m-calm">${eye(24, 35, 3.4)}${eye(40, 35, 3.4)}${smile(32, 44, 7)}</g>
    <g class="m-happy"><path d="M20 36q4-6 8 0M36 36q4-6 8 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M25 43q7 9 14 0z" fill="${INK}"/></g>
    <g class="m-oops">${eye(24, 36, 3)}${eye(40, 36, 3)}<path d="M19 31l8-3M45 31l-8-3" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><ellipse cx="32" cy="46" rx="3.5" ry="3" fill="${INK}"/></g>
    <g class="m-think">${eye(25, 34, 3)}${eye(41, 32, 3)}<path d="M27 46h9" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/></g>
    ${cheek(17, 43)}${cheek(47, 43)}`, 'sprig-art');
  el.dataset.mood = mood;
  return el;
}
