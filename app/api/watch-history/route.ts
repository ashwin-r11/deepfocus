import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/watch-history - Get user's watch history
export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const includeCompleted = searchParams.get("includeCompleted") === "true"

    const watchHistory = await prisma.watchHistory.findMany({
      where: {
        userId: session.user.id,
        ...(includeCompleted ? {} : { completed: false }),
      },
      orderBy: { lastWatched: "desc" },
      take: limit,
    })

    return NextResponse.json(watchHistory)
  } catch (error) {
    console.error("Error fetching watch history:", error)
    return NextResponse.json({ error: "Failed to fetch watch history" }, { status: 500 })
  }
}

// POST /api/watch-history - Update watch progress
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { videoId, videoTitle, thumbnail, channelName, progress, duration } = body

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 })
    }

    // Calculate if video is completed (watched 90% or more)
    const completed = duration > 0 && progress / duration >= 0.9

    const watchHistory = await prisma.watchHistory.upsert({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId,
        },
      },
      update: {
        progress: Math.floor(progress),
        duration: Math.floor(duration),
        completed,
        lastWatched: new Date(),
        ...(videoTitle && { videoTitle }),
        ...(thumbnail && { thumbnail }),
        ...(channelName && { channelName }),
      },
      create: {
        userId: session.user.id,
        videoId,
        videoTitle,
        thumbnail,
        channelName,
        progress: Math.floor(progress),
        duration: Math.floor(duration),
        completed,
      },
    })

    return NextResponse.json(watchHistory)
  } catch (error) {
    console.error("Error updating watch history:", error)
    return NextResponse.json({ error: "Failed to update watch history" }, { status: 500 })
  }
}

// DELETE /api/watch-history - Remove from watch history
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get("videoId")

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 })
    }

    await prisma.watchHistory.delete({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting watch history:", error)
    return NextResponse.json({ error: "Failed to delete watch history" }, { status: 500 })
  }
}
