class SoundManager {
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private enabled = true

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeAudioContext()
      this.generateSounds()
    }
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn("Web Audio API not supported:", error)
    }
  }

  private async generateSounds() {
    if (!this.audioContext) return

    // Generate different tones for different events
    const soundConfigs = {
      ready: { frequency: 800, duration: 0.1, type: "sine" as OscillatorType },
      start: { frequency: 1000, duration: 0.15, type: "square" as OscillatorType },
      stop: { frequency: 600, duration: 0.2, type: "sine" as OscillatorType },
      achievement: { frequency: 1200, duration: 0.3, type: "triangle" as OscillatorType },
      tick: { frequency: 400, duration: 0.05, type: "square" as OscillatorType },
      error: { frequency: 200, duration: 0.3, type: "sawtooth" as OscillatorType },
      success: { frequency: 880, duration: 0.25, type: "sine" as OscillatorType },
    }

    for (const [name, config] of Object.entries(soundConfigs)) {
      const buffer = await this.createTone(config.frequency, config.duration, config.type)
      if (buffer) {
        this.sounds.set(name, buffer)
      }
    }
  }

  private async createTone(frequency: number, duration: number, type: OscillatorType): Promise<AudioBuffer | null> {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      let sample = 0

      switch (type) {
        case "sine":
          sample = Math.sin(2 * Math.PI * frequency * t)
          break
        case "square":
          sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1
          break
        case "triangle":
          sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t))
          break
        case "sawtooth":
          sample = 2 * (t * frequency - Math.floor(0.5 + t * frequency))
          break
      }

      // Apply envelope (fade in/out)
      const envelope = Math.min(1, Math.min(i / (sampleRate * 0.01), (length - i) / (sampleRate * 0.05)))
      data[i] = sample * envelope * 0.3 // Reduce volume
    }

    return buffer
  }

  async play(soundName: string, volume = 1) {
    if (!this.enabled || !this.audioContext || !this.sounds.has(soundName)) return

    try {
      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume()
      }

      const buffer = this.sounds.get(soundName)!
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()

      source.buffer = buffer
      gainNode.gain.value = Math.max(0, Math.min(1, volume))

      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      source.start()
    } catch (error) {
      console.warn("Error playing sound:", error)
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  // Play achievement sound with multiple tones
  async playAchievement() {
    if (!this.enabled) return

    const notes = [880, 1108, 1319, 1760] // A5, C#6, E6, A6
    for (let i = 0; i < notes.length; i++) {
      setTimeout(() => {
        this.playCustomTone(notes[i], 0.15, "sine", 0.4)
      }, i * 100)
    }
  }

  private async playCustomTone(frequency: number, duration: number, type: OscillatorType, volume: number) {
    if (!this.audioContext || !this.enabled) return

    try {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume()
      }

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration)
    } catch (error) {
      console.warn("Error playing custom tone:", error)
    }
  }
}

// Create singleton instance
export const soundManager = new SoundManager()
