import { NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""
  const type = searchParams.get("type") || "video" // video, playlist, channel
  const pageToken = searchParams.get("pageToken") || undefined
  const maxResults = parseInt(searchParams.get("maxResults") || "20")

  try {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const youtube = google.youtube({ version: "v3", auth: oauth2Client })

    // Search based on type
    const searchResponse = await youtube.search.list({
      part: ["snippet"],
      q: query,
      type: [type as "video" | "playlist" | "channel"],
      maxResults,
      pageToken,
      relevanceLanguage: "en",
      safeSearch: "strict",
    })

    let items: any[] = []

    if (type === "video") {
      // Get video details for duration
      const videoIds = searchResponse.data.items?.map((item) => item.id?.videoId).filter(Boolean) as string[]
      
      let videoDurations: Record<string, string> = {}
      if (videoIds.length > 0) {
        const videoDetails = await youtube.videos.list({
          part: ["contentDetails"],
          id: videoIds,
        })
        
        videoDurations = videoDetails.data.items?.reduce((acc, item) => {
          if (item.id && item.contentDetails?.duration) {
            acc[item.id] = formatDuration(item.contentDetails.duration)
          }
          return acc
        }, {} as Record<string, string>) || {}
      }

      items = searchResponse.data.items?.map((item) => ({
        id: item.id?.videoId,
        title: item.snippet?.title,
        description: item.snippet?.description,
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
        channelTitle: item.snippet?.channelTitle,
        publishedAt: item.snippet?.publishedAt,
        duration: item.id?.videoId ? videoDurations[item.id.videoId] : undefined,
        type: "video",
      })) || []
    } else if (type === "playlist") {
      // Get playlist details for video count
      const playlistIds = searchResponse.data.items?.map((item) => item.id?.playlistId).filter(Boolean) as string[]
      
      let playlistDetails: Record<string, number> = {}
      if (playlistIds.length > 0) {
        const details = await youtube.playlists.list({
          part: ["contentDetails"],
          id: playlistIds,
        })
        
        playlistDetails = details.data.items?.reduce((acc, item) => {
          if (item.id && item.contentDetails?.itemCount !== undefined) {
            acc[item.id] = item.contentDetails.itemCount
          }
          return acc
        }, {} as Record<string, number>) || {}
      }

      items = searchResponse.data.items?.map((item) => ({
        id: item.id?.playlistId,
        title: item.snippet?.title,
        description: item.snippet?.description,
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
        channelTitle: item.snippet?.channelTitle,
        videoCount: item.id?.playlistId ? playlistDetails[item.id.playlistId] : undefined,
        type: "playlist",
      })) || []
    } else if (type === "channel") {
      // Get channel details for subscriber count
      const channelIds = searchResponse.data.items?.map((item) => item.id?.channelId).filter(Boolean) as string[]
      
      let channelDetails: Record<string, string> = {}
      if (channelIds.length > 0) {
        const details = await youtube.channels.list({
          part: ["statistics"],
          id: channelIds,
        })
        
        channelDetails = details.data.items?.reduce((acc, item) => {
          if (item.id && item.statistics?.subscriberCount) {
            acc[item.id] = formatSubscribers(parseInt(item.statistics.subscriberCount))
          }
          return acc
        }, {} as Record<string, string>) || {}
      }

      items = searchResponse.data.items?.map((item) => ({
        id: item.id?.channelId,
        title: item.snippet?.title,
        description: item.snippet?.description,
        thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
        channelTitle: item.snippet?.channelTitle,
        subscriberCount: item.id?.channelId ? channelDetails[item.id.channelId] : undefined,
        type: "channel",
      })) || []
    }

    return NextResponse.json({
      items,
      nextPageToken: searchResponse.data.nextPageToken,
      totalResults: searchResponse.data.pageInfo?.totalResults,
    })
  } catch (error) {
    console.error("YouTube search error:", error)
    return NextResponse.json({ error: "Failed to search" }, { status: 500 })
  }
}

// Convert ISO 8601 duration to readable format
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

// Format subscriber count
function formatSubscribers(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M subscribers`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K subscribers`
  }
  return `${count} subscribers`
}
