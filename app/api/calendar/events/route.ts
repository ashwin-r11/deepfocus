import { NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const maxResults = parseInt(searchParams.get("maxResults") || "10")
  const timeMin = searchParams.get("timeMin") || new Date().toISOString()
  
  // Default to 7 days ahead
  const defaultTimeMax = new Date()
  defaultTimeMax.setDate(defaultTimeMax.getDate() + 7)
  const timeMax = searchParams.get("timeMax") || defaultTimeMax.toISOString()

  try {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const calendar = google.calendar({ version: "v3", auth: oauth2Client })

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    })

    const events = response.data.items?.map((event) => ({
      id: event.id,
      title: event.summary || "Untitled Event",
      description: event.description,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location,
      htmlLink: event.htmlLink,
      isAllDay: !event.start?.dateTime,
      // Categorize based on common educational keywords
      type: categorizeEvent(event.summary || ""),
    }))

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Calendar error:", error)
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { title, description, start, end, videoId, videoTitle, reminder } = await request.json()

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const calendar = google.calendar({ version: "v3", auth: oauth2Client })

    // Build description with video link if provided
    let eventDescription = description || ""
    if (videoId) {
      const videoLink = `https://youtube.com/watch?v=${videoId}`
      eventDescription = eventDescription 
        ? `${eventDescription}\n\n📺 Video: ${videoTitle || "Watch Video"}\n${videoLink}`
        : `📺 Video: ${videoTitle || "Watch Video"}\n${videoLink}`
    }

    // Parse dates
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : new Date(startDate.getTime() + 60 * 60 * 1000) // Default 1 hour

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        description: eventDescription || undefined,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        reminders: reminder ? {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: reminder },
          ],
        } : { useDefault: true },
      },
    })

    return NextResponse.json({
      id: response.data.id,
      title: response.data.summary,
      start: response.data.start?.dateTime,
      end: response.data.end?.dateTime,
      htmlLink: response.data.htmlLink,
    })
  } catch (error) {
    console.error("Create calendar event error:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}

function categorizeEvent(title: string): "lecture" | "deadline" | "exam" | "office" | "other" {
  const lowerTitle = title.toLowerCase()
  
  if (lowerTitle.includes("exam") || lowerTitle.includes("test") || lowerTitle.includes("quiz")) {
    return "exam"
  }
  if (lowerTitle.includes("due") || lowerTitle.includes("deadline") || lowerTitle.includes("submit")) {
    return "deadline"
  }
  if (lowerTitle.includes("office") || lowerTitle.includes("hours") || lowerTitle.includes("consultation")) {
    return "office"
  }
  if (lowerTitle.includes("lecture") || lowerTitle.includes("class") || lowerTitle.includes("seminar")) {
    return "lecture"
  }
  
  return "other"
}
