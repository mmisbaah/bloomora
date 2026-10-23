# Plays every level in a real browser with a solver that answers like a child (tapping and
# typing), at phone portrait and phone landscape sizes. Checks each level ends with 3 stars,
# no JavaScript errors, every puzzle visible, and nothing overflowing the screen.
# Needs Playwright for Python and Chromium. Run from the repo root: python3 tests/play.test.py
import asyncio, json, os, subprocess, sys, time
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8811
CHROME = os.environ.get('BLOOMORA_CHROME', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
SIZES = [(390, 844), (844, 390)]
WORKERS = 6

MEASURE = """()=>{const p=document.querySelector('.puzzle'), fit=p.querySelector('.fit'), de=document.documentElement;
  const m=+((fit.style.transform.match(/scale\\(([\\d.]+)\\)/)||[0,1])[1]);
  return {scale:m, hidden: +getComputedStyle(fit).opacity < 0.9, over: de.scrollWidth>innerWidth+1 || de.scrollHeight>innerHeight+1 || (!p.classList.contains('puzzle--scroll') && fit.offsetHeight*m>p.clientHeight+2)};}"""

async def level_list(page):
    return await page.evaluate("""(async()=>{const m=await import('./js/data/worlds.js');
      return m.WORLDS.flatMap(w=>w.levels.map((l,i)=>[w.band,w.id,i,l.id]));})()""")

async def play(page, band, wid, idx, lang):
    await page.evaluate("""([band,lang])=>{const all={};for(const k of ['build','predict','missing','rule','oddOne','shapes','sort','balance','machine','mirror','twins','pick','sticks','story','table'])all[k]=true;
      localStorage.setItem('bloomora-lagoon-v2', JSON.stringify({band, levels:{}, tutorials:all, lang, music:false, muted:true,
        storiesSeen:Object.fromEntries(['tide','shore','cove','boss-minnows','reef','docks','market','boss-turtles','machines','mirror','harbor','boss-dolphins','atoll','yard','trench','grand'].map(k=>[k,1]))}));}""", [band, lang])
    await page.reload(); await page.wait_for_selector('.logo')
    await page.evaluate("([w,i])=>window.bloomoraNav.level(w,i)", [wid, idx])
    await page.wait_for_selector('.intro .btn--big')
    await page.evaluate("document.querySelector('.intro .btn--big').click()")
    report = {'minScale': 1, 'overflow': False, 'types': []}
    start = time.time()
    while time.time() - start < 90:
        await page.wait_for_timeout(250)
        state = await page.evaluate("""()=>{
          const reason=document.querySelector('.reasoning-check');
          if(reason) { reason.querySelector('[data-reason-correct="true"]').click(); [...reason.querySelectorAll('button')].find(b=>!b.hidden&&b.classList.contains('btn')&&!b.classList.contains('btn--ghost')).click(); return {}; }
          const ov=document.querySelector('.overlay .stars-big'); if(ov) return {done:[...ov.querySelectorAll('.star.on')].length};
          if(document.querySelector('.overlay')) return {fail:document.querySelector('.overlay').innerText.slice(0,80)};
          const p=document.querySelector('.puzzle'); const r=p&&p.bloomoraRound; if(!r) return {};
          const fresh = r!==window.__last; const card=[...p.querySelectorAll('.rule-card')].some(b=>b.bloomoraOk&&!b.disabled&&!b.classList.contains('is-right'));
          return {fresh, card, type:r.type};
        }""")
        if 'done' in state: report['stars'] = state['done']; return report
        if 'fail' in state: report['fail'] = state['fail']; return report
        if not state: continue
        if state['fresh'] or (state['type'] == 'machine' and state['card']):
            await page.wait_for_timeout(450)  # let the swim-in and shrink-to-fit finish before measuring
            size = await page.evaluate(MEASURE)
            report['minScale'] = min(report['minScale'], size['scale'])
            report['overflow'] |= size['over']
            if size['hidden']: report['fail'] = f"puzzle {len(report['types'])+1} invisible"; return report
            if state['fresh']: report['types'].append(state['type'])
            await page.evaluate("()=>{window.__last=document.querySelector('.puzzle').bloomoraRound}")
            res = await page.evaluate("window.__bloomoraSolve()")
            if res.startswith('unknown') or res == 'no-round': report['fail'] = res; return report
    report['fail'] = 'timeout'; return report

async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    solver = open(os.path.join(ROOT, 'tests', 'solver.js')).read()
    problems, total = [], 0
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(executable_path=CHROME)
            for (w, h) in SIZES:
                for lang in (['en', 'ar'] if (w, h) == SIZES[0] else ['en']):
                    probe = await browser.new_page(); await probe.goto(f'http://localhost:{PORT}/'); levels = await level_list(probe); await probe.close()
                    queue = asyncio.Queue()
                    for lv in levels: queue.put_nowait(lv)
                    async def worker():
                        nonlocal total
                        ctx = await browser.new_context(viewport={'width': w, 'height': h}, service_workers='block')
                        await ctx.route('**/fonts.googleapis.com/**', lambda r: r.abort())
                        await ctx.add_init_script(solver)
                        page = await ctx.new_page(); errs = []
                        page.on('pageerror', lambda e: errs.append(str(e)))
                        await page.goto(f'http://localhost:{PORT}/'); await page.wait_for_selector('.logo')
                        while not queue.empty():
                            band, wid, idx, lid = queue.get_nowait()
                            errs.clear()
                            try: rep = await play(page, band, wid, idx, lang)
                            except Exception as e: rep = {'fail': str(e)[:120]}
                            total += 1
                            bad = rep.get('fail') or rep.get('stars') != 3 or rep.get('overflow') or errs or rep.get('minScale', 1) < 0.5
                            tag = f'{w}x{h} {lang} {lid}'
                            if bad: problems.append(f"{tag}: {json.dumps(rep)} {errs[:2]}")
                            elif rep['minScale'] < 0.75: print(f'  note {tag}: shrunk to {rep["minScale"]:.2f} ({",".join(rep["types"])})')
                        await ctx.close()
                    await asyncio.gather(*[worker() for _ in range(WORKERS)])
                    print(f'{w}x{h} {lang}: {len(levels)} levels played')
            await browser.close()
    finally:
        srv.kill()
    print(f'levels played: {total}, problems: {len(problems)}')
    for pr in problems[:40]: print(' ', pr)
    sys.exit(1 if problems else 0)

asyncio.run(main())
