import { NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@/lib/auth"

// GET - List user's subscriptions
export async function GET(request: Request) {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const pageToken = searchParams.get("pageToken") || undefined
  const maxResults = parseInt(searchParams.get("maxResults") || "25")

  try {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const youtube = google.youtube({ version: "v3", auth: oauth2Client })

    const response = await youtube.subscriptions.list({
      part: ["snippet", "contentDetails"],
      mine: true,
      maxResults,
      pageToken,
      order: "alphabetical",
    })

    const subscriptions = response.data.items?.map((item) => ({
      id: item.id, // Subscription ID (for unsubscribe)
      channelId: item.snippet?.resourceId?.channelId,
      title: item.snippet?.title,
      description: item.snippet?.description,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      subscribedAt: item.snippet?.publishedAt,
      newItemCount: item.contentDetails?.newItemCount,
      totalItemCount: item.contentDetails?.totalItemCount,
    })) || []

    return NextResponse.json({
      subscriptions,
      nextPageToken: response.data.nextPageToken,
      totalResults: response.data.pageInfo?.totalResults,
    })
  } catch (error) {
    console.error("Subscriptions error:", error)
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
  }
}

// POST - Subscribe to a channel
export async function POST(request: Request) {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { channelId } = await request.json()

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID required" }, { status: 400 })
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const youtube = google.youtube({ version: "v3", auth: oauth2Client })

    const response = await youtube.subscriptions.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          resourceId: {
            kind: "youtube#channel",
            channelId,
          },
        },
      },
    })

    return NextResponse.json({
      id: response.data.id,
      channelId: response.data.snippet?.resourceId?.channelId,
      title: response.data.snippet?.title,
      success: true,
    })
  } catch (error: any) {
    if (error?.response?.data?.error?.errors?.[0]?.reason === "subscriptionDuplicate") {
      return NextResponse.json({ error: "Already subscribed" }, { status: 409 })
    }
    console.error("Subscribe error:", error)
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
  }
}

// DELETE - Unsubscribe from a channel
export async function DELETE(request: Request) {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get("id")

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID required" }, { status: 400 })
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const youtube = google.youtube({ version: "v3", auth: oauth2Client })

    await youtube.subscriptions.delete({
      id: subscriptionId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unsubscribe error:", error)
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
  }
}
