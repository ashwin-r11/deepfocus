import { NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@/lib/auth"

// GET /api/drive/search - Search files in Google Drive
export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const mimeType = searchParams.get("mimeType") // Filter by type
    const pageToken = searchParams.get("pageToken") || undefined
    const pageSize = parseInt(searchParams.get("pageSize") || "30")

    if (!query.trim()) {
      return NextResponse.json({ files: [], nextPageToken: null })
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const drive = google.drive({ version: "v3", auth: oauth2Client })

    // Build search query
    let searchQuery = `name contains '${query.replace(/'/g, "\\'")}' and trashed = false`
    if (mimeType) {
      searchQuery += ` and mimeType = '${mimeType}'`
    }

    const response = await drive.files.list({
      q: searchQuery,
      pageSize,
      pageToken,
      fields: "nextPageToken, files(id, name, mimeType, size, modifiedTime, iconLink, webViewLink, thumbnailLink, parents)",
      orderBy: "modifiedTime desc",
    })

    return NextResponse.json({
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken,
    })
  } catch (error) {
    console.error("Error searching Drive files:", error)
    return NextResponse.json({ error: "Failed to search files" }, { status: 500 })
  }
}
