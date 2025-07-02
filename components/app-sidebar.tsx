"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
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
import { Clock, Trophy, Loader2, Trash2, MoreVertical, Edit, LogOut, Calendar } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import ManualTimeEntry from "@/components/manual-time-entry"
import QuickTimeButtons from "@/components/quick-time-buttons"
import BulkImport from "@/components/bulk-import"
import EditTimeEntry from "@/components/edit-time-entry"
import { format, isToday, isYesterday } from "date-fns"

interface SolveRecord {
  id: string
  time_ms: number
  solve_date: string
  user_id: string
  formattedTime: string
}

interface AppSidebarProps {
  user: SupabaseUser
  solveRecords: SolveRecord[]
  loading: boolean
  deleting: string | null
  onTimeAdded: () => void
  onDeleteRecord: (recordId: string) => void
  onRecordSelect: (record: SolveRecord) => void
  formatTime: (timeMs: number) => string
}

export function AppSidebar({
  user,
  solveRecords,
  loading,
  deleting,
  onTimeAdded,
  onDeleteRecord,
  onRecordSelect,
  formatTime,
}: AppSidebarProps) {
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    setSigningOut(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
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

  const getTimeCategory = (timeMs: number) => {
    const seconds = timeMs / 1000
    if (seconds < 10) return { label: "Sub-10", color: "bg-red-500" }
    if (seconds < 15) return { label: "Sub-15", color: "bg-orange-500" }
    if (seconds < 20) return { label: "Sub-20", color: "bg-yellow-500" }
    if (seconds < 30) return { label: "Sub-30", color: "bg-green-500" }
    if (seconds < 60) return { label: "Sub-60", color: "bg-blue-500" }
    return { label: "1min+", color: "bg-purple-500" }
  }

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "MMM d")
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 via-green-500 to-blue-500 text-sidebar-primary-foreground">
                <Clock className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Dashboard</span>
                <span className="truncate text-xs">Solve History</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Add Times Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Add Times</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 space-y-2">
              <ManualTimeEntry user={user} onTimeAdded={onTimeAdded} />
              <QuickTimeButtons user={user} onTimeAdded={onTimeAdded} />
              <BulkImport user={user} onTimesAdded={onTimeAdded} />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Statistics Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Statistics</SidebarGroupLabel>
          <SidebarGroupContent>
            <Card className="mx-2">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Trophy className="h-4 w-4" />
                  Your Stats
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Best Time</span>
                    <span className="font-mono font-bold text-lg">
                      {getBestTime() ? formatTime(getBestTime()!) : "--"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average</span>
                    <span className="font-mono font-bold text-lg">
                      {getAverageTime() ? formatTime(getAverageTime()!) : "--"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Solves</span>
                    <span className="font-mono font-bold text-lg">{solveRecords.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Recent Solves Section */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Recent Solves</SidebarGroupLabel>
          <SidebarGroupContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="px-2 space-y-2">
                {solveRecords.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">No solves yet. Start timing!</div>
                ) : (
                  solveRecords.slice(0, 15).map((record, index) => {
                    const category = getTimeCategory(record.time_ms)
                    const isPersonalBest = record.time_ms === getBestTime()

                    return (
                      <Card
                        key={record.id}
                        className="group/item cursor-pointer hover:bg-muted/50 transition-colors border-l-4"
                        style={{ borderLeftColor: isPersonalBest ? "#ffd700" : "transparent" }}
                        onClick={() => onRecordSelect(record)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            {/* Header with solve number and actions */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  #{solveRecords.length - index}
                                </span>
                                {isPersonalBest && (
                                  <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                    PB
                                  </Badge>
                                )}
                                <Badge variant="secondary" className={`text-xs text-white ${category.color}`}>
                                  {category.label}
                                </Badge>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover/item:opacity-100 transition-opacity h-6 w-6 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <EditTimeEntry
                                    record={record}
                                    onTimeUpdated={onTimeAdded}
                                    trigger={
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                    }
                                  />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600"
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Solve Record</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this solve time of{" "}
                                          <strong>{record.formattedTime}</strong>? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => onDeleteRecord(record.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                          disabled={deleting === record.id}
                                        >
                                          {deleting === record.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Main time display */}
                            <div className="text-center">
                              <div className="text-2xl font-mono font-bold text-foreground">{record.formattedTime}</div>
                            </div>

                            {/* Date and time info */}
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{getDateLabel(record.solve_date)}</span>
                              <span>•</span>
                              <span>{format(new Date(record.solve_date), "h:mm a")}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{displayName}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={handleSignOut} disabled={signingOut}>
                  {signingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
