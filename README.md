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

- **4 age bands, 60 levels in 16 worlds.** Minnows (5–6), Turtles (7–8), Dolphins (9–10) and Orcas (11–12). Each band changes the topics and how forgiving the game is: hint prices, number of answer choices, read-aloud, whether there's a clock, and hearts (Minnows have none to lose in levels, so they can keep trying).
- **15 puzzle types.** Build the Pool, Look Ahead, Sunken Stone, Rule Card, Broken Stone, Pattern Parade, Line-Up, Lagoon Scales, Current Machine, Mirror Pool, Twin Currents, Number Net, plus Stick Shapes (growing matchstick patterns), Lagoon Tales (pattern word problems) and Tide Charts (tables and bar graphs). Each type has its own icon and colour.
- **Real-world numbers.** Coin Cove, Market Bay, Harbor Charts and Shipwright Yard bring in money, clock times, halves and decimals. The values are whole numbers underneath (cents, minutes, halves, tenths), so answers stay exact. Some Orcas levels go below zero.
- **A story to follow.** Every world opens with a short chapter card and a sleeping sea friend. Finish the world and the friend wakes up. Sprig swims along an illustrated trail on the map, and the art is drawn in SVG rather than emoji.
- **Pattern Maker.** Children type their own pattern and Sprig tries to guess the rule (add, multiply, squares, triangles, Fibonacci, growing jumps, repeats and more). Stumping Sprig is the goal.
- **Fresh problems every play.** Levels are templates. Each play generates new numbers, positions, creatures and mirror pictures while keeping the level's skill and staying inside its band's limits.
- **Learning from mistakes.** A wrong answer brings up a "show me why" picture: the jumps between pools, the weight on each side of a scale, the repeating group in a parade, or one mirror tile that was missed.
- **Difficulty that adapts.** Two rough puzzles in a row make the next ones gentler; three clean ones make them harder. Hints come in two steps, a nudge first and then the full hint.
- **Practice Pool.** Missed puzzles come back later with new numbers, spaced out over days until they're mastered. They also turn up in Free Dive.
- **Free Dive and Daily Dive.** Free Dive is endless. Daily Dive is six puzzles a day, the same for everyone in a band, with a streak counter.
- **Players and progress.** Up to six players per device, each with their own save. The grown-ups page has a Progress tab with stars, streaks, accuracy per puzzle type and what needs practice.
- **First-time help.** The first time a child meets a puzzle type, a ghost hand shows where to look and where to answer. "Show me how" in ⚙️ Settings replays it.
- **Results a child understands.** Younger bands see "You can count in 5s!" and the pearls they found. Older bands also get the points tally.
- **Sprig's Wardrobe.** Pearls buy hats for Sprig.
- **One settings menu (⚙️).** Sound effects, background music (generated as it plays), read-aloud, big text, language, "show me how" and leaving a level.
- **Read-aloud** for early readers, with emoji and symbols turned into words.
- **Arabic.** The interface, puzzle prompts, hints, stories and Pattern Maker switch to Arabic with a right-to-left layout. Puzzle boards stay left-to-right so number patterns read in the direction the arrows point. Level names and intros are still English.
- **Accessibility.** Right and wrong answers show ✓ and ✗ as well as colour. Keys 1–9 press answer buttons, the number pad takes typed numbers, and focus outlines show where you are. Big text is in Settings, and animations calm down when the device asks for reduced motion.
- **Progress codes and a class view.** A player's progress packs into a text code. Paste it on another device to move the player, or paste a whole class's codes into the grown-ups page to see them side by side. There's no server: a live class dashboard would need accounts, which this version doesn't have.
- **Fits any screen.** Nothing scrolls. Long screens page with big arrow buttons, and puzzles shrink to fit when they have to.
- **A guide for grown-ups** explaining which curriculum standard each level lines up with (US Common Core and England's national curriculum), with sources.

Progress is saved in the browser's local storage.

## How the code is laid out

```
index.html
css/        base.css (tokens, buttons, pager) · screens.css · puzzles.css
js/
  main.js           screen router
  core/             sequences, random generation, drawing pools, number pad, sound and music, speech,
                    saving, translations (i18n.js), progress codes, Sprig's rule guesser
  data/             worlds.js (every level) · bands.js (age bands, settings, sources) · templates.js · shop.js
  puzzles/          one file per puzzle type, plus index.js
  screens/          title, age picker, map, play, results, collection, Pattern Maker, grown-ups guide
  ui/               shared widgets, pager, SVG art, settings menu, ghost-hand tutorial
icons/ · manifest.webmanifest · sw.js   install + offline support
tests/
  generator.test.mjs · offline.test.mjs · play.test.py + solver.js (browser play-through)
```

**Adding a level:** add an entry to `js/data/worlds.js` and a line to `js/data/cando.js` saying what a child can now do. Rounds describe a pattern (for example `{ kind: 'arith', a: 3, d: 3 }`) rather than hard-coded answers, so the code works out every answer itself.

**Adding a puzzle type:** add a file to `js/puzzles/` with `id`, `name`, `prompt`, `say`, `nudge`, `hint` and `mount` (call `api.showWhy(el)` after a wrong answer to explain it), register it in `js/puzzles/index.js` (with an icon and colour in `LOOK`), add a ghost-hand line to `HOW` in `js/ui/tutorial.js`, Arabic text in `js/core/i18n.js`, and give it a variation rule in `js/core/generate.js`.

## Tests

```sh
node tests/generator.test.mjs   # 82,000 generated problems: valid answers, band limits, same skill
node tests/offline.test.mjs     # sw.js lists every file the game needs offline
python3 tests/play.test.py      # plays all 60 levels in Chromium (portrait, landscape, Arabic)
```

The play test needs Playwright for Python. It answers every puzzle the way a child would and checks for 3 stars, no script errors and nothing spilling off the screen. Set `BLOOMORA_CHROME` if Chromium lives somewhere else.

GitHub Actions runs the two Node tests on every push (`.github/workflows/test.yml`). If you add a file, add it to the `FILES` list in `sw.js` and bump `VERSION`.

## Standards codes

The grown-ups page maps each level to US Common Core and England national curriculum codes. Codes marked with an asterisk (*) couldn't be checked against the official text while the game was built, so have a teacher confirm them before relying on that page.
