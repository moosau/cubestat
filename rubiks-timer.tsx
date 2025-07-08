"use client"

import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Clock, Menu, Trophy, Loader2, Trash2, MoreVertical, Edit } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import UserProfile from "@/components/auth/user-profile"
import Celebration from "@/components/animations/celebration"
import type { User } from "@supabase/supabase-js"
import ManualTimeEntry from "@/components/manual-time-entry"
import QuickTimeButtons from "@/components/quick-time-buttons"
import BulkImport from "@/components/bulk-import"
import EditTimeEntry from "@/components/edit-time-entry"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { StatisticsView } from "@/components/views/statistics-view"
import { HistoryView } from "@/components/views/history-view"
import { SearchView } from "@/components/views/search-view"
import { SettingsView } from "@/components/views/settings-view"
import { useSoundSettings } from "@/hooks/use-sound-settings"

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

export default function RubiksTimer({ user }: RubiksTimerProps) {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [solveRecords, setSolveRecords] = useState<SolveRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<SolveRecord | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<{
    show: boolean
    type: AchievementType
    time: string
  }>({ show: false, type: "first_solve", time: "" })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const [currentView, setCurrentView] = useState("timer")

  // Sound settings hook
  const { soundEnabled, volume, toggleSound, updateVolume, playSound, playAchievement } = useSoundSettings()

  // Load solve records from Supabase
  useEffect(() => {
    loadSolveRecords()
  }, [])

  // Add this useEffect after the existing loadSolveRecords useEffect
  useEffect(() => {
    // Ensure user profile exists
    ensureUserProfile()
  }, [user])

  // Add hotkey for spacebar to start/stop timer
  useEffect(() => {
    if (currentView !== "timer") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input, textarea, or contenteditable is focused
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isEditable = (e.target as HTMLElement)?.isContentEditable;
      if (tag === "input" || tag === "textarea" || isEditable) return;
      if (e.code === "Space" && !e.repeat && !saving && !celebration.show) {
        e.preventDefault();
        handleScreenTap();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentView, saving, celebration.show, isRunning, isReady]);

  const ensureUserProfile = async () => {
    try {
      // Check if profile exists
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (fetchError && fetchError.code === "PGRST116") {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase.from("profiles").insert([
          {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          },
        ])

        if (insertError) {
          console.error("Error creating profile:", insertError)
        }
      } else if (fetchError) {
        console.error("Error fetching profile:", fetchError)
      }
    } catch (error) {
      console.error("Error ensuring user profile:", error)
    }
  }

  const loadSolveRecords = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("solve_records").select("*").order("solve_date", { ascending: false })

      if (error) throw error

      const formattedRecords = data.map((record) => ({
        ...record,
        formattedTime: formatTime(record.time_ms),
      }))

      setSolveRecords(formattedRecords)
    } catch (error) {
      console.error("Error loading solve records:", error)
      playSound("error")
    } finally {
      setLoading(false)
    }
  }

  const checkForAchievements = (timeMs: number, isFirstSolve: boolean): AchievementType | null => {
    const timeInSeconds = timeMs / 1000

    // Check for first solve
    if (isFirstSolve) {
      return "first_solve"
    }

    // Check for time-based achievements
    if (timeInSeconds < 10) {
      return "sub_10"
    } else if (timeInSeconds < 15) {
      return "sub_15"
    } else if (timeInSeconds < 20) {
      return "sub_20"
    }

    // Check for personal best
    const currentBest = getBestTime()
    if (!currentBest || timeMs < currentBest) {
      return "personal_best"
    }

    return null
  }

  const saveSolveRecord = async (timeMs: number) => {
    setSaving(true)
    try {
      const isFirstSolve = solveRecords.length === 0

      const { data, error } = await supabase
        .from("solve_records")
        .insert([
          {
            user_id: user.id,
            time_ms: timeMs,
            solve_date: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      const newRecord = {
        ...data,
        formattedTime: formatTime(data.time_ms),
      }

      setSolveRecords((prev) => [newRecord, ...prev])

      // Check for achievements
      const achievement = checkForAchievements(timeMs, isFirstSolve)
      if (achievement) {
        setCelebration({
          show: true,
          type: achievement,
          time: formatTime(timeMs),
        })
        // Play achievement sound
        playAchievement()
      } else {
        // Play success sound for regular saves
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

      setSolveRecords((prev) => prev.filter((record) => record.id !== recordId))
      setSelectedRecord(null)
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
    if (saving || celebration.show) return // Prevent interaction while saving or celebrating

    if (!isRunning && !isReady) {
      // First tap - get ready
      setIsReady(true)
      setTime(0)
      playSound("ready")
    } else if (!isRunning && isReady) {
      // Second tap - start timer
      setIsRunning(true)
      setIsReady(false)
      startTimeRef.current = Date.now()
      playSound("start")

      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setTime(Date.now() - startTimeRef.current)
        }
      }, 10)
    } else if (isRunning) {
      // Third tap - stop timer and save
      setIsRunning(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      const finalTime = Date.now() - (startTimeRef.current || 0)
      setTime(finalTime)
      playSound("stop")

      // Save to Supabase
      await saveSolveRecord(finalTime)
    }
  }

  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setTime(0)
    setIsRunning(false)
    setIsReady(false)
    startTimeRef.current = null
    playSound("tick")
  }

  const getBestTime = () => {
    if (solveRecords.length === 0) return null
    return Math.min(...solveRecords.map((record) => record.time_ms))
  }

  const getAverageTime = () => {
    if (solveRecords.length === 0) return null
    const total = solveRecords.reduce((sum, record) => sum + record.time_ms, 0)
    return total / solveRecords.length
  }

  const getStatusText = () => {
    if (saving) return "Saving solve..."
    if (isReady) return "Ready! Tap to start"
    if (isRunning) return "Solving... Tap to stop"
    return "Tap anywhere to get ready"
  }

  const getStatusColor = () => {
    if (saving) return "text-blue-500"
    if (isReady) return "text-green-500"
    if (isRunning) return "text-red-500"
    return "text-muted-foreground"
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} currentView={currentView} onViewChange={setCurrentView} />
      <SidebarInset className="flex flex-col min-h-screen">
        {/* Celebration Animation */}
        <Celebration
          isVisible={celebration.show}
          achievementType={celebration.type}
          time={celebration.time}
          onComplete={() => setCelebration({ ...celebration, show: false })}
        />

        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <div className="w-8 h-8 bg-gradient-to-br from-red-400 via-green-400 to-blue-400 rounded opacity-80"></div>
            <h1 className="text-xl font-semibold text-foreground/90">Rubik's Timer</h1>
          </div>
          {/* Removed right-hand Sheet sidebar */}
        </header>

        {/* Main Content Area - Now properly contained within SidebarInset */}
        <main className="flex-1 overflow-hidden">
          {currentView === "timer" ? (
            <div
              className={`h-full flex flex-col items-center justify-center p-8 select-none ${saving || celebration.show ? "cursor-wait" : "cursor-pointer"
                }`}
              onClick={handleScreenTap}
            >
              <div className="text-center space-y-8">
                {/* Timer Display */}
                <div className="space-y-4">
                  <div
                    className={`text-6xl md:text-8xl lg:text-9xl font-mono font-bold tabular-nums transition-colors duration-300 ${isRunning ? "text-red-400" : isReady ? "text-green-400" : "text-foreground/80"
                      }`}
                  >
                    {formatTime(time)}
                  </div>
                  <div className={`text-lg flex items-center justify-center gap-2 ${getStatusColor()}`}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {getStatusText()}
                  </div>
                </div>

                {/* Reset Button */}
                {(time > 0 || isReady) && !saving && !celebration.show && (
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      resetTimer()
                    }}
                    className="mt-8 bg-background/50"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          ) : currentView === "statistics" ? (
            <div className="h-full overflow-auto">
              <StatisticsView solveRecords={solveRecords} />
            </div>
          ) : currentView === "history" ? (
            <div className="h-full overflow-auto">
              <HistoryView
                solveRecords={solveRecords}
                onDeleteRecord={deleteSolveRecord}
                onUpdateRecords={loadSolveRecords}
                deleting={deleting}
              />
            </div>
          ) : currentView === "search" ? (
            <div className="h-full overflow-auto">
              <SearchView solveRecords={solveRecords} />
            </div>
          ) : currentView === "settings" ? (
            <div className="h-full overflow-auto">
              <SettingsView
                user={user}
                soundEnabled={soundEnabled}
                volume={volume}
                onToggleSound={toggleSound}
                onVolumeChange={updateVolume}
              />
            </div>
          ) : null}
        </main>

        {/* Selected Record Details Modal */}
        {selectedRecord && (
          <Sheet open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Solve Details</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <Card className="bg-card/50">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-mono font-bold mb-2">{selectedRecord.formattedTime}</div>
                    <div className="text-muted-foreground">Solve Time</div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date</label>
                    <div className="text-lg">{new Date(selectedRecord.solve_date).toLocaleDateString()}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Time</label>
                    <div className="text-lg">{new Date(selectedRecord.solve_date).toLocaleTimeString()}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Milliseconds</label>
                    <div className="text-lg font-mono">{selectedRecord.time_ms}ms</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Solve ID</label>
                    <div className="text-sm font-mono text-muted-foreground">{selectedRecord.id}</div>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <EditTimeEntry record={selectedRecord} onTimeUpdated={loadSolveRecords} />

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete This Solve
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Solve Record</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this solve time of{" "}
                          <strong>{selectedRecord.formattedTime}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteSolveRecord(selectedRecord.id)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deleting === selectedRecord.id}
                        >
                          {deleting === selectedRecord.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
