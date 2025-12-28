"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import YouTube, { YouTubePlayer, YouTubeEvent } from "react-youtube"
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, ArrowLeft, 
  SkipBack, SkipForward, Subtitles, ListPlus, FileText 
} from "lucide-react"

interface VideoStageProps {
  videoId?: string
  title?: string
  onTimeUpdate?: (time: number) => void
  onAddToPlaylist?: () => void
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export function VideoStage({ videoId, title, onTimeUpdate, onAddToPlaylist }: VideoStageProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [captionsEnabled, setCaptionsEnabled] = useState(true)
  const [showTranscript, setShowTranscript] = useState(false)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Update progress periodically when playing
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      progressIntervalRef.current = setInterval(async () => {
        if (playerRef.current) {
          const time = await playerRef.current.getCurrentTime()
          const dur = await playerRef.current.getDuration()
          setCurrentTime(time)
          setDuration(dur)
          setProgress((time / dur) * 100)
          onTimeUpdate?.(time)
        }
      }, 1000)
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [isPlaying, onTimeUpdate])

  const onReady = useCallback((event: YouTubeEvent) => {
    playerRef.current = event.target
    setDuration(event.target.getDuration())
    setIsReady(true)
  }, [])

  const onStateChange = useCallback((event: YouTubeEvent) => {
    // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    setIsPlaying(event.data === 1)
  }, [])

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return
    if (isMuted) {
      playerRef.current.unMute()
    } else {
      playerRef.current.mute()
    }
    setIsMuted(!isMuted)
  }, [isMuted])

  const seekTo = useCallback((percent: number) => {
    if (!playerRef.current || !duration) return
    const time = (percent / 100) * duration
    playerRef.current.seekTo(time, true)
    setProgress(percent)
    setCurrentTime(time)
  }, [duration])

  const skip = useCallback((seconds: number) => {
    if (!playerRef.current) return
    const newTime = Math.max(0, Math.min(currentTime + seconds, duration))
    playerRef.current.seekTo(newTime, true)
    setCurrentTime(newTime)
    setProgress((newTime / duration) * 100)
  }, [currentTime, duration])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = (x / rect.width) * 100
    seekTo(percent)
  }, [seekTo])

  // Fullscreen the container (not just iframe) so custom controls stay visible
  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return
    
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } else {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      }
    } catch (err) {
      console.error("Fullscreen error:", err)
    }
  }, [])

  // Listen for fullscreen changes (e.g., user presses Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Toggle captions via YouTube player API
  const toggleCaptions = useCallback(() => {
    if (!playerRef.current) return
    const iframe = playerRef.current.getIframe()
    if (iframe) {
      // YouTube IFrame API doesn't have direct caption toggle, we need to use loadModule
      // This will toggle the cc_load_policy
      setCaptionsEnabled(!captionsEnabled)
    }
  }, [captionsEnabled])

  const youtubeOpts = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 0,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      iv_load_policy: 3,
      disablekb: 1,
      cc_load_policy: captionsEnabled ? 1 : 0, // Enable captions by default
      cc_lang_pref: "en", // Prefer English captions
    },
  }

  return (
    <div className={`flex flex-col h-auto ${isFullscreen ? "" : "p-4 sm:p-6 pb-3"}`}>
      {!isFullscreen && (
        <Link
          href="/"
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors mb-3 sm:mb-4 w-fit touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-mono">Back to Library</span>
        </Link>
      )}

      {/* Video Container - this is what gets fullscreened */}
      <div 
        ref={containerRef}
        className={`relative w-full bg-black rounded-md overflow-hidden ${isFullscreen ? "h-screen" : "aspect-video"}`}
      >
        {videoId ? (
          <YouTube
            videoId={videoId}
            opts={youtubeOpts}
            onReady={onReady}
            onStateChange={onStateChange}
            className="absolute inset-0 w-full h-full"
            iframeClassName="w-full h-full"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground/30 text-sm font-mono">No video selected</div>
          </div>
        )}

        {/* Play Button Overlay */}
        {!isPlaying && isReady && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors hover:bg-black/50 touch-manipulation z-10"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-neutral-900/80 flex items-center justify-center">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-300 ml-1" />
            </div>
          </button>
        )}

        {/* Custom Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-3 sm:p-4 pt-8 z-20">
          {/* Progress Bar */}
          <div
            className="w-full h-2 sm:h-1 bg-neutral-800 rounded-full mb-3 cursor-pointer group touch-manipulation"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-red-600 rounded-full relative transition-all group-hover:bg-red-500"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-3 sm:h-3 bg-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => skip(-10)}
                className="text-neutral-400 hover:text-white transition-colors p-1 touch-manipulation"
                title="Back 10s"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={togglePlay}
                className="text-neutral-400 hover:text-white transition-colors p-1 touch-manipulation"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 sm:w-5 sm:h-5" />
                ) : (
                  <Play className="w-5 h-5 sm:w-5 sm:h-5" />
                )}
              </button>

              <button
                onClick={() => skip(10)}
                className="text-neutral-400 hover:text-white transition-colors p-1 touch-manipulation"
                title="Forward 10s"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={toggleMute}
                className="text-neutral-400 hover:text-white transition-colors p-1 touch-manipulation"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <span className="text-neutral-500 text-[10px] sm:text-xs font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Captions Toggle */}
              <button
                onClick={toggleCaptions}
                className={`p-1 touch-manipulation transition-colors ${
                  captionsEnabled ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                }`}
                title={captionsEnabled ? "Disable captions" : "Enable captions"}
              >
                <Subtitles className="w-5 h-5" />
              </button>

              {/* Add to Playlist */}
              {onAddToPlaylist && (
                <button
                  onClick={onAddToPlaylist}
                  className="text-neutral-400 hover:text-white transition-colors p-1 touch-manipulation"
                  title="Add to playlist"
                >
                  <ListPlus className="w-5 h-5" />
                </button>
              )}

              {/* Fullscreen */}
              <button
                onClick={handleFullscreen}
                className="text-neutral-400 hover:text-white transition-colors p-1 touch-manipulation"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Title & Actions - only show when not fullscreen */}
      {!isFullscreen && (
        <div className="mt-3 sm:mt-4 flex items-start justify-between gap-4">
          <h1 className="text-base sm:text-lg text-neutral-200 font-medium leading-tight">
            {title || "Select a video to start learning"}
          </h1>
          {onAddToPlaylist && (
            <button
              onClick={onAddToPlaylist}
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-md text-sm transition-colors shrink-0"
            >
              <ListPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
