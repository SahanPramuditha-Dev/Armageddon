/**
 * Procedural Web Audio API Sound Synthesizer for ARMAGEDDON.
 * Generates military acoustic feedback: Sonar pings, Klaxon warning sirens,
 * rocket launch whooshes, and underwater explosive rumbles with zero external audio assets.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private klaxonInterval: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0.0 : 0.4;
    }
    if (muted) {
      this.stopKlaxon();
    }
  }

  public setVolume(volume: number) {
    this.initContext();
    if (this.masterGain && !this.isMuted) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /** Subtle military interface chirp */
  public playUIClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  /** Tactical Sonar Ping with reverberating decay */
  public playRadarPing() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.85);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.85);
  }

  /** Missile booster ignition / whoosh */
  public playWeaponLaunch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 0.8;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start();
    whiteNoise.stop(this.ctx.currentTime + 0.8);
  }

  /** Heavy explosion rumble */
  public playExplosion() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    // Sub-bass thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 1.2);

    oscGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);

    // Filtered noise blast
    const bufferSize = this.ctx.sampleRate * 1.0;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 1.0);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.0);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start();
    noise.stop(this.ctx.currentTime + 1.0);
  }

  /** CIWS / Interception flak burst */
  public playInterception() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800 + i * 200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
      }, i * 60);
    }
  }

  /** Incoming Threat Klaxon warning siren */
  public startKlaxon() {
    if (this.isMuted || this.klaxonInterval !== null) return;
    this.initContext();

    const beep = () => {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(950, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    };

    beep();
    this.klaxonInterval = window.setInterval(beep, 600);
  }

  public stopKlaxon() {
    if (this.klaxonInterval !== null) {
      clearInterval(this.klaxonInterval);
      this.klaxonInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
