"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"

interface SolveRecord {
  id: string
  time_ms: number
  solve_date: string
  user_id: string
  formattedTime: string
}

interface SearchViewProps {
  solveRecords: SolveRecord[]
}

export function SearchView({ solveRecords }: SearchViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [timeFilter, setTimeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [filteredRecords, setFilteredRecords] = useState<SolveRecord[]>(solveRecords)

  const handleSearch = () => {
    let filtered = [...solveRecords]

    // Time-based filtering
    if (timeFilter !== "all") {
      switch (timeFilter) {
        case "sub10":
          filtered = filtered.filter((record) => record.time_ms < 10000)
          break
        case "sub15":
          filtered = filtered.filter((record) => record.time_ms < 15000)
          break
        case "sub20":
          filtered = filtered.filter((record) => record.time_ms < 20000)
          break
        case "over30":
          filtered = filtered.filter((record) => record.time_ms > 30000)
          break
      }
    }

    // Date-based filtering
    if (dateFilter !== "all") {
      const now = new Date()
      switch (dateFilter) {
        case "today":
          filtered = filtered.filter((record) => new Date(record.solve_date).toDateString() === now.toDateString())
          break
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter((record) => new Date(record.solve_date) >= weekAgo)
          break
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter((record) => new Date(record.solve_date) >= monthAgo)
          break
      }
    }

    // Text search in time
    if (searchQuery) {
      filtered = filtered.filter(
        (record) => record.formattedTime.includes(searchQuery) || record.time_ms.toString().includes(searchQuery),
      )
    }

    setFilteredRecords(filtered)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setTimeFilter("all")
    setDateFilter("all")
    setFilteredRecords(solveRecords)
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Search className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-semibold text-foreground/90">Search Solves</h1>
      </div>

      {/* Search Filters */}
      <Card className="bg-card/50">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-input">Search Time</Label>
              <Input
                id="search-input"
                placeholder="e.g., 12.34 or 1:23"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Time Range</Label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="All times" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All times</SelectItem>
                  <SelectItem value="sub10">Sub-10 seconds</SelectItem>
                  <SelectItem value="sub15">Sub-15 seconds</SelectItem>
                  <SelectItem value="sub20">Sub-20 seconds</SelectItem>
                  <SelectItem value="over30">Over 30 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button variant="outline" onClick={resetFilters} className="flex items-center gap-2 bg-background/50">
              <Filter className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      <Card className="bg-card/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Search Results ({filteredRecords.length} found)</h3>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredRecords.map((record, index) => (
                <div key={record.id} className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div>
                    <div className="font-mono text-lg font-bold">{record.formattedTime}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(record.solve_date).toLocaleDateString()} at{" "}
                      {new Date(record.solve_date).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    #{solveRecords.length - solveRecords.indexOf(record)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
