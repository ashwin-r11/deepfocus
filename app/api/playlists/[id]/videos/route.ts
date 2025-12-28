import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/playlists/[id]/videos - Add video to playlist
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: playlistId } = await params
    const body = await request.json()
    const { videoId, title, thumbnail, duration, channelName } = body

    if (!videoId || !title) {
      return NextResponse.json(
        { error: "videoId and title are required" },
        { status: 400 }
      )
    }

    // Verify playlist belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId: session.user.id },
      include: { _count: { select: { videos: true } } },
    })

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Check if video already in playlist
    const existingVideo = await prisma.playlistVideo.findUnique({
      where: {
        playlistId_videoId: { playlistId, videoId },
      },
    })

    if (existingVideo) {
      return NextResponse.json(
        { error: "Video already in playlist" },
        { status: 409 }
      )
    }

    // Add video to playlist
    const playlistVideo = await prisma.playlistVideo.create({
      data: {
        playlistId,
        videoId,
        title,
        thumbnail,
        duration,
        channelName,
        visibleOrder: playlist._count.videos, // Add at end
      },
    })

    // Update playlist thumbnail if first video
    if (playlist._count.videos === 0 && thumbnail) {
      await prisma.playlist.update({
        where: { id: playlistId },
        data: { thumbnail },
      })
    }

    return NextResponse.json(playlistVideo, { status: 201 })
  } catch (error) {
    console.error("Error adding video to playlist:", error)
    return NextResponse.json(
      { error: "Failed to add video to playlist" },
      { status: 500 }
    )
  }
}

// DELETE /api/playlists/[id]/videos - Remove video from playlist
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: playlistId } = await params
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get("videoId")

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 })
    }

    // Verify playlist belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId: session.user.id },
    })

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    await prisma.playlistVideo.delete({
      where: {
        playlistId_videoId: { playlistId, videoId },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing video from playlist:", error)
    return NextResponse.json(
      { error: "Failed to remove video from playlist" },
      { status: 500 }
    )
  }
}
