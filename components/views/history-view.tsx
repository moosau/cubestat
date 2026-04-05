"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { Inbox, MoreVertical, Edit, Trash2, Loader2 } from "lucide-react"
import EditTimeEntry from "@/components/edit-time-entry"

interface SolveRecord {
  id: string
  time_ms: number
  solve_date: string
  user_id: string
  formattedTime: string
}

interface HistoryViewProps {
  solveRecords: SolveRecord[]
  onDeleteRecord: (recordId: string) => Promise<void>
  onUpdateRecords: () => void
  deleting: string | null
}

export function HistoryView({ solveRecords, onDeleteRecord, onUpdateRecords, deleting }: HistoryViewProps) {
  const [selectedRecord, setSelectedRecord] = useState<SolveRecord | null>(null)

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Inbox className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-semibold text-foreground/90">Solve History</h1>
      </div>

      {solveRecords.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-base font-semibold mb-1">No Solves Yet</h3>
            <p className="text-sm text-muted-foreground">Your solve history will appear here once you start timing.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {solveRecords.map((record, index) => (
            <Card
              key={record.id}
              className="cursor-pointer hover:bg-muted/40 transition-colors group"
              onClick={() => setSelectedRecord(record)}
            >
              <CardContent className="px-5 py-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-xs tabular-nums text-muted-foreground w-6 text-right">{solveRecords.length - index}</span>
                    <div>
                      <div className="font-mono text-base font-semibold tabular-nums">{record.formattedTime}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(record.solve_date).toLocaleDateString()} at{" "}
                        {new Date(record.solve_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <EditTimeEntry
                        record={record}
                        onTimeUpdated={onUpdateRecords}
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
                              Are you sure you want to delete this solve time of <strong>{record.formattedTime}</strong>
                              ? This action cannot be undone.
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
