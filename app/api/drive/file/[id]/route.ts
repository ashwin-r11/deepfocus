import { NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@/lib/auth"

// GET /api/drive/file/[id] - Get file details or content
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: fileId } = await params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || "metadata"

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const drive = google.drive({ version: "v3", auth: oauth2Client })

    if (action === "metadata") {
      // Get file metadata
      const response = await drive.files.get({
        fileId,
        fields: "id, name, mimeType, size, modifiedTime, iconLink, webViewLink, webContentLink, thumbnailLink, parents",
      })

      return NextResponse.json(response.data)
    } else if (action === "embed") {
      // Return embed URL for preview
      const response = await drive.files.get({
        fileId,
        fields: "id, name, mimeType, webViewLink",
      })

      const file = response.data
      let embedUrl = ""

      // Generate appropriate embed URL based on file type
      if (file.mimeType === "application/pdf") {
        embedUrl = `https://drive.google.com/file/d/${fileId}/preview`
      } else if (file.mimeType?.startsWith("image/")) {
        embedUrl = `https://drive.google.com/uc?id=${fileId}`
      } else if (file.mimeType === "application/vnd.google-apps.document") {
        embedUrl = `https://docs.google.com/document/d/${fileId}/preview`
      } else if (file.mimeType === "application/vnd.google-apps.spreadsheet") {
        embedUrl = `https://docs.google.com/spreadsheets/d/${fileId}/preview`
      } else if (file.mimeType === "application/vnd.google-apps.presentation") {
        embedUrl = `https://docs.google.com/presentation/d/${fileId}/preview`
      } else {
        embedUrl = `https://drive.google.com/file/d/${fileId}/preview`
      }

      return NextResponse.json({
        ...file,
        embedUrl,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error getting Drive file:", error)
    return NextResponse.json({ error: "Failed to get file" }, { status: 500 })
  }
}
