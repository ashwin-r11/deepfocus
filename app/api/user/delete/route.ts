import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Delete all user data in order (respecting foreign key constraints)
    // 1. Delete watch history
    await prisma.watchHistory.deleteMany({
      where: { userId },
    })

    // 2. Delete notes
    await prisma.note.deleteMany({
      where: { userId },
    })

    // 3. Delete playlist videos (from user's playlists)
    const userPlaylists = await prisma.playlist.findMany({
      where: { userId },
      select: { id: true },
    })
    
    for (const playlist of userPlaylists) {
      await prisma.playlistVideo.deleteMany({
        where: { playlistId: playlist.id },
      })
    }

    // 4. Delete playlists
    await prisma.playlist.deleteMany({
      where: { userId },
    })

    // 5. Delete sessions
    await prisma.session.deleteMany({
      where: { userId },
    })

    // 6. Delete accounts (OAuth connections)
    await prisma.account.deleteMany({
      where: { userId },
    })

    // 7. Finally delete the user
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    )
  }
}
