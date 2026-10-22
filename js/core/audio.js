// Web Audio synth with lagoon tones. Notes are scheduled on the audio clock, not setTimeout.
class LagoonAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicGain = null;
  }

  ready() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  tone(freq, type = 'sine', dur = 0.2, vol = 0.1, delay = 0, out = null) {
    if (this.muted) return;
    try {
      this.ready();
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(out || this.ctx.destination);
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
  // A quick rising bubble, used for taps on answers and page turns.
  bubble() {
    if (this.muted) return;
    try {
      const ctx = this.ready(), t = ctx.currentTime;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(900, t + 0.09);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    } catch (e) { /* ignore */ }
  }
  whoosh() {
    if (this.muted) return;
    try {
      const ctx = this.ready(), t = ctx.currentTime;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      src.buffer = buf;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.exponentialRampToValueAtTime(1800, t + 0.35);
      gain.gain.setValueAtTime(0.06, t);
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start(t);
    } catch (e) { /* ignore */ }
  }
  wake() {
    [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 'triangle', 0.5, 0.07, i * 0.09));
  }

  // Soft background music: a slow pentatonic tune over a two-chord drone, made up as it plays.
  // Notes are scheduled half a second ahead so timer jitter never makes them stumble.
  startMusic() {
    if (this.muted || this.musicTimer) return;
    try {
      const ctx = this.ready();
      this.musicGain = ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.musicGain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 2);
      this.musicGain.connect(ctx.destination);
      const scale = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
      const chords = [[130.81, 196], [110, 164.81], [146.83, 220], [98, 146.83]];
      let next = ctx.currentTime + 0.1, beat = 0, note = 3;
      this.musicTimer = setInterval(() => {
        while (next < ctx.currentTime + 0.5) {
          const delay = next - ctx.currentTime;
          if (beat % 8 === 0) chords[(beat / 8) % chords.length].forEach(f => this.tone(f, 'sine', 3.2, 0.035, delay, this.musicGain));
          if (Math.random() < 0.7) {
            note = Math.max(0, Math.min(scale.length - 1, note + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
            this.tone(scale[note], 'triangle', 0.7, 0.03, delay, this.musicGain);
          }
          next += 0.42;
          beat = (beat + 1) % 32;
        }
      }, 120);
    } catch (e) { /* ignore */ }
  }
  stopMusic() {
    clearInterval(this.musicTimer);
    this.musicTimer = null;
    if (this.musicGain && this.ctx) {
      const g = this.musicGain;
      g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
      setTimeout(() => g.disconnect(), 1500);
    }
    this.musicGain = null;
  }

  fail() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 'triangle', 0.32, 0.1, i * 0.16));
  }
}

export const audio = new LagoonAudio();
