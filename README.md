# Bloomora: The Sunken Lagoon

A pattern-puzzle math game for kids aged 5 to 12. Sprig, a little lantern sprout, needs help waking up a quiet lagoon, and the way to do it is to spot the rule behind each pattern.

Plain HTML, CSS and JavaScript modules. No build step and no libraries.

## Play it

The game uses JavaScript modules, so browsers won't run it from a double-clicked file. Serve the folder instead:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

It also works as-is on GitHub Pages or any static host.

## What's in it

- **4 age bands, 42 levels.** Minnows (5–6), Turtles (7–8), Dolphins (9–10) and Orcas (11–12). Each band changes the topics and how forgiving the game is: hearts, hint prices, number of answer choices, read-aloud, and whether there's a clock.
- **10 puzzle types.** Build the Pool, Look Ahead, Sunken Stone, Rule Card, Broken Stone, Pattern Parade, Line-Up, Lagoon Scales, Current Machine and Mirror Pool.
- **Fresh problems every play.** Levels are templates. Each play generates new numbers, positions, creatures and mirror pictures while keeping the level's skill and staying inside its band's limits.
- **Free Dive.** An endless mode per band that keeps generating puzzles until your hearts run out.
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
  data/             worlds.js (every level) · bands.js (age bands, settings, sources)
  puzzles/          one file per puzzle type, plus index.js
  screens/          title, age picker, map, play, results, collection, grown-ups guide
  ui/               shared widgets and the pager
tests/
  generator.test.mjs
```

**Adding a level:** add an entry to `js/data/worlds.js`. Rounds describe a pattern (for example `{ kind: 'arith', a: 3, d: 3 }`) rather than hard-coded answers, so the code works out every answer itself.

**Adding a puzzle type:** add a file to `js/puzzles/` with `id`, `name`, `prompt`, `say`, `hint` and `mount`, register it in `js/puzzles/index.js`, and give it a variation rule in `js/core/generate.js`.

## Tests

```sh
node tests/generator.test.mjs
```

This generates 400 versions of every round in the game (58,800 in total) and checks each one for a valid answer, numbers within the band's limits, and the same skill as the original level.
