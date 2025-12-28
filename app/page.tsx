"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, signIn, signOut } from "next-auth/react"
import { 
  Search, LogIn, LogOut, User, BookOpen, Play, Clock, 
  Shuffle, ListVideo, Calendar, CheckSquare, GraduationCap,
  Trash2, ChevronRight, Plus, X, Loader2, Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WatchHistoryItem {
  id: string
  videoId: string
  title: string
  thumbnailUrl: string
  channelTitle: string
  progress: number
  duration: number
  lastWatched: string
}

interface SearchResult {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  channelTitle: string
  type: "video" | "playlist" | "channel"
  videoCount?: number
  subscriberCount?: string
}

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  type: string
}

interface Task {
  id: string
  title: string
  due?: string
  status: string
}

interface Assignment {
  id: string
  title: string
  courseTitle: string
  dueDate?: string
  state: string
}

export default function Home() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"video" | "playlist" | "channel">("video")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Fetch user data when signed in
  useEffect(() => {
    if (session) {
      fetchUserData()
    }
  }, [session])

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchUserData = async () => {
    setIsLoadingData(true)
    try {
      const [historyRes, calendarRes, tasksRes, classroomRes] = await Promise.all([
        fetch("/api/watch-history"),
        fetch("/api/calendar/events"),
        fetch("/api/tasks"),
        fetch("/api/classroom/courses"),
      ])

      if (historyRes.ok) {
        const history = await historyRes.json()
        setWatchHistory(history)
      }
      if (calendarRes.ok) {
        const cal = await calendarRes.json()
        setCalendarEvents(cal.events || [])
      }
      if (tasksRes.ok) {
        const t = await tasksRes.json()
        setTasks(t.tasks || [])
      }
      if (classroomRes.ok) {
        const c = await classroomRes.json()
        const allAssignments: Assignment[] = []
        c.courses?.forEach((course: any) => {
          course.assignments?.forEach((a: any) => {
            allAssignments.push({
              ...a,
              courseTitle: course.name,
            })
          })
        })
        setAssignments(allAssignments.filter(a => a.state !== "TURNED_IN"))
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setShowResults(true)

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&type=${searchType}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.items || [])
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value)
    }, 300)
  }

  const router = useRouter()
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to full search page
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`)
    }
  }

  const handleLucky = () => {
    // Pick random video from featured educational channels
    const featured = [
      // MIT OpenCourseWare
      "HtSuA80QTyo", // MIT Algorithms
      "ZK3O402wf1c", // MIT Linear Algebra
      "7K1sB05pE0A", // MIT Calculus
      // 3Blue1Brown
      "fNk_zzaMoSs", // Essence of Linear Algebra
      "WUvTyaaNkzM", // Essence of Calculus
      "spUNpyF58BY", // Neural Networks
      // Veritasium
      "HeQX2HjkcNo", // This is Math's Fatal Flaw
      "OxGsU8oIWjY", // The Simplest Math Problem
      // Computerphile
      "kPRA0W1kECg", // Sorting Algorithms
      "ySN5Wnu88nE", // Dijkstra's Algorithm
      // CS50
      "IDDmrzzB14M", // CS50 2023 Lecture 0
      "cwtpLIWylAw", // CS50 Python
      // Fireship
      "Sxxw3qtb3_g", // 100 Seconds Series
      "q1fsBWLpYW4", // TypeScript Tutorial
      // Web Dev Simplified
      "PoRJizFvM7s", // Learn React
      // Network Chuck
      "qiQR5rTSshw", // Linux Tutorial
      // Traversy Media
      "fBNz5xF-Kx4", // Node.js Crash Course
      "w7ejDZ8SWv8", // React Crash Course
      // Khan Academy
      "WNuIhXo39_k", // Statistics
      // CrashCourse
      "tpIctyqH29Q", // Computer Science
    ]
    const random = featured[Math.floor(Math.random() * featured.length)]
    window.location.href = `/watch/${random}`
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return
    
    setIsCreatingTask(true)
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle }),
      })
      
      if (res.ok) {
        const newTask = await res.json()
        setTasks(prev => [newTask, ...prev])
        setNewTaskTitle("")
        setShowTaskDialog(false)
      }
    } catch (error) {
      console.error("Error creating task:", error)
    } finally {
      setIsCreatingTask(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" })
      if (res.ok) {
        await signOut({ callbackUrl: "/" })
      }
    } catch (error) {
      console.error("Error deleting account:", error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const formatProgress = (progress: number, duration: number) => {
    const percent = duration > 0 ? Math.round((progress / duration) * 100) : 0
    return percent
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-neutral-300" />
            </div>
            <span className="text-lg font-medium text-neutral-200 tracking-tight">DeepFocus</span>
          </Link>

          <nav className="flex items-center gap-3">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-neutral-900 animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-full hover:bg-neutral-900 transition-colors">
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                        <User className="w-4 h-4 text-neutral-500" />
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-neutral-950 border-neutral-800">
                  <div className="px-3 py-2 border-b border-neutral-800">
                    <p className="text-sm font-medium text-neutral-200">{session.user?.name}</p>
                    <p className="text-xs text-neutral-500">{session.user?.email}</p>
                  </div>

                  <Link href="/subscriptions">
                    <DropdownMenuItem className="text-neutral-300 focus:bg-neutral-900 focus:text-white cursor-pointer">
                      <Users className="w-4 h-4 mr-2" />
                      Subscriptions
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="text-neutral-300 focus:bg-neutral-900 focus:text-white cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-400 focus:bg-red-950 focus:text-red-300 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => signIn("google")}
                className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded-full gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section with Search */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-100 mb-3">
            Learn without distractions
          </h1>
          <p className="text-neutral-500 mb-8">
            Search YouTube videos, playlists, and channels
          </p>

          {/* Large Search Bar */}
          <div ref={searchRef} className="relative max-w-2xl mx-auto">
            <form onSubmit={handleSearchSubmit}>
              <div className="flex items-center bg-neutral-900 rounded-full border border-neutral-800 focus-within:border-neutral-700 transition-colors">
                {/* Search Type Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      type="button"
                      className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-400 hover:text-neutral-200 border-r border-neutral-800"
                    >
                      {searchType === "video" && <Play className="w-4 h-4" />}
                      {searchType === "playlist" && <ListVideo className="w-4 h-4" />}
                      {searchType === "channel" && <User className="w-4 h-4" />}
                      <span className="capitalize">{searchType}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-neutral-950 border-neutral-800">
                    <DropdownMenuItem 
                      onClick={() => setSearchType("video")}
                      className="text-neutral-300 focus:bg-neutral-900 focus:text-white cursor-pointer"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Video
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSearchType("playlist")}
                      className="text-neutral-300 focus:bg-neutral-900 focus:text-white cursor-pointer"
                    >
                      <ListVideo className="w-4 h-4 mr-2" />
                      Playlist
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSearchType("channel")}
                      className="text-neutral-300 focus:bg-neutral-900 focus:text-white cursor-pointer"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Channel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Input
                  type="text"
                  placeholder={`Search ${searchType}s...`}
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={() => searchQuery && setShowResults(true)}
                  className="flex-1 border-0 bg-transparent text-neutral-200 placeholder:text-neutral-600 focus-visible:ring-0 text-lg py-6"
                />
                
                <button 
                  type="submit"
                  className="p-3 mr-1 rounded-full hover:bg-neutral-800 transition-colors"
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5 text-neutral-400" />
                  )}
                </button>
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showResults && (searchResults.length > 0 || isSearching) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-[60vh] overflow-y-auto">
                {isSearching ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 text-neutral-500 animate-spin mx-auto" />
                  </div>
                ) : (
                  searchResults.map((result) => (
                    <Link
                      key={result.id}
                      href={result.type === "video" ? `/watch/${result.id}` : result.type === "playlist" ? `/playlist/${result.id}` : `/channel/${result.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-neutral-900 transition-colors"
                      onClick={() => setShowResults(false)}
                    >
                      <img
                        src={result.thumbnailUrl}
                        alt={result.title}
                        className={`${result.type === "channel" ? "w-12 h-12 rounded-full" : "w-24 h-14 rounded-lg"} object-cover bg-neutral-800`}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-neutral-200 line-clamp-1">{result.title}</h4>
                        <p className="text-xs text-neutral-500 line-clamp-1">{result.channelTitle}</p>
                        {result.type === "playlist" && result.videoCount && (
                          <p className="text-xs text-neutral-600">{result.videoCount} videos</p>
                        )}
                      </div>
                      <div className="text-xs text-neutral-600 capitalize">{result.type}</div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Link href="/playlists">
              <Button 
                variant="outline" 
                className="rounded-full bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white gap-2 px-6"
              >
                <ListVideo className="w-4 h-4" />
                Playlists
              </Button>
            </Link>
            <Button 
              onClick={handleLucky}
              variant="outline" 
              className="rounded-full bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white gap-2 px-6"
            >
              <Shuffle className="w-4 h-4" />
              I'm Feeling Lucky
            </Button>
          </div>
        </div>

        {/* Sign in prompt for non-authenticated users */}
        {!session && status !== "loading" && (
          <div className="text-center py-12 border-t border-neutral-900">
            <p className="text-neutral-500 mb-4">
              Sign in to sync notes, access Calendar, Tasks, and Classroom
            </p>
            <Button 
              onClick={() => signIn("google")}
              className="bg-white text-black hover:bg-neutral-200 rounded-full gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign in with Google
            </Button>
          </div>
        )}

        {/* Authenticated User Content */}
        {session && (
          <div className="space-y-8">
            {/* Continue Watching */}
            {watchHistory.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                    Continue Watching
                  </h2>
                  <Link href="/history" className="text-xs text-neutral-600 hover:text-neutral-400 flex items-center gap-1">
                    View All <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
                  {watchHistory.slice(0, 6).map((item) => (
                    <Link
                      key={item.id}
                      href={`/watch/${item.videoId}`}
                      className="flex-shrink-0 w-64 group"
                    >
                      <div className="relative rounded-xl overflow-hidden bg-neutral-900">
                        <img
                          src={item.thumbnailUrl || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`}
                          alt={item.title}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Play className="w-4 h-4 text-white ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-700">
                          <div 
                            className="h-full bg-red-500" 
                            style={{ width: `${formatProgress(item.progress, item.duration)}%` }} 
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <h4 className="text-sm text-neutral-200 font-medium line-clamp-2">{item.title}</h4>
                        <p className="text-xs text-neutral-600 mt-1">{item.channelTitle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Google Services Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Calendar */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-medium text-neutral-300">Upcoming</h3>
                </div>
                {isLoadingData ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => (
                      <div key={i} className="h-12 bg-neutral-900 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : calendarEvents.length > 0 ? (
                  <div className="space-y-2">
                    {calendarEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="p-3 bg-neutral-900 rounded-lg">
                        <p className="text-sm text-neutral-200 line-clamp-1">{event.title}</p>
                        <p className="text-xs text-neutral-500">{formatDate(event.start)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-600">No upcoming events</p>
                )}
              </div>

              {/* Tasks */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-green-400" />
                    <h3 className="text-sm font-medium text-neutral-300">Tasks</h3>
                  </div>
                  <button 
                    onClick={() => setShowTaskDialog(true)}
                    className="text-neutral-600 hover:text-neutral-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {isLoadingData ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => (
                      <div key={i} className="h-12 bg-neutral-900 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.filter(t => t.status !== "completed").slice(0, 3).map((task) => (
                      <div key={task.id} className="p-3 bg-neutral-900 rounded-lg">
                        <p className="text-sm text-neutral-200 line-clamp-1">{task.title}</p>
                        {task.due && (
                          <p className="text-xs text-neutral-500">Due: {formatDate(task.due)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-600">No pending tasks</p>
                )}
              </div>

              {/* Classroom */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-sm font-medium text-neutral-300">Assignments</h3>
                </div>
                {isLoadingData ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => (
                      <div key={i} className="h-12 bg-neutral-900 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : assignments.length > 0 ? (
                  <div className="space-y-2">
                    {assignments.slice(0, 3).map((assignment) => (
                      <div key={assignment.id} className="p-3 bg-neutral-900 rounded-lg">
                        <p className="text-sm text-neutral-200 line-clamp-1">{assignment.title}</p>
                        <p className="text-xs text-neutral-500">{assignment.courseTitle}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-600">No pending assignments</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-neutral-950 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-200">Delete Account</DialogTitle>
            <DialogDescription className="text-neutral-500">
              This will permanently delete your account and all associated data including playlists, notes, and watch history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="bg-neutral-950 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-200">Create Task</DialogTitle>
            <DialogDescription className="text-neutral-500">
              Add a new task to your Google Tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
              className="bg-neutral-900 border-neutral-800 text-neutral-200 placeholder:text-neutral-600"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowTaskDialog(false)}
              className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={isCreatingTask || !newTaskTitle.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isCreatingTask ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
