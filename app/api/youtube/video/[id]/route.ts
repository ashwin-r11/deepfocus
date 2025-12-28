import { NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@/lib/auth"

async function createYouTubeClient(session: any) {
  // Prefer API key for public data (more reliable, no token expiry issues)
  if (process.env.YOUTUBE_API_KEY) {
    return google.youtube({ version: "v3", auth: process.env.YOUTUBE_API_KEY })
  }
  
  // Fallback to OAuth if API key not available
  if (session?.accessToken) {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })
    return google.youtube({ version: "v3", auth: oauth2Client })
  }
  
  return null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id: videoId } = await params

  try {
    const youtube = await createYouTubeClient(session)
    
    if (!youtube) {
      return NextResponse.json({ error: "No YouTube API credentials available" }, { status: 401 })
    }

    const response = await youtube.videos.list({
      part: ["snippet", "contentDetails", "statistics"],
      id: [videoId],
    })

    const video = response.data.items?.[0]
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: video.id,
      title: video.snippet?.title,
      description: video.snippet?.description,
      thumbnail: video.snippet?.thumbnails?.maxres?.url || 
                 video.snippet?.thumbnails?.high?.url ||
                 video.snippet?.thumbnails?.medium?.url,
      channelTitle: video.snippet?.channelTitle,
      channelId: video.snippet?.channelId,
      publishedAt: video.snippet?.publishedAt,
      duration: video.contentDetails?.duration ? formatDuration(video.contentDetails.duration) : undefined,
      durationSeconds: video.contentDetails?.duration ? parseDurationToSeconds(video.contentDetails.duration) : 0,
      viewCount: video.statistics?.viewCount,
      likeCount: video.statistics?.likeCount,
      tags: video.snippet?.tags?.slice(0, 10),
      categoryId: video.snippet?.categoryId,
    })
  } catch (error) {
    console.error("YouTube video error:", error)
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 })
  }
}

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return "0:00"

  const hours = parseInt(match[1] || "0")
  const minutes = parseInt(match[2] || "0")
  const seconds = parseInt(match[3] || "0")

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

function parseDurationToSeconds(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || "0")
  const minutes = parseInt(match[2] || "0")
  const seconds = parseInt(match[3] || "0")

  return hours * 3600 + minutes * 60 + seconds
}
