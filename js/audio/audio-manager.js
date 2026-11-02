/**
 * Multisim Web Studio - Procedural Web Audio Sound Architecture
 * Native Web Audio API synthesis for realistic hardware laboratory acoustic feedback.
 * Zero external sound files.
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initContext();
  }

  initContext() {
    // Lazy initialize on first user gesture
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  ensureContext() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /**
   * Terminal Snap / Wire Lock: Short high-register mechanical contact tick
   * Sine wave at 1400Hz, 25ms exponential decay.
   */
  playTerminalSnap() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.025);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.025);
    } catch (_) {}
  }

  /**
   * Component Insertion / Placement: Crisp tactile latch sound
   * Low-pass filtered pulse, 40ms decay.
   */
  playComponentPlacement() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.04);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (_) {}
  }

  /**
   * Delete / Disconnect: Soft damped thud
   * Triangle wave down-sweep 240Hz -> 90Hz, 50ms.
   */
  playDelete() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.05);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (_) {}
  }

  /**
   * Component Rotation: Precision ratcheted click
   * Band-pass noise burst, 15ms.
   */
  playRotate() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.015);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600, now);
      filter.Q.setValueAtTime(3.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.015);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
    } catch (_) {}
  }

  /**
   * Simulation Start / Stop: Low-frequency relay toggle click with subtle ping
   */
  playRelayToggle(isStart = true) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Click pulse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isStart ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isStart ? 320 : 180, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.035);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);

      // Subtle metallic resonance ping
      const ping = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(isStart ? 1850 : 1200, now + 0.008);
      pingGain.gain.setValueAtTime(0.06, now + 0.008);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      ping.connect(pingGain);
      pingGain.connect(this.ctx.destination);

      ping.start(now + 0.008);
      ping.stop(now + 0.05);
    } catch (_) {}
  }
}
