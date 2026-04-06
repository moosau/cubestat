"use client"

import { useState, useMemo } from "react"
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
import { Inbox, MoreVertical, Edit, Trash2, Loader2, CheckSquare, Square, SlidersHorizontal } from "lucide-react"
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

type SortKey = "date-desc" | "date-asc" | "time-asc" | "time-desc"

export function HistoryView({ solveRecords, onDeleteRecord, onUpdateRecords, deleting }: HistoryViewProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("date-desc")
  const [filterMin, setFilterMin] = useState("")
  const [filterMax, setFilterMax] = useState("")

  const parseFilterSeconds = (val: string): number | null => {
    const n = parseFloat(val)
    return isNaN(n) ? null : n * 1000
  }

  const sorted = useMemo(() => {
    const copy = [...solveRecords]
    if (sortKey === "date-desc") copy.sort((a, b) => new Date(b.solve_date).getTime() - new Date(a.solve_date).getTime())
    else if (sortKey === "date-asc") copy.sort((a, b) => new Date(a.solve_date).getTime() - new Date(b.solve_date).getTime())
    else if (sortKey === "time-asc") copy.sort((a, b) => a.time_ms - b.time_ms)
    else if (sortKey === "time-desc") copy.sort((a, b) => b.time_ms - a.time_ms)
    return copy
  }, [solveRecords, sortKey])

  const filtered = useMemo(() => {
    const minMs = parseFilterSeconds(filterMin)
    const maxMs = parseFilterSeconds(filterMax)
    return sorted.filter((r) => {
      if (minMs !== null && r.time_ms < minMs) return false
      if (maxMs !== null && r.time_ms > maxMs) return false
      return true
    })
  }, [sorted, filterMin, filterMax])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((r) => r.id)))
    }
  }

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    for (const id of Array.from(selected)) {
      await onDeleteRecord(id)
    }
    setSelected(new Set())
    setBulkDeleting(false)
  }

  const sortLabels: Record<SortKey, string> = {
    "date-desc": "Date (newest)",
    "date-asc": "Date (oldest)",
    "time-asc": "Time (fastest)",
    "time-desc": "Time (slowest)",
  }

  const isSelecting = selected.size > 0

  return (
    <div className="space-y-4 p-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Inbox className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-semibold text-foreground/90">History</h1>
        </div>
        <div className="flex items-center gap-2">
          {isSelecting && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={bulkDeleting}>
                  {bulkDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                  Delete {selected.size}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selected.size} solve{selected.size !== 1 ? "s" : ""}?</AlertDialogTitle>
                  <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {sortLabels[sortKey]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                <DropdownMenuItem key={key} onClick={() => setSortKey(key)} className={sortKey === key ? "font-medium" : ""}>
                  {sortLabels[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter by time range */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground text-xs">Filter (seconds):</span>
        <input
          type="number"
          placeholder="Min"
          value={filterMin}
          onChange={(e) => setFilterMin(e.target.value)}
          className="w-20 px-2 py-1 text-xs rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <span className="text-muted-foreground text-xs">–</span>
        <input
          type="number"
          placeholder="Max"
          value={filterMax}
          onChange={(e) => setFilterMax(e.target.value)}
          className="w-20 px-2 py-1 text-xs rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {(filterMin || filterMax) && (
          <button
            onClick={() => { setFilterMin(""); setFilterMax("") }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} solve{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {solveRecords.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-base font-semibold mb-1">No Solves Yet</h3>
            <p className="text-sm text-muted-foreground">Your solve history will appear here once you start timing.</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No solves match the current filter.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Select all row */}
          <div className="flex items-center gap-2 px-1">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {selected.size === filtered.length && filtered.length > 0
                ? <CheckSquare className="h-4 w-4" />
                : <Square className="h-4 w-4" />}
              {selected.size === filtered.length && filtered.length > 0 ? "Deselect all" : "Select all"}
            </button>
          </div>

          <div className="space-y-2">
            {filtered.map((record, index) => (
              <Card
                key={record.id}
                className={`transition-colors group ${selected.has(record.id) ? "bg-muted" : "hover:bg-muted/40"}`}
              >
                <CardContent className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(record.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      {selected.has(record.id)
                        ? <CheckSquare className="h-4 w-4" />
                        : <Square className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </button>

                    <span className="text-xs tabular-nums text-muted-foreground w-6 text-right shrink-0">
                      {solveRecords.length - solveRecords.findIndex((r) => r.id === record.id)}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-base font-semibold tabular-nums">{record.formattedTime}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(record.solve_date).toLocaleDateString()} at{" "}
                        {new Date(record.solve_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 shrink-0"
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
                              className="text-destructive focus:text-destructive"
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
                                Delete <strong>{record.formattedTime}</strong>? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteRecord(record.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
        </>
      )}
    </div>
  )
}
