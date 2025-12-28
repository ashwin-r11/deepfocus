import { NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, videoId, videoUrl, dueDate, notes } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const tasks = google.tasks({ version: "v1", auth: oauth2Client })

    // Get the default task list
    const taskListsResponse = await tasks.tasklists.list()
    const defaultList = taskListsResponse.data.items?.[0]
    
    if (!defaultList?.id) {
      return NextResponse.json({ error: "No task list found" }, { status: 404 })
    }

    // Create task body with video link
    let taskNotes = `📺 Watch: ${videoUrl || `https://deepfocus.vercel.app/watch/${videoId}`}`
    if (notes) {
      taskNotes += `\n\n${notes}`
    }

    // Create the task
    const taskResponse = await tasks.tasks.insert({
      tasklist: defaultList.id,
      requestBody: {
        title: `📚 ${title}`,
        notes: taskNotes,
        due: dueDate ? new Date(dueDate).toISOString() : undefined,
      },
    })

    return NextResponse.json({
      task: {
        id: taskResponse.data.id,
        title: taskResponse.data.title,
        notes: taskResponse.data.notes,
        due: taskResponse.data.due,
        status: taskResponse.data.status,
      },
    })
  } catch (error) {
    console.error("Schedule video error:", error)
    return NextResponse.json(
      { error: "Failed to schedule video" },
      { status: 500 }
    )
  }
}
