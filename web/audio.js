import { clamp, safeLocalStorage } from './characters.js';

export class AudioManager {
  constructor(onMuteChange = () => {}) {
    this.context = null;
    this.engineOscillator = null;
    this.engineHarmonic = null;
    this.engineGain = null;
    this.storage = safeLocalStorage();
    this.muted = this.storage?.getItem('turboCircuitMuted') === '1';
    this.onMuteChange = onMuteChange;
    this.onMuteChange(this.muted);
  }

  ensure() {
    if (this.context) {
      this.context.resume().catch(() => {});
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.context = new AudioContextClass();
    this.engineGain = this.context.createGain();
    this.engineGain.gain.value = 0.0001;
    this.engineGain.connect(this.context.destination);

    this.engineOscillator = this.context.createOscillator();
    this.engineOscillator.type = 'sawtooth';
    this.engineOscillator.frequency.value = 58;
    this.engineOscillator.connect(this.engineGain);
    this.engineOscillator.start();

    this.engineHarmonic = this.context.createOscillator();
    this.engineHarmonic.type = 'triangle';
    this.engineHarmonic.frequency.value = 116;
    const harmonicGain = this.context.createGain();
    harmonicGain.gain.value = 0.33;
    this.engineHarmonic.connect(harmonicGain);
    harmonicGain.connect(this.engineGain);
    this.engineHarmonic.start();
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    this.storage?.setItem('turboCircuitMuted', this.muted ? '1' : '0');
    this.onMuteChange(this.muted);
    if (this.engineGain && this.context) {
      this.engineGain.gain.setTargetAtTime(this.muted ? 0.0001 : 0.018, this.context.currentTime, 0.04);
    }
  }

  update(speedRatio, boosting, offRoad, active) {
    const context = this.context;
    if (!context || !this.engineGain || !this.engineOscillator || !this.engineHarmonic) return;
    const ratio = clamp(speedRatio, 0, 1.45);
    const frequency = 58 + ratio * 150 + (boosting ? 34 : 0);
    this.engineOscillator.frequency.setTargetAtTime(frequency, context.currentTime, 0.035);
    this.engineHarmonic.frequency.setTargetAtTime(frequency * (offRoad ? 1.86 : 2.02), context.currentTime, 0.05);
    const volume = this.muted || !active ? 0.0001 : 0.012 + ratio * 0.014 + (offRoad ? 0.004 : 0);
    this.engineGain.gain.setTargetAtTime(volume, context.currentTime, 0.055);
  }

  sfx(name) {
    if (this.muted) return;
    this.ensure();
    const patterns = {
      countdown: [[330, 0.08, 0]],
      go: [[520, 0.09, 180], [760, 0.14, 260]],
      coin: [[820, 0.055, 120], [1080, 0.07, 160]],
      item: [[520, 0.06, 180]],
      boost: [[300, 0.06, 380]],
      jump: [[420, 0.08, 260]],
      hit: [[150, 0.16, -80]],
      shield: [[620, 0.12, 120]],
      rocket: [[220, 0.08, 220]],
      pulse: [[190, 0.18, 480]],
      finish: [[520, 0.1, 120], [680, 0.1, 160], [860, 0.22, 260]],
      click: [[460, 0.04, 30]],
    };
    const pattern = patterns[name] ?? patterns.click;
    let delay = 0;
    for (const [frequency, duration, slide] of pattern) {
      this.tone(frequency, duration, slide, delay);
      delay += duration * 0.72;
    }
    if (name === 'hit') this.noise(0.12, 0.035);
  }

  tone(frequency, duration, slide = 0, delay = 0) {
    const context = this.context;
    if (!context || this.muted) return;
    const now = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, frequency + slide), now + duration);
    gain.gain.setValueAtTime(0.032, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  noise(duration = 0.12, volume = 0.025) {
    const context = this.context;
    if (!context || this.muted) return;
    const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / frameCount);
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
  }
}
