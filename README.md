# Bloomora: The Sunken Lagoon

A pattern-puzzle math game for kids aged 5 to 12. Sprig, a little lantern sprout, needs help waking up a quiet lagoon, and the way to do it is to spot the rule behind each pattern.

Plain HTML, CSS and JavaScript modules. No build step and no libraries.

## Play it

The game uses JavaScript modules, so browsers won't run it from a double-clicked file. Serve the folder instead:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

It also works as-is on GitHub Pages or any static host. Once it has loaded online, it keeps working offline (there's a service worker in `sw.js`), and it can be installed to a home screen.

## What's in it

- **4 age bands, 46 levels.** Minnows (5–6), Turtles (7–8), Dolphins (9–10) and Orcas (11–12). Each band changes the topics and how forgiving the game is: hearts, hint prices, number of answer choices, read-aloud, and whether there's a clock.
- **12 puzzle types.** Build the Pool, Look Ahead, Sunken Stone, Rule Card, Broken Stone, Pattern Parade, Line-Up, Lagoon Scales, Current Machine, Mirror Pool, Twin Currents (comparing two patterns) and Number Net (odd, even and multiples). Some Orcas levels go below zero.
- **Fresh problems every play.** Levels are templates. Each play generates new numbers, positions, creatures and mirror pictures while keeping the level's skill and staying inside its band's limits.
- **Learning from mistakes.** A wrong answer brings up a "show me why" picture: the jumps between pools, the weight on each side of a scale, the repeating group in a parade, or one mirror tile that was missed.
- **Difficulty that adapts.** Two rough puzzles in a row make the next ones gentler; three clean ones make them harder. Hints come in two steps, a nudge first and then the full hint.
- **Practice Pool.** Missed puzzles come back later with new numbers, spaced out over days until they're mastered. They also turn up in Free Dive.
- **Free Dive and Daily Dive.** Free Dive is endless. Daily Dive is six puzzles a day, the same for everyone in a band, with a streak counter.
- **Players and progress.** Up to six players per device, each with their own save. The grown-ups page has a Progress tab with stars, streaks, accuracy per puzzle type and what needs practice.
- **Sprig's Wardrobe.** Pearls buy hats for Sprig.
- **Read-aloud** for early readers, with emoji and symbols turned into words.
- **Fits any screen.** Nothing scrolls. Long screens page with big arrow buttons, and puzzles shrink to fit when they have to.
- **A guide for grown-ups** explaining which curriculum standard each level lines up with (US Common Core and England's national curriculum), with sources.

Progress is saved in the browser's local storage.

## How the code is laid out

```
index.html
css/        base.css (tokens, buttons, pager) · screens.css · puzzles.css
js/
  main.js           screen router
  core/             sequences, random generation, drawing pools, number pad, sound, speech, saving
  data/             worlds.js (every level) · bands.js (age bands, settings, sources) · templates.js · shop.js
  puzzles/          one file per puzzle type, plus index.js
  screens/          title, age picker, map, play, results, collection, grown-ups guide
  ui/               shared widgets and the pager
icons/ · manifest.webmanifest · sw.js   install + offline support
tests/
  generator.test.mjs · offline.test.mjs
```

**Adding a level:** add an entry to `js/data/worlds.js`. Rounds describe a pattern (for example `{ kind: 'arith', a: 3, d: 3 }`) rather than hard-coded answers, so the code works out every answer itself.

**Adding a puzzle type:** add a file to `js/puzzles/` with `id`, `name`, `prompt`, `say`, `nudge`, `hint` and `mount` (call `api.showWhy(el)` after a wrong answer to explain it), register it in `js/puzzles/index.js`, and give it a variation rule in `js/core/generate.js`.

## Tests

```sh
node tests/generator.test.mjs   # 64,400 generated problems: valid answers, band limits, same skill
node tests/offline.test.mjs     # sw.js lists every file the game needs offline
```

GitHub Actions runs both on every push (`.github/workflows/test.yml`). If you add a file, add it to the `FILES` list in `sw.js` and bump `VERSION`.

## Standards codes

The grown-ups page maps each level to US Common Core and England national curriculum codes. Codes marked with an asterisk (*) couldn't be checked against the official text while the game was built, so have a teacher confirm them before relying on that page.
