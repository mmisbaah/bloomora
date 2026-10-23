// All levels through the rendered controls, with a virtual clock for feedback animations.
// Server and browser setup are shared with the experience suite.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html'); res.end(data);
  });
});
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const browser = await chromium.launch({ headless: true, ...(process.env.BLOOMORA_CHROME ? { executablePath: process.env.BLOOMORA_CHROME } : fs.existsSync(edge) ? { executablePath: edge } : {}) });
  const url = `http://127.0.0.1:${server.address().port}`;
  let total = 0;
  try {
    for (const [width, height, lang] of [[390,844,'en'], [844,390,'en'], [390,844,'ar']]) {
      const probe = await browser.newPage(); await probe.goto(url);
      const levels = await probe.evaluate(async () => (await import('/js/data/worlds.js')).WORLDS.flatMap(w => w.levels.map((l,i) => ({ world: w.id, band: w.band, i, id: l.id }))));
      await probe.close(); let cursor = 0;
      await Promise.all(Array.from({length:4}, async () => {
        const context = await browser.newContext({ viewport:{width,height}, serviceWorkers:'block' });
        await context.route('https://fonts.googleapis.com/**', r=>r.abort());
        await context.addInitScript(fs.readFileSync(path.join(__dirname, 'solver.js'), 'utf8'));
        const page = await context.newPage(), errors=[];
        page.on('pageerror', e=>errors.push(e.message)); await page.goto(url);
        await page.getByRole('button', {name:'Play',exact:true}).waitFor();
        await page.clock.install();
        while(cursor < levels.length) {
          const level = levels[cursor++]; errors.length=0;
          await page.evaluate(async ({level,lang}) => {
            const S = await import('/js/core/state.js');
            const { WORLDS } = await import('/js/data/worlds.js');
            const { PUZZLES } = await import('/js/puzzles/index.js');
            S.replaceState({band:level.band,muted:true,music:false,lang, tutorials:Object.fromEntries(Object.keys(PUZZLES).map(t=>[t,true])),storiesSeen:Object.fromEntries(WORLDS.map(w=>[w.id,true]))});
            window.bloomoraNav.level(level.world,level.i);
          }, {level,lang});
          await page.locator('.intro .btn--big').click();
          let lastRound = null, finished = false;
          for(let step=0; step<40;step++) {
            if(await page.locator('.stars-big').count()) { finished=true;break; }
            if(await page.locator('.reasoning-check').count()) {
              await page.locator('[data-reason-correct="true"]').click();
              await page.locator('.reasoning-check .btn:not(.btn--ghost)').click();
            } else {
              const status = await page.evaluate(() => {
                const root=document.querySelector('.puzzle'),r=root?.bloomoraRound;
                return { key:r?.src, stage:!!root?.querySelector('.rule-card:not(:disabled):not(.is-right)'),fresh:r!==window.__campaignRound };
              });
              if(status.fresh || status.stage && lastRound==='machine') {
                await page.evaluate(()=> {window.__campaignRound=document.querySelector('.puzzle').bloomoraRound});
                lastRound=await page.evaluate(()=>window.__bloomoraSolve());
                assert.ok(!lastRound.startsWith('unknown'), `${level.id}: solver ${lastRound}`);
              }
            }
            await page.clock.fastForward(2400);
          }
          assert.ok(finished, `${width}x${height} ${lang} ${level.id}: completion`);
          assert.equal(await page.locator('.star.on').count(),3,`${level.id}: stars`);
          assert.deepEqual(errors,[],`${level.id}: script errors`);
          total++;
        }
        await context.close();
      }));
      console.log(`PASS ${levels.length} levels at ${width}x${height} ${lang}`);
    }
    console.log(`PASS ${total} campaign playthroughs`);
  } finally { await browser.close(); }
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
