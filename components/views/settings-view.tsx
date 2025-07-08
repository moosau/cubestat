"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Settings, Bell, Download, Trash2, User, Volume2, VolumeX, Trophy } from "lucide-react"
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
  const { toast } = useToast ? useToast() : { toast: () => { } }

  // Edit profile handler
  const handleEditProfile = async () => {
    setEditLoading(true)
    try {
      // Update Supabase auth user metadata
      const { error: userError } = await supabase.auth.updateUser({
        data: { full_name: editName },
      })
      // Update profiles table
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

  // Export data handler
  const handleExportData = async () => {
    setExportLoading(true)
    try {
      const { data, error } = await supabase
        .from("solve_records")
        .select("time_ms,solve_date")
        .eq("user_id", user.id)
        .order("solve_date", { ascending: true })
      if (error) throw error
      // Convert to CSV
      const csv = ["Time (ms),Date"].concat(
        data.map((row: any) => `${row.time_ms},${row.solve_date}`)
      ).join("\n")
      // Download
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

  // Export fastest time as gamified image
  const handleExportFastest = async () => {
    setExportFastestLoading(true)
    try {
      // Fetch all solves for this user
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
      // Format time
      const formatTime = (ms: number) => {
        const min = Math.floor(ms / 60000)
        const sec = Math.floor((ms % 60000) / 1000)
        const cs = Math.floor((ms % 1000) / 10)
        return min > 0
          ? `${min}:${sec.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`
          : `${sec}.${cs.toString().padStart(2, "0")}`
      }
      // Placeholder for ranking (replace with real API call)
      const rankingNumber = 1; // TODO: Fetch real ranking from global solves API
      function ordinal(n: number) {
        const s = ["th", "st", "nd", "rd"], v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      }
      const ranking = ordinal(rankingNumber);
      // Create canvas styled like Figma
      const canvas = document.createElement("canvas")
      canvas.width = 1200
      canvas.height = 675
      const ctx = canvas.getContext("2d")!
      // Draw rounded rectangle background and border
      function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      }
      ctx.clearRect(0, 0, 1200, 675);
      // Background with border radius
      roundRect(ctx, 0, 0, 1200, 675, 20);
      ctx.fillStyle = "#171819";
      ctx.fill();
      // Border
      ctx.save();
      ctx.strokeStyle = "#c06969";
      ctx.lineWidth = 10;
      ctx.setLineDash([20, 20]);
      roundRect(ctx, 5, 5, 1190, 665, 20);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      // Ranking (top, gradient)
      ctx.save();
      ctx.font = "bold 60px Nunito, sans-serif";
      ctx.textAlign = "center";
      let grad = ctx.createLinearGradient(400, 0, 800, 0);
      grad.addColorStop(0, "#38bdf8"); // blue-400
      grad.addColorStop(1, "#06b6d4"); // cyan-400
      ctx.fillStyle = grad;
      ctx.fillText(ranking, 600, 120);
      ctx.restore();
      // Name
      ctx.font = "bold 50px Nunito, sans-serif";
      ctx.fillStyle = "#a8819f";
      ctx.textAlign = "center";
      ctx.fillText(user.user_metadata?.full_name || user.email, 600, 200);
      // Subtitle
      ctx.font = "50px Nunito, sans-serif";
      ctx.fillStyle = "#a8819f";
      ctx.fillText("solved the rubik's cube in", 600, 270);
      // Time (main, gradient)
      ctx.save();
      ctx.font = "bold 120px Nunito, monospace, sans-serif";
      grad = ctx.createLinearGradient(400, 0, 800, 0);
      grad.addColorStop(0, "#38bdf8");
      grad.addColorStop(1, "#06b6d4");
      ctx.fillStyle = grad;
      ctx.fillText(formatTime(best), 600, 400);
      ctx.restore();
      // Date
      ctx.font = "bold 40px Nunito, sans-serif";
      ctx.fillStyle = "#a8819f";
      ctx.textAlign = "left";
      ctx.fillText(bestDate.toLocaleDateString(), 200, 500);
      // Time label
      ctx.textAlign = "right";
      ctx.fillText("Personal Best", 1000, 500);
      // Badge
      ctx.font = "bold 36px Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fbbf24";
      ctx.fillText("🏆 Rubik's Timer Champion!", 600, 600);
      // Download
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
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-semibold text-foreground/90">Settings</h1>
      </div>

      <div className="grid gap-6">
        {/* User Profile */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <div className="text-lg">{user.user_metadata?.full_name || "Not set"}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <div className="text-lg">{user.email}</div>
            </div>
            <Button variant="outline" size="sm" className="bg-background/50" onClick={() => { setEditName(user.user_metadata?.full_name || ""); setEditOpen(true); }}>
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how the app looks and feels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Theme</Label>
                <div className="text-sm text-muted-foreground">Choose your preferred theme</div>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Audio Settings */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              Audio Settings
            </CardTitle>
            <CardDescription>Configure sound effects and audio feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound-enabled" className="text-sm font-medium">
                  Sound Effects
                </Label>
                <div className="text-sm text-muted-foreground">Play sounds for timer events and achievements</div>
              </div>
              <Switch id="sound-enabled" checked={soundEnabled} onCheckedChange={onToggleSound} />
            </div>

            {soundEnabled && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Volume</Label>
                  <span className="text-sm text-muted-foreground">{Math.round(volume * 100)}%</span>
                </div>
                <Slider
                  value={[volume]}
                  onValueChange={(value) => onVolumeChange(value[0])}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  Adjust the volume of timer sounds and achievement notifications
                </div>
              </div>
            )}

            {soundEnabled && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sound Events</Label>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>• Ready signal</div>
                  <div>• Timer start</div>
                  <div>• Timer stop</div>
                  <div>• Achievement fanfare</div>
                  <div>• Success confirmation</div>
                  <div>• Error alerts</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timer Settings */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Timer Settings</CardTitle>
            <CardDescription>Configure timer behavior and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-save" className="text-sm font-medium">
                  Auto-save Times
                </Label>
                <div className="text-sm text-muted-foreground">Automatically save solve times</div>
              </div>
              <Switch id="auto-save" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-milliseconds" className="text-sm font-medium">
                  Show Milliseconds
                </Label>
                <div className="text-sm text-muted-foreground">Display precise timing</div>
              </div>
              <Switch id="show-milliseconds" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="achievement-notifications" className="text-sm font-medium">
                  Achievement Notifications
                </Label>
                <div className="text-sm text-muted-foreground">Get notified of personal bests</div>
              </div>
              <Switch id="achievement-notifications" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="daily-reminders" className="text-sm font-medium">
                  Daily Practice Reminders
                </Label>
                <div className="text-sm text-muted-foreground">Remind me to practice daily</div>
              </div>
              <Switch id="daily-reminders" />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Export or delete your solve data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2 bg-background/50" onClick={handleExportData} disabled={exportLoading}>
                <Download className="h-4 w-4" />
                {exportLoading ? "Exporting..." : "Export Data"}
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-background/50" onClick={handleExportFastest} disabled={exportFastestLoading}>
                <Trophy className="h-4 w-4" />
                {exportFastestLoading ? "Exporting..." : "Export Fastest Time"}
              </Button>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete All Data
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
          <div className="space-y-4">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} disabled={editLoading} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleEditProfile} disabled={editLoading || !editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
