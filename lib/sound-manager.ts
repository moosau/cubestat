class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled = true

  constructor() {
    if (typeof window !== "undefined") {
      // Resume context on first user gesture to avoid latency on first play
      const resume = () => {
        this.getContext()
        window.removeEventListener("pointerdown", resume)
        window.removeEventListener("keydown", resume)
      }
      window.addEventListener("pointerdown", resume)
      window.addEventListener("keydown", resume)
    }
  }

  private getContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch {
        return null
      }
    }
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume()
    }
    return this.audioContext
  }

  private playTone(frequency: number, duration: number, type: OscillatorType, volume: number) {
    const ctx = this.getContext()
    if (!ctx || !this.enabled) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const now = ctx.currentTime

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.005)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(now)
    oscillator.stop(now + duration)
  }

  play(soundName: string, volume = 1) {
    if (!this.enabled) return
    const v = Math.max(0, Math.min(1, volume)) * 0.3

    switch (soundName) {
      case "ready":
        this.playTone(800, 0.1, "sine", v)
        break
      case "start":
        this.playTone(1000, 0.12, "sine", v)
        break
      case "stop":
        this.playTone(600, 0.18, "sine", v)
        break
      case "tick":
        this.playTone(400, 0.05, "square", v * 0.5)
        break
      case "success":
        this.playTone(880, 0.2, "sine", v)
        break
      case "error":
        this.playTone(220, 0.25, "sawtooth", v)
        break
    }
  }

  playAchievement() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    const notes = [880, 1108, 1319, 1760]
    notes.forEach((freq, i) => {
      const start = ctx.currentTime + i * 0.1
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.12, start + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.15)
    })
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }
}

export const soundManager = new SoundManager()
