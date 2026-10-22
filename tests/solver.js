// In-page solver used by tests/play.test.py. It reads the round the play screen generated
// (.puzzle.bloomoraRound) and answers it the way a child would: tapping or typing.
window.__bloomoraSolve = async () => {
  const root = document.querySelector('.puzzle');
  const r = root?.bloomoraRound;
  if (!r) return 'no-round';
  const m = await import('./js/core/sequences.js');
  const st = await import('./js/puzzles/sticks.js');
  const fit = root.querySelector('.fit');
  const key = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  const type = v => { for (const ch of String(v)) key(ch); key('Enter'); };
  const answer = v => {
    if (fit.querySelector('.numpad')) return type(v);
    const want = m.fmt(v, r.seq?.format);
    const b = [...fit.querySelectorAll('.option')].find(o => o.querySelector('.option-num').textContent === want);
    if (!b) throw new Error(`no option ${want}`);
    b.click();
  };
  const okCard = () => [...fit.querySelectorAll('.rule-card')].find(b => b.bloomoraOk && !b.disabled);
  const f = r.seq ? m.seqFn(r.seq) : null;
  switch (r.type) {
    case 'build': {
      const target = f(r.from + r.show);
      const plus = fit.querySelector('.build-controls .btn--kelp');
      const count = fit.querySelector('.pool--build .pool-count');
      for (let i = 0; i < 300 && !count.textContent.startsWith(`${target} `); i++) plus.click();
      [...fit.querySelectorAll('.build-controls .btn')].pop().click();
      break;
    }
    case 'predict': case 'story': case 'table': answer(f(r.ask)); break;
    case 'missing': answer(f(r.gap)); break;
    case 'sticks': answer(m.seqFn(st.stickSeq(r.shape))(r.ask)); break;
    case 'rule': case 'twins': okCard().click(); break;
    case 'machine': {
      const c = okCard();
      if (c) c.click();
      else type(r.inverse ? r.ask : r.m * r.ask + r.b);
      break;
    }
    case 'oddOne': fit.querySelectorAll('button.stone')[r.bad.at - r.from].click(); break;
    case 'shapes': {
      const blanks = fit.querySelectorAll('.parade-slot').length;
      for (let i = 0; i < blanks; i++) {
        const o = r.unit[(r.shown + i) % r.unit.length];
        fit.querySelector(`.parade-option[aria-label="Place ${o}"]`).click();
      }
      break;
    }
    case 'sort': {
      const order = [...r.values].sort((a, b) => (r.desc ? b - a : a - b));
      for (const v of order) fit.querySelector(`.pebble[aria-label="${v}"]:not(.gone)`).click();
      break;
    }
    case 'balance': type((r.right.k - r.left.k) / (r.left.x - r.right.x)); break;
    case 'mirror': {
      const p = r.pattern, axis = r.axis || 'v';
      const rows = axis === 'v' ? p.length : p.length * 2, cols = axis === 'v' ? p[0].length * 2 : p[0].length;
      for (let y = 0; y < p.length; y++) for (let x = 0; x < p[0].length; x++) {
        if (p[y][x] !== '#') continue;
        const [ty, tx] = axis === 'v' ? [y, cols - 1 - x] : [rows - 1 - y, x];
        fit.querySelector(`.cell.tgt[aria-label="Row ${ty + 1}, column ${tx + 1}"]`).click();
      }
      [...fit.querySelectorAll('.btn')].pop().click();
      break;
    }
    case 'pick': {
      const test = m.pickTest(r.rule, r.k);
      for (const v of r.values) if (test(v)) fit.querySelector(`.net-fish[aria-label="${v}"]`).click();
      [...fit.querySelectorAll('.btn')].pop().click();
      break;
    }
    default: return `unknown ${r.type}`;
  }
  return r.type;
};
