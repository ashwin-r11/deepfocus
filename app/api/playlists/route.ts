import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/playlists - Get all playlists for the current user
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlists = await prisma.playlist.findMany({
      where: { userId: session.user.id },
      include: {
        videos: {
          orderBy: { visibleOrder: "asc" },
          take: 4, // Just get first 4 for thumbnails
        },
        _count: {
          select: { videos: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(playlists)
  } catch (error) {
    console.error("Error fetching playlists:", error)
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 })
  }
}

// POST /api/playlists - Create a new playlist
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, isPublic = false } = body

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const playlist = await prisma.playlist.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        isPublic,
      },
    })

    return NextResponse.json(playlist, { status: 201 })
  } catch (error) {
    console.error("Error creating playlist:", error)
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 })
  }
}
