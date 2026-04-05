"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Target, Calendar, Award } from "lucide-react"

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

  const getBestTime = () => {
    if (solveRecords.length === 0) return null
    return Math.min(...solveRecords.map((record) => record.time_ms))
  }

  const getWorstTime = () => {
    if (solveRecords.length === 0) return null
    return Math.max(...solveRecords.map((record) => record.time_ms))
  }

  const getAverageTime = () => {
    if (solveRecords.length === 0) return null
    const total = solveRecords.reduce((sum, record) => sum + record.time_ms, 0)
    return total / solveRecords.length
  }

  const getAverageOf5 = () => {
    if (solveRecords.length < 5) return null
    const last5 = solveRecords.slice(0, 5)
    const times = last5.map((r) => r.time_ms).sort((a, b) => a - b)
    // Remove best and worst, average the middle 3
    const middle3 = times.slice(1, 4)
    return middle3.reduce((sum, time) => sum + time, 0) / 3
  }

  const getAverageOf12 = () => {
    if (solveRecords.length < 12) return null
    const last12 = solveRecords.slice(0, 12)
    const times = last12.map((r) => r.time_ms).sort((a, b) => a - b)
    // Remove best and worst, average the middle 10
    const middle10 = times.slice(1, 11)
    return middle10.reduce((sum, time) => sum + time, 0) / 10
  }

  const getSub20Count = () => {
    return solveRecords.filter((record) => record.time_ms < 20000).length
  }

  const getSub15Count = () => {
    return solveRecords.filter((record) => record.time_ms < 15000).length
  }

  const getSub10Count = () => {
    return solveRecords.filter((record) => record.time_ms < 10000).length
  }

  const getTodaysSolves = () => {
    const today = new Date().toDateString()
    return solveRecords.filter((record) => new Date(record.solve_date).toDateString() === today).length
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {getAverageTime() ? formatTime(getAverageTime()!) : "--"}
                </div>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Today's Solves</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTodaysSolves()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Averages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Average of 5</CardTitle>
                <CardDescription>Last 5 solves (best and worst removed)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  {getAverageOf5() ? formatTime(getAverageOf5()!) : "--"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Average of 12</CardTitle>
                <CardDescription>Last 12 solves (best and worst removed)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  {getAverageOf12() ? formatTime(getAverageOf12()!) : "--"}
                </div>
              </CardContent>
            </Card>

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
          </div>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Milestones</CardTitle>
              <CardDescription>How many times you've hit each threshold</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-border">
                <div className="text-center py-4 md:py-0">
                  <div className="text-4xl font-bold font-mono">{getSub20Count()}</div>
                  <div className="text-sm text-muted-foreground mt-1">Sub-20 Solves</div>
                </div>
                <div className="text-center py-4 md:py-0">
                  <div className="text-4xl font-bold font-mono">{getSub15Count()}</div>
                  <div className="text-sm text-muted-foreground mt-1">Sub-15 Solves</div>
                </div>
                <div className="text-center py-4 md:py-0">
                  <div className="text-4xl font-bold font-mono">{getSub10Count()}</div>
                  <div className="text-sm text-muted-foreground mt-1">Sub-10 Solves</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
