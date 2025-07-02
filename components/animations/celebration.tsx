"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Star, Zap, Crown, Target } from "lucide-react"

interface CelebrationProps {
  isVisible: boolean
  achievementType: "personal_best" | "sub_10" | "sub_15" | "sub_20" | "first_solve"
  time: string
  onComplete: () => void
}

const achievementConfig = {
  personal_best: {
    title: "🎉 NEW PERSONAL BEST! 🎉",
    subtitle: "You're getting faster!",
    icon: Trophy,
    color: "from-yellow-400 to-orange-500",
    particles: "⭐",
  },
  sub_10: {
    title: "🔥 SUB-10 SECONDS! 🔥",
    subtitle: "INCREDIBLE SPEED!",
    icon: Zap,
    color: "from-red-500 to-pink-600",
    particles: "🔥",
  },
  sub_15: {
    title: "⚡ SUB-15 SECONDS! ⚡",
    subtitle: "Amazing solve!",
    icon: Star,
    color: "from-purple-500 to-blue-600",
    particles: "⚡",
  },
  sub_20: {
    title: "🎯 SUB-20 SECONDS! 🎯",
    subtitle: "Great progress!",
    icon: Target,
    color: "from-green-500 to-teal-600",
    particles: "🎯",
  },
  first_solve: {
    title: "🎊 FIRST SOLVE! 🎊",
    subtitle: "Welcome to speedcubing!",
    icon: Crown,
    color: "from-indigo-500 to-purple-600",
    particles: "🎊",
  },
}

export default function Celebration({ isVisible, achievementType, time, onComplete }: CelebrationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])
  const config = achievementConfig[achievementType]
  const Icon = config.icon

  useEffect(() => {
    if (isVisible) {
      // Generate random particles
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
      }))
      setParticles(newParticles)

      // Auto-complete after animation
      const timer = setTimeout(onComplete, 4000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onComplete}
        >
          {/* Particle Background */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ opacity: 0, scale: 0, x: "50vw", y: "50vh" }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.5, 1, 0],
                  x: `${particle.x}vw`,
                  y: `${particle.y}vh`,
                  rotate: 360,
                }}
                transition={{
                  duration: 3,
                  delay: particle.delay,
                  ease: "easeOut",
                }}
                className="absolute text-4xl"
              >
                {config.particles}
              </motion.div>
            ))}
          </div>

          {/* Main Achievement Card */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="relative z-10 max-w-md mx-4"
          >
            <div className={`bg-gradient-to-br ${config.color} p-8 rounded-3xl shadow-2xl text-white text-center`}>
              {/* Pulsing Icon */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="mb-6"
              >
                <Icon className="w-20 h-20 mx-auto" />
              </motion.div>

              {/* Achievement Title */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold mb-2"
              >
                {config.title}
              </motion.h1>

              {/* Time Display */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="text-6xl font-mono font-bold mb-4 bg-white/20 rounded-2xl py-4 backdrop-blur-sm"
              >
                {time}
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-xl opacity-90"
              >
                {config.subtitle}
              </motion.p>

              {/* Tap to continue */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ delay: 2, duration: 1, repeat: Number.POSITIVE_INFINITY }}
                className="text-sm mt-4 opacity-70"
              >
                Tap anywhere to continue
              </motion.p>
            </div>
          </motion.div>

          {/* Confetti Burst */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 0] }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    rotate: i * 30,
                    x: Math.cos((i * 30 * Math.PI) / 180) * 200,
                    y: Math.sin((i * 30 * Math.PI) / 180) * 200,
                  }}
                  transition={{ duration: 2, delay: 0.1 * i }}
                  className="absolute w-4 h-4 bg-yellow-400 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
