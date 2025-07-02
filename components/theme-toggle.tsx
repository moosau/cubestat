"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="bg-transparent">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const toggleTheme = () => {
    setIsAnimating(true)
    setTheme(theme === "dark" ? "light" : "dark")

    // Reset animation state after transition
    setTimeout(() => setIsAnimating(false), 800)
  }

  return (
    <div className="relative">
      {/* Liquid Background Animation */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 20, opacity: [0, 0.3, 0] }}
            exit={{ scale: 25, opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.6 },
            }}
            className={`absolute inset-0 rounded-full pointer-events-none z-0 ${
              theme === "dark"
                ? "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"
                : "bg-gradient-to-r from-orange-200 via-yellow-200 to-orange-200"
            }`}
            style={{
              transformOrigin: "center",
            }}
          />
        )}
      </AnimatePresence>

      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="relative z-10 bg-transparent border-2 transition-all duration-300 hover:scale-105"
        disabled={isAnimating}
      >
        <div className="relative w-4 h-4">
          <AnimatePresence mode="wait">
            {theme === "dark" ? (
              <motion.div
                key="moon"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Moon className="h-4 w-4 text-slate-300" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Sun className="h-4 w-4 text-orange-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ripple Effect */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-current"
            />
          )}
        </AnimatePresence>
      </Button>

      {/* Floating Particles */}
      <AnimatePresence>
        {isAnimating && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  scale: 0,
                  x: 0,
                  y: 0,
                  opacity: 0,
                }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * 60 * Math.PI) / 180) * 30,
                  y: Math.sin((i * 60 * Math.PI) / 180) * 30,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
                className={`absolute top-1/2 left-1/2 w-1 h-1 rounded-full ${
                  theme === "dark" ? "bg-yellow-400" : "bg-slate-600"
                }`}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
