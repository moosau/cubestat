"use client"

import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
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
import { Loader2, Trash2 } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import Celebration from "@/components/animations/celebration"
import type { User } from "@supabase/supabase-js"
import EditTimeEntry from "@/components/edit-time-entry"

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

  // Load solve records from Supabase
  useEffect(() => {
    loadSolveRecords()
  }, [])

  // Add this useEffect after the existing loadSolveRecords useEffect
  useEffect(() => {
    // Ensure user profile exists
    ensureUserProfile()
  }, [user])

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
      }
    } catch (error: any) {
      console.error("Error saving solve record:", error)
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
    } catch (error: any) {
      console.error("Error deleting solve record:", error)
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
    } else if (!isRunning && isReady) {
      // Second tap - start timer
      setIsRunning(true)
      setIsReady(false)
      startTimeRef.current = Date.now()

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
  }

  const getBestTime = () => {
    if (solveRecords.length === 0) return null
    return Math.min(...solveRecords.map((record) => record.time_ms))
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
      <SidebarInset>
        {/* Celebration Animation */}
        <Celebration
          isVisible={celebration.show}
          achievementType={celebration.type}
          time={celebration.time}
          onComplete={() => setCelebration({ ...celebration, show: false })}
        />

        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-red-500 via-green-500 to-blue-500 rounded"></div>
            <h1 className="text-lg font-semibold">Rubik's Timer</h1>
          </div>
          <div className="flex items-center gap-2">
            <Separator orientation="vertical" className="h-4" />
            <SidebarTrigger className="-mr-1" />
          </div>
        </header>

        {/* Main Timer Area */}
        <div
          className={`flex-1 flex flex-col items-center justify-center p-8 select-none ${
            saving || celebration.show ? "cursor-wait" : "cursor-pointer"
          }`}
          onClick={handleScreenTap}
        >
          <div className="text-center space-y-8">
            {/* Timer Display */}
            <div className="space-y-4">
              <div
                className={`text-8xl md:text-9xl font-mono font-bold tabular-nums transition-colors duration-300 ${
                  isRunning ? "text-red-500" : isReady ? "text-green-500" : "text-foreground"
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
                className="mt-8"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Selected Record Details Modal */}
        {selectedRecord && (
          <Sheet open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Solve Details</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <Card>
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
      <AppSidebar
        user={user}
        solveRecords={solveRecords}
        loading={loading}
        deleting={deleting}
        onTimeAdded={loadSolveRecords}
        onDeleteRecord={deleteSolveRecord}
        onRecordSelect={setSelectedRecord}
        formatTime={formatTime}
      />
    </SidebarProvider>
  )
}
