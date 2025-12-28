import { NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@/lib/auth"

// Educational video categories on YouTube
const EDUCATION_CATEGORIES = ["27", "28"] // Education, Science & Technology

export async function GET(request: Request) {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""
  const pageToken = searchParams.get("pageToken") || undefined
  const maxResults = parseInt(searchParams.get("maxResults") || "20")

  try {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const youtube = google.youtube({ version: "v3", auth: oauth2Client })

    // Search with educational filter
    const searchResponse = await youtube.search.list({
      part: ["snippet"],
      q: query,
      type: ["video"],
      videoCategoryId: "27", // Education category
      maxResults,
      pageToken,
      relevanceLanguage: "en",
      safeSearch: "strict",
    })

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

    const videos = searchResponse.data.items?.map((item) => ({
      id: item.id?.videoId,
      title: item.snippet?.title,
      description: item.snippet?.description,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      channelTitle: item.snippet?.channelTitle,
      publishedAt: item.snippet?.publishedAt,
      duration: item.id?.videoId ? videoDurations[item.id.videoId] : undefined,
    }))

    return NextResponse.json({
      videos,
      nextPageToken: searchResponse.data.nextPageToken,
      totalResults: searchResponse.data.pageInfo?.totalResults,
    })
  } catch (error) {
    console.error("YouTube search error:", error)
    return NextResponse.json({ error: "Failed to search videos" }, { status: 500 })
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
