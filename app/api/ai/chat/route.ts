import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// POST /api/ai/chat - Chat with Gemini AI about video content
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { message, context, videoTitle, notes } = body

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Build context for Gemini
    let systemContext = "You are a helpful learning assistant. "
    if (videoTitle) {
      systemContext += `The user is watching a video titled "${videoTitle}". `
    }
    if (notes) {
      systemContext += `Here are the user's notes from the video:\n${notes}\n\n`
    }
    if (context) {
      systemContext += `Additional context: ${context}\n\n`
    }
    systemContext += "Help the user understand the content, answer questions, and provide explanations. Be concise but thorough."

    // Call Gemini API using user's OAuth token
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
              parts: [{ text: `${systemContext}\n\nUser question: ${message}` }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Gemini API error:", errorData)
      
      // If OAuth doesn't work, provide a helpful message
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ 
          response: "AI features require Gemini API access. You may need to enable the Generative Language API in your Google Cloud Console, or the API might not be available with OAuth yet. Try using an API key instead.",
          error: "auth_error"
        })
      }
      
      return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 })
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response."

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error("Error in AI chat:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
