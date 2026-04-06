"use client"

import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Settings, Timer, X, RefreshCw } from "lucide-react"
import Celebration from "@/components/animations/celebration"
import type { User } from "@supabase/supabase-js"
import { StatisticsView } from "@/components/views/statistics-view"
import { HistoryView } from "@/components/views/history-view"
import { SettingsView } from "@/components/views/settings-view"
import { useSoundSettings } from "@/hooks/use-sound-settings"
import { generateScramble } from "@/lib/scramble"

interface SolveRecord {
  id: string
  time_ms: number
  solve_date: string
  user_id: string
  formattedTime: string
}

interface RubiksTimerProps {
  user: User
}

type AchievementType = "personal_best" | "sub_10" | "sub_15" | "sub_20" | "first_solve"
type TimerPhase = "idle" | "inspection" | "ready" | "running" | "stopped"

const NAV_VIEWS = [
  { id: "statistics", label: "Stats" },
  { id: "history", label: "History" },
] as const

type ViewId = "statistics" | "history" | "settings" | "timer"

const INSPECTION_SECONDS = 15

export default function RubiksTimer({ user }: RubiksTimerProps) {
  const [time, setTime] = useState(0)
  const [phase, setPhase] = useState<TimerPhase>("idle")
  const [inspectionLeft, setInspectionLeft] = useState(INSPECTION_SECONDS)
  const [solveRecords, setSolveRecords] = useState<SolveRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<{
    show: boolean
    type: AchievementType
    time: string
  }>({ show: false, type: "first_solve", time: "" })
  const [scramble, setScramble] = useState(() => generateScramble())
  const [currentView, setCurrentView] = useState<ViewId>("statistics")

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const inspectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  const { soundEnabled, volume, toggleSound, updateVolume, playSound, playAchievement } = useSoundSettings()

  const timerActive = currentView === "timer"

  useEffect(() => { loadSolveRecords() }, [])
  useEffect(() => { ensureUserProfile() }, [user])

  // Spacebar handler
  useEffect(() => {
    if (currentView !== "timer") return
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable) return
      if (e.code === "Space" && !e.repeat && !saving && !celebration.show) {
        e.preventDefault()
        handleScreenTap()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentView, saving, celebration.show, phase])

  const startInspection = () => {
    setInspectionLeft(INSPECTION_SECONDS)
    setPhase("inspection")
    playSound("ready")
    let remaining = INSPECTION_SECONDS
    inspectionIntervalRef.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 3) playSound("ready")
      if (remaining <= 0) {
        clearInterval(inspectionIntervalRef.current!)
        inspectionIntervalRef.current = null
        startRunning()
      } else {
        setInspectionLeft(remaining)
      }
    }, 1000)
  }

  const startRunning = () => {
    clearInterval(inspectionIntervalRef.current!)
    inspectionIntervalRef.current = null
    clearInterval(timerIntervalRef.current!)
    timerIntervalRef.current = null
    setTime(0)
    setPhase("running")
    const start = Date.now()
    startTimeRef.current = start
    playSound("start")
    timerIntervalRef.current = setInterval(() => {
      setTime(Date.now() - start)
    }, 10)
  }

  const ensureUserProfile = async () => {
    try {
      const { error: fetchError } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      if (fetchError && fetchError.code === "PGRST116") {
        await supabase.from("profiles").insert([{
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        }])
      }
    } catch (error) {
      console.error("Error ensuring user profile:", error)
    }
  }

  const loadSolveRecords = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("solve_records").select("*").order("solve_date", { ascending: false })
      if (error) throw error
      setSolveRecords(data.map((r) => ({ ...r, formattedTime: formatTime(r.time_ms) })))
    } catch (error) {
      console.error("Error loading solve records:", error)
      playSound("error")
    } finally {
      setLoading(false)
    }
  }

  const checkForAchievements = (timeMs: number, isFirstSolve: boolean): AchievementType | null => {
    if (isFirstSolve) return "first_solve"
    const s = timeMs / 1000
    if (s < 10) return "sub_10"
    if (s < 15) return "sub_15"
    if (s < 20) return "sub_20"
    const best = getBestTime()
    if (!best || timeMs < best) return "personal_best"
    return null
  }

  const saveSolveRecord = async (timeMs: number) => {
    setSaving(true)
    try {
      const isFirstSolve = solveRecords.length === 0
      const { data, error } = await supabase
        .from("solve_records")
        .insert([{ user_id: user.id, time_ms: timeMs, solve_date: new Date().toISOString() }])
        .select().single()
      if (error) throw error
      const newRecord = { ...data, formattedTime: formatTime(data.time_ms) }
      setSolveRecords((prev) => [newRecord, ...prev])
      const achievement = checkForAchievements(timeMs, isFirstSolve)
      if (achievement) {
        setCelebration({ show: true, type: achievement, time: formatTime(timeMs) })
        playAchievement()
      } else {
        playSound("success")
      }
    } catch (error: any) {
      console.error("Error saving solve record:", error)
      playSound("error")
      alert(`Error saving solve: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const deleteSolveRecord = async (recordId: string) => {
    setDeleting(recordId)
    try {
      const { error } = await supabase.from("solve_records").delete().eq("id", recordId)
      if (error) throw error
      setSolveRecords((prev) => prev.filter((r) => r.id !== recordId))
      playSound("success")
    } catch (error: any) {
      console.error("Error deleting solve record:", error)
      playSound("error")
      alert(`Error deleting solve: ${error.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const formatTime = (timeInMs: number): string => {
    const totalSeconds = timeInMs / 1000
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    const milliseconds = Math.floor((timeInMs % 1000) / 10)
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
    }
    return `${seconds}.${milliseconds.toString().padStart(2, "0")}`
  }

  const handleScreenTap = async () => {
    if (saving || celebration.show) return

    if (phase === "idle" || phase === "stopped") {
      startInspection()
    } else if (phase === "inspection") {
      startRunning()
    } else if (phase === "running") {
      clearInterval(timerIntervalRef.current!)
      timerIntervalRef.current = null
      const finalTime = Date.now() - (startTimeRef.current || 0)
      startTimeRef.current = null
      setTime(finalTime)
      setPhase("stopped")
      playSound("stop")
      await saveSolveRecord(finalTime)
      setScramble(generateScramble())
    }
  }

  const resetTimer = () => {
    clearInterval(timerIntervalRef.current!)
    clearInterval(inspectionIntervalRef.current!)
    timerIntervalRef.current = null
    inspectionIntervalRef.current = null
    startTimeRef.current = null
    setTime(0)
    setPhase("idle")
    setInspectionLeft(INSPECTION_SECONDS)
    playSound("tick")
  }

  const exitTimer = () => {
    resetTimer()
    setCurrentView("statistics")
  }

  const newScramble = (e: React.MouseEvent) => {
    e.stopPropagation()
    setScramble(generateScramble())
  }

  const getBestTime = () => {
    if (solveRecords.length === 0) return null
    return Math.min(...solveRecords.map((r) => r.time_ms))
  }

  const getStatusText = () => {
    if (saving) return "Saving..."
    if (phase === "inspection") return "Tap or space to skip inspection"
    if (phase === "running") return "Tap or space to stop"
    if (phase === "stopped") return "Tap or space to start next solve"
    return "Tap or space to begin inspection"
  }

  const getTimerDisplay = () => {
    if (phase === "inspection") return inspectionLeft.toString()
    return formatTime(time)
  }

  const getTimerColor = () => {
    if (phase === "inspection") {
      if (inspectionLeft <= 3) return "text-destructive"
      return "text-foreground"
    }
    if (phase === "running") return "text-foreground"
    if (phase === "stopped") return "text-foreground"
    return "text-foreground/40"
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Celebration
        isVisible={celebration.show}
        achievementType={celebration.type}
        time={celebration.time}
        onComplete={() => setCelebration({ ...celebration, show: false })}
      />

      {/* Header — hidden in timer view */}
      {!timerActive && (
        <header className="sticky top-0 z-40 border-b bg-background">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <span className="font-semibold text-base tracking-tight">Rubik's Timer</span>
            <nav className="flex items-center gap-1">
              {NAV_VIEWS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setCurrentView(v.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentView === v.id
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {v.label}
                </button>
              ))}
              <button
                onClick={() => setCurrentView("settings")}
                className={`p-2 rounded-md transition-colors ${
                  currentView === "settings"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </nav>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {currentView === "timer" && (
          <div className="relative min-h-screen flex flex-col">
            {/* X button */}
            <button
              onClick={exitTimer}
              className="absolute top-4 left-4 z-10 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close timer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Tap area */}
            <div
              className={`flex-1 flex flex-col items-center justify-center p-8 select-none ${
                saving || celebration.show ? "cursor-wait" : "cursor-pointer"
              }`}
              onClick={handleScreenTap}
            >
              {/* Scramble — shown when idle or stopped */}
              {(phase === "idle" || phase === "stopped") && (
                <div
                  className="mb-10 max-w-lg text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="font-mono text-base md:text-lg font-medium tracking-wide leading-relaxed text-foreground/80">
                    {scramble}
                  </p>
                  <button
                    onClick={newScramble}
                    className="mt-3 flex items-center gap-1.5 mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    New scramble
                  </button>
                </div>
              )}

              <div className="text-center space-y-6">
                {/* Timer / Inspection display */}
                <div className={`text-7xl md:text-9xl font-mono font-bold tabular-nums transition-colors duration-200 ${getTimerColor()}`}>
                  {getTimerDisplay()}
                </div>

                {/* Inspection label */}
                {phase === "inspection" && (
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                    Inspection
                  </div>
                )}

                <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {getStatusText()}
                </div>

                {/* Reset — only during inspection or running */}
                {(phase === "inspection" || phase === "running") && !saving && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={resetTimer}>
                      Reset
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === "statistics" && (
          <div className="h-full overflow-auto">
            <StatisticsView solveRecords={solveRecords} />
          </div>
        )}

        {currentView === "history" && (
          <div className="h-full overflow-auto">
            <HistoryView
              solveRecords={solveRecords}
              onDeleteRecord={deleteSolveRecord}
              onUpdateRecords={loadSolveRecords}
              deleting={deleting}
            />
          </div>
        )}

        {currentView === "settings" && (
          <div className="h-full overflow-auto">
            <SettingsView
              user={user}
              soundEnabled={soundEnabled}
              volume={volume}
              onToggleSound={toggleSound}
              onVolumeChange={updateVolume}
            />
          </div>
        )}

        {/* FAB */}
        {currentView !== "timer" && (
          <button
            onClick={() => setCurrentView("timer")}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
            aria-label="Open timer"
          >
            <Timer className="h-6 w-6" />
          </button>
        )}
      </main>
    </div>
  )
}
