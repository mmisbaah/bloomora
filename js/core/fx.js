// Visual effects: ambient bubbles, confetti bursts, floating score text, toasts.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function fitCanvas(cv, ctx) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = cv.clientWidth;
  const h = cv.clientHeight;
  cv.width = w * dpr;
  cv.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}

export function startBubbles(cv) {
  const ctx = cv.getContext('2d');
  let { w, h } = fitCanvas(cv, ctx);
  const spawn = anywhere => ({
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + 20,
    r: 2 + Math.random() * 7,
    speed: 0.2 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
  });
  const bubbles = Array.from({ length: Math.round(Math.min(42, w / 28)) }, () => spawn(true));

  window.addEventListener('resize', () => ({ w, h } = fitCanvas(cv, ctx)));

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const b of bubbles) {
      const x = b.x + Math.sin(b.phase) * 6;
      ctx.beginPath();
      ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(234, 247, 244, 0.18)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(234, 247, 244, 0.28)';
      ctx.fill();
    }
  }

  function step() {
    for (const b of bubbles) {
      b.y -= b.speed;
      b.phase += 0.02;
      if (b.y < -20) Object.assign(b, spawn(false));
    }
    draw();
    requestAnimationFrame(step);
  }

  if (reduceMotion) draw();
  else requestAnimationFrame(step);
}

let confettiCanvas = null;
let confettiCtx = null;
let parts = [];
let running = false;
const COLORS = ['#ff7a59', '#f6d68b', '#6cc59f', '#eaf7f4', '#8fd3e8', '#c7a6ff'];

export function initConfetti(cv) {
  confettiCanvas = cv;
  confettiCtx = cv.getContext('2d');
}

export function confetti(count = 140) {
  if (reduceMotion || !confettiCanvas) return;
  const { w, h } = fitCanvas(confettiCanvas, confettiCtx);
  for (let i = 0; i < count; i++) {
    parts.push({
      x: w / 2 + (Math.random() - 0.5) * w * 0.3,
      y: h * 0.38,
      vx: (Math.random() - 0.5) * 13,
      vy: -Math.random() * 13 - 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      size: 6 + Math.random() * 6,
      color: COLORS[i % COLORS.length],
    });
  }
  if (!running) {
    running = true;
    requestAnimationFrame(() => loop(h));
  }
}

function loop(h) {
  const ctx = confettiCtx;
  ctx.clearRect(0, 0, confettiCanvas.clientWidth, confettiCanvas.clientHeight);
  for (const p of parts) {
    p.vy += 0.32;
    p.vx *= 0.99;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.restore();
  }
  parts = parts.filter(p => p.y < h + 40);
  if (parts.length) requestAnimationFrame(() => loop(h));
  else {
    running = false;
    ctx.clearRect(0, 0, confettiCanvas.clientWidth, confettiCanvas.clientHeight);
  }
}

export function floatText(text, anchor) {
  const r = anchor.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = text;
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top + Math.min(r.height / 2, 160)}px`;
  document.body.append(el);
  el.addEventListener('animationend', () => el.remove());
  setTimeout(() => el.remove(), 1500);
}

let toastTimer = null;
export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
