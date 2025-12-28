"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { X, Plus, ListPlus, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Playlist {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  _count: { videos: number }
}

interface VideoInfo {
  videoId: string
  title: string
  thumbnail?: string
  duration?: string
  channelName?: string
}

interface PlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  video: VideoInfo
}

export function PlaylistModal({ isOpen, onClose, video }: PlaylistModalProps) {
  const { data: session } = useSession()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("")
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set())

  // Fetch playlists when modal opens
  useEffect(() => {
    if (isOpen && session) {
      setLoading(true)
      fetch("/api/playlists")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPlaylists(data)
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [isOpen, session])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowCreateForm(false)
      setNewPlaylistTitle("")
      setAddedTo(new Set())
    }
  }, [isOpen])

  const handleCreatePlaylist = async () => {
    if (!newPlaylistTitle.trim()) return

    setCreating(true)
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newPlaylistTitle.trim() }),
      })

      if (res.ok) {
        const newPlaylist = await res.json()
        setPlaylists((prev) => [{ ...newPlaylist, _count: { videos: 0 } }, ...prev])
        setNewPlaylistTitle("")
        setShowCreateForm(false)
        // Auto-add video to new playlist
        handleAddToPlaylist(newPlaylist.id)
      }
    } catch (error) {
      console.error("Error creating playlist:", error)
    } finally {
      setCreating(false)
    }
  }

  const handleAddToPlaylist = async (playlistId: string) => {
    if (addedTo.has(playlistId)) return

    setAddingTo(playlistId)
    try {
      const res = await fetch(`/api/playlists/${playlistId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.videoId,
          title: video.title,
          thumbnail: video.thumbnail,
          duration: video.duration,
          channelName: video.channelName,
        }),
      })

      if (res.ok) {
        setAddedTo((prev) => new Set([...prev, playlistId]))
        // Update count in local state
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === playlistId
              ? { ...p, _count: { videos: p._count.videos + 1 } }
              : p
          )
        )
      } else if (res.status === 409) {
        // Video already in playlist
        setAddedTo((prev) => new Set([...prev, playlistId]))
      }
    } catch (error) {
      console.error("Error adding to playlist:", error)
    } finally {
      setAddingTo(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-950 border border-neutral-900 rounded-md w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-900">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-neutral-200">Save to Playlist</h3>
            <p className="text-sm text-neutral-500 mt-1 truncate">{video.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!session ? (
            <p className="text-center text-neutral-500 py-8">
              Sign in to save videos to playlists
            </p>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* Create New Playlist */}
              {showCreateForm ? (
                <div className="flex items-center gap-2 p-2 bg-neutral-900 rounded-md">
                  <Input
                    value={newPlaylistTitle}
                    onChange={(e) => setNewPlaylistTitle(e.target.value)}
                    placeholder="Playlist name"
                    className="flex-1 bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-600 h-9"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
                  />
                  <Button
                    size="sm"
                    onClick={handleCreatePlaylist}
                    disabled={!newPlaylistTitle.trim() || creating}
                    className="bg-neutral-700 hover:bg-neutral-600 text-white"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-md bg-neutral-900 hover:bg-neutral-800 transition-colors text-left"
                >
                  <Plus className="w-5 h-5 text-neutral-400" />
                  <span className="text-neutral-200">Create new playlist</span>
                </button>
              )}

              {/* Existing Playlists */}
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id)}
                  disabled={addingTo === playlist.id}
                  className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-neutral-900 transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-neutral-800 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
                    {playlist.thumbnail ? (
                      <img
                        src={playlist.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ListPlus className="w-4 h-4 text-neutral-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-200 truncate">{playlist.title}</p>
                    <p className="text-xs text-neutral-600">{playlist._count.videos} videos</p>
                  </div>
                  {addingTo === playlist.id ? (
                    <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
                  ) : addedTo.has(playlist.id) ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : null}
                </button>
              ))}

              {playlists.length === 0 && !showCreateForm && (
                <p className="text-center text-neutral-600 py-4 text-sm">
                  No playlists yet. Create one to get started.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-900 flex justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
