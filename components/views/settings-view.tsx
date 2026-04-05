"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Download, User, Volume2, VolumeX, Trophy } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

interface SettingsViewProps {
  user: any
  soundEnabled: boolean
  volume: number
  onToggleSound: () => void
  onVolumeChange: (volume: number) => void
}

export function SettingsView({ user, soundEnabled, volume, onToggleSound, onVolumeChange }: SettingsViewProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState(user.user_metadata?.full_name || "")
  const [editLoading, setEditLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportFastestLoading, setExportFastestLoading] = useState(false)
  const { toast } = useToast ? useToast() : { toast: () => {} }

  const handleEditProfile = async () => {
    setEditLoading(true)
    try {
      const { error: userError } = await supabase.auth.updateUser({ data: { full_name: editName } })
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: editName })
        .eq("id", user.id)
      if (userError || profileError) throw userError || profileError
      toast && toast({ title: "Profile updated!" })
      setEditOpen(false)
      window.location.reload()
    } catch (e: any) {
      toast && toast({ title: "Error updating profile", description: e.message, variant: "destructive" })
    } finally {
      setEditLoading(false)
    }
  }

  const handleExportData = async () => {
    setExportLoading(true)
    try {
      const { data, error } = await supabase
        .from("solve_records")
        .select("time_ms,solve_date")
        .eq("user_id", user.id)
        .order("solve_date", { ascending: true })
      if (error) throw error
      const csv = ["Time (ms),Date"]
        .concat(data.map((row: any) => `${row.time_ms},${row.solve_date}`))
        .join("\n")
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "rubiks-timer-solves.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast && toast({ title: "Data exported!" })
    } catch (e: any) {
      toast && toast({ title: "Export failed", description: e.message, variant: "destructive" })
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportFastest = async () => {
    setExportFastestLoading(true)
    try {
      const { data, error } = await supabase
        .from("solve_records")
        .select("time_ms,solve_date")
        .eq("user_id", user.id)
        .order("time_ms", { ascending: true })
      if (error) throw error
      if (!data || data.length === 0) throw new Error("No solves found!")
      const bestSolve = data[0]
      const best = bestSolve.time_ms
      const bestDate = new Date(bestSolve.solve_date)

      const formatTime = (ms: number) => {
        const min = Math.floor(ms / 60000)
        const sec = Math.floor((ms % 60000) / 1000)
        const cs = Math.floor((ms % 1000) / 10)
        return min > 0
          ? `${min}:${sec.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`
          : `${sec}.${cs.toString().padStart(2, "0")}`
      }

      let ranking = "?", total = "?"
      try {
        const res = await fetch("https://yylunpfryjyzufwjlaxe.supabase.co/functions/v1/global-ranking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ time_ms: best }),
        })
        if (res.ok) {
          const json = await res.json()
          ranking = json.ordinal
          total = json.total
        } else {
          throw new Error("Failed to fetch ranking")
        }
      } catch {
        ranking = "?"
        total = "?"
      }

      const canvas = document.createElement("canvas")
      canvas.width = 1200
      canvas.height = 675
      const ctx = canvas.getContext("2d")!

      function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.quadraticCurveTo(x + w, y, x + w, y + r)
        ctx.lineTo(x + w, y + h - r)
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
        ctx.lineTo(x + r, y + h)
        ctx.quadraticCurveTo(x, y + h, x, y + h - r)
        ctx.lineTo(x, y + r)
        ctx.quadraticCurveTo(x, y, x + r, y)
        ctx.closePath()
      }

      ctx.clearRect(0, 0, 1200, 675)
      roundRect(ctx, 0, 0, 1200, 675, 20)
      ctx.fillStyle = "#171819"
      ctx.fill()
      ctx.save()
      ctx.strokeStyle = "#c06969"
      ctx.lineWidth = 10
      ctx.setLineDash([20, 20])
      roundRect(ctx, 5, 5, 1190, 665, 20)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      ctx.save()
      ctx.font = "bold 60px Nunito, sans-serif"
      ctx.textAlign = "center"
      const grad1 = ctx.createLinearGradient(400, 0, 800, 0)
      grad1.addColorStop(0, "#38bdf8")
      grad1.addColorStop(1, "#06b6d4")
      ctx.fillStyle = grad1
      ctx.fillText(`${ranking} / ${total}`, 600, 120)
      ctx.restore()

      ctx.font = "bold 50px Nunito, sans-serif"
      ctx.fillStyle = "#a8819f"
      ctx.textAlign = "center"
      ctx.fillText(user.user_metadata?.full_name || user.email, 600, 200)
      ctx.font = "50px Nunito, sans-serif"
      ctx.fillStyle = "#a8819f"
      ctx.fillText("solved the rubik's cube in", 600, 270)

      ctx.save()
      ctx.font = "bold 120px Nunito, monospace, sans-serif"
      const grad2 = ctx.createLinearGradient(400, 0, 800, 0)
      grad2.addColorStop(0, "#38bdf8")
      grad2.addColorStop(1, "#06b6d4")
      ctx.fillStyle = grad2
      ctx.fillText(formatTime(best), 600, 400)
      ctx.restore()

      ctx.font = "bold 40px Nunito, sans-serif"
      ctx.fillStyle = "#a8819f"
      ctx.textAlign = "left"
      ctx.fillText(bestDate.toLocaleDateString(), 200, 500)
      ctx.textAlign = "right"
      ctx.fillText("Personal Best", 1000, 500)
      ctx.font = "bold 36px Nunito, sans-serif"
      ctx.textAlign = "center"
      ctx.fillStyle = "#fbbf24"
      ctx.fillText("🏆 Rubik's Timer Champion!", 600, 600)

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "fastest-time.png"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, "image/png")

      toast && toast({ title: "Image exported!" })
    } catch (e: any) {
      toast && toast({ title: "Export failed", description: e.message, variant: "destructive" })
    } finally {
      setExportFastestLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold">Settings</h1>

      <div className="grid gap-4">
        {/* Profile */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">Name</span>
              <span>{user.user_metadata?.full_name || "Not set"}</span>
              <span className="text-muted-foreground">Email</span>
              <span>{user.email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditName(user.user_metadata?.full_name || "")
                setEditOpen(true)
              }}
            >
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Theme</div>
                <div className="text-xs text-muted-foreground">Switch between light and dark</div>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Audio */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              Audio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound-enabled" className="text-sm font-medium">Sound Effects</Label>
                <div className="text-xs text-muted-foreground">Sounds for timer events and achievements</div>
              </div>
              <Switch id="sound-enabled" checked={soundEnabled} onCheckedChange={onToggleSound} />
            </div>
            {soundEnabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Volume</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(volume * 100)}%</span>
                </div>
                <Slider
                  value={[volume]}
                  onValueChange={(value) => onVolumeChange(value[0])}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Data</CardTitle>
            <CardDescription>Export your solve data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleExportData}
                disabled={exportLoading}
              >
                <Download className="h-4 w-4" />
                {exportLoading ? "Exporting..." : "Export CSV"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleExportFastest}
                disabled={exportFastestLoading}
              >
                <Trophy className="h-4 w-4" />
                {exportFastestLoading ? "Exporting..." : "Export Best Time Image"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={editLoading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>
              Cancel
            </Button>
            <Button onClick={handleEditProfile} disabled={editLoading || !editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
