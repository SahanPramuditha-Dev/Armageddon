// Procedural Tactical Audio Engine using Web Audio API

class TacticalAudioEngine {
  private ctx: AudioContext | null = null
  private isMuted: boolean = false

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted
  }

  public getIsMuted(): boolean {
    return this.isMuted
  }

  // Sonar / Radar Sweep Ping
  public playSonarPing() {
    if (this.isMuted) return
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(1400, now)
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.4)

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 1.2)
    } catch {
      // Audio context policy fallback
    }
  }

  // Incoming Missile / Threat Lock Alarm
  public playThreatAlarm() {
    if (this.isMuted) return
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(880, now + i * 0.15)
        osc.frequency.setValueAtTime(1100, now + i * 0.15 + 0.07)

        gain.gain.setValueAtTime(0.12, now + i * 0.15)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.13)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(now + i * 0.15)
        osc.stop(now + i * 0.15 + 0.14)
      }
    } catch {
      // Audio fallback
    }
  }

  // Railgun Hyper-Velocity Discharge
  public playRailgunFire() {
    if (this.isMuted) return
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime

      // High electrical capacitor whine
      const osc = this.ctx.createOscillator()
      const oscGain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(2400, now)
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.3)
      oscGain.gain.setValueAtTime(0.2, now)
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      osc.connect(oscGain)
      oscGain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.35)

      // Kinetic shockwave thump
      const bufferSize = this.ctx.sampleRate * 0.4
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
      const noise = this.ctx.createBufferSource()
      noise.buffer = buffer

      const filter = this.ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(450, now)
      filter.frequency.exponentialRampToValueAtTime(40, now + 0.4)

      const noiseGain = this.ctx.createGain()
      noiseGain.gain.setValueAtTime(0.35, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

      noise.connect(filter)
      filter.connect(noiseGain)
      noiseGain.connect(this.ctx.destination)
      noise.start(now)
    } catch {
      // Audio fallback
    }
  }

  // Missile Launch Rocket Burn
  public playMissileLaunch() {
    if (this.isMuted) return
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const bufferSize = this.ctx.sampleRate * 0.7
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
      const noise = this.ctx.createBufferSource()
      noise.buffer = buffer

      const filter = this.ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(300, now)
      filter.frequency.exponentialRampToValueAtTime(1200, now + 0.4)
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.7)

      const gain = this.ctx.createGain()
      gain.gain.setValueAtTime(0.05, now)
      gain.gain.linearRampToValueAtTime(0.25, now + 0.2)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(this.ctx.destination)
      noise.start(now)
    } catch {
      // Audio fallback
    }
  }

  // Kinetic / High-Explosive Impact
  public playExplosion() {
    if (this.isMuted) return
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const bufferSize = this.ctx.sampleRate * 0.9
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.25))
      }
      const noise = this.ctx.createBufferSource()
      noise.buffer = buffer

      const filter = this.ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(250, now)
      filter.frequency.exponentialRampToValueAtTime(30, now + 0.9)

      const gain = this.ctx.createGain()
      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(this.ctx.destination)
      noise.start(now)
    } catch {
      // Audio fallback
    }
  }

  // Interception / CIWS Burst
  public playCIWSBurst() {
    if (this.isMuted) return
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      for (let i = 0; i < 5; i++) {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(500 + Math.random() * 100, now + i * 0.05)
        gain.gain.setValueAtTime(0.1, now + i * 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.04)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now + i * 0.05)
        osc.stop(now + i * 0.05 + 0.05)
      }
    } catch {
      // Audio fallback
    }
  }

  // Tactical Order Acknowledged Confirmation Tone
  public playOrderAck() {
    if (this.isMuted) return
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, now)
      osc.frequency.setValueAtTime(1200, now + 0.08)

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.25)
    } catch {
      // Audio fallback
    }
  }
}

export const tacticalAudio = new TacticalAudioEngine()
