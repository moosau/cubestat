"use client"

import { useState, useEffect } from "react"
import { soundManager } from "@/lib/sound-manager"

export function useSoundSettings() {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [volume, setVolume] = useState(0.7)

  useEffect(() => {
    // Load settings from localStorage
    const savedSoundEnabled = localStorage.getItem("sound-enabled")
    const savedVolume = localStorage.getItem("sound-volume")

    if (savedSoundEnabled !== null) {
      const enabled = savedSoundEnabled === "true"
      setSoundEnabled(enabled)
      soundManager.setEnabled(enabled)
    }

    if (savedVolume !== null) {
      const vol = Number.parseFloat(savedVolume)
      setVolume(vol)
    }
  }, [])

  const toggleSound = () => {
    const newEnabled = !soundEnabled
    setSoundEnabled(newEnabled)
    soundManager.setEnabled(newEnabled)
    localStorage.setItem("sound-enabled", newEnabled.toString())
  }

  const updateVolume = (newVolume: number) => {
    setVolume(newVolume)
    localStorage.setItem("sound-volume", newVolume.toString())
  }

  const playSound = (soundName: string) => {
    if (soundEnabled) {
      soundManager.play(soundName, volume)
    }
  }

  const playAchievement = () => {
    if (soundEnabled) {
      soundManager.playAchievement()
    }
  }

  return {
    soundEnabled,
    volume,
    toggleSound,
    updateVolume,
    playSound,
    playAchievement,
  }
}
