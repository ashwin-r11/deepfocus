"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { VideoStage } from "@/components/video-stage"
import { Notepad } from "@/components/notepad"
import { ToolsPanel } from "@/components/tools-panel"
import { PlaylistModal } from "@/components/playlist-modal"
import { ScheduleModal } from "@/components/schedule-modal"

// Demo video data - will be replaced with API fetch
const demoVideos: Record<string, { title: string; videoId: string; channelName?: string }> = {
  "1": { videoId: "dQw4w9WgXcQ", title: "Demo Video" },
  // Some educational videos for testing
  "mit-algorithms": { videoId: "HtSuA80QTyo", title: "MIT 6.006 - Introduction to Algorithms", channelName: "MIT OpenCourseWare" },
  "3blue1brown-linear": { videoId: "fNk_zzaMoSs", title: "3Blue1Brown - Essence of Linear Algebra", channelName: "3Blue1Brown" },
  "computerphile-sorting": { videoId: "kPRA0W1kECg", title: "Computerphile - Sorting Algorithms", channelName: "Computerphile" },
  "traversy-nodejs": { videoId: "fBNz5xF-Kx4", title: "Node.js Crash Course", channelName: "Traversy Media" },
}

export default function WatchPage() {
  const params = useParams()
  const { data: session } = useSession()
  const id = params.id as string
  
  // Get video info - defaults to MIT lecture if invalid ID
  const videoInfo = demoVideos[id] || { videoId: id, title: "Video" }
  
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const lastSaveRef = useRef(0)

  // Save watch progress periodically (every 10 seconds of playback)
  const handleTimeUpdate = useCallback((time: number, videoDuration?: number) => {
    setCurrentTime(time)
    if (videoDuration) setDuration(videoDuration)

    // Save progress every 10 seconds
    if (session?.user && time - lastSaveRef.current >= 10) {
      lastSaveRef.current = time
      fetch("/api/watch-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: videoInfo.videoId,
          videoTitle: videoInfo.title,
          thumbnail: `https://img.youtube.com/vi/${videoInfo.videoId}/mqdefault.jpg`,
          channelName: videoInfo.channelName,
          progress: time,
          duration: videoDuration || duration,
        }),
      }).catch(console.error)
    }
  }, [session, videoInfo, duration])

  // Save progress when leaving page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session?.user && currentTime > 0) {
        navigator.sendBeacon(
          "/api/watch-history",
          JSON.stringify({
            videoId: videoInfo.videoId,
            videoTitle: videoInfo.title,
            thumbnail: `https://img.youtube.com/vi/${videoInfo.videoId}/mqdefault.jpg`,
            channelName: videoInfo.channelName,
            progress: currentTime,
            duration,
          })
        )
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [session, videoInfo, currentTime, duration])

  return (
    <main className="flex min-h-screen w-full bg-black">
      <div className="flex flex-col lg:flex-row w-full gap-0">
        {/* Left Column - Video Stage (full width on mobile, 65% on desktop) */}
        <div className="w-full lg:w-[65%] flex flex-col">
          <VideoStage 
            videoId={videoInfo.videoId}
            title={videoInfo.title}
            onTimeUpdate={handleTimeUpdate}
            onAddToPlaylist={() => setShowPlaylistModal(true)}
            onScheduleVideo={() => setShowScheduleModal(true)}
          />
          {/* Tools Panel below video */}
          <ToolsPanel />
        </div>

        {/* Right Column - Notepad (full width on mobile, 35% on desktop) */}
        <div className="w-full lg:w-[35%] flex flex-col border-t lg:border-t-0 lg:border-l border-neutral-900 min-h-[50vh] lg:min-h-0">
          <Notepad videoId={videoInfo.videoId} currentVideoTime={currentTime} />
        </div>
      </div>

      {/* Playlist Modal */}
      <PlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        video={{
          videoId: videoInfo.videoId,
          title: videoInfo.title,
          thumbnail: `https://img.youtube.com/vi/${videoInfo.videoId}/mqdefault.jpg`,
          channelName: videoInfo.channelName,
        }}
      />

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        video={{
          videoId: videoInfo.videoId,
          title: videoInfo.title,
          thumbnail: `https://img.youtube.com/vi/${videoInfo.videoId}/mqdefault.jpg`,
        }}
      />
    </main>
  )
}
