import { NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: playlistId } = await params
  const { searchParams } = new URL(request.url)
  const pageToken = searchParams.get("pageToken") || undefined
  const maxResults = parseInt(searchParams.get("maxResults") || "50")

  try {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const youtube = google.youtube({ version: "v3", auth: oauth2Client })

    // Get playlist info
    const playlistResponse = await youtube.playlists.list({
      part: ["snippet", "contentDetails"],
      id: [playlistId],
    })

    const playlist = playlistResponse.data.items?.[0]
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Get playlist items
    const itemsResponse = await youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId,
      maxResults,
      pageToken,
    })

    // Get video details for durations
    const videoIds = itemsResponse.data.items
      ?.map((item) => item.contentDetails?.videoId)
      .filter(Boolean) as string[]

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

    const videos = itemsResponse.data.items?.map((item, index) => ({
      id: item.contentDetails?.videoId,
      title: item.snippet?.title,
      description: item.snippet?.description,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      channelTitle: item.snippet?.channelTitle,
      position: item.snippet?.position ?? index,
      duration: item.contentDetails?.videoId ? videoDurations[item.contentDetails.videoId] : undefined,
    }))

    return NextResponse.json({
      playlist: {
        id: playlist.id,
        title: playlist.snippet?.title,
        description: playlist.snippet?.description,
        thumbnail: playlist.snippet?.thumbnails?.medium?.url,
        channelTitle: playlist.snippet?.channelTitle,
        itemCount: playlist.contentDetails?.itemCount,
      },
      videos,
      nextPageToken: itemsResponse.data.nextPageToken,
      totalResults: itemsResponse.data.pageInfo?.totalResults,
    })
  } catch (error) {
    console.error("YouTube playlist error:", error)
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 })
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
