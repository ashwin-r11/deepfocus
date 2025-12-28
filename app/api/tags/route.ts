import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - List all user tags with item counts
export async function GET() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const tags = await prisma.tag.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { items: true }
        },
        items: {
          take: 5, // Preview of items
          orderBy: { addedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      tags: tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        itemCount: tag._count.items,
        recentItems: tag.items,
        createdAt: tag.createdAt,
      })),
    })
  } catch (error) {
    console.error("Get tags error:", error)
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 })
  }
}

// POST - Create a new tag
export async function POST(request: Request) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, color } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "Tag name required" }, { status: 400 })
    }

    const tag = await prisma.tag.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        color: color || "#6366f1",
      },
    })

    return NextResponse.json(tag)
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Tag already exists" }, { status: 409 })
    }
    console.error("Create tag error:", error)
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 })
  }
}

// PATCH - Update a tag (name or color)
export async function PATCH(request: Request) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { tagId, name, color } = await request.json()

    if (!tagId) {
      return NextResponse.json({ error: "Tag ID required" }, { status: 400 })
    }

    const tag = await prisma.tag.update({
      where: {
        id: tagId,
        userId: session.user.id,
      },
      data: {
        ...(name && { name: name.trim() }),
        ...(color && { color }),
      },
    })

    return NextResponse.json(tag)
  } catch (error) {
    console.error("Update tag error:", error)
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 })
  }
}

// DELETE - Delete a tag
export async function DELETE(request: Request) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get("id")

    if (!tagId) {
      return NextResponse.json({ error: "Tag ID required" }, { status: 400 })
    }

    await prisma.tag.delete({
      where: {
        id: tagId,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete tag error:", error)
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 })
  }
}
