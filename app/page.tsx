"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { Play, Clock, BookOpen, Search, LogIn, LogOut, User, Plus, ListPlus, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Sample data for playlists - will be replaced with user playlists from DB
const playlists = [
  {
    id: 1,
    title: "Distributed Systems",
    description: "Complete course on building scalable distributed systems",
    lectureCount: 12,
    totalDuration: "8h 30m",
    thumbnail: "/distributed-systems-architecture-dark.jpg",
  },
  {
    id: 2,
    title: "Machine Learning Fundamentals",
    description: "From basic concepts to neural networks",
    lectureCount: 18,
    totalDuration: "12h 15m",
    thumbnail: "/machine-learning-neural-network-dark.jpg",
  },
  {
    id: 3,
    title: "Database Design",
    description: "SQL, NoSQL, and data modeling patterns",
    lectureCount: 8,
    totalDuration: "5h 45m",
    thumbnail: "/database-design-dark.jpg",
  },
]

// Demo educational videos with real YouTube IDs
const demoVideos = [
  {
    id: "mit-algorithms",
    videoId: "HtSuA80QTyo",
    title: "MIT 6.006 - Introduction to Algorithms",
    playlist: "MIT OpenCourseWare",
    duration: "1:23:15",
    progress: 35,
  },
  {
    id: "3blue1brown-linear",
    videoId: "fNk_zzaMoSs",
    title: "Essence of Linear Algebra - Chapter 1",
    playlist: "3Blue1Brown",
    duration: "15:09",
    progress: 0,
  },
  {
    id: "computerphile-sorting",
    videoId: "kPRA0W1kECg",
    title: "Quicksort Algorithm Explained",
    playlist: "Computerphile",
    duration: "8:43",
    progress: 100,
  },
  {
    id: "traversy-nodejs",
    videoId: "fBNz5xF-Kx4",
    title: "Node.js Crash Course",
    playlist: "Traversy Media",
    duration: "1:30:49",
    progress: 72,
  },
]

export default function Home() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<typeof demoVideos[0] | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search results (will implement search page later)
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  const handleAddToPlaylist = (video: typeof demoVideos[0]) => {
    setSelectedVideo(video)
    setShowPlaylistModal(true)
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 rounded-md flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-neutral-300" />
            </div>
            <span className="text-lg font-medium text-neutral-200 tracking-tight">DeepFocus</span>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <Input
                type="text"
                placeholder="Search educational videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 bg-neutral-900/50 border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus-visible:ring-neutral-700 rounded-md"
              />
            </div>
          </form>

          <nav className="flex items-center gap-4">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-neutral-900 animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-500 hidden sm:inline">{session.user?.name}</span>
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center">
                    <User className="w-4 h-4 text-neutral-500" />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signIn("google")}
                className="text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900 gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="mb-6 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
            <Input
              type="text"
              placeholder="Search educational videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 bg-neutral-900/50 border-neutral-800 text-neutral-200 placeholder:text-neutral-600 rounded-md"
            />
          </div>
        </form>

        {/* Welcome message for non-authenticated users */}
        {!session && (
          <div className="mb-8 p-6 bg-neutral-950 rounded-md border border-neutral-900">
            <h2 className="text-lg text-neutral-200 font-medium mb-2">Welcome to DeepFocus</h2>
            <p className="text-sm text-neutral-500 mb-4">
              Sign in with Google to sync your notes to Drive, access your Calendar, Tasks, and Google Classroom.
            </p>
            <Button onClick={() => signIn("google")} className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded-md">
              <LogIn className="w-4 h-4 mr-2" />
              Sign in with Google
            </Button>
          </div>
        )}

        {/* Demo Videos Section */}
        <section className="mb-12">
          <h2 className="text-sm font-medium text-neutral-500 tracking-wide uppercase mb-4">
            {session ? "Continue Watching" : "Try These Educational Videos"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {demoVideos.map((video) => (
              <div
                key={video.id}
                className="group bg-neutral-950 rounded-md overflow-hidden border border-neutral-900 hover:border-neutral-800 transition-colors"
              >
                <Link href={`/watch/${video.id}`} className="block">
                  <div className="relative">
                    <img
                      src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-neutral-900/80 flex items-center justify-center">
                        <Play className="w-4 h-4 text-neutral-300 ml-0.5" />
                      </div>
                    </div>
                    {video.progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
                        <div className="h-full bg-red-600" style={{ width: `${video.progress}%` }} />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/watch/${video.id}`} className="flex-1 min-w-0">
                      <h3 className="text-sm text-neutral-200 font-medium line-clamp-2 mb-1 hover:text-white transition-colors">
                        {video.title}
                      </h3>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 text-neutral-600 hover:text-neutral-300 transition-colors shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-neutral-950 border-neutral-800">
                        <DropdownMenuItem 
                          onClick={() => handleAddToPlaylist(video)}
                          className="text-neutral-300 focus:bg-neutral-900 focus:text-white cursor-pointer"
                        >
                          <ListPlus className="w-4 h-4 mr-2" />
                          Add to Playlist
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                    <span>{video.playlist}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {video.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Playlists Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-neutral-500 tracking-wide uppercase">Your Playlists</h2>
            {session && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900 gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Playlist</span>
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className="group bg-neutral-950 rounded-md overflow-hidden border border-neutral-900 hover:border-neutral-800 transition-colors"
              >
                <div className="relative">
                  <img
                    src={playlist.thumbnail || "/placeholder.svg"}
                    alt={playlist.title}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-neutral-900/80 flex items-center justify-center">
                      <Play className="w-5 h-5 text-neutral-300 ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/90 px-2 py-1 rounded-md text-xs font-mono text-neutral-300">
                    {playlist.lectureCount} lectures
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-base text-neutral-200 font-medium mb-1">{playlist.title}</h3>
                  <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{playlist.description}</p>
                  <div className="flex items-center gap-1 text-xs text-neutral-600">
                    <Clock className="w-3 h-3" />
                    <span>{playlist.totalDuration}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Playlist Modal - Simple implementation for now */}
      {showPlaylistModal && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-950 border border-neutral-900 rounded-md w-full max-w-md">
            <div className="p-4 border-b border-neutral-900">
              <h3 className="text-lg font-medium text-neutral-200">Save to Playlist</h3>
              <p className="text-sm text-neutral-500 mt-1 line-clamp-1">{selectedVideo.title}</p>
            </div>
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              <button className="w-full flex items-center gap-3 p-3 rounded-md bg-neutral-900 hover:bg-neutral-800 transition-colors text-left">
                <Plus className="w-5 h-5 text-neutral-400" />
                <span className="text-neutral-200">Create new playlist</span>
              </button>
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-neutral-900 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-neutral-800 rounded-md flex items-center justify-center shrink-0">
                    <ListPlus className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-200 truncate">{playlist.title}</p>
                    <p className="text-xs text-neutral-600">{playlist.lectureCount} videos</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-neutral-900 flex justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowPlaylistModal(false)}
                className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
