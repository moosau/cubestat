"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Settings, Bell, Download, Trash2, User, Volume2, VolumeX } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface SettingsViewProps {
  user: any
  soundEnabled: boolean
  volume: number
  onToggleSound: () => void
  onVolumeChange: (volume: number) => void
}

export function SettingsView({ user, soundEnabled, volume, onToggleSound, onVolumeChange }: SettingsViewProps) {
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
            <Button variant="outline" size="sm" className="bg-background/50">
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
              <Button variant="outline" className="flex items-center gap-2 bg-background/50">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
