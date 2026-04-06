"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, TrendingDown, Minus, Target, Calendar, Award, ChevronLeft, ChevronRight } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

interface SolveRecord {
  id: string
  time_ms: number
  solve_date: string
  user_id: string
  formattedTime: string
}

interface StatisticsViewProps {
  solveRecords: SolveRecord[]
}

type Period = "day" | "week" | "month" | "year" | "all"

function getWindowBounds(period: Period, offset: number): { start: Date; end: Date } | null {
  if (period === "all") return null
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  if (period === "day") {
    start.setDate(now.getDate() - offset)
    start.setHours(0, 0, 0, 0)
    end.setDate(now.getDate() - offset)
    end.setHours(23, 59, 59, 999)
  } else if (period === "week") {
    const dow = now.getDay()
    const startOfThisWeek = new Date(now)
    startOfThisWeek.setDate(now.getDate() - dow)
    startOfThisWeek.setHours(0, 0, 0, 0)
    start.setTime(startOfThisWeek.getTime() - offset * 7 * 86400000)
    end.setTime(startOfThisWeek.getTime() - offset * 7 * 86400000 + 7 * 86400000 - 1)
  } else if (period === "month") {
    start.setMonth(now.getMonth() - offset, 1)
    start.setHours(0, 0, 0, 0)
    end.setMonth(now.getMonth() - offset + 1, 0)
    end.setHours(23, 59, 59, 999)
  } else if (period === "year") {
    start.setFullYear(now.getFullYear() - offset, 0, 1)
    start.setHours(0, 0, 0, 0)
    end.setFullYear(now.getFullYear() - offset, 11, 31)
    end.setHours(23, 59, 59, 999)
  }

  return { start, end }
}

function formatWindowLabel(period: Period, offset: number): string {
  if (period === "all") return "All Time"
  const bounds = getWindowBounds(period, offset)!
  const { start, end } = bounds
  if (period === "day") return start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
  if (period === "week") return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
  if (period === "month") return start.toLocaleDateString(undefined, { month: "long", year: "numeric" })
  if (period === "year") return `${start.getFullYear()}`
  return ""
}

function SolveChart({ solveRecords, formatTime }: { solveRecords: SolveRecord[]; formatTime: (ms: number) => string }) {
  const [period, setPeriod] = useState<Period>("week")
  const [offset, setOffset] = useState(0)

  const allChronological = [...solveRecords].reverse()

  const bounds = getWindowBounds(period, offset)
  const filtered = bounds
    ? allChronological.filter((r) => {
        const d = new Date(r.solve_date)
        return d >= bounds.start && d <= bounds.end
      })
    : allChronological.slice(-100)

  const data = filtered.map((r) => ({
    label: new Date(r.solve_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    time: new Date(r.solve_date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    ms: r.time_ms,
  }))

  const canGoNext = offset > 0
  const canGoPrev = (() => {
    if (period === "all") return false
    const b = getWindowBounds(period, offset + 1)!
    return allChronological.some((r) => new Date(r.solve_date) < b.end)
  })()

  const minMs = data.length ? Math.min(...data.map((d) => d.ms)) : 0
  const maxMs = data.length ? Math.max(...data.map((d) => d.ms)) : 1000
  const pad = (maxMs - minMs) * 0.15 || 1000

  const periods: { value: Period; label: string }[] = [
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "year", label: "Year" },
    { value: "all", label: "All" },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">Solve Times</CardTitle>
          <div className="flex items-center gap-1 text-xs">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => { setPeriod(p.value); setOffset(0) }}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  period === p.value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {period !== "all" && (
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => setOffset((o) => o + 1)}
              disabled={!canGoPrev}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-muted-foreground flex-1">{formatWindowLabel(period, offset)}</span>
            <button
              onClick={() => setOffset((o) => o - 1)}
              disabled={!canGoNext}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            No solves in this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[Math.max(0, minMs - pad), maxMs + pad]}
                tickFormatter={(v) => formatTime(v)}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
                labelFormatter={(_label, payload) => {
                  const item = payload?.[0]?.payload
                  return item ? `${item.label} ${item.time}` : _label
                }}
                formatter={(value: number) => [formatTime(value), "Time"]}
              />
              <Line
                type="monotone"
                dataKey="ms"
                stroke="hsl(var(--foreground))"
                strokeWidth={1.5}
                dot={data.length <= 30 ? { r: 3, fill: "hsl(var(--foreground))", strokeWidth: 0 } : false}
                activeDot={{ r: 4, fill: "hsl(var(--foreground))", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// Compute best average of N (trim best+worst, average middle) across ALL windows
function bestAverageOf(records: SolveRecord[], n: number): number | null {
  if (records.length < n) return null
  // records are newest-first; iterate all windows chronologically
  const chron = [...records].reverse()
  let best: number | null = null
  for (let i = 0; i <= chron.length - n; i++) {
    const window = chron.slice(i, i + n).map((r) => r.time_ms).sort((a, b) => a - b)
    const trimmed = window.slice(1, n - 1) // remove best and worst
    const avg = trimmed.reduce((s, v) => s + v, 0) / trimmed.length
    if (best === null || avg < best) best = avg
  }
  return best
}

// Trend: compare last N solves avg vs previous N solves avg
function getTrend(records: SolveRecord[], n = 5): "up" | "down" | "flat" | null {
  if (records.length < n * 2) return null
  const recent = records.slice(0, n).reduce((s, r) => s + r.time_ms, 0) / n
  const previous = records.slice(n, n * 2).reduce((s, r) => s + r.time_ms, 0) / n
  const diff = (recent - previous) / previous
  if (Math.abs(diff) < 0.01) return "flat"
  return recent < previous ? "down" : "up" // "down" = faster = good
}

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" | null }) {
  if (!trend) return null
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-foreground" />
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
}

function TrendLabel({ trend }: { trend: "up" | "down" | "flat" | null }) {
  if (!trend) return null
  if (trend === "down") return <span className="text-xs text-foreground">Improving</span>
  if (trend === "up") return <span className="text-xs text-muted-foreground">Slower</span>
  return <span className="text-xs text-muted-foreground">Stable</span>
}

export function StatisticsView({ solveRecords }: StatisticsViewProps) {
  const formatTime = (timeInMs: number): string => {
    const totalSeconds = timeInMs / 1000
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    const milliseconds = Math.floor((timeInMs % 1000) / 10)
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
    }
    return `${seconds}.${milliseconds.toString().padStart(2, "0")}`
  }

  const getBestTime = () => solveRecords.length ? Math.min(...solveRecords.map((r) => r.time_ms)) : null
  const getWorstTime = () => solveRecords.length ? Math.max(...solveRecords.map((r) => r.time_ms)) : null
  const getAverageTime = () => {
    if (!solveRecords.length) return null
    return solveRecords.reduce((s, r) => s + r.time_ms, 0) / solveRecords.length
  }

  // Current (most recent) averages
  const getCurrentAoN = (n: number) => {
    if (solveRecords.length < n) return null
    const times = solveRecords.slice(0, n).map((r) => r.time_ms).sort((a, b) => a - b)
    return times.slice(1, n - 1).reduce((s, v) => s + v, 0) / (n - 2)
  }

  const getTodaysSolves = () => {
    const today = new Date().toDateString()
    return solveRecords.filter((r) => new Date(r.solve_date).toDateString() === today).length
  }

  const getSub20Count = () => solveRecords.filter((r) => r.time_ms < 20000).length
  const getSub15Count = () => solveRecords.filter((r) => r.time_ms < 15000).length
  const getSub10Count = () => solveRecords.filter((r) => r.time_ms < 10000).length

  const trend = getTrend(solveRecords)

  const bestAo5 = bestAverageOf(solveRecords, 5)
  const bestAo12 = bestAverageOf(solveRecords, 12)
  const bestAo50 = bestAverageOf(solveRecords, 50)
  const bestAo100 = bestAverageOf(solveRecords, 100)

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-semibold text-foreground/90">Statistics</h1>
      </div>

      {solveRecords.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-base font-semibold mb-1">No Statistics Yet</h3>
            <p className="text-sm text-muted-foreground">Start solving to see your statistics.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Main Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Best Time</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{getBestTime() ? formatTime(getBestTime()!) : "--"}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average</CardTitle>
                <div className="flex items-center gap-1">
                  <TrendIcon trend={trend} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {getAverageTime() ? formatTime(getAverageTime()!) : "--"}
                </div>
                <div className="mt-1"><TrendLabel trend={trend} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Solves</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{solveRecords.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTodaysSolves()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Current averages */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Current Ao5", value: getCurrentAoN(5) },
              { label: "Current Ao12", value: getCurrentAoN(12) },
              { label: "Current Ao50", value: getCurrentAoN(50) },
              { label: "Current Ao100", value: getCurrentAoN(100) },
            ].map(({ label, value }) => (
              <Card key={label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold font-mono">{value ? formatTime(value) : "--"}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Best averages of record */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Best Averages</CardTitle>
              <CardDescription>Record average across all sessions (best+worst trimmed)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y-0">
                {[
                  { label: "Best Ao5", value: bestAo5 },
                  { label: "Best Ao12", value: bestAo12 },
                  { label: "Best Ao50", value: bestAo50 },
                  { label: "Best Ao100", value: bestAo100 },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl font-bold font-mono">{value ? formatTime(value) : "--"}</div>
                    <div className="text-xs text-muted-foreground mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Worst + milestones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Worst Time</CardTitle>
                <CardDescription>Your slowest solve</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  {getWorstTime() ? formatTime(getWorstTime()!) : "--"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Milestones</CardTitle>
                <CardDescription>Solves under each threshold</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold font-mono">{getSub20Count()}</div>
                    <div className="text-xs text-muted-foreground mt-1">Sub-20</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono">{getSub15Count()}</div>
                    <div className="text-xs text-muted-foreground mt-1">Sub-15</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono">{getSub10Count()}</div>
                    <div className="text-xs text-muted-foreground mt-1">Sub-10</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <SolveChart solveRecords={solveRecords} formatTime={formatTime} />
        </div>
      )}
    </div>
  )
}
