import { NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@/lib/auth"

const FOLDER_NAME = "DeepFocus Notes"

interface NoteInput {
  timestamp: string
  timestampSeconds: number
  text: string
}

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { videoId, notes, videoTitle } = await request.json() as {
      videoId: string
      notes: NoteInput[]
      videoTitle?: string
    }

    if (!videoId || !notes || notes.length === 0) {
      return NextResponse.json({ error: "Missing videoId or notes" }, { status: 400 })
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const drive = google.drive({ version: "v3", auth: oauth2Client })

    // Find or create the DeepFocus Notes folder
    const folderSearchResponse = await drive.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
    })

    let folderId: string
    if (folderSearchResponse.data.files && folderSearchResponse.data.files.length > 0) {
      folderId = folderSearchResponse.data.files[0].id!
    } else {
      // Create the folder
      const folderResponse = await drive.files.create({
        requestBody: {
          name: FOLDER_NAME,
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      })
      folderId = folderResponse.data.id!
    }

    // Generate markdown content
    const date = new Date()
    const dateStr = date.toISOString().split("T")[0]
    const title = videoTitle || `Video ${videoId}`
    const fileName = `${title} - ${dateStr}.md`

    const content = `# ${title}

**Video ID:** ${videoId}
**Date:** ${dateStr}
**YouTube Link:** https://www.youtube.com/watch?v=${videoId}

---

## Notes

${notes.map((note) => `- **[${note.timestamp}]** ${note.text}`).join("\n")}

---
*Notes captured with DeepFocus*
`

    // Check if file already exists for this video
    const existingFileSearch = await drive.files.list({
      q: `name contains '${videoId}' and '${folderId}' in parents and trashed=false`,
      fields: "files(id, name)",
    })

    let fileId: string
    if (existingFileSearch.data.files && existingFileSearch.data.files.length > 0) {
      // Update existing file
      fileId = existingFileSearch.data.files[0].id!
      await drive.files.update({
        fileId,
        media: {
          mimeType: "text/markdown",
          body: content,
        },
      })
    } else {
      // Create new file
      const fileResponse = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          mimeType: "text/markdown",
        },
        media: {
          mimeType: "text/markdown",
          body: content,
        },
        fields: "id, webViewLink",
      })
      fileId = fileResponse.data.id!
    }

    return NextResponse.json({
      success: true,
      fileId,
      message: "Notes saved to Google Drive",
    })
  } catch (error) {
    console.error("Drive save error:", error)
    return NextResponse.json({ error: "Failed to save notes" }, { status: 500 })
  }
}
