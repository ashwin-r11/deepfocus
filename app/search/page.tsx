"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Search, Grid3X3, List, Filter, Clock, ThumbsUp, Eye, Calendar, 
  ListPlus, Share2, Bookmark, Tag, MoreVertical, Play, Users,
  ChevronDown, X, CheckSquare, Bell, Loader2, Heart, ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SearchResult {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  channelTitle: string
  channelId?: string
  type: "video" | "playlist" | "channel"
  videoCount?: number
  subscriberCount?: string
  duration?: string
  viewCount?: string
  publishedAt?: string
}

interface UserTag {
  id: string
  name: string
  color: string
}

type ViewMode = "grid" | "list"
type SortBy = "relevance" | "date" | "viewCount" | "rating"
type UploadDate = "any" | "hour" | "today" | "week" | "month" | "year"
type Duration = "any" | "short" | "medium" | "long"

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  const initialQuery = searchParams.get("q") || ""
  const initialType = (searchParams.get("type") as "video" | "playlist" | "channel") || "video"
  
  const [query, setQuery] = useState(initialQuery)
  const [searchType, setSearchType] = useState<"video" | "playlist" | "channel">(initialType)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  
  // Filters
  const [sortBy, setSortBy] = useState<SortBy>("relevance")
  const [uploadDate, setUploadDate] = useState<UploadDate>("any")
  const [duration, setDuration] = useState<Duration>("any")
  const [showFilters, setShowFilters] = useState(false)
  
  // Tags
  const [userTags, setUserTags] = useState<UserTag[]>([])
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null)
  const [showTagDialog, setShowTagDialog] = useState(false)
  const [tagTarget, setTagTarget] = useState<SearchResult | null>(null)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#6366f1")
  
  // Schedule dialog
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [scheduleTarget, setScheduleTarget] = useState<SearchResult | null>(null)
  const [scheduleType, setScheduleType] = useState<"task" | "event">("task")
  const [scheduleDate, setScheduleDate] = useState("")
  const [isScheduling, setIsScheduling] = useState(false)

  // Fetch user tags
  useEffect(() => {
    if (session) {
      fetch("/api/tags")
        .then(res => res.json())
        .then(data => setUserTags(data.tags || []))
        .catch(console.error)
    }
  }, [session])

  // Search on initial load if query exists
  useEffect(() => {
    if (initialQuery) {
      handleSearch()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    
    setIsLoading(true)
    
    // Update URL
    const params = new URLSearchParams()
    params.set("q", query)
    params.set("type", searchType)
    if (sortBy !== "relevance") params.set("sort", sortBy)
    if (uploadDate !== "any") params.set("date", uploadDate)
    if (duration !== "any") params.set("duration", duration)
    router.push(`/search?${params.toString()}`, { scroll: false })

    try {
      const url = new URL("/api/youtube/search", window.location.origin)
      url.searchParams.set("q", query)
      url.searchParams.set("type", searchType)
      url.searchParams.set("maxResults", "30")
      if (sortBy !== "relevance") url.searchParams.set("order", sortBy)
      
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setResults(data.items || [])
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [query, searchType, sortBy, uploadDate, duration, router])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleWatchLater = async (video: SearchResult) => {
    try {
      const res = await fetch("/api/watch-later", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id }),
      })
      if (res.ok) {
        // Show success toast or notification
      }
    } catch (error) {
      console.error("Watch Later error:", error)
    }
  }

  const handleSubscribe = async (channelId: string) => {
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      })
      if (res.ok) {
        // Show success
      }
    } catch (error) {
      console.error("Subscribe error:", error)
    }
  }

  const handleShare = async (item: SearchResult) => {
    const url = item.type === "video" 
      ? `https://youtube.com/watch?v=${item.id}`
      : item.type === "playlist"
      ? `https://youtube.com/playlist?list=${item.id}`
      : `https://youtube.com/channel/${item.id}`
    
    if (navigator.share) {
      await navigator.share({ title: item.title, url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  const handleAddTag = async (tagId: string) => {
    if (!tagTarget) return
    
    try {
      await fetch("/api/tags/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagId,
          itemId: tagTarget.id,
          itemType: tagTarget.type,
          title: tagTarget.title,
          thumbnail: tagTarget.thumbnailUrl,
        }),
      })
      setShowTagDialog(false)
      setTagTarget(null)
    } catch (error) {
      console.error("Tag error:", error)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName, color: newTagColor }),
      })
      if (res.ok) {
        const tag = await res.json()
        setUserTags(prev => [...prev, tag])
        if (tagTarget) {
          await handleAddTag(tag.id)
        }
        setNewTagName("")
      }
    } catch (error) {
      console.error("Create tag error:", error)
    }
  }

  const handleSchedule = async () => {
    if (!scheduleTarget || !scheduleDate) return
    
    setIsScheduling(true)
    try {
      const endpoint = scheduleType === "task" ? "/api/tasks" : "/api/calendar/events"
      const body = scheduleType === "task" 
        ? {
            title: `Watch: ${scheduleTarget.title}`,
            videoId: scheduleTarget.id,
            videoTitle: scheduleTarget.title,
            due: scheduleDate,
          }
        : {
            title: `Watch: ${scheduleTarget.title}`,
            videoId: scheduleTarget.id,
            videoTitle: scheduleTarget.title,
            start: scheduleDate,
          }
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      
      if (res.ok) {
        setShowScheduleDialog(false)
        setScheduleTarget(null)
        setScheduleDate("")
      }
    } catch (error) {
      console.error("Schedule error:", error)
    } finally {
      setIsScheduling(false)
    }
  }

  const formatDuration = (duration?: string) => {
    if (!duration) return ""
    return duration
  }

  const formatViews = (views?: string) => {
    if (!views) return ""
    const num = parseInt(views)
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`
    return `${num} views`
  }

  const tagColors = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
    "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  ]

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-medium text-neutral-200 shrink-0">
              DeepFocus
            </Link>
            
            {/* Search Bar */}
            <div className="flex-1 flex items-center gap-2 max-w-3xl">
              <div className="flex-1 flex items-center bg-neutral-900 rounded-full border border-neutral-800 focus-within:border-neutral-700">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search videos, playlists, channels..."
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-neutral-200 placeholder:text-neutral-600"
                />
                <Select value={searchType} onValueChange={(v) => setSearchType(v as typeof searchType)}>
                  <SelectTrigger className="w-28 border-0 bg-transparent text-neutral-400 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="playlist">Playlists</SelectItem>
                    <SelectItem value="channel">Channels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSearch} size="icon" className="rounded-full bg-neutral-800 hover:bg-neutral-700">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* View Mode & Filters */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "text-white" : "text-neutral-500"}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "text-white" : "text-neutral-500"}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-neutral-400"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-900">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="w-36 bg-neutral-900 border-neutral-800">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Upload date</SelectItem>
                  <SelectItem value="viewCount">View count</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>

              <Select value={uploadDate} onValueChange={(v) => setUploadDate(v as UploadDate)}>
                <SelectTrigger className="w-36 bg-neutral-900 border-neutral-800">
                  <SelectValue placeholder="Upload date" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  <SelectItem value="any">Any time</SelectItem>
                  <SelectItem value="hour">Last hour</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                </SelectContent>
              </Select>

              {searchType === "video" && (
                <Select value={duration} onValueChange={(v) => setDuration(v as Duration)}>
                  <SelectTrigger className="w-36 bg-neutral-900 border-neutral-800">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
                    <SelectItem value="any">Any duration</SelectItem>
                    <SelectItem value="short">Under 4 min</SelectItem>
                    <SelectItem value="medium">4-20 min</SelectItem>
                    <SelectItem value="long">Over 20 min</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Tag Filter */}
              {userTags.length > 0 && (
                <Select value={selectedTagFilter || "all"} onValueChange={(v) => setSelectedTagFilter(v === "all" ? null : v)}>
                  <SelectTrigger className="w-36 bg-neutral-900 border-neutral-800">
                    <Tag className="w-3 h-3 mr-2" />
                    <SelectValue placeholder="Tags" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
                    <SelectItem value="all">All tags</SelectItem>
                    {userTags.map(tag => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                          {tag.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button variant="ghost" size="sm" onClick={() => {
                setSortBy("relevance")
                setUploadDate("any")
                setDuration("any")
                setSelectedTagFilter(null)
              }} className="text-neutral-500">
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 mx-auto text-neutral-800 mb-4" />
            <h2 className="text-xl text-neutral-400">
              {query ? "No results found" : "Search for videos, playlists, or channels"}
            </h2>
          </div>
        ) : viewMode === "grid" ? (
          // Grid View (Pinterest-style)
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="break-inside-avoid mb-4 group relative bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-900 hover:border-neutral-800 transition-colors"
              >
                {/* Thumbnail */}
                <Link href={
                  result.type === "video" ? `/watch/${result.id}` :
                  result.type === "playlist" ? `/playlist/${result.id}` :
                  `/channel/${result.id}`
                }>
                  <div className="relative aspect-video">
                    <img
                      src={result.thumbnailUrl}
                      alt={result.title}
                      className="w-full h-full object-cover"
                    />
                    {result.type === "video" && result.duration && (
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
                        {result.duration}
                      </span>
                    )}
                    {result.type === "playlist" && result.videoCount && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-8 h-8 text-white" />
                        <span className="text-white text-sm ml-2">{result.videoCount} videos</span>
                      </div>
                    )}
                    {result.type === "channel" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white">
                          <img src={result.thumbnailUrl} alt={result.title} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-3">
                  <Link href={
                    result.type === "video" ? `/watch/${result.id}` :
                    result.type === "playlist" ? `/playlist/${result.id}` :
                    `/channel/${result.id}`
                  }>
                    <h3 className="text-sm font-medium text-neutral-200 line-clamp-2 hover:text-white">
                      {result.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-neutral-500 mt-1">{result.channelTitle}</p>
                  {result.type === "video" && result.viewCount && (
                    <p className="text-xs text-neutral-600 mt-0.5">{formatViews(result.viewCount)}</p>
                  )}
                  {result.type === "channel" && result.subscriberCount && (
                    <p className="text-xs text-neutral-500 mt-0.5">{result.subscriberCount}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 bg-black/60 hover:bg-black/80">
                        <MoreVertical className="w-4 h-4 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-neutral-800">
                      {result.type === "video" && (
                        <>
                          <DropdownMenuItem onClick={() => handleWatchLater(result)} className="text-neutral-300">
                            <Clock className="w-4 h-4 mr-2" /> Watch Later
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setScheduleTarget(result)
                            setShowScheduleDialog(true)
                          }} className="text-neutral-300">
                            <Calendar className="w-4 h-4 mr-2" /> Schedule
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={() => {
                        setTagTarget(result)
                        setShowTagDialog(true)
                      }} className="text-neutral-300">
                        <Tag className="w-4 h-4 mr-2" /> Add Tag
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-neutral-300">
                        <ListPlus className="w-4 h-4 mr-2" /> Add to Playlist
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-neutral-800" />
                      {result.type === "channel" || result.channelId ? (
                        <DropdownMenuItem onClick={() => handleSubscribe(result.channelId || result.id)} className="text-neutral-300">
                          <Bell className="w-4 h-4 mr-2" /> Subscribe
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem onClick={() => handleShare(result)} className="text-neutral-300">
                        <Share2 className="w-4 h-4 mr-2" /> Share
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-neutral-300">
                        <ExternalLink className="w-4 h-4 mr-2" /> Open on YouTube
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="flex gap-4 p-3 bg-neutral-950 rounded-xl border border-neutral-900 hover:border-neutral-800 group transition-colors"
              >
                {/* Thumbnail */}
                <Link href={
                  result.type === "video" ? `/watch/${result.id}` :
                  result.type === "playlist" ? `/playlist/${result.id}` :
                  `/channel/${result.id}`
                } className="shrink-0">
                  <div className="relative w-64 aspect-video rounded-lg overflow-hidden">
                    <img
                      src={result.thumbnailUrl}
                      alt={result.title}
                      className="w-full h-full object-cover"
                    />
                    {result.type === "video" && result.duration && (
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
                        {result.duration}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={
                    result.type === "video" ? `/watch/${result.id}` :
                    result.type === "playlist" ? `/playlist/${result.id}` :
                    `/channel/${result.id}`
                  }>
                    <h3 className="text-base font-medium text-neutral-200 line-clamp-2 hover:text-white">
                      {result.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-neutral-500">{result.channelTitle}</span>
                    {result.type === "video" && result.viewCount && (
                      <>
                        <span className="text-neutral-700">•</span>
                        <span className="text-sm text-neutral-600">{formatViews(result.viewCount)}</span>
                      </>
                    )}
                  </div>
                  {result.description && (
                    <p className="text-sm text-neutral-600 mt-2 line-clamp-2">{result.description}</p>
                  )}

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {result.type === "video" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleWatchLater(result)} className="h-8 text-neutral-400 hover:text-white">
                          <Clock className="w-4 h-4 mr-1" /> Later
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          setScheduleTarget(result)
                          setShowScheduleDialog(true)
                        }} className="h-8 text-neutral-400 hover:text-white">
                          <Calendar className="w-4 h-4 mr-1" /> Schedule
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => {
                      setTagTarget(result)
                      setShowTagDialog(true)
                    }} className="h-8 text-neutral-400 hover:text-white">
                      <Tag className="w-4 h-4 mr-1" /> Tag
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-neutral-400 hover:text-white">
                      <ListPlus className="w-4 h-4 mr-1" /> Playlist
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleShare(result)} className="h-8 text-neutral-400 hover:text-white">
                      <Share2 className="w-4 h-4 mr-1" /> Share
                    </Button>
                    {(result.type === "channel" || result.channelId) && (
                      <Button size="sm" variant="ghost" onClick={() => handleSubscribe(result.channelId || result.id)} className="h-8 text-neutral-400 hover:text-white">
                        <Bell className="w-4 h-4 mr-1" /> Subscribe
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tag Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent className="bg-neutral-950 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-200">Add Tag</DialogTitle>
            <DialogDescription className="text-neutral-500">
              Tag "{tagTarget?.title}" for easy organization
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Existing Tags */}
            {userTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-neutral-400">Your tags</p>
                <div className="flex flex-wrap gap-2">
                  {userTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => handleAddTag(tag.id)}
                      className="px-3 py-1.5 rounded-full text-sm flex items-center gap-2 hover:opacity-80"
                      style={{ backgroundColor: tag.color + "20", color: tag.color }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Tag */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <p className="text-sm text-neutral-400">Create new tag</p>
              <div className="flex gap-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name..."
                  className="flex-1 bg-neutral-900 border-neutral-800"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-10 p-0 border-neutral-800">
                      <div className="w-5 h-5 rounded" style={{ backgroundColor: newTagColor }} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-neutral-900 border-neutral-800">
                    <div className="grid grid-cols-5 gap-1 p-2">
                      {tagColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewTagColor(color)}
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTagDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>Create Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="bg-neutral-950 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-200">Schedule Video</DialogTitle>
            <DialogDescription className="text-neutral-500">
              Add to Google Tasks or Calendar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={scheduleType === "task" ? "default" : "outline"}
                onClick={() => setScheduleType("task")}
                className="flex-1"
              >
                <CheckSquare className="w-4 h-4 mr-2" /> Task
              </Button>
              <Button
                variant={scheduleType === "event" ? "default" : "outline"}
                onClick={() => setScheduleType("event")}
                className="flex-1"
              >
                <Calendar className="w-4 h-4 mr-2" /> Event
              </Button>
            </div>

            <Input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="bg-neutral-900 border-neutral-800"
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={!scheduleDate || isScheduling}>
              {isScheduling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
