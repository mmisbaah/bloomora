// Generates 400 variants of every round template and checks each one: valid answer,
// numbers inside the band limits, and the same skill as the template. Run: node tests/generator.test.mjs
const B = new URL('../js/', import.meta.url).href;
const { WORLDS } = await import(B+'data/worlds.js');
const { seqFn, pickTest, nthCards } = await import(B+'core/sequences.js');
const { makeRng, vary } = await import(B+'core/generate.js');
const R = makeRng(12345);
const errs = []; const variety = [];
const LIMIT = { count: 20, groups: 40 };
const spanOf = r => r.type==='build'?[r.from,r.from+r.show]: ['predict','story','table'].includes(r.type)?[r.from,r.ask]: r.type==='rule'?[r.from,r.from+r.show-1]:[r.from,r.from+r.count-1];
let n=0;
for (const w of WORLDS) for (const l of w.levels) l.rounds.forEach((r0, ri) => {
  const t = { ...w.defaults, ...l.defaults, ...r0 };
  const seen = new Set();
  for (let i=0;i<400;i++) {
    const ease = [-1, 0, 1][i % 3];
    const r = vary(t, R, w.band, { ease }); n++; seen.add(JSON.stringify(r));
    const where = `${l.id}#${ri+1} ${r.type}`;
    const bad = m => errs.push(`${where}: ${m} ${JSON.stringify(r).slice(0,160)}`);
    if (r.type !== t.type) bad('type changed');
    if (['build','predict','missing','oddOne','rule','story','table'].includes(r.type)) {
      const f = seqFn(r.seq); const [lo,hi] = spanOf(r); const vals=[]; for(let k=lo;k<=hi;k++) vals.push(f(k));
      if (vals.some(v=>!Number.isInteger(v)||(!r.negative && v<1))) bad('non-positive');
      if (r.negative && !vals.some(v=>v<0)) bad('negative round never goes below zero');
      if (r.nth) { const cards = nthCards(r.seq); const ok = cards.filter(c=>c.correct); if (ok.length!==1 || cards.length<3 || new Set(cards.map(c=>c.text)).size!==cards.length) bad('nth cards'); const m = ok[0].text.match(/has (\d*)n(?: ([+−]) (\d+))?$/); const k = m[1]===''?1:+m[1]; const c0 = m[2] ? (m[2]==='+'?1:-1)*+m[3] : 0; for (let q=1;q<6;q++) if (k*q+c0!==f(q)) { bad('nth formula wrong'); break; } }
      if (r.seq.kind!==t.seq.kind || r.seq.d!==t.seq.d || r.seq.r!==t.seq.r || r.seq.format!==t.seq.format) bad('rule changed');
      if (['story','table'].includes(r.type) && r.ask <= r.from + r.show - 1) bad('ask not ahead');
      if (r.type==='story' && !r.name) bad('story has no name');
      if (r.seq.format==='time' && Math.max(...vals) >= 24*60) bad('time past midnight');
      if (r.type==='missing' && (r.gap<=r.from || r.gap>=r.from+r.count-1)) bad('gap at edge');
      if (r.type==='oddOne') { const real=f(r.bad.at); const shown=vals; if (r.bad.value===real||shown.includes(r.bad.value)||(!r.negative && r.bad.value<1)||r.bad.at<r.from+2||r.bad.at>hi) bad('broken stone ambiguous'); }
      if (r.type==='predict' && r.ask <= r.from + r.show - 1) bad('ask not ahead');
      if (r.type==='build') { const target=f(r.from+r.show); const m=r.mode||'one'; const d=r.group||r.seq.d;
        const val = k => m==='one'?k: m==='group'?k*d: m==='border'?k*k: k*(k+1)/2; let k=0; while(val(k)<target&&k<300)k++; if (val(k)!==target) bad('build target unreachable');
        if (k > 12) bad('too many presses '+k); }
      // drawings stay countable where the template's were
      const cap = LIMIT[r.style]; if (cap && ['build','rule'].includes(r.type)) { const t0=seqFn(t.seq); const [a,b]=spanOf(t); let m0=0; for(let k=a;k<=b;k++) m0=Math.max(m0,t0(k)); if (m0<=cap && Math.max(...vals.slice(0, r.type==='build'?-1:undefined))>cap) bad('drawing over limit'); }
      if (['build','rule'].includes(r.type) && w.band==='minnows' && r.style==='count' && Math.max(...vals)>20 && r.type!=='predict') bad('minnows count > 20');
    }
    if (r.type==='shapes') { if (r.unit.length!==t.unit.length || new Set(r.unit).size!==new Set(t.unit).size) bad('structure changed'); if (r.shown<r.unit.length+2) bad('too few shown');
      // same repeat structure: positions of equal symbols identical
      const sig = u => u.map(s=>u.indexOf(s)).join(); if (sig(r.unit)!==sig(t.unit)) bad('pattern shape changed'); }
    if (r.type==='sort') { if (new Set(r.values).size!==r.values.length || r.values.length!==t.values.length) bad('sort values'); if (w.band==='minnows' && Math.max(...r.values)>20) bad('minnows >20'); }
    if (r.type==='balance') { const {left:L,right:Rt}=r; const x=(Rt.k-L.k)/(L.x-Rt.x); if(!Number.isInteger(x)||x<2) bad('balance answer '+x); if (L.x!==t.left.x||Rt.x!==t.right.x||(!!L.k)!==(!!t.left.k)) bad('equation shape changed'); if (w.band==='turtles' && Rt.k>100) bad('turtles >100'); }
    if (r.type==='machine') { const f=x=>r.m*x+r.b; if ([...r.examples,r.ask].some(x=>f(x)<1)) bad('machine output <1'); if (r.m!==t.m || Math.sign(r.b)!==Math.sign(t.b)) bad('machine rule class changed'); if (new Set(r.examples).size!==3) bad('dup inputs'); if (r.examples.includes(r.ask)) bad('ask repeats example'); }
    if (r.type==='twins') { if (!(r.a>=1 && Number.isInteger(r.a)) || !(t.ks||[2,3]).includes(r.k)) bad('twins'); }
    if (r.type==='pick') { const test=pickTest(r.rule,r.k); const hits=r.values.filter(test).length; if (new Set(r.values).size!==r.count || hits<2 || hits>r.count-2 || r.values.some(v=>v<1||v>r.max)) bad('pick values'); }
    if (r.type==='sticks') { if (r.shape!==t.shape || r.show!==t.show || r.ask<=r.show || r.ask>t.ask+3) bad('sticks ask'); }
    if (r.type==='mirror') { const c=s=>s.join('').split('#').length-1; if (c(r.pattern)!==c(t.pattern)) bad('tile count changed'); if (r.pattern.length!==t.pattern.length||r.pattern[0].length!==t.pattern[0].length) bad('size changed'); }
  }
  variety.push([`${l.id}#${ri+1} ${t.type}`, seen.size]);
});
console.log('variants checked:', n, 'errors:', errs.length);
console.log([...new Set(errs.map(e=>e.split(':')[0]+':'+e.split(':')[1]))].slice(0,15).join('\n'));
const low = variety.filter(v=>v[1]<5); console.log('templates with <5 distinct variants:', low.length, low.map(v=>v.join('=')).join(', '));
const tot = variety.map(v=>v[1]); console.log('median distinct variants per template:', tot.sort((a,b)=>a-b)[Math.floor(tot.length/2)], 'templates:', tot.length);
if (errs.length) process.exit(1);
