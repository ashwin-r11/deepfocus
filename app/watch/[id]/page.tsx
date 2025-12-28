"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { VideoStage } from "@/components/video-stage"
import { Notepad } from "@/components/notepad"
import { ToolsPanel } from "@/components/tools-panel"
import { PlaylistModal } from "@/components/playlist-modal"
import { ScheduleModal } from "@/components/schedule-modal"
import { DrivePanel } from "@/components/drive-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PenLine, FolderOpen } from "lucide-react"

interface VideoInfo {
  videoId: string
  title: string
  channelName?: string
  description?: string
}

export default function WatchPage() {
  const params = useParams()
  const { data: session } = useSession()
  const id = params.id as string
  
  const [videoInfo, setVideoInfo] = useState<VideoInfo>({ videoId: id, title: "Loading..." })
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [activeTab, setActiveTab] = useState("notes")
  const lastSaveRef = useRef(0)

  // Fetch video info from YouTube API
  useEffect(() => {
    const fetchVideoInfo = async () => {
      try {
        const res = await fetch(`/api/youtube/video/${id}`)
        if (res.ok) {
          const data = await res.json()
          setVideoInfo({
            videoId: id,
            title: data.title || "Video",
            channelName: data.channelTitle,
            description: data.description,
          })
        } else {
          setVideoInfo({ videoId: id, title: "Video" })
        }
      } catch (error) {
        console.error("Error fetching video info:", error)
        setVideoInfo({ videoId: id, title: "Video" })
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideoInfo()
  }, [id])

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

        {/* Right Column - Tabbed Panel (full width on mobile, 35% on desktop) */}
        <div className="w-full lg:w-[35%] flex flex-col border-t lg:border-t-0 lg:border-l border-neutral-900 min-h-[50vh] lg:min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="w-full justify-start rounded-none border-b border-neutral-800 bg-neutral-950 h-12 px-2">
              <TabsTrigger 
                value="notes" 
                className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white gap-2"
              >
                <PenLine className="h-4 w-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger 
                value="drive" 
                className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                Drive
              </TabsTrigger>
            </TabsList>
            <TabsContent value="notes" className="flex-1 m-0 overflow-hidden">
              <Notepad 
                videoId={videoInfo.videoId} 
                currentVideoTime={currentTime}
              />
            </TabsContent>
            <TabsContent value="drive" className="flex-1 m-0 overflow-hidden">
              <DrivePanel />
            </TabsContent>
          </Tabs>
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
