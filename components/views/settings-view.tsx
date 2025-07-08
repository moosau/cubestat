"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Settings, Bell, Download, Trash2, User, Volume2, VolumeX } from "lucide-react"
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
            <Button onClick={handleEditProfile} loading={editLoading} disabled={editLoading || !editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
