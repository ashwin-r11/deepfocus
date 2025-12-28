import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// POST /api/ai/summarize - Summarize notes using Gemini
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notes, videoTitle, type = "summary" } = body

    if (!notes) {
      return NextResponse.json({ error: "Notes are required" }, { status: 400 })
    }

    let prompt = ""
    
    if (type === "summary") {
      prompt = `Please summarize the following notes from a video${videoTitle ? ` titled "${videoTitle}"` : ""}. Provide a clear, concise summary with key points:\n\n${notes}`
    } else if (type === "keypoints") {
      prompt = `Extract the key points and main concepts from these notes${videoTitle ? ` about "${videoTitle}"` : ""}. Format as a bulleted list:\n\n${notes}`
    } else if (type === "questions") {
      prompt = `Based on these notes${videoTitle ? ` about "${videoTitle}"` : ""}, generate 5 study questions that would help someone test their understanding of the material:\n\n${notes}`
    } else if (type === "flashcards") {
      prompt = `Create flashcard-style Q&A pairs from these notes${videoTitle ? ` about "${videoTitle}"` : ""}. Format each as:\nQ: [question]\nA: [answer]\n\nNotes:\n${notes}`
    }

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.5,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Gemini API error:", errorData)
      
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ 
          result: "AI summarization requires Gemini API access. Enable the Generative Language API in Google Cloud Console.",
          error: "auth_error"
        })
      }
      
      return NextResponse.json({ error: "Failed to summarize" }, { status: 500 })
    }

    const data = await response.json()
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate summary."

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Error in AI summarize:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
