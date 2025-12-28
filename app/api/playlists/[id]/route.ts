import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        videos: {
          orderBy: { order: "asc" },
        },
      },
    })

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Check if user owns the playlist or it's public
    if (playlist.userId !== session.user.id && !playlist.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ playlist })
  } catch (error) {
    console.error("Get playlist error:", error)
    return NextResponse.json(
      { error: "Failed to get playlist" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id },
    })

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, thumbnailUrl, isPublic } = body

    const updatedPlaylist = await prisma.playlist.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(isPublic !== undefined && { isPublic }),
      },
    })

    return NextResponse.json({ playlist: updatedPlaylist })
  } catch (error) {
    console.error("Update playlist error:", error)
    return NextResponse.json(
      { error: "Failed to update playlist" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id },
    })

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete all videos in the playlist first
    await prisma.playlistVideo.deleteMany({
      where: { playlistId: id },
    })

    // Delete the playlist
    await prisma.playlist.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete playlist error:", error)
    return NextResponse.json(
      { error: "Failed to delete playlist" },
      { status: 500 }
    )
  }
}
