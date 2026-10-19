// Age bands. Each band sets how forgiving the game is and which worlds it opens on.
// The topic placement follows the US Common Core and England's national curriculum; see SOURCES
// and the "For grown-ups" screen for the reasoning behind each choice.

export const BANDS = [
  {
    id: 'minnows',
    name: 'Minnows',
    ages: '5–6',
    emoji: '🐟',
    color: 'var(--coral)',
    grades: 'Kindergarten–Grade 1 (US) · Reception–Year 1 (England)',
    focus: 'Repeating patterns, counting on and back within 20, counting in 2s, 5s and 10s.',
    settings: { hearts: 5, hintCost: 0, timer: false, speedBonus: false, options: 3, readAloud: true, stars: [1, 3] },
    why: [
      'Repeating patterns step up from AB to AAB to ABC. Research from the Rittle-Johnson lab finds difficulty rises with the number of items in the repeating unit, and that patterning at ages 4–6 predicts later maths.',
      'Counting to 100 by ones and tens is Kindergarten standard K.CC.A.1. Counting in multiples of 2, 5 and 10 is a Year 1 objective in England.',
      'Read-aloud starts on and every action is one tap. Most children this age are early readers, and drag or pinch gestures are hard for small hands.',
      'Five hearts, free hints, no clock and fewer answer choices. Mistakes are part of learning here, and 3 stars still allows one slip.',
    ],
  },
  {
    id: 'turtles',
    name: 'Turtles',
    ages: '7–8',
    emoji: '🐢',
    color: 'var(--kelp)',
    grades: 'Grades 2–3 (US) · Years 2–3 (England)',
    focus: 'Skip counting in 3s, 4s, 5s, 8s, 50s and 100s, early times tables, finding a missing factor, vertical mirror lines.',
    settings: { hearts: 4, hintCost: 3, timer: false, speedBonus: false, options: 4, readAloud: false, stars: [0, 2] },
    why: [
      'England expects counting in steps of 2, 3 and 5 in Year 2, then multiples of 4, 8, 50 and 100 in Year 3. Common Core 2.NBT.A.2 adds skip counting by 5s, 10s and 100s within 1000.',
      'Multiplying within 100 (3.OA.C.7) and finding the unknown number in a multiplication equation (3.OA.A.4) make the first machines and one-sided scales.',
      'Line symmetry with a vertical mirror is introduced in Year 2 in England, so mirror puzzles here only use an upright line.',
      'No clock. Evidence on timed maths and anxiety is disputed, so the game keeps time pressure out of the younger bands.',
    ],
  },
  {
    id: 'dolphins',
    name: 'Dolphins',
    ages: '9–10',
    emoji: '🐬',
    color: 'var(--sky)',
    grades: 'Grades 4–5 (US) · Years 4–5 (England)',
    focus: 'Patterns from a rule that don’t start at zero, tables up to 12 × 12, two-step machines, mirror lines in any direction, square and cube numbers.',
    settings: { hearts: 3, hintCost: 5, timer: true, speedBonus: true, options: 4, readAloud: false, stars: [0, 1] },
    why: [
      'Common Core 4.OA.C.5 asks pupils to generate a number or shape pattern from a given rule and notice features the rule doesn’t state, which is why these patterns start mid-way.',
      'England’s Year 4 covers multiples of 6, 7, 9, 25 and 1000, all tables up to 12 × 12, and completing symmetric figures in different orientations (Common Core 4.G.A.3).',
      'Square and cube numbers are a Year 5 objective in England. Common Core reaches exponents later, in Grade 6 (6.EE.A.1).',
      'Speed bonuses and a timed boss appear from this band up. They are optional, because a level can always be cleared without them.',
    ],
  },
  {
    id: 'orcas',
    name: 'Orcas',
    ages: '11–12',
    emoji: '🐋',
    color: 'var(--lilac)',
    grades: 'Grades 6–7 (US) · Years 6–7 (England)',
    focus: 'Linear sequences and the nth term, solving equations on a balance, working backwards through a rule, triangular numbers. Stretch world: doubling and Fibonacci.',
    settings: { hearts: 3, hintCost: 5, timer: true, speedBonus: true, options: 4, readAloud: false, stars: [0, 1] },
    why: [
      'England’s Year 6 asks pupils to generate and describe linear number sequences and express missing-number problems algebraically. Key Stage 3 adds finding the nth term.',
      'Balance scales model equations: x + p = q and px = q in Common Core 6.EE.B.7, px + q = r in 7.EE.B.4. Unknowns on both sides (8.EE.C.7) are the hardest scales, saved for the end.',
      'Triangular numbers are introduced at Key Stage 3, per the NCETM guidance.',
      'The Deep Trench is marked Stretch. Geometric (doubling) and Fibonacci sequences are not named until England’s Key Stage 4 (ages 14–16).',
    ],
  },
];

export const findBand = id => BANDS.find(b => b.id === id) || BANDS[0];

export const SOURCES = [
  { label: 'Mathematics programmes of study: key stages 1 and 2 (Department for Education)', url: 'https://assets.publishing.service.gov.uk/media/5a7da548ed915d2ac884cb07/PRIMARY_national_curriculum_-_Mathematics_220714.pdf' },
  { label: 'National curriculum in England: mathematics programmes of study (GOV.UK)', url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study' },
  { label: 'Mathematics guidance: year 4 (DfE, non-statutory)', url: 'https://assets.publishing.service.gov.uk/media/6009a9888fa8f5296a72aad7/Maths_guidance_year_4.pdf' },
  { label: 'Mathematics guidance: year 6 (DfE, non-statutory)', url: 'https://assets.publishing.service.gov.uk/media/614094a6d3bf7f05afde045f/Maths_guidance_year_6.pdf' },
  { label: 'Mathematics guidance: Key Stage 3 (NCETM / DfE, non-statutory)', url: 'https://assets.publishing.service.gov.uk/media/621629ac8fa8f5490d52ee78/KS3_NonStatutory_Guidance_Sept_2021_FINAL_NCETM.pdf' },
  { label: 'Common Core State Standards for Mathematics (CCSSO)', url: 'https://learning.ccsso.org/wp-content/uploads/2022/11/ADA-Compliant-Math-Standards.pdf' },
  { label: 'Kindergarten: Counting & Cardinality (Common Core)', url: 'https://www.thecorestandards.org/Math/Content/K/CC/' },
  { label: 'Grade 2: Number & Operations in Base Ten (Common Core)', url: 'https://www.thecorestandards.org/Math/Content/2/NBT/' },
  { label: '3.OA.9 arithmetic patterns (California Department of Education)', url: 'https://www2.cde.ca.gov/cacs/id/web/340' },
  { label: '5.OA.3 two-rule patterns (California Department of Education)', url: 'https://www2.cde.ca.gov/cacs/id/web/402' },
  { label: 'Zippert, Douglas & Rittle-Johnson: repeating patterns and later maths (Vanderbilt)', url: 'https://cdn.vanderbilt.edu/vu-sub/wp-content/uploads/sites/280/2023/07/19032255/ZippertDouglasBRJ.pdf' },
  { label: 'Repeating pattern skills (The Education Hub)', url: 'https://cdn.theeducationhub.org.nz/wp-content/uploads/2023/07/Repeating-pattern-skills.pdf' },
  { label: 'Designing engaging apps for kids (Google for Developers)', url: 'https://developers.google.com/building-for-kids/designing-engaging-apps' },
  { label: 'Playful interfaces: designing for children (UXPA Magazine)', url: 'https://oldmagazine.uxpa.org/?p=11776' },
  { label: 'Timed tests and the development of math anxiety (Jo Boaler, Education Week)', url: 'https://www.edweek.org/teaching-learning/opinion-timed-tests-and-the-development-of-math-anxiety/2012/07' },
  { label: 'The debate over timed math tests (The Hechinger Report)', url: 'https://hechingerreport.org/?p=93534' },
];
