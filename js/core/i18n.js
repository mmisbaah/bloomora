// Translations. English text is the key, so untranslated strings simply stay in English.
// t('Hint · {n} pearls', { n: 3 }) fills in {n}. Arabic switches the page to right-to-left;
// puzzle boards stay left-to-right so number patterns and → arrows read the same way.
import * as S from './state.js';

export const LANGS = [
  { id: 'en', name: 'English', dir: 'ltr', speech: 'en' },
  { id: 'ar', name: 'العربية', dir: 'rtl', speech: 'ar' },
];

const AR = {
  // Settings
  'Settings': 'الإعدادات', 'Sound effects': 'المؤثرات الصوتية', 'Music': 'الموسيقى', 'Read aloud': 'القراءة بصوت عالٍ',
  'Big text': 'خط كبير', 'Language': 'اللغة', 'On': 'تشغيل', 'Off': 'إيقاف', 'Show me how': 'أرني كيف',
  'Leave level': 'مغادرة المرحلة', 'Done': 'تم', 'For grown-ups': 'للكبار',
  // Title
  'Continue': 'متابعة', 'Play': 'العب', 'Collection': 'المجموعة', 'The Sunken Lagoon': 'البحيرة الغارقة',
  'The lagoon has gone quiet. Help Sprig the lantern sprout find the hidden patterns and wake the reef back up.':
    'سكتت البحيرة. ساعد سبريغ، البرعم المضيء، على إيجاد الأنماط المخفية لإيقاظ الشعاب المرجانية من جديد.',
  '{n} age bands': '{n} فئات عمرية', '{n} levels': '{n} مرحلة', 'change': 'تغيير',
  'Diving as {band} (ages {ages}) · ': 'تغوص مع {band} (الأعمار {ages}) · ',
  // Map
  '{band} Map': 'خريطة {band}', 'World {n}': 'العالم {n}', 'Every level cleared!': 'أنهيت كل المراحل!',
  'Next: {name}': 'التالي: {name}', 'Again': 'مرة أخرى', 'Go': 'انطلق', 'Locked': 'مقفل',
  'Daily Dive': 'غوصة اليوم', 'New every day': 'جديد كل يوم', 'Done today ✓': 'أنجزتها اليوم ✓',
  'Start a streak!': 'ابدأ سلسلة!', '🔥 {n}-day streak': '🔥 سلسلة {n} أيام', 'Practice Pool': 'بركة التدريب',
  '{n} to practise': '{n} للتدريب', 'Endless puzzles': 'ألغاز بلا نهاية', 'Free Dive': 'الغوص الحر',
  'Record: depth {n}': 'الرقم القياسي: العمق {n}', 'Your turn': 'دورك', 'Pattern Maker': 'صانع الأنماط',
  'Stump Sprig!': 'حيّر سبريغ!', 'Make': 'اصنع', 'Hooray!': 'مرحى!', '{name} woke up!': 'استيقظ {name}!',
  '{world} is complete': 'اكتمل {world}', 'Find your new friend in the 🏆 collection.': 'ستجد صديقك الجديد في 🏆 المجموعة.',
  'Boss level': 'مرحلة الزعيم', '{n} more': '{n} أخرى',
  // Play screen
  'Start': 'ابدأ', 'Hint': 'تلميح', 'Hint · {n} pearls': 'تلميح · {n} لآلئ', 'More help': 'مساعدة أكثر',
  'Score': 'النقاط', 'Depth': 'العمق', 'Let’s go!': 'هيا بنا!', 'Level {w}-{n}': 'المرحلة {w}-{n}',
  '{n} puzzles': '{n} ألغاز', '{n} hearts': '{n} قلوب', 'no hearts to lose, so take your time': 'لا قلوب لتخسرها، خذ وقتك',
  '1 mistake or fewer earns 3 stars': 'خطأ واحد أو أقل يمنحك 3 نجوم', 'no mistakes earns 3 stars': 'بلا أخطاء تحصل على 3 نجوم',
  '{t} on the tide clock': '{t} على ساعة المد', 'puzzles get harder the deeper you go': 'تزداد الألغاز صعوبة كلما غصت أعمق',
  'streak: {n} days': 'السلسلة: {n} أيام', 'new numbers every time': 'أرقام جديدة كل مرة',
  'Your best: {stars} · {score} points': 'أفضل نتيجة: {stars} · {score} نقطة',
  'Not quite. Look again!': 'ليس تماماً. انظر مرة أخرى!', 'Let’s try a gentler one.': 'لنجرب لغزاً أسهل.',
  'You’re on fire! Here’s a trickier one.': 'أنت رائع! إليك لغزاً أصعب.',
  'The lagoon is blooming! Look at all that light.': 'البحيرة تزهر! انظر إلى كل هذا الضوء.',
  'Leave this level?': 'هل تغادر هذه المرحلة؟', 'You’ll lose your progress in this level.': 'ستفقد تقدمك في هذه المرحلة.',
  'Leave': 'غادر', 'Keep playing': 'تابع اللعب', 'Start a puzzle first, then I can show you how.': 'ابدأ لغزاً أولاً، ثم سأريك كيف.',
  'A hint costs {n} pearls. Clear levels to find more.': 'التلميح يكلف {n} لآلئ. أنهِ مراحل لتجد المزيد.',
  'Out of hearts! The tide carried your shells away.': 'نفدت القلوب! حمل المد أصدافك بعيداً.',
  'The tide went out before you finished. Try to move a little faster!': 'انحسر المد قبل أن تنتهي. حاول أن تسرع قليلاً!',
  'Look at the pattern carefully. What changes each time?': 'انظر إلى النمط جيداً. ما الذي يتغير كل مرة؟',
  'Find the jump between two numbers, then keep going.': 'جد القفزة بين رقمين، ثم تابع.',
  // Results
  'Level cleared': 'أنهيت المرحلة', 'Replay': 'أعد اللعب', 'Map': 'الخريطة', 'Next level': 'المرحلة التالية',
  '+{n} pearls': '+{n} لآلئ', 'Puzzle points': 'نقاط الألغاز', 'Total': 'المجموع', 'Pearls found': 'لآلئ وجدتها',
  'New best score!': 'أفضل نتيجة جديدة!', 'Washed out!': 'جرفتك الأمواج!', 'Try again': 'حاول مجدداً',
  'Wonderful! Three bright stars.': 'رائع! ثلاث نجوم لامعة.', 'Perfect! Not a single mistake.': 'ممتاز! ولا خطأ واحد.',
  'So close! A couple fewer slips earns all 3 stars.': 'اقتربت! أخطاء أقل تمنحك النجوم الثلاث.',
  'Cleared! Fewer mistakes earns more stars.': 'أنهيتها! أخطاء أقل تعني نجوماً أكثر.',
  'Free Dive over': 'انتهى الغوص الحر', 'Depth {n}': 'العمق {n}', 'Dive again': 'غص مجدداً', 'Play again': 'العب مجدداً',
  'Puzzles solved': 'ألغاز محلولة', 'Previous record': 'الرقم السابق',
  // Pattern Maker
  '🧪 Your turn to make one': '🧪 دورك لتصنع نمطاً', '🤔 Sprig, guess my rule!': '🤔 سبريغ، خمّن قاعدتي!', 'Start over': 'ابدأ من جديد',
  'Make a pattern and I’ll guess the rule.': 'اصنع نمطاً وسأخمّن القاعدة.',
  'Three numbers! Add more to make it trickier, or ask me to guess.': 'ثلاثة أرقام! أضف المزيد لتصعّبه، أو اطلب مني أن أخمّن.',
  'So next comes {next}. Did I get it?': 'إذن يأتي بعد ذلك {next}. هل أصبت؟',
  'You stumped me! I can’t find a rule. Can you explain your pattern to someone?': 'لقد حيّرتني! لا أجد قاعدة. هل تستطيع أن تشرح نمطك لأحد؟',
  'You add {d} each time.': 'تضيف {d} كل مرة.', 'You take away {d} each time.': 'تطرح {d} كل مرة.',
  'You multiply by {d} each time.': 'تضرب في {d} كل مرة.', 'You divide by {d} each time.': 'تقسم على {d} كل مرة.',
  'Every number is {d}. That’s a pattern too!': 'كل الأرقام {d}. وهذا نمط أيضاً!',
  'Those are square numbers!': 'هذه أعداد مربعة!', 'Those are cube numbers!': 'هذه أعداد مكعبة!', 'Those are triangular numbers!': 'هذه أعداد مثلثية!',
  'Each number is the two before it added together, like the Fibonacci pattern.': 'كل رقم هو مجموع الرقمين قبله، مثل نمط فيبوناتشي.',
  'The jumps grow by {d} each time.': 'تكبر القفزات بمقدار {d} كل مرة.', 'The jumps take turns.': 'القفزات تتناوب.',
  'It repeats every {d} numbers.': 'يتكرر كل {d} أرقام.', 'You multiply by {m}, then add or take away.': 'تضرب في {m}، ثم تضيف أو تطرح.',
  // Puzzle boards
  'Pool {n}': 'البركة {n}', 'Shape {n}': 'الشكل {n}', 'Check': 'تحقق', 'Check reflection': 'تحقق من الانعكاس',
  'Check my net': 'تحقق من شبكتي', 'sticks': 'عيدان', 'Step {n}': 'الخطوة {n}',
};

// Puzzle names, prompts and Sprig's first line, by puzzle id. Feedback during play falls back to
// short general lines in Arabic so a child never sees a half-English screen.
export const AR_PUZZLES = {
  build: { name: 'املأ البركة', prompt: () => 'املأ البركة الفارغة لتكمل النمط.', say: () => 'اضغط + أو − ثم اضغط تحقق.' },
  predict: { name: 'انظر بعيداً', prompt: r => `كم سيكون في البركة ${r.ask}؟`, say: r => `البركة ${r.ask} أبعد على الشاطئ. اتبع النمط لتصل إليها.` },
  missing: { name: 'الحجر الغارق', prompt: () => 'ما الرقم المختبئ تحت الرمل؟', say: () => 'جد الرقم الناقص.' },
  rule: { name: 'بطاقة القاعدة', prompt: () => 'أي بطاقة تصف القاعدة؟', say: () => 'راقب كيف تتغير البرك.' },
  oddOne: { name: 'الحجر المكسور', prompt: () => 'حجر واحد يكسر النمط. اضغط عليه!', say: () => 'تحقق من كل قفزة من حجر إلى حجر.' },
  shapes: { name: 'موكب الأنماط', prompt: () => 'من يأتي بعد ذلك في الموكب؟', say: () => 'قل النمط بصوت عالٍ، ثم اختر التالي.' },
  sort: { name: 'الطابور', prompt: () => 'رتّبها من الأصغر إلى الأكبر.', say: () => 'ابدأ بالأصغر.' },
  balance: { name: 'ميزان البحيرة', prompt: () => 'ما الرقم الذي يجعل الميزان متوازناً؟', say: () => 'يجب أن يزن الجانبان الشيء نفسه.' },
  machine: { name: 'آلة التيار', prompt: r => (r.inverse ? 'ما الرقم الذي دخل إلى الآلة؟' : 'ماذا ستُخرج الآلة؟'), say: () => 'الآلة تفعل الشيء نفسه بكل رقم.' },
  mirror: { name: 'بركة المرآة', prompt: () => 'اجعل الجانب الآخر مطابقاً.', say: () => 'اضغط المربعات لتنسخ الشكل في المرآة، ثم اضغط تحقق.' },
  twins: { name: 'التيارات التوأم', prompt: () => 'ما القاعدة التي تربط النمطين؟', say: () => 'نمطان يسبحان جنباً إلى جنب.' },
  pick: { name: 'شبكة الأرقام', prompt: () => 'اختر كل رقم يناسب القاعدة.', say: () => 'اضغط الأرقام لتلتقطها، ثم اضغط تحقق.' },
  sticks: { name: 'أشكال العيدان', prompt: r => `كم عوداً يحتاج الشكل ${r.ask}؟`, say: () => 'عدّ العيدان، ثم اكتشف كم عوداً يضاف كل مرة.' },
  story: { name: 'حكايات البحيرة', prompt: () => 'ماذا يحدث بعد ذلك في القصة؟', say: () => 'اقرأ القصة. ما الذي يتغير كل مرة؟' },
  table: { name: 'جداول المد', prompt: r => (r.mode === 'graph' ? `كم طول العمود ${r.ask}؟` : 'ما الرقم الناقص في الجدول؟'), say: () => 'اقرأ الصفوف. ما الذي يحدث في كل صف؟' },
};

export const AR_HOW = {
  build: 'انظر كيف تكبر البرك. اضغط + أو − لتملأ البركة الفارغة، ثم اضغط تحقق.',
  predict: 'جد القفزة بين البرك. تابع القفز حتى البركة البعيدة، ثم اختر جوابك.',
  missing: 'غرق حجر. اكتشف القفزة، ثم اكتب الرقم الناقص.',
  rule: 'راقب كيف تتغير البرك، ثم اختر البطاقة التي تصف القاعدة.',
  oddOne: 'كل الأحجار تتبع قاعدة واحدة إلا حجراً واحداً. اضغط عليه.',
  shapes: 'قل النمط بصوت عالٍ، ثم اختر ما يأتي بعده لتملأ الفراغ.',
  sort: 'اضغط على المخلوقات بالترتيب، من الأصغر.',
  balance: 'يجب أن يزن الجانبان الشيء نفسه. اكتب الرقم الذي يوازن الميزان.',
  machine: 'الآلة تفعل الشيء نفسه بكل رقم. اكتشف ما تفعله، ثم اكتب الجواب.',
  mirror: 'اجعل الجانب الآخر مطابقاً. اضغط المربعات لتنسخ الشكل في المرآة.',
  twins: 'نمطان يسبحان جنباً إلى جنب. جد القاعدة التي تربطهما.',
  pick: 'اضغط كل رقم يناسب القاعدة، ثم اضغط تحقق.',
  sticks: 'عدّ العيدان في كل شكل. اكتشف كم عوداً يضاف، ثم اكتب الجواب.',
  story: 'اقرأ القصة. جد النمط فيها، ثم أجب.',
  table: 'اقرأ الجدول أو الرسم. جد القاعدة، ثم املأ الرقم الناقص.',
};

export const AR_PRAISE = ['رائع!', 'أحسنت!', 'البحيرة تتوهج أكثر!', 'عيون حادة!', 'وجدت النمط!', 'سبريغ معجب بك!'];

// Story plots in Arabic (see puzzles/story.js for the English ones).
export const AR_PLOTS = {
  jar: { open: '{name} يضع لآلئ في جرة كل يوم.', step: 'اليوم', thing: 'لآلئ', q: 'كم لؤلؤة ستكون في الجرة في اليوم {ask}؟' },
  kelp: { open: '{name} يقيس نبتة عشب البحر كل أسبوع.', step: 'الأسبوع', thing: 'سم', q: 'كم سيكون طولها في الأسبوع {ask}؟' },
  sub: { open: 'غواصة {name} تصعد نحو السطح.', step: 'الدقيقة', thing: 'متراً عمقاً', q: 'كم سيكون عمقها في الدقيقة {ask}؟' },
  jelly: { open: 'قناديل البحر في حوض {name} تتكاثر.', step: 'الساعة', thing: 'قنديلاً', q: 'كم قنديلاً سيكون في الساعة {ask}؟' },
  tables: { open: '{name} يضم الطاولات لحفلة. كل طاولة تضيف مقاعد.', step: 'الطاولات:', thing: 'مقعداً', q: 'كم مقعداً مع {ask} طاولات؟' },
  piggy: { open: '{name} يدّخر المبلغ نفسه كل أسبوع.', step: 'الأسبوع', thing: 'مدّخر', q: 'كم سيدّخر {name} في الأسبوع {ask}؟' },
  ferry: { open: 'عبّارة الجزيرة تغادر الرصيف في أوقات منتظمة.', step: 'العبّارة', thing: '', q: 'متى تغادر العبّارة {ask}؟' },
  climb: { open: '{name} يصعد درج المنارة بخطى ثابتة.', step: 'الدقيقة', thing: 'درجة', q: 'كم درجة سيصعد {name} بعد {ask} دقائق؟' },
};

export const lang = () => (S.getState().lang === 'ar' ? 'ar' : 'en');
export const isArabic = () => lang() === 'ar';
export const langInfo = () => LANGS.find(l => l.id === lang());

export function t(text, vars = {}) {
  const base = (isArabic() && AR[text]) || text;
  return base.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

export function applyLang() {
  const info = langInfo();
  document.documentElement.lang = info.id;
  document.documentElement.dir = info.dir;
}
