"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Zap } from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface QuickTimeButtonsProps {
  user: User
  onTimeAdded: () => void
}

const quickTimes = [
  { label: "Sub-10", time: 9.99, color: "bg-red-500 hover:bg-red-600" },
  { label: "Sub-15", time: 14.99, color: "bg-orange-500 hover:bg-orange-600" },
  { label: "Sub-20", time: 19.99, color: "bg-yellow-500 hover:bg-yellow-600" },
  { label: "Sub-30", time: 29.99, color: "bg-green-500 hover:bg-green-600" },
  { label: "1 Min", time: 60.0, color: "bg-blue-500 hover:bg-blue-600" },
  { label: "2 Min", time: 120.0, color: "bg-purple-500 hover:bg-purple-600" },
]

export default function QuickTimeButtons({ user, onTimeAdded }: QuickTimeButtonsProps) {
  const [loading, setLoading] = useState<number | null>(null)

  const addQuickTime = async (timeInSeconds: number) => {
    setLoading(timeInSeconds)
    try {
      const timeMs = Math.floor(timeInSeconds * 1000)

      const { error } = await supabase.from("solve_records").insert([
        {
          user_id: user.id,
          time_ms: timeMs,
          solve_date: new Date().toISOString(),
        },
      ])

      if (error) throw error

      onTimeAdded()
    } catch (error) {
      console.error("Error adding quick time:", error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Add Times
        </CardTitle>
        <CardDescription>Add common benchmark times instantly</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {quickTimes.map((quickTime) => (
            <Button
              key={quickTime.time}
              variant="secondary"
              size="sm"
              className={`${quickTime.color} text-white`}
              onClick={() => addQuickTime(quickTime.time)}
              disabled={loading !== null}
            >
              {loading === quickTime.time && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {quickTime.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
