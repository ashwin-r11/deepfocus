import { NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@/lib/auth"

// GET - Fetch Watch Later playlist videos
export async function GET() {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const youtube = google.youtube({ version: "v3", auth: oauth2Client })

    // Get Watch Later playlist ID (special playlist WL)
    const response = await youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId: "WL", // Watch Later special playlist ID
      maxResults: 50,
    })

    const videos = response.data.items?.map((item) => ({
      id: item.id,
      videoId: item.contentDetails?.videoId,
      title: item.snippet?.title,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      channelTitle: item.snippet?.channelTitle,
      addedAt: item.snippet?.publishedAt,
    })) || []

    return NextResponse.json({ 
      videos,
      totalResults: response.data.pageInfo?.totalResults,
    })
  } catch (error: any) {
    // Watch Later might be private or unavailable
    if (error?.response?.status === 403) {
      return NextResponse.json({ 
        videos: [],
        error: "Watch Later playlist is private or unavailable"
      })
    }
    console.error("Watch Later error:", error)
    return NextResponse.json({ error: "Failed to fetch Watch Later" }, { status: 500 })
  }
}

// POST - Add video to Watch Later
export async function POST(request: Request) {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: "Video ID required" }, { status: 400 })
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const youtube = google.youtube({ version: "v3", auth: oauth2Client })

    const response = await youtube.playlistItems.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          playlistId: "WL", // Watch Later special playlist ID
          resourceId: {
            kind: "youtube#video",
            videoId,
          },
        },
      },
    })

    return NextResponse.json({
      id: response.data.id,
      videoId: response.data.snippet?.resourceId?.videoId,
      title: response.data.snippet?.title,
      success: true,
    })
  } catch (error: any) {
    if (error?.response?.status === 403) {
      return NextResponse.json({ 
        error: "Cannot add to Watch Later - you may need to add it manually on YouTube"
      }, { status: 403 })
    }
    console.error("Add to Watch Later error:", error)
    return NextResponse.json({ error: "Failed to add to Watch Later" }, { status: 500 })
  }
}

// DELETE - Remove video from Watch Later
export async function DELETE(request: Request) {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const playlistItemId = searchParams.get("id")

    if (!playlistItemId) {
      return NextResponse.json({ error: "Playlist item ID required" }, { status: 400 })
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const youtube = google.youtube({ version: "v3", auth: oauth2Client })

    await youtube.playlistItems.delete({
      id: playlistItemId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove from Watch Later error:", error)
    return NextResponse.json({ error: "Failed to remove from Watch Later" }, { status: 500 })
  }
}
