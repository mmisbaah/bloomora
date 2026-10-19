// Things Sprig can wear. Bought with pearls; the one being worn shows on Sprig everywhere.
export const HATS = [
  { id: 'cap', emoji: '🧢', name: 'Sailor cap', cost: 20 },
  { id: 'flower', emoji: '🌸', name: 'Sea flower', cost: 25 },
  { id: 'shell', emoji: '🐚', name: 'Shell helmet', cost: 30 },
  { id: 'tophat', emoji: '🎩', name: 'Top hat', cost: 40 },
  { id: 'grad', emoji: '🎓', name: 'Thinking cap', cost: 50 },
  { id: 'crown', emoji: '👑', name: 'Coral crown', cost: 60 },
  { id: 'star', emoji: '⭐', name: 'Star clip', cost: 35 },
  { id: 'bow', emoji: '🎀', name: 'Ribbon bow', cost: 25 },
];

export const findHat = id => HATS.find(h => h.id === id) || null;

export const PLAYER_EMOJI = ['🐠', '🐙', '🦀', '🐢', '🐬', '🦈', '🐳', '🦑', '🪼', '🐡'];
