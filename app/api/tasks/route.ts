import { NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const tasks = google.tasks({ version: "v1", auth: oauth2Client })

    // Get the default task list
    const taskListsResponse = await tasks.tasklists.list()
    const defaultList = taskListsResponse.data.items?.[0]
    
    if (!defaultList?.id) {
      return NextResponse.json({ tasks: [] })
    }

    // Get tasks from the default list
    const tasksResponse = await tasks.tasks.list({
      tasklist: defaultList.id,
      showCompleted: true,
      showHidden: false,
      maxResults: 20,
    })

    const taskItems = tasksResponse.data.items?.map((task) => ({
      id: task.id,
      title: task.title,
      notes: task.notes,
      due: task.due,
      completed: task.status === "completed",
      completedAt: task.completed,
      updated: task.updated,
    })) || []

    return NextResponse.json({ 
      tasks: taskItems,
      taskListId: defaultList.id,
    })
  } catch (error) {
    console.error("Tasks error:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { title, notes, due, parent, videoId, videoTitle } = await request.json()

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const tasks = google.tasks({ version: "v1", auth: oauth2Client })

    // Get the default task list
    const taskListsResponse = await tasks.tasklists.list()
    const defaultList = taskListsResponse.data.items?.[0]
    
    if (!defaultList?.id) {
      return NextResponse.json({ error: "No task list found" }, { status: 404 })
    }

    // Build notes with video link if provided
    let taskNotes = notes || ""
    if (videoId) {
      const videoLink = `https://youtube.com/watch?v=${videoId}`
      taskNotes = taskNotes 
        ? `${taskNotes}\n\n📺 Video: ${videoTitle || "Watch Video"}\n${videoLink}`
        : `📺 Video: ${videoTitle || "Watch Video"}\n${videoLink}`
    }

    const response = await tasks.tasks.insert({
      tasklist: defaultList.id,
      parent, // For subtasks - parent task ID
      requestBody: {
        title,
        notes: taskNotes || undefined,
        due: due ? new Date(due).toISOString() : undefined,
      },
    })

    return NextResponse.json({
      id: response.data.id,
      title: response.data.title,
      notes: response.data.notes,
      due: response.data.due,
      completed: false,
      parent: response.data.parent,
    })
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { taskId, taskListId, completed } = await request.json()

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const tasks = google.tasks({ version: "v1", auth: oauth2Client })

    // First get the task to preserve its other properties
    const existingTask = await tasks.tasks.get({
      tasklist: taskListId,
      task: taskId,
    })

    // Update the task status
    await tasks.tasks.update({
      tasklist: taskListId,
      task: taskId,
      requestBody: {
        ...existingTask.data,
        status: completed ? "completed" : "needsAction",
        completed: completed ? new Date().toISOString() : undefined,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}
