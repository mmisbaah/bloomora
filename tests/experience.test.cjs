// Browser regression tests for learning support. Run with Playwright available to Node.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'text/plain');
    res.end(data);
  });
});

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const browser = await chromium.launch({ headless: true, ...(process.env.BLOOMORA_CHROME ? { executablePath: process.env.BLOOMORA_CHROME } : fs.existsSync(edge) ? { executablePath: edge } : {}) });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await context.addInitScript(fs.readFileSync(path.join(__dirname, 'solver.js'), 'utf8'));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.goto(url);
    await page.getByRole('button', { name: 'Play', exact: true }).waitFor();
    // Keep the first-time tutorial enabled: exercise onboarding, not just a preconfigured save.
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.getByRole('button', { name: 'Minnows, ages 5–6', exact: true }).click();
    await page.getByRole('button', { name: /Level 1-1:/ }).click();
    await page.getByRole('button', { name: 'Let’s go!', exact: true }).click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.ghost').waitFor({ state: 'attached' });
    assert.match(await page.locator('.speech-text').innerText(), /pattern|tap|Tap/i);
    console.log('PASS first-time tutorial');

    for (const axis of ['v', 'h']) {
      await page.evaluate(async axis => {
        const S = await import('/js/core/state.js');
        const { ALL_TEMPLATES } = await import('/js/data/templates.js');
        const { findWorld } = await import('/js/data/worlds.js');
        const template = ALL_TEMPLATES().find(r => r.type === 'mirror' && (r.axis || 'v') === axis);
        const band = findWorld(template.src.split(':')[0]).band;
        S.replaceState({ band, music: false, muted: true, tutorials: { mirror: true } });
        S.recordMiss(template.src, band);
        window.bloomoraNav.practice(band);
      }, axis);
      await page.getByRole('button', { name: 'Start', exact: true }).click();
      const hearts = page.locator('.heart:not(.lost)');
      const initial = await hearts.count();
      for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Check reflection', exact: true }).click();
      assert.equal(await hearts.count(), initial - 1, 'corrections must cost at most one heart per puzzle');
      assert.match(await page.locator('.explain').innerText(), /same number of steps/);
      await page.evaluate(() => {
        const r = document.querySelector('.puzzle').bloomoraRound;
        const rows = r.axis === 'h' ? r.pattern.length * 2 : r.pattern.length;
        const cols = r.axis === 'h' ? r.pattern[0].length : r.pattern[0].length * 2;
        r.pattern.forEach((row, y) => [...row].forEach((cell, x) => {
          if (cell !== '#') return;
          const ty = r.axis === 'h' ? rows - 1 - y : y;
          const tx = r.axis === 'h' ? x : cols - 1 - x;
          document.querySelector(`[aria-label="Row ${ty + 1}, column ${tx + 1}"]`).click();
        }));
      });
      await page.getByRole('button', { name: 'Check reflection', exact: true }).click();
      await page.getByText('Practice done', { exact: true }).waitFor();
      assert.equal(await page.locator('.tally dd').nth(1).innerText(), '1');
      console.log(`PASS ${axis} mirror mistakes, explanation, correction and completion`);
    }
    // Every puzzle must survive a wrong answer and offer working examples and guided help.
    const support = await page.evaluate(async () => {
      window.bloomoraNav.title();
      const { PUZZLES } = await import('/js/puzzles/index.js');
      const { ALL_TEMPLATES } = await import('/js/data/templates.js');
      const { answerFor, workedExample, guideRound } = await import('/js/core/learning.js');
      const { vary, makeRng } = await import('/js/core/generate.js');
      const { findWorld } = await import('/js/data/worlds.js');
      const S = await import('/js/core/state.js'); S.setMuted(true);
      const templates = ALL_TEMPLATES(), reports = [];
      for (const [type, P] of Object.entries(PUZZLES)) {
        const template = templates.find(t => t.type === type);
        const r = vary(template, makeRng(12345), findWorld(template.src.split(':')[0]).band);
        const root = document.createElement('div'); document.getElementById('app').append(root);
        let wrong = 0;
        const api = { locked: false, correct() {}, wrong() { wrong++; }, say() {}, showWhy(el) { root.append(el); } };
        const cleanup = P.mount(root, r, api);
        const buttons = () => [...root.querySelectorAll('button')];
        if (['build', 'mirror', 'pick'].includes(type)) buttons().at(-1).click();
        else if (['rule', 'twins'].includes(type)) buttons().find(b => b.classList.contains('rule-card') && !b.bloomoraOk).click();
        else if (type === 'oddOne') root.querySelectorAll('button.stone')[r.bad.at - r.from === 0 ? 1 : 0].click();
        else if (type === 'shapes') buttons().find(b => b.getAttribute('aria-label') !== `Place ${r.unit[r.shown % r.unit.length]}`).click();
        else if (type === 'sort') {
          const order = [...r.values].sort((a,b) => r.desc ? b-a : a-b);
          buttons().find(b => b.getAttribute('aria-label') === String(order.at(-1))).click();
        } else if (root.querySelector('.option')) {
          const { fmt } = await import('/js/core/sequences.js');
          buttons().find(b => b.classList.contains('option') && b.querySelector('.option-num').textContent !== fmt(answerFor(r), r.seq?.format)).click();
        } else {
          for (const key of String(answerFor(r) + 1)) document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        }
        const example = workedExample(r); root.append(example);
        const stop = guideRound(root, r);
        reports.push({ type, wrong, explanation: !!root.querySelector('.explain'), targets: root.querySelectorAll('.guided-target').length, example: example.textContent.length });
        stop(); cleanup?.(); root.remove();
      }
      return reports;
    });
    for (const r of support) {
      assert.equal(r.wrong, 1, `${r.type}: wrong answer path`);
      assert.equal(r.explanation, true, `${r.type}: mistake explanation`);
      assert.ok(r.targets > 0, `${r.type}: guided next step`);
      assert.ok(r.example > 20, `${r.type}: worked example`);
    }
    console.log('PASS mistakes, examples and guidance for all 15 puzzle types');

    await page.evaluate(async () => {
      const S = await import('/js/core/state.js');
      S.replaceState({ band: 'turtles', pearls: 0, music: false, muted: true, tutorials: { mirror: true } });
      const { ALL_TEMPLATES } = await import('/js/data/templates.js');
      const { findWorld } = await import('/js/data/worlds.js');
      const r = ALL_TEMPLATES().find(r => r.type === 'mirror' && findWorld(r.src.split(':')[0]).band === 'turtles');
      S.recordMiss(r.src, 'turtles'); window.bloomoraNav.practice('turtles');
    });
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.getByRole('button', { name: 'Clue · free', exact: true }).click();
    await page.getByRole('button', { name: 'Worked example', exact: true }).click();
    assert.ok(await page.locator('.help-example').isVisible());
    await page.getByRole('button', { name: 'Guide me', exact: true }).click();
    assert.ok(await page.locator('.guided-target').count() > 0);
    assert.equal(await page.evaluate(async () => (await import('/js/core/state.js')).getState().pearls), 0);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('switch', { name: /Relaxed mode/ }).click();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    assert.equal(await page.locator('.hearts').isVisible(), false);
    for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Check reflection', exact: true }).click();
    assert.equal(await page.locator('.overlay').count(), 0, 'relaxed mistakes cannot end a session');
    await page.reload();
    assert.equal(await page.evaluate(async () => (await import('/js/core/state.js')).getState().relaxed), true);
    console.log('PASS free help at zero pearls and relaxed mode persistence');

    await page.evaluate(async () => {
      const S = await import('/js/core/state.js');
      const { WORLDS } = await import('/js/data/worlds.js');
      S.replaceState({ band: 'dolphins', muted: true, music: false });
      const boss = WORLDS.find(w => w.band === 'dolphins' && w.boss);
      S.setPref('storiesSeen', { [boss.id]: true });
      S.setPref('tutorials', Object.fromEntries(['build','predict','missing','rule','oddOne','shapes','sort','balance','machine','mirror','twins','pick','sticks','story','table'].map(k=>[k,true])));
      window.bloomoraNav.level(boss.id, 0);
    });
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    const clock = page.locator('.timer span');
    await page.waitForFunction(() => document.querySelector('.timer span').textContent !== '4:00');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const paused = await clock.innerText();
    await page.waitForTimeout(1500);
    assert.equal(await clock.innerText(), paused);
    await page.getByRole('switch', { name: /Relaxed mode/ }).click();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    assert.equal(await page.locator('.timer').isVisible(), false);
    assert.equal(await page.locator('.hearts').isVisible(), false);
    console.log('PASS clock pauses in Settings and relaxed mode applies during play');

    // A challenge can still end when hearts run out across different puzzles.
    await page.evaluate(async () => {
      const S=await import('/js/core/state.js');
      const {PUZZLES}=await import('/js/puzzles/index.js');
      S.replaceState({band:'dolphins',muted:true,music:false,tutorials:Object.fromEntries(Object.keys(PUZZLES).map(k=>[k,true]))});
      window.bloomoraNav.free('dolphins');
    });
    await page.getByRole('button', {name:'Start',exact:true}).click();
    for(let life=0;life<3;life++) {
      await page.evaluate(async () => {
        const root=document.querySelector('.puzzle'),r=root.bloomoraRound;
        window.__failureRound=r;
        const {answerFor}=await import('/js/core/learning.js');
        const {fmt}=await import('/js/core/sequences.js');
        const buttons=[...root.querySelectorAll('button')];
        if(['build','mirror','pick'].includes(r.type)) buttons.at(-1).click();
        else if(['rule','twins'].includes(r.type)) buttons.find(b=>b.classList.contains('rule-card')&&!b.bloomoraOk).click();
        else if(r.type==='oddOne') root.querySelectorAll('button.stone')[r.bad.at-r.from===0?1:0].click();
        else if(r.type==='shapes') buttons.find(b=>b.getAttribute('aria-label')!==`Place ${r.unit[r.shown%r.unit.length]}`).click();
        else if(r.type==='sort') {const a=[...r.values].sort((a,b)=>r.desc?b-a:a-b);buttons.find(b=>b.getAttribute('aria-label')===String(a.at(-1))).click();}
        else if(root.querySelector('.option')) buttons.find(b=>b.classList.contains('option')&&b.querySelector('.option-num').textContent!==fmt(answerFor(r),r.seq?.format)).click();
        else {for(const key of String(answerFor(r)+1))document.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));document.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));}
      });
      assert.equal(await page.locator('.heart:not(.lost)').count(), 2-life);
      if(life<2) {
        await page.evaluate(()=>window.__bloomoraSolve());
        // Some machines ask for a number followed by a rule card.
        if(await page.locator('.rule-card').count()) await page.evaluate(()=>window.__bloomoraSolve());
        await page.waitForFunction(()=>document.querySelector('.puzzle').bloomoraRound!==window.__failureRound);
      }
    }
    await page.getByText('Free Dive over',{exact:true}).waitFor();
    console.log('PASS hearts exhaust across puzzles and Free Dive ends cleanly');

    const reason = await page.evaluate(async () => {
      window.bloomoraNav.title();
      const { reasoningCheck } = await import('/js/core/reasoning.js');
      const root = document.createElement('div'); document.getElementById('app').append(root);
      let done = false; const answers = [];
      reasoningCheck(root, { seq: { kind: 'arith', a: 3, d: 3 }, from: 1 }, { say() {}, onDone() { done = true; }, onAnswer(ok) { answers.push(ok); } });
      root.querySelector('[data-reason-correct="false"]').click();
      root.querySelector('[data-reason-correct="true"]').click();
      [...root.querySelectorAll('button')].find(b => b.textContent === 'Keep diving').click();
      root.remove(); return { done, answers };
    });
    assert.deepEqual(reason, { done: true, answers: [false, true] });
    console.log('PASS explanation question accepts correction and resumes');

    await page.evaluate(async () => {
      const S = await import('/js/core/state.js');
      S.replaceState({ band: 'minnows', muted: true, music: false });
      S.recordResult('tide-1', 3, 500); window.bloomoraNav.map();
    });
    await page.getByRole('img', { name: '1 of 5 coral patches restored', exact: true }).waitFor();
    await page.reload();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('img', { name: '1 of 5 coral patches restored', exact: true }).waitFor();
    console.log('PASS restored coral persists after reload');

    await page.evaluate(async () => {
      const S=await import('/js/core/state.js');
      S.setPref('owned',['bow']); S.setPref('hat','bow');
      S.recordFreeDive('minnows',12,1800); S.recordMiss('tide:0:0','minnows');
      window.bloomoraNav.guide();
    });
    const backupBefore=await page.evaluate(async()=>structuredClone((await import('/js/core/state.js')).getState()));
    await page.getByRole('tab',{name:'Share & class',exact:true}).click();
    await page.getByRole('button',{name:/Player 1/,exact:false}).click();
    const backup=await page.getByLabel('Progress code',{exact:true}).inputValue();
    assert.ok(backup.startsWith('BLOOM2-'));
    await page.getByRole('button',{name:'Close',exact:true}).click();
    for(let pageNo=0;pageNo<6&&!await page.getByRole('button',{name:'Paste a code',exact:true}).isVisible();pageNo++) {
      await page.getByRole('button',{name:'Next page',exact:true}).click();
    }
    await page.getByRole('button',{name:'Paste a code',exact:true}).click();
    await page.getByLabel('Paste codes here',{exact:true}).fill(backup);
    await page.getByRole('button',{name:'Add player',exact:true}).click();
    assert.deepEqual(await page.evaluate(async()=>structuredClone((await import('/js/core/state.js')).getState())),backupBefore);
    console.log('PASS full backup export and import through the grown-ups interface');

    await page.evaluate(async () => {
      const S=await import('/js/core/state.js');
      for(const id of ['tide-1','tide-2','tide-3','tide-4','tide-5'])S.recordResult(id,3,500);
      window.bloomoraNav.collection();
    });
    await page.getByRole('button',{name:'Say hello',exact:true}).click();
    assert.match(await page.locator('.friend-reply').first().innerText(),/Pip/);
    console.log('PASS rescued friend interaction');

    for (const [width,height] of [[390,844],[844,390]]) {
      await page.setViewportSize({width,height});
      const types=await page.evaluate(async()=>Object.keys((await import('/js/puzzles/index.js')).PUZZLES));
      for(const type of types) {
        await page.evaluate(async type=>{
          const S=await import('/js/core/state.js');
          const {ALL_TEMPLATES}=await import('/js/data/templates.js');
          const {findWorld}=await import('/js/data/worlds.js');
          const r=ALL_TEMPLATES().find(r=>r.type===type),band=findWorld(r.src.split(':')[0]).band;
          S.replaceState({band,muted:true,music:false,tutorials:{[type]:true}});
          S.recordMiss(r.src,band);window.bloomoraNav.practice(band);
        },type);
        await page.getByRole('button',{name:'Start',exact:true}).click();
        await page.getByRole('button',{name:'Clue · free',exact:true}).click();
        await page.getByRole('button',{name:'Worked example',exact:true}).click();
        const size=await page.evaluate(async()=>{
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          const p=document.querySelector('.puzzle'),fit=p.querySelector('.fit');
          const scale=Number((fit.style.transform.match(/scale\(([\d.]+)\)/)||[0,1])[1]);
          const scroll=p.classList.contains('puzzle--scroll');
          if(scroll) p.scrollTop=p.scrollHeight;
          const example=fit.querySelector('.help-example').getBoundingClientRect(),box=p.getBoundingClientRect();
          return {height:fit.offsetHeight*scale,room:p.clientHeight,width:fit.scrollWidth*scale,space:p.clientWidth,scroll,reachable:example.bottom<=box.bottom+2};
        });
        assert.ok((size.scroll ? size.reachable : size.height<=size.room+2) && size.width<=size.space+2, `${type} worked example fits ${width}x${height}: ${JSON.stringify(size)}`);
      }
    }
    console.log('PASS worked example layouts for all 15 types in portrait and landscape');

    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1280, height: 720 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => window.bloomoraNav.map());
      const clipped = await page.evaluate(() => [...document.querySelectorAll('.world-card')].filter(el => el.getBoundingClientRect().height).some(el => { const r=el.getBoundingClientRect(); return r.bottom > innerHeight + 2 || r.right > innerWidth + 2; }));
      assert.equal(clipped, false, `map must fit ${viewport.width}x${viewport.height}`);
    }
    fs.mkdirSync(path.join(root, 'test-artifacts'), { recursive: true });
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.screen')).opacity === '1');
    await page.screenshot({ path: path.join(root, 'test-artifacts', 'restored-lagoon.png') });
    assert.deepEqual(errors, []);
    await context.close();
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => server.close());
