// Web Audio synth with lagoon tones. Notes are scheduled on the audio clock, not setTimeout.
class LagoonAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  tone(freq, type = 'sine', dur = 0.2, vol = 0.1, delay = 0) {
    if (this.muted) return;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch (e) {
      // Audio is a nicety; never let it break play.
    }
  }

  tap() {
    this.tone(520, 'sine', 0.07, 0.1);
    this.tone(700, 'sine', 0.07, 0.1, 0.04);
  }
  correct() {
    [440, 554.37, 659.25, 880].forEach((f, i) => this.tone(f, 'triangle', 0.14, 0.12, i * 0.08));
  }
  wrong() {
    this.tone(196, 'sawtooth', 0.22, 0.07);
    this.tone(150, 'sawtooth', 0.25, 0.06, 0.1);
  }
  bloom() {
    [329.63, 440, 554.37, 659.25, 880, 1108.73].forEach((f, i) => this.tone(f, 'sine', 0.4, 0.08, i * 0.07));
  }
  star(i) {
    this.tone(660 + i * 220, 'triangle', 0.3, 0.12);
    this.tone(990 + i * 330, 'sine', 0.2, 0.05, 0.05);
  }
  coin() {
    this.tone(988, 'square', 0.06, 0.04);
    this.tone(1319, 'square', 0.14, 0.04, 0.06);
  }
  fail() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 'triangle', 0.32, 0.1, i * 0.16));
  }
}

export const audio = new LagoonAudio();
