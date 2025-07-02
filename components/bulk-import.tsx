"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Loader2, FileText } from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface BulkImportProps {
  user: User
  onTimesAdded: () => void
}

export default function BulkImport({ user, onTimesAdded }: BulkImportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [timesText, setTimesText] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const parseTimeString = (timeStr: string): number | null => {
    try {
      // Remove any whitespace
      const cleaned = timeStr.trim()

      // Match patterns like "12.34", "1:23.45", "1:23", "23.45"
      const timeMatch = cleaned.match(/^(?:(\d+):)?(\d+)(?:\.(\d{1,2}))?$/)

      if (!timeMatch) return null

      const minutes = Number.parseInt(timeMatch[1] || "0")
      const seconds = Number.parseInt(timeMatch[2] || "0")
      const centiseconds = Number.parseInt((timeMatch[3] || "0").padEnd(2, "0"))

      if (seconds >= 60 || centiseconds >= 100) return null

      return (minutes * 60 + seconds) * 1000 + centiseconds * 10
    } catch {
      return null
    }
  }

  const handleImport = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const lines = timesText.split("\n").filter((line) => line.trim())

      if (lines.length === 0) {
        throw new Error("Please enter some times to import")
      }

      const validTimes: number[] = []
      const invalidLines: string[] = []

      lines.forEach((line, index) => {
        const timeMs = parseTimeString(line)
        if (timeMs !== null && timeMs > 0) {
          validTimes.push(timeMs)
        } else {
          invalidLines.push(`Line ${index + 1}: "${line}"`)
        }
      })

      if (validTimes.length === 0) {
        throw new Error("No valid times found. Please check your format.")
      }

      // Insert all valid times
      const records = validTimes.map((timeMs) => ({
        user_id: user.id,
        time_ms: timeMs,
        solve_date: new Date().toISOString(),
      }))

      const { error } = await supabase.from("solve_records").insert(records)

      if (error) throw error

      let successMessage = `Successfully imported ${validTimes.length} solve time${validTimes.length > 1 ? "s" : ""}`

      if (invalidLines.length > 0) {
        successMessage += `\n\nSkipped ${invalidLines.length} invalid line${invalidLines.length > 1 ? "s" : ""}:\n${invalidLines.join("\n")}`
      }

      setMessage({ type: "success", text: successMessage })
      setTimesText("")
      onTimesAdded()

      setTimeout(() => {
        setIsOpen(false)
        setMessage(null)
      }, 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full bg-transparent">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Import
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bulk Import Times
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import Format</CardTitle>
              <CardDescription>Enter one time per line. Supported formats:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="font-mono bg-muted p-2 rounded">
                12.34 (seconds.centiseconds)
                <br />
                1:23.45 (minutes:seconds.centiseconds)
                <br />
                1:23 (minutes:seconds)
                <br />
                45 (seconds only)
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="times-input">Paste your times here:</Label>
            <Textarea
              id="times-input"
              placeholder={`12.34
15.67
1:23.45
18.90
22.11`}
              value={timesText}
              onChange={(e) => setTimesText(e.target.value)}
              rows={8}
              className="font-mono"
            />
          </div>

          <Button onClick={handleImport} disabled={loading || !timesText.trim()} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {timesText.split("\n").filter((line) => line.trim()).length} Times
          </Button>

          {message && (
            <Alert className={message.type === "error" ? "border-red-500" : "border-green-500"}>
              <AlertDescription className="whitespace-pre-line">{message.text}</AlertDescription>
            </Alert>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
