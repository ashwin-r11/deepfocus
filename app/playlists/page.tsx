"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession, signIn } from "next-auth/react"
import { 
  BookOpen, Plus, Play, Trash2, MoreVertical, 
  Loader2, ArrowLeft, Lock, Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

interface Playlist {
  id: string
  name: string
  description?: string
  thumbnailUrl?: string
  isPublic: boolean
  _count?: {
    videos: number
  }
  videos?: {
    videoId: string
    title: string
    thumbnailUrl: string
  }[]
}

export default function PlaylistsPage() {
  const { data: session, status } = useSession()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [deletePlaylistId, setDeletePlaylistId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (session) {
      fetchPlaylists()
    }
  }, [session])

  const fetchPlaylists = async () => {
    try {
      const res = await fetch("/api/playlists")
      if (res.ok) {
        const data = await res.json()
        setPlaylists(data.playlists || [])
      }
    } catch (error) {
      console.error("Error fetching playlists:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return

    setIsCreating(true)
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPlaylistName.trim(),
          description: newPlaylistDescription.trim() || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setPlaylists((prev) => [data.playlist, ...prev])
        setShowCreateDialog(false)
        setNewPlaylistName("")
        setNewPlaylistDescription("")
      }
    } catch (error) {
      console.error("Error creating playlist:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeletePlaylist = async () => {
    if (!deletePlaylistId) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/playlists/${deletePlaylistId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setPlaylists((prev) => prev.filter((p) => p.id !== deletePlaylistId))
        setDeletePlaylistId(null)
      }
    } catch (error) {
      console.error("Error deleting playlist:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
      </main>
    )
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-200 mb-4">Sign in to view playlists</h1>
          <Button onClick={() => signIn("google")} className="bg-white text-black hover:bg-neutral-200">
            Sign in with Google
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-neutral-900 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-neutral-400" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-neutral-300" />
              </div>
              <span className="text-lg font-medium text-neutral-200 tracking-tight">DeepFocus</span>
            </div>
          </div>

          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded-full gap-2"
          >
            <Plus className="w-4 h-4" />
            New Playlist
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-neutral-100 mb-8">Your Playlists</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-neutral-900" />
                <div className="p-4">
                  <div className="h-5 bg-neutral-900 rounded mb-2 w-3/4" />
                  <div className="h-4 bg-neutral-900 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-neutral-600" />
            </div>
            <h2 className="text-lg font-medium text-neutral-300 mb-2">No playlists yet</h2>
            <p className="text-neutral-600 mb-6">Create your first playlist to organize your learning</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Playlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="group bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden hover:border-neutral-800 transition-colors"
              >
                <Link href={`/playlist/${playlist.id}`}>
                  <div className="relative aspect-video bg-neutral-900">
                    {playlist.thumbnailUrl || playlist.videos?.[0]?.thumbnailUrl ? (
                      <img
                        src={playlist.thumbnailUrl || playlist.videos?.[0]?.thumbnailUrl}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-neutral-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded-lg text-xs text-neutral-300">
                      {playlist._count?.videos || playlist.videos?.length || 0} videos
                    </div>
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/playlist/${playlist.id}`} className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-neutral-200 line-clamp-1 hover:text-white transition-colors">
                        {playlist.name}
                      </h3>
                      {playlist.description && (
                        <p className="text-sm text-neutral-600 line-clamp-1 mt-1">{playlist.description}</p>
                      )}
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 text-neutral-600 hover:text-neutral-300 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-neutral-950 border-neutral-800">
                        <DropdownMenuItem
                          onClick={() => setDeletePlaylistId(playlist.id)}
                          className="text-red-400 focus:bg-red-950 focus:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {playlist.isPublic ? (
                      <span className="flex items-center gap-1 text-xs text-neutral-600">
                        <Globe className="w-3 h-3" /> Public
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-neutral-600">
                        <Lock className="w-3 h-3" /> Private
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Playlist Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-neutral-950 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-200">Create Playlist</DialogTitle>
            <DialogDescription className="text-neutral-500">
              Create a new playlist to organize your learning videos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-neutral-400 mb-2 block">Name</label>
              <Input
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="e.g., Machine Learning Basics"
                className="bg-neutral-900 border-neutral-800 text-neutral-200"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 mb-2 block">Description (optional)</label>
              <Input
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                placeholder="What's this playlist about?"
                className="bg-neutral-900 border-neutral-800 text-neutral-200"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowCreateDialog(false)}
              className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlaylist}
              disabled={!newPlaylistName.trim() || isCreating}
              className="bg-white text-black hover:bg-neutral-200"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletePlaylistId} onOpenChange={() => setDeletePlaylistId(null)}>
        <DialogContent className="bg-neutral-950 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-200">Delete Playlist</DialogTitle>
            <DialogDescription className="text-neutral-500">
              Are you sure you want to delete this playlist? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeletePlaylistId(null)}
              className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeletePlaylist}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
