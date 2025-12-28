import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Add item to tag
export async function POST(request: Request) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { tagId, itemId, itemType, title, thumbnail } = await request.json()

    if (!tagId || !itemId || !itemType) {
      return NextResponse.json({ error: "Tag ID, item ID, and item type required" }, { status: 400 })
    }

    if (!["video", "playlist", "channel"].includes(itemType)) {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 })
    }

    // Verify tag belongs to user
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, userId: session.user.id },
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    const taggedItem = await prisma.taggedItem.create({
      data: {
        tagId,
        itemId,
        itemType,
        title,
        thumbnail,
      },
    })

    return NextResponse.json(taggedItem)
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Item already tagged" }, { status: 409 })
    }
    console.error("Tag item error:", error)
    return NextResponse.json({ error: "Failed to tag item" }, { status: 500 })
  }
}

// DELETE - Remove item from tag
export async function DELETE(request: Request) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get("tagId")
    const itemId = searchParams.get("itemId")
    const itemType = searchParams.get("itemType")

    if (!tagId || !itemId || !itemType) {
      return NextResponse.json({ error: "Tag ID, item ID, and item type required" }, { status: 400 })
    }

    // Verify tag belongs to user
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, userId: session.user.id },
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    await prisma.taggedItem.delete({
      where: {
        tagId_itemId_itemType: {
          tagId,
          itemId,
          itemType,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Untag item error:", error)
    return NextResponse.json({ error: "Failed to remove tag" }, { status: 500 })
  }
}

// GET - Get all tags for a specific item
export async function GET(request: Request) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")
    const itemType = searchParams.get("itemType")

    if (!itemId || !itemType) {
      return NextResponse.json({ error: "Item ID and type required" }, { status: 400 })
    }

    const taggedItems = await prisma.taggedItem.findMany({
      where: {
        itemId,
        itemType,
        tag: { userId: session.user.id },
      },
      include: {
        tag: true,
      },
    })

    return NextResponse.json({
      tags: taggedItems.map(ti => ({
        id: ti.tag.id,
        name: ti.tag.name,
        color: ti.tag.color,
      })),
    })
  } catch (error) {
    console.error("Get item tags error:", error)
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 })
  }
}
