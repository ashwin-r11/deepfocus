import { NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@/lib/auth"

// GET /api/drive/files - List files from Google Drive
export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId") || "root"
    const mimeType = searchParams.get("mimeType") // e.g., "application/pdf"
    const pageToken = searchParams.get("pageToken") || undefined
    const pageSize = parseInt(searchParams.get("pageSize") || "50")

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const drive = google.drive({ version: "v3", auth: oauth2Client })

    // Build query
    let query = `'${folderId}' in parents and trashed = false`
    if (mimeType) {
      query += ` and mimeType = '${mimeType}'`
    }

    const response = await drive.files.list({
      q: query,
      pageSize,
      pageToken,
      fields: "nextPageToken, files(id, name, mimeType, size, modifiedTime, iconLink, webViewLink, thumbnailLink, parents)",
      orderBy: "folder, name",
    })

    // Separate folders and files
    const files = response.data.files || []
    const folders = files.filter(f => f.mimeType === "application/vnd.google-apps.folder")
    const documents = files.filter(f => f.mimeType !== "application/vnd.google-apps.folder")

    return NextResponse.json({
      folders,
      files: documents,
      nextPageToken: response.data.nextPageToken,
    })
  } catch (error) {
    console.error("Error listing Drive files:", error)
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 })
  }
}
