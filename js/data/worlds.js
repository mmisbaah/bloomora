// All worlds and levels, grouped by age band (see bands.js).
// A round inherits world.defaults, then level.defaults, then its own fields.
// Sequences ({ kind, ... }) drive every number answer; see core/sequences.js.
// Pool numbers are real term numbers: `from: 2` means the first pool shown is Pool 2.
// Each level lists the skill it practises and the standards it lines up with
// (CC = US Common Core, Eng = England's national curriculum year or key stage).

const arith = (a, d) => ({ kind: 'arith', a, d });
const geo = (a, r) => ({ kind: 'geo', a, r });
const SQUARE = { kind: 'square' };
const CUBE = { kind: 'cube' };
const TRI = { kind: 'tri' };
const FIB = { kind: 'fib' };
const TILES = { seq: SQUARE, style: 'squares', item: '▪', itemName: 'tile', itemPlural: 'tiles' };

export const WORLDS = [
  // ───────────── Minnows · ages 5–6 ─────────────
  {
    id: 'tide', band: 'minnows', num: 1,
    name: 'Tidepool Terraces',
    crest: '🐚', color: 'var(--coral)',
    blurb: 'Repeating parades, counting on by one, and lining things up.',
    defaults: { item: '🐚', itemName: 'shell', itemPlural: 'shells', style: 'count' },
    reward: { emoji: '🦀', name: 'Pip the Hermit Crab', line: 'Pip trades shells with anyone who can count them.' },
    levels: [
      {
        id: 'tide-1', name: 'First Shells',
        skill: 'AB repeating pattern; counting on by 1 to 6',
        std: ['Research: AB patterns first', 'CC K.CC.A.2', 'Eng Y1'],
        intro: 'Patterns are how the lagoon grows. Watch closely and you can tell what comes next.',
        defaults: { seq: arith(1, 1) },
        rounds: [
          { type: 'shapes', unit: ['🐚', '🐠'], shown: 5, blanks: 1 },
          { type: 'build', from: 1, show: 3, mode: 'one' },
          { type: 'predict', from: 1, show: 4, ask: 6 },
        ],
      },
      {
        id: 'tide-2', name: 'Starfish Steps',
        skill: 'AAB pattern; counting on from 2; missing number to 6',
        std: ['Research: AAB after AB', 'CC K.CC.A.2'],
        intro: 'Starfish like to march in twos. Can you keep their parade going?',
        rounds: [
          { type: 'shapes', unit: ['⭐', '⭐', '🐚'], shown: 6, blanks: 2 },
          { type: 'build', seq: arith(2, 1), from: 1, show: 3, mode: 'one' },
          { type: 'missing', seq: arith(1, 1), from: 1, count: 6, gap: 4 },
        ],
      },
      {
        id: 'tide-3', name: 'Turtle Line-Up',
        skill: 'Ordering numbers within 10',
        std: ['CC K.CC.C.7', 'Eng Y1'],
        intro: 'The baby turtles are racing to the sea. Help them line up first!',
        rounds: [
          { type: 'sort', values: [3, 7, 1, 5], critter: '🐢', critterName: 'turtles' },
          { type: 'sort', values: [8, 2, 6, 4, 9], critter: '🐢', critterName: 'turtles' },
          { type: 'predict', seq: arith(4, 1), from: 1, show: 3, ask: 5 },
        ],
      },
      {
        id: 'tide-4', name: 'Pattern Pond',
        skill: 'ABC pattern; counting in 2s to 10',
        std: ['Research: ABC is harder', 'Eng Y1: multiples of 2'],
        intro: 'Three kinds of fish now, and a stone path that skips by twos.',
        rounds: [
          { type: 'shapes', unit: ['🐠', '🐡', '🦑'], shown: 7, blanks: 2 },
          { type: 'missing', seq: arith(2, 2), from: 1, count: 5, gap: 3 },
          { type: 'oddOne', seq: arith(1, 1), from: 1, count: 6, bad: { at: 4, value: 7 } },
        ],
      },
      {
        id: 'tide-5', name: 'Count Down Cove',
        skill: 'Counting back in 1s and 2s from 10; AABC pattern',
        std: ['Eng Y1: count backwards', 'CC 1.OA.C.5'],
        intro: 'The tide is going out, so these pools get smaller each time.',
        rounds: [
          { type: 'build', seq: arith(10, -1), from: 1, show: 3, mode: 'one' },
          { type: 'missing', seq: arith(10, -2), from: 1, count: 5, gap: 3 },
          { type: 'sort', values: [4, 9, 2, 7], desc: true, critter: '🦀', critterName: 'crabs' },
          { type: 'shapes', unit: ['🐚', '🐚', '⭐', '🐠'], shown: 8, blanks: 2 },
        ],
      },
    ],
  },
  {
    id: 'shore', band: 'minnows', num: 2,
    name: 'Shell Shore',
    crest: '🏖️', color: 'var(--sand)',
    blurb: 'Counting in 2s, 5s and 10s, and numbers up to 20.',
    defaults: { item: '🐚', itemName: 'shell', itemPlural: 'shells', style: 'count' },
    reward: { emoji: '🦐', name: 'Skip the Shrimp', line: 'Skip only ever hops in twos, fives or tens.' },
    levels: [
      {
        id: 'shore-1', name: 'Twos Together',
        skill: 'Counting in 2s; spotting a broken count',
        std: ['Eng Y1: multiples of 2'],
        intro: 'Crabs walk side by side, two at a time.',
        defaults: { seq: arith(2, 2), item: '🦀', itemName: 'crab', itemPlural: 'crabs', style: 'groups' },
        rounds: [
          { type: 'build', from: 1, show: 3, mode: 'group' },
          { type: 'oddOne', from: 1, count: 6, bad: { at: 4, value: 9 } },
          { type: 'shapes', unit: ['🦀', '🐚', '🐚'], shown: 5, blanks: 2 },
        ],
      },
      {
        id: 'shore-2', name: 'High Fives',
        skill: 'Counting in 5s to 30',
        std: ['Eng Y1: multiples of 5', 'CC 2.NBT.A.2 (preview)'],
        intro: 'Starfish have five arms, so we count them in fives.',
        defaults: { seq: arith(5, 5), item: '⭐', itemName: 'arm', itemPlural: 'arms', style: 'groups' },
        rounds: [
          { type: 'build', from: 1, show: 3, mode: 'group' },
          { type: 'missing', from: 1, count: 6, gap: 5 },
          { type: 'sort', values: [15, 5, 20, 10], critter: '⭐', critterName: 'starfish' },
        ],
      },
      {
        id: 'shore-3', name: 'Tens Tide',
        skill: 'Counting in 10s to 100',
        std: ['CC K.CC.A.1', 'Eng Y1: multiples of 10'],
        intro: 'Big waves bring ten shells at a time.',
        defaults: { seq: arith(10, 10), style: 'number' },
        rounds: [
          { type: 'missing', from: 1, count: 5, gap: 3 },
          { type: 'predict', from: 1, show: 4, ask: 6 },
          { type: 'shapes', unit: ['🐚', '🐚', '🐠'], shown: 6, blanks: 1 },
        ],
      },
      {
        id: 'shore-4', name: 'Up to Twenty',
        skill: 'Ordering and counting on within 20',
        std: ['CC K.CC.A.2', 'CC 1.NBT.A.1'],
        intro: 'The lagoon goes deeper now. These numbers reach all the way to 20.',
        defaults: { style: 'number' },
        rounds: [
          { type: 'sort', values: [12, 3, 18, 7, 15], critter: '🐟', critterName: 'fish' },
          { type: 'missing', seq: arith(11, 1), from: 1, count: 6, gap: 4 },
          { type: 'predict', seq: arith(14, 1), from: 1, show: 3, ask: 6 },
        ],
      },
    ],
  },
  {
    id: 'boss-minnows', band: 'minnows', boss: true, num: '★',
    name: 'Tidepool Parade',
    crest: '🎏', color: 'var(--coral)',
    blurb: 'Six mixed puzzles from the Minnows worlds. No clock, so take your time.',
    defaults: { item: '🐚', itemName: 'shell', itemPlural: 'shells', style: 'count' },
    reward: { emoji: '🐡', name: 'Puff the Pufferfish', line: 'Puff gets very round with pride when you finish the parade.' },
    levels: [
      {
        id: 'boss-minnows-1', name: 'Tidepool Parade',
        skill: 'Review of all Minnows skills',
        std: ['Review'],
        intro: 'Everyone in the tidepool has come to watch. Show them what you have learned!',
        rounds: [
          { type: 'shapes', unit: ['🐠', '🐠', '🦀'], shown: 7, blanks: 2 },
          { type: 'build', seq: arith(3, 1), from: 1, show: 3, mode: 'one' },
          { type: 'missing', seq: arith(2, 2), from: 1, count: 5, gap: 4, style: 'number' },
          { type: 'sort', values: [9, 2, 6, 4], critter: '🐢', critterName: 'turtles' },
          { type: 'predict', seq: arith(10, 10), from: 1, show: 3, ask: 5, style: 'number' },
          { type: 'oddOne', seq: arith(5, 5), from: 1, count: 5, bad: { at: 2, value: 12 } },
        ],
      },
    ],
  },

  // ───────────── Turtles · ages 7–8 ─────────────
  {
    id: 'reef', band: 'turtles', num: 3,
    name: 'Skip-Step Reef',
    crest: '🪸', color: 'var(--kelp)',
    blurb: 'Skip counting in 3s, 4s, 5s, 8s, 50s and 100s.',
    defaults: { item: '🪸', itemName: 'coral', itemPlural: 'corals', style: 'groups' },
    reward: { emoji: '🐠', name: 'Dot the Clownfish', line: 'Dot can count corals in threes, fours and fives without stopping.' },
    levels: [
      {
        id: 'reef-3', name: 'Fives Alive',
        skill: 'Counting in 5s to 35; spotting a broken count',
        std: ['CC 2.NBT.A.2', 'Eng Y2: steps of 5'],
        intro: 'Anemones bloom in fives. One stone on the path got it wrong, though.',
        defaults: { seq: arith(5, 5), item: '🌸', itemName: 'anemone', itemPlural: 'anemones' },
        rounds: [
          { type: 'oddOne', from: 1, count: 6, bad: { at: 3, value: 14 } },
          { type: 'build', from: 1, show: 3, mode: 'group' },
          { type: 'predict', from: 1, show: 3, ask: 7 },
          { type: 'rule', from: 1, show: 3 },
        ],
      },
      {
        id: 'reef-1', name: 'Clusters of Three',
        skill: 'Counting in 3s; naming the rule',
        std: ['Eng Y2: steps of 3', 'CC 3.OA.D.9'],
        intro: 'Coral grows here in tidy clusters. Count the clusters, not every coral!',
        defaults: { seq: arith(3, 3) },
        rounds: [
          { type: 'build', from: 1, show: 3, mode: 'group' },
          { type: 'predict', from: 1, show: 3, ask: 6 },
          { type: 'rule', from: 1, show: 4 },
        ],
      },
      {
        id: 'reef-2', name: 'Sea Fan Fours',
        skill: 'Counting in 4s to 32',
        std: ['Eng Y3: multiples of 4', 'CC 3.OA.C.7'],
        intro: 'Sea fans sprout four at a time.',
        defaults: { seq: arith(4, 4), item: '🌾', itemName: 'sea fan', itemPlural: 'sea fans' },
        rounds: [
          { type: 'build', from: 1, show: 3, mode: 'group' },
          { type: 'missing', from: 1, count: 6, gap: 5 },
          { type: 'predict', from: 1, show: 3, ask: 8 },
        ],
      },
      {
        id: 'reef-8', name: 'Eight-Arm Reef',
        skill: 'Counting in 8s to 48',
        std: ['Eng Y3: multiples of 8', 'CC 3.OA.D.9'],
        intro: 'Octopus arms come in eights. That adds up quickly!',
        defaults: { seq: arith(8, 8), item: '🦑', itemName: 'arm', itemPlural: 'arms' },
        rounds: [
          { type: 'build', from: 1, show: 3, mode: 'group' },
          { type: 'predict', from: 1, show: 3, ask: 6, style: 'number' },
          { type: 'rule', from: 1, show: 3, style: 'number' },
        ],
      },
      {
        id: 'reef-h', name: 'Hundreds Harbor',
        skill: 'Counting in 10s, 50s and 100s within 1000',
        std: ['CC 2.NBT.A.2', 'Eng Y3: multiples of 50 and 100'],
        intro: 'Ships unload their cargo in big, round numbers.',
        defaults: { style: 'number' },
        rounds: [
          { type: 'missing', seq: arith(100, 100), from: 1, count: 6, gap: 4 },
          { type: 'predict', seq: arith(50, 50), from: 1, show: 4, ask: 7 },
          { type: 'oddOne', seq: arith(10, 10), from: 1, count: 6, bad: { at: 5, value: 55 } },
        ],
      },
    ],
  },
  {
    id: 'docks', band: 'turtles', num: 4,
    name: 'Doubler Docks',
    crest: '⚓', color: 'var(--sand)',
    blurb: 'Times-table machines, missing factors and upright mirror lines.',
    defaults: { item: '🦀', itemName: 'crab', itemPlural: 'crabs', style: 'number' },
    reward: { emoji: '🦭', name: 'Bolt the Seal', line: 'Bolt runs the dock machines and never forgets a times table.' },
    levels: [
      {
        id: 'mach-1', name: 'The Doubler',
        skill: '×2 and ×3 machines; one-sided scale (2 × ? = 8)',
        std: ['CC 3.OA.A.4', 'CC 3.OA.C.7', 'Eng Y2–3 tables'],
        intro: 'Numbers swim into these machines and come out changed. Find the secret rule.',
        rounds: [
          { type: 'machine', m: 2, b: 0, examples: [1, 2, 3], ask: 7 },
          { type: 'machine', m: 3, b: 0, examples: [2, 4, 5], ask: 10, pickRule: true },
          { type: 'balance', critter: '🦀', left: { x: 2, k: 0 }, right: { x: 0, k: 8 } },
        ],
      },
      {
        id: 'dock-2', name: 'Table Machines',
        skill: '×5 and ×10 machines; 4 × ? = 12',
        std: ['Eng Y2: 2, 5 and 10 tables', 'CC 3.OA.A.4'],
        intro: 'These machines know their 5 and 10 times tables.',
        rounds: [
          { type: 'machine', m: 5, b: 0, examples: [1, 2, 3], ask: 6 },
          { type: 'machine', m: 10, b: 0, examples: [2, 3, 5], ask: 7, pickRule: true },
          { type: 'balance', critter: '🐡', left: { x: 4, k: 0 }, right: { x: 0, k: 12 } },
        ],
      },
      {
        id: 'mirr-1', name: 'Butterfly Fish',
        skill: 'Completing a picture across a vertical mirror line',
        std: ['Eng Y2: vertical line symmetry', 'CC 4.G.A.3 (preview)'],
        intro: 'The water here is so still it works like a mirror.',
        rounds: [
          { type: 'mirror', axis: 'v', pattern: ['..#', '.##', '###', '..#'] },
          { type: 'shapes', unit: ['🔺', '🔷', '🔷'], shown: 6, blanks: 2 },
          { type: 'mirror', axis: 'v', pattern: ['#..', '##.', '.##', '##.', '#..'] },
        ],
      },
      {
        id: 'dock-4', name: 'Fold the Fish',
        skill: 'Vertical symmetry; AABB pattern',
        std: ['Eng Y2: vertical line symmetry'],
        intro: 'Fold the picture along the line in your head. Both halves must match.',
        rounds: [
          { type: 'mirror', axis: 'v', pattern: ['##.', '#..', '###', '#..'] },
          { type: 'shapes', unit: ['🔺', '🔺', '🔷', '🔷'], shown: 6, blanks: 2 },
          { type: 'mirror', axis: 'v', pattern: ['...#', '..##', '.###', '..##', '...#'] },
        ],
      },
      {
        id: 'dock-5', name: 'Times Tide',
        skill: 'Multiplying within 100; working back from a product',
        std: ['CC 3.OA.C.7', 'CC 3.OA.A.4', 'Eng Y3: 3, 4 and 8 tables'],
        intro: 'The tide machines multiply. Sometimes you know what came out and need to find what went in.',
        rounds: [
          { type: 'machine', m: 4, b: 0, examples: [2, 5, 3], ask: 9 },
          { type: 'balance', critter: '🦞', left: { x: 3, k: 0 }, right: { x: 0, k: 15 } },
          { type: 'machine', m: 2, b: 0, examples: [3, 5, 8], ask: 9, inverse: true },
        ],
      },
    ],
  },
  {
    id: 'boss-turtles', band: 'turtles', boss: true, num: '★',
    name: 'Reef Relay',
    crest: '🏁', color: 'var(--kelp)',
    blurb: 'Six mixed puzzles from the Turtles worlds. No clock.',
    defaults: { item: '🪸', itemName: 'coral', itemPlural: 'corals', style: 'number' },
    reward: { emoji: '🦈', name: 'Finn the Reef Shark', line: 'Finn is friendly, fast, and loves a relay race.' },
    levels: [
      {
        id: 'boss-turtles-1', name: 'Reef Relay',
        skill: 'Review of all Turtles skills',
        std: ['Review'],
        intro: 'Pass the baton from puzzle to puzzle. The whole reef is cheering!',
        rounds: [
          { type: 'build', seq: arith(4, 4), from: 1, show: 3, mode: 'group', style: 'groups' },
          { type: 'missing', seq: arith(100, 100), from: 1, count: 5, gap: 3 },
          { type: 'machine', m: 3, b: 0, examples: [1, 2, 4], ask: 8 },
          { type: 'balance', critter: '🦀', left: { x: 2, k: 0 }, right: { x: 0, k: 14 } },
          { type: 'mirror', axis: 'v', pattern: ['#..', '##.', '#.#', '###'] },
          { type: 'predict', seq: arith(5, 5), from: 1, show: 3, ask: 9, style: 'groups' },
        ],
      },
    ],
  },

  // ───────────── Dolphins · ages 9–10 ─────────────
  {
    id: 'machines', band: 'dolphins', num: 5,
    name: 'Current Machines',
    crest: '⚙️', color: 'var(--sky)',
    blurb: 'Rules that don’t start at zero, tables to 12 × 12, and two-step machines.',
    defaults: { item: '🦀', itemName: 'crab', itemPlural: 'crabs', style: 'number' },
    reward: { emoji: '🐙', name: 'Gizmo the Octopus', line: 'Gizmo built every current machine with all eight arms.' },
    levels: [
      {
        id: 'reef-4', name: 'Off-Beat Reef',
        skill: 'Patterns from a rule with a non-zero start (2, 5, 8 …)',
        std: ['CC 4.OA.C.5'],
        intro: 'These patterns don’t start where you expect. The jump is what matters.',
        rounds: [
          { type: 'predict', seq: arith(2, 3), from: 1, show: 4, ask: 7 },
          { type: 'missing', seq: arith(7, 4), from: 1, count: 5, gap: 2 },
          { type: 'rule', seq: arith(2, 3), from: 1, show: 4 },
        ],
      },
      {
        id: 'mach-t', name: 'Table Titans',
        skill: 'Multiples of 7, 9, 12 and 25',
        std: ['Eng Y4: multiples of 6, 7, 9, 25', 'Eng Y4: tables to 12 × 12'],
        intro: 'The trickiest tables in the lagoon live here.',
        rounds: [
          { type: 'missing', seq: arith(7, 7), from: 1, count: 6, gap: 4 },
          { type: 'predict', seq: arith(9, 9), from: 1, show: 3, ask: 8 },
          { type: 'oddOne', seq: arith(25, 25), from: 1, count: 6, bad: { at: 4, value: 95 } },
          { type: 'machine', m: 12, b: 0, examples: [2, 3, 5], ask: 9 },
        ],
      },
      {
        id: 'reef-5', name: 'Reef Count Down',
        skill: 'Counting backwards in 4s, 5s and 6s from large numbers',
        std: ['Eng Y4: count backwards', 'CC 4.OA.C.5'],
        intro: 'Big numbers, getting smaller. Skip count backwards!',
        rounds: [
          { type: 'missing', seq: arith(50, -5), from: 1, count: 6, gap: 5 },
          { type: 'oddOne', seq: arith(40, -4), from: 1, count: 6, bad: { at: 3, value: 33 } },
          { type: 'predict', seq: arith(60, -6), from: 1, show: 3, ask: 6 },
          { type: 'sort', values: [24, 6, 18, 12, 30], critter: '🐟', critterName: 'fish' },
        ],
      },
      {
        id: 'mach-2', name: 'Add-On Engine',
        skill: 'Two-step rules (× then +); 3 × ? + 2 = 11',
        std: ['CC 4.OA.C.5', 'CC 5.OA.B.3'],
        intro: 'Some machines add, some multiply, and some do both.',
        rounds: [
          { type: 'machine', m: 1, b: 5, examples: [1, 4, 6], ask: 12 },
          { type: 'machine', m: 2, b: 1, examples: [1, 2, 3], ask: 10, pickRule: true },
          { type: 'balance', critter: '🐙', left: { x: 3, k: 2 }, right: { x: 0, k: 11 } },
        ],
      },
      {
        id: 'mach-s', name: 'Two-Step Current',
        skill: 'Finding and naming a two-step rule',
        std: ['CC 4.OA.C.5', 'Eng Y6 (preview): simple formulae'],
        intro: 'Two steps hide inside every one of these machines.',
        rounds: [
          { type: 'machine', m: 3, b: 1, examples: [1, 2, 3], ask: 10, pickRule: true },
          { type: 'balance', critter: '🦀', left: { x: 2, k: 3 }, right: { x: 0, k: 11 } },
          { type: 'rule', seq: arith(4, 3), from: 1, show: 4 },
        ],
      },
    ],
  },
  {
    id: 'mirror', band: 'dolphins', num: 6,
    name: 'Mirror Lagoon',
    crest: '🪞', color: 'var(--lilac)',
    blurb: 'Mirror lines in any direction, plus square and cube numbers.',
    defaults: { item: '🌿', itemName: 'kelp leaf', itemPlural: 'kelp leaves', style: 'count' },
    reward: { emoji: '🪼', name: 'Glim the Jellyfish', line: 'Glim is perfectly symmetrical and very proud of it.' },
    levels: [
      {
        id: 'mirr-2', name: 'Still Water',
        skill: 'Symmetry across horizontal and vertical lines',
        std: ['CC 4.G.A.3', 'Eng Y4: symmetric figures'],
        intro: 'Now the mirror lies flat, like the surface of the lagoon.',
        rounds: [
          { type: 'mirror', axis: 'h', pattern: ['#...#', '.#.#.', '..#..'] },
          { type: 'mirror', axis: 'v', pattern: ['...#', '..##', '.#.#', '####', '...#'] },
          { type: 'shapes', unit: ['🟡', '🔺', '🔺', '🟣'], shown: 8, blanks: 2 },
        ],
      },
      {
        id: 'mirr-6', name: 'Reflection Reef',
        skill: 'Larger symmetric figures, both orientations',
        std: ['CC 4.G.A.3', 'Eng Y4: symmetric figures'],
        intro: 'Bigger pictures, same trick: count the steps from the line.',
        rounds: [
          { type: 'mirror', axis: 'v', pattern: ['#...', '##..', '#.#.', '#..#', '##..', '#...'] },
          { type: 'mirror', axis: 'h', pattern: ['#..#..', '.##...', '...###'] },
          { type: 'shapes', unit: ['🔷', '🟡', '🟡', '🔺', '🔺'], shown: 9, blanks: 2 },
        ],
      },
      {
        id: 'atol-1', name: 'Square Steps',
        skill: 'Square numbers as growing squares',
        std: ['Eng Y5: square numbers', 'CC 6.EE.A.1'],
        intro: 'Each sand square grows by one L-shaped border. Watch the gold tiles.',
        defaults: TILES,
        rounds: [
          { type: 'build', from: 1, show: 4, mode: 'border' },
          { type: 'predict', from: 1, show: 4, ask: 7 },
          { type: 'rule', from: 1, show: 4 },
        ],
      },
      {
        id: 'atol-2', name: 'Border Detective',
        skill: 'Square numbers starting mid-sequence',
        std: ['Eng Y5: square numbers'],
        intro: 'These squares start part-way along the beach. Pool numbers tell you the side length.',
        defaults: TILES,
        rounds: [
          { type: 'build', from: 2, show: 4, mode: 'border' },
          { type: 'missing', from: 3, count: 5, gap: 5 },
          { type: 'oddOne', from: 1, count: 6, bad: { at: 4, value: 15 } },
        ],
      },
      {
        id: 'mirr-5', name: 'Mirror Master',
        skill: 'Large symmetric figures; cube numbers',
        std: ['CC 4.G.A.3', 'Eng Y5: cube numbers'],
        intro: 'The largest mirrors in the lagoon, and a line-up of cube numbers.',
        rounds: [
          { type: 'mirror', axis: 'h', pattern: ['##....', '#.#...', '#..#..', '#...##'] },
          { type: 'mirror', axis: 'v', pattern: ['....#', '...##', '..#.#', '.#..#', '#####', '..#..'] },
          { type: 'sort', values: [64, 8, 27, 1, 125], critter: '🧊', critterName: 'ice cubes' },
          { type: 'missing', seq: CUBE, from: 1, count: 5, gap: 3, style: 'number' },
        ],
      },
    ],
  },
  {
    id: 'boss-dolphins', band: 'dolphins', boss: true, num: '★',
    name: 'Current Rush',
    crest: '🌀', color: 'var(--sky)',
    blurb: 'Six mixed puzzles against the tide clock.',
    defaults: { item: '🐚', itemName: 'shell', itemPlural: 'shells', style: 'number' },
    reward: { emoji: '🐬', name: 'Echo the Dolphin', line: 'Echo can hear a pattern from the other side of the lagoon.' },
    levels: [
      {
        id: 'boss-dolphins-1', name: 'Current Rush',
        skill: 'Review of all Dolphins skills, timed',
        std: ['Review'],
        intro: 'The current is strong today. Solve all six before the tide turns!',
        timeLimit: 240,
        par: 180,
        rounds: [
          { type: 'machine', m: 4, b: 3, examples: [1, 2, 5], ask: 10 },
          { type: 'balance', critter: '🐡', left: { x: 3, k: 5 }, right: { x: 0, k: 20 } },
          { type: 'mirror', axis: 'h', pattern: ['#..#..', '.##...', '...###'] },
          { type: 'predict', ...TILES, from: 1, show: 4, ask: 9 },
          { type: 'missing', seq: arith(9, 9), from: 1, count: 6, gap: 5 },
          { type: 'oddOne', seq: arith(3, 4), from: 1, count: 6, bad: { at: 3, value: 12 } },
        ],
      },
    ],
  },

  // ───────────── Orcas · ages 11–12 ─────────────
  {
    id: 'atoll', band: 'orcas', num: 7,
    name: 'Algebra Atoll',
    crest: '🏝️', color: 'var(--lilac)',
    blurb: 'Linear sequences, the nth term, balancing equations and triangular numbers.',
    defaults: { item: '🦀', itemName: 'crab', itemPlural: 'crabs', style: 'number' },
    reward: { emoji: '🐢', name: 'Atlas the Sea Turtle', line: 'Atlas has carried the atoll’s equations on his shell for a hundred years.' },
    levels: [
      {
        id: 'atol-6', name: 'Sequence Detective',
        skill: 'Linear sequences and the nth term (3n + 1)',
        std: ['Eng Y6: linear number sequences', 'Eng KS3: nth term'],
        intro: 'A detective finds the rule that works for any pool, even Pool 20.',
        defaults: { seq: arith(4, 3) },
        rounds: [
          { type: 'predict', from: 1, show: 4, ask: 20 },
          {
            type: 'rule', from: 1, show: 4,
            cards: [
              { text: 'Pool n has 3n + 1', correct: true },
              { text: 'Pool n has 3n', correct: false },
              { text: 'Pool n has n + 3', correct: false },
              { text: 'Pool n has 4n', correct: false },
            ],
          },
          { type: 'missing', seq: arith(5, 6), from: 1, count: 5, gap: 4 },
        ],
      },
      {
        id: 'mach-3', name: 'Lagoon Scales',
        skill: 'Solving px + q = r; unknowns on both sides',
        std: ['CC 6.EE.B.7', 'CC 7.EE.B.4', 'Eng Y6: missing numbers algebraically'],
        intro: 'Whatever you do to one side of the scale, do to the other.',
        rounds: [
          { type: 'balance', critter: '🦀', left: { x: 4, k: 1 }, right: { x: 0, k: 13 } },
          { type: 'balance', critter: '🐡', left: { x: 2, k: 5 }, right: { x: 0, k: 17 } },
          { type: 'balance', critter: '🦞', left: { x: 5, k: 0 }, right: { x: 2, k: 9 } },
        ],
      },
      {
        id: 'mach-4', name: 'Reverse Current',
        skill: 'Inverse operations; naming two-step rules',
        std: ['CC 6.EE.C.9', 'CC 7.EE.B.4'],
        intro: 'The current has flipped. Sometimes you know what came out and need what went in.',
        rounds: [
          { type: 'machine', m: 2, b: 3, examples: [1, 2, 4], ask: 10, inverse: true },
          { type: 'machine', m: 3, b: -1, examples: [1, 2, 3], ask: 9, pickRule: true },
          { type: 'balance', critter: '🦀', left: { x: 3, k: 4 }, right: { x: 1, k: 12 } },
        ],
      },
      {
        id: 'atol-3', name: 'Triangle Shoals',
        skill: 'Triangular numbers',
        std: ['Eng KS3: special sequences'],
        intro: 'Pearls stack into triangles here. Every new row is one longer.',
        defaults: { seq: TRI, style: 'triangle', itemName: 'pearl', itemPlural: 'pearls' },
        rounds: [
          { type: 'build', from: 1, show: 4, mode: 'row' },
          { type: 'predict', from: 1, show: 4, ask: 7 },
          { type: 'rule', from: 1, show: 5 },
        ],
      },
      {
        id: 'mach-5', name: 'Machine Master',
        skill: 'Larger two-step rules, forwards and backwards',
        std: ['CC 6.EE.C.9', 'CC 8.EE.C.7 (stretch)'],
        intro: 'The biggest machines in the lagoon. Take it one row at a time.',
        rounds: [
          { type: 'machine', m: 4, b: 2, examples: [0, 1, 3], ask: 8 },
          { type: 'machine', m: 5, b: 0, examples: [2, 3, 6], ask: 9, inverse: true },
          { type: 'balance', critter: '🐙', left: { x: 6, k: 3 }, right: { x: 2, k: 19 } },
          { type: 'machine', m: 10, b: -3, examples: [1, 2, 5], ask: 4, pickRule: true },
        ],
      },
    ],
  },
  {
    id: 'trench', band: 'orcas', stretch: true, num: 8,
    name: 'Deep Trench',
    crest: '🌌', color: 'var(--danger)',
    blurb: 'Stretch world: doubling, tripling and the Fibonacci spiral.',
    defaults: { item: '🌿', itemName: 'kelp leaf', itemPlural: 'kelp leaves', style: 'count' },
    reward: { emoji: '🦑', name: 'Nyx the Giant Squid', line: 'Nyx lives deeper than anyone, where the strangest patterns grow.' },
    levels: [
      {
        id: 'mirr-3', name: 'Doubling Kelp',
        skill: 'Doubling (geometric) sequences',
        std: ['Eng KS4: geometric progressions (stretch)'],
        intro: 'Kelp doubles every day. That gets big fast!',
        defaults: { seq: geo(1, 2) },
        rounds: [
          { type: 'predict', from: 1, show: 4, ask: 6 },
          { type: 'missing', seq: geo(3, 2), from: 1, count: 5, gap: 4 },
          { type: 'rule', from: 1, show: 4 },
        ],
      },
      {
        id: 'mirr-4', name: 'Kelp Forest',
        skill: 'Doubling and tripling sequences',
        std: ['Eng KS4: geometric progressions (stretch)'],
        intro: 'Some kelp triples. And one stone in the forest path is lying.',
        rounds: [
          { type: 'oddOne', seq: geo(1, 2), from: 1, count: 6, bad: { at: 5, value: 18 } },
          { type: 'predict', seq: geo(2, 3), from: 1, show: 3, ask: 5, style: 'number' },
          { type: 'rule', seq: geo(5, 2), from: 1, show: 3 },
        ],
      },
      {
        id: 'atol-4', name: 'Spiral Shells',
        skill: 'The Fibonacci sequence',
        std: ['Eng KS4: Fibonacci-type sequences (stretch)'],
        intro: 'The spiral shell pattern: each number comes from the two before it.',
        defaults: { seq: FIB, style: 'number', itemName: 'spiral', itemPlural: 'spirals' },
        rounds: [
          { type: 'missing', from: 1, count: 7, gap: 6 },
          { type: 'predict', from: 1, show: 6, ask: 9 },
          { type: 'rule', from: 1, show: 6 },
        ],
      },
      {
        id: 'atol-5', name: 'Trench Master',
        skill: 'Squares, triangles and Fibonacci mixed',
        std: ['Eng KS3–KS4 (stretch)'],
        intro: 'Squares, triangles and spirals, all mixed together.',
        defaults: TILES,
        rounds: [
          { type: 'predict', from: 1, show: 4, ask: 12 },
          { type: 'missing', seq: TRI, style: 'number', from: 1, count: 6, gap: 5 },
          { type: 'oddOne', seq: FIB, from: 1, count: 7, bad: { at: 5, value: 6 } },
          { type: 'build', from: 3, show: 3, mode: 'border' },
        ],
      },
    ],
  },
  {
    id: 'grand', band: 'orcas', boss: true, num: '★',
    name: 'Grand Lagoon',
    crest: '🐋', color: 'var(--lilac)',
    blurb: 'Eight mixed puzzles against the tide clock.',
    defaults: { item: '🐚', itemName: 'shell', itemPlural: 'shells', style: 'number' },
    reward: { emoji: '🐋', name: 'Bloom the Whale', line: 'Bloom wakes up only when the whole lagoon is in harmony.' },
    levels: [
      {
        id: 'grand-1', name: 'The Grand Lagoon',
        skill: 'Review of everything, timed',
        std: ['Review'],
        intro: 'Every kind of puzzle, one after another, before the tide goes out. Ready?',
        timeLimit: 240,
        par: 200,
        rounds: [
          { type: 'shapes', unit: ['🐠', '🐚', '🐚'], shown: 7, blanks: 2 },
          { type: 'build', seq: arith(6, 6), from: 1, show: 3, mode: 'group', item: '🪸', itemName: 'coral', itemPlural: 'corals', style: 'groups' },
          { type: 'missing', seq: arith(3, 7), from: 1, count: 5, gap: 4 },
          { type: 'machine', m: 3, b: 2, examples: [1, 2, 4], ask: 10 },
          { type: 'balance', critter: '🦀', left: { x: 4, k: 3 }, right: { x: 1, k: 15 } },
          { type: 'mirror', axis: 'v', pattern: ['#..#', '.##.', '...#', '.###', '#...'] },
          { type: 'predict', ...TILES, from: 1, show: 4, ask: 10 },
          { type: 'oddOne', seq: arith(4, 3), from: 1, count: 6, bad: { at: 4, value: 14 } },
        ],
      },
    ],
  },
];

export const ALL_WORLDS = WORLDS;
export const findWorld = id => WORLDS.find(w => w.id === id);
export const worldsInBand = bandId => WORLDS.filter(w => w.band === bandId);
export const MAX_STARS = WORLDS.reduce((sum, w) => sum + w.levels.length * 3, 0);
export const LEVEL_COUNT = WORLDS.reduce((sum, w) => sum + w.levels.length, 0);

// A band's boss opens once the player has half the stars from that band's other levels.
export function bossThreshold(bandId) {
  const levels = worldsInBand(bandId).filter(w => !w.boss).flatMap(w => w.levels);
  return Math.ceil((levels.length * 3) / 2);
}
