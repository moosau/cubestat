"use client"

import type React from "react"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock, Plus, Loader2 } from "lucide-react"
import { format } from "date-fns"
import type { User } from "@supabase/supabase-js"

interface ManualTimeEntryProps {
  user: User
  onTimeAdded: () => void
}

export default function ManualTimeEntry({ user, onTimeAdded }: ManualTimeEntryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Time input states
  const [minutes, setMinutes] = useState("")
  const [seconds, setSeconds] = useState("")
  const [milliseconds, setMilliseconds] = useState("")

  // Date and time states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedHour, setSelectedHour] = useState(new Date().getHours().toString())
  const [selectedMinute, setSelectedMinute] = useState(new Date().getMinutes().toString())

  const formatTime = (timeInMs: number): string => {
    const totalSeconds = timeInMs / 1000
    const mins = Math.floor(totalSeconds / 60)
    const secs = Math.floor(totalSeconds % 60)
    const ms = Math.floor((timeInMs % 1000) / 10)

    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
    }
    return `${secs}.${ms.toString().padStart(2, "0")}`
  }

  const parseTimeToMs = (): number | null => {
    try {
      const mins = Number.parseInt(minutes || "0")
      const secs = Number.parseInt(seconds || "0")
      const ms = Number.parseInt(milliseconds || "0")

      if (mins < 0 || secs < 0 || secs >= 60 || ms < 0 || ms >= 100) {
        return null
      }

      return (mins * 60 + secs) * 1000 + ms * 10
    } catch {
      return null
    }
  }

  const getCurrentTimePreview = (): string => {
    const timeMs = parseTimeToMs()
    return timeMs !== null ? formatTime(timeMs) : "Invalid time"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const timeMs = parseTimeToMs()

      if (timeMs === null || timeMs <= 0) {
        throw new Error("Please enter a valid time")
      }

      if (timeMs > 3600000) {
        // 1 hour instead of 10 minutes
        throw new Error("Time cannot exceed 1 hour")
      }

      // Create the solve date by combining selected date and time
      const solveDateTime = new Date(selectedDate)
      solveDateTime.setHours(Number.parseInt(selectedHour), Number.parseInt(selectedMinute), 0, 0)

      // Check if the date is not in the future
      if (solveDateTime > new Date()) {
        throw new Error("Cannot add times from the future")
      }

      const { error } = await supabase.from("solve_records").insert([
        {
          user_id: user.id,
          time_ms: timeMs,
          solve_date: solveDateTime.toISOString(),
        },
      ])

      if (error) throw error

      setMessage({ type: "success", text: `Added solve time: ${formatTime(timeMs)}` })

      // Reset form
      setMinutes("")
      setSeconds("")
      setMilliseconds("")
      setSelectedDate(new Date())
      setSelectedHour(new Date().getHours().toString())
      setSelectedMinute(new Date().getMinutes().toString())

      // Notify parent component
      onTimeAdded()

      // Close after a delay
      setTimeout(() => {
        setIsOpen(false)
        setMessage(null)
      }, 2000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const generateHours = () => {
    return Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  }

  const generateMinutes = () => {
    return Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full bg-transparent">
          <Plus className="h-4 w-4 mr-2" />
          Add Past Time
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Add Past Solve Time
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Time Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Solve Time</CardTitle>
              <CardDescription>Enter your solve time in minutes, seconds, and centiseconds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="minutes">Minutes</Label>
                  <Input
                    id="minutes"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seconds">Seconds</Label>
                  <Input
                    id="seconds"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={seconds}
                    onChange={(e) => setSeconds(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="milliseconds">Centiseconds</Label>
                  <Input
                    id="milliseconds"
                    type="number"
                    min="0"
                    max="99"
                    placeholder="00"
                    value={milliseconds}
                    onChange={(e) => setMilliseconds(e.target.value)}
                  />
                </div>
              </div>

              {/* Time Preview */}
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Preview</div>
                <div className="text-2xl font-mono font-bold">{getCurrentTimePreview()}</div>
              </div>
            </CardContent>
          </Card>

          {/* Date and Time Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">When did you achieve this time?</CardTitle>
              <CardDescription>Select the date and time when you completed this solve</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Picker */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Hour</Label>
                  <Select value={selectedHour} onValueChange={setSelectedHour}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateHours().map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Minute</Label>
                  <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                    <SelectTrigger>
                      <SelectValue placeholder="Minute" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateMinutes().map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          :{minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Selected DateTime Preview */}
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Solve completed on</div>
                <div className="font-medium">
                  {format(selectedDate, "EEEE, MMMM do, yyyy")} at {selectedHour}:{selectedMinute.padStart(2, "0")}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading || parseTimeToMs() === null}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Solve Time
          </Button>

          {/* Message Display */}
          {message && (
            <Alert className={message.type === "error" ? "border-red-500" : "border-green-500"}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </form>
      </SheetContent>
    </Sheet>
  )
}
