"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { 
  ArrowLeft, History, Loader2, Search, Trash2, Play,
  Clock, CheckCircle, Filter, X, Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface WatchHistoryItem {
  id: string
  videoId: string
  videoTitle: string
  thumbnail: string
  channelName: string
  progress: number
  duration: number
  completed: boolean
  lastWatched: string
}

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const [history, setHistory] = useState<WatchHistoryItem[]>([])
  const [filteredHistory, setFilteredHistory] = useState<WatchHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("all")
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "progress">("recent")
  const [deleteItem, setDeleteItem] = useState<WatchHistoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [clearAllDialog, setClearAllDialog] = useState(false)

  useEffect(() => {
    if (session) {
      fetchHistory()
    }
  }, [session])

  useEffect(() => {
    filterAndSortHistory()
  }, [searchQuery, filter, sortBy, history])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/watch-history?limit=100&includeCompleted=true")
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (error) {
      console.error("Error fetching history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortHistory = () => {
    let filtered = [...history]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        item =>
          item.videoTitle?.toLowerCase().includes(query) ||
          item.channelName?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (filter === "in-progress") {
      filtered = filtered.filter(item => !item.completed && item.progress > 0)
    } else if (filter === "completed") {
      filtered = filtered.filter(item => item.completed)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime()
      } else if (sortBy === "oldest") {
        return new Date(a.lastWatched).getTime() - new Date(b.lastWatched).getTime()
      } else {
        // Sort by progress percentage (highest first)
        const progressA = a.duration > 0 ? a.progress / a.duration : 0
        const progressB = b.duration > 0 ? b.progress / b.duration : 0
        return progressB - progressA
      }
    })

    setFilteredHistory(filtered)
  }

  const handleDelete = async (item: WatchHistoryItem) => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/watch-history?videoId=${item.videoId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setHistory(prev => prev.filter(h => h.videoId !== item.videoId))
      }
    } catch (error) {
      console.error("Error deleting item:", error)
    } finally {
      setIsDeleting(false)
      setDeleteItem(null)
    }
  }

  const handleClearAll = async () => {
    setIsDeleting(true)
    try {
      // Delete all items one by one
      for (const item of history) {
        await fetch(`/api/watch-history?videoId=${item.videoId}`, {
          method: "DELETE",
        })
      }
      setHistory([])
    } catch (error) {
      console.error("Error clearing history:", error)
    } finally {
      setIsDeleting(false)
      setClearAllDialog(false)
    }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00"
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getProgressPercentage = (item: WatchHistoryItem) => {
    if (!item.duration || item.duration === 0) return 0
    return Math.min(100, Math.round((item.progress / item.duration) * 100))
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-600" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <History className="w-12 h-12 text-neutral-600" />
        <h1 className="text-xl text-neutral-400">Sign in to view your watch history</h1>
        <Link href="/">
          <Button variant="outline" className="border-neutral-800 hover:bg-neutral-900">
            Go Home
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <h1 className="text-lg font-semibold text-white">Watch History</h1>
            </div>
          </div>

          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setClearAllDialog(true)}
              className="text-neutral-500 hover:text-red-400 hover:bg-red-950/50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-neutral-950 border-neutral-800 text-neutral-200 placeholder:text-neutral-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-[140px] bg-neutral-950 border-neutral-800 text-neutral-300">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-950 border-neutral-800">
                <SelectItem value="all">All Videos</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[140px] bg-neutral-950 border-neutral-800 text-neutral-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-950 border-neutral-800">
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="progress">By Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{history.length}</p>
            <p className="text-sm text-neutral-500">Total Videos</p>
          </div>
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-400">
              {history.filter(h => h.completed).length}
            </p>
            <p className="text-sm text-neutral-500">Completed</p>
          </div>
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4">
            <p className="text-2xl font-bold text-yellow-400">
              {history.filter(h => !h.completed && h.progress > 0).length}
            </p>
            <p className="text-sm text-neutral-500">In Progress</p>
          </div>
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-600" />
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <History className="w-12 h-12 text-neutral-700" />
            <p className="text-neutral-500">
              {searchQuery || filter !== "all"
                ? "No videos match your filters"
                : "No watch history yet"}
            </p>
            {(searchQuery || filter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setFilter("all")
                }}
                className="border-neutral-800 hover:bg-neutral-900"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="group bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden hover:border-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-4 p-3">
                  {/* Thumbnail with progress bar */}
                  <Link href={`/watch/${item.videoId}?t=${item.progress}`} className="relative flex-shrink-0">
                    <div className="relative w-40 h-24 rounded-lg overflow-hidden bg-neutral-800">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail}
                          alt={item.videoTitle || "Video"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-neutral-600" />
                        </div>
                      )}
                      {/* Duration badge */}
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white">
                        {formatDuration(item.duration)}
                      </div>
                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
                        <div
                          className={`h-full transition-all ${
                            item.completed ? "bg-green-500" : "bg-red-500"
                          }`}
                          style={{ width: `${getProgressPercentage(item)}%` }}
                        />
                      </div>
                      {/* Play overlay on hover */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-10 h-10 text-white" fill="white" />
                      </div>
                    </div>
                  </Link>

                  {/* Video info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/watch/${item.videoId}?t=${item.progress}`}>
                      <h3 className="text-sm font-medium text-neutral-200 line-clamp-2 group-hover:text-white transition-colors">
                        {item.videoTitle || "Untitled Video"}
                      </h3>
                    </Link>
                    <p className="text-xs text-neutral-500 mt-1">{item.channelName || "Unknown Channel"}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.lastWatched)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(item.progress)} / {formatDuration(item.duration)}
                      </span>
                      {item.completed && (
                        <span className="flex items-center gap-1 text-green-500">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteItem(item)}
                      className="text-neutral-500 hover:text-red-400 hover:bg-red-950/50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent className="bg-neutral-950 border-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-200">Remove from history?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500">
              This will remove &quot;{deleteItem?.videoTitle}&quot; from your watch history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItem && handleDelete(deleteItem)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all confirmation dialog */}
      <AlertDialog open={clearAllDialog} onOpenChange={setClearAllDialog}>
        <AlertDialogContent className="bg-neutral-950 border-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-200">Clear all watch history?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500">
              This will permanently delete all {history.length} videos from your watch history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Clear All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
