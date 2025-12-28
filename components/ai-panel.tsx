"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Sparkles, Send, Loader2, ListChecks, FileQuestion, 
  BookOpen, Lightbulb, X, ChevronDown, User, Bot
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIPanelProps {
  videoTitle?: string
  notes?: string
  isExpanded?: boolean
  onToggle?: () => void
}

export function AIPanel({ videoTitle, notes, isExpanded = true, onToggle }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          videoTitle,
          notes,
        }),
      })

      const data = await res.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.error || "Sorry, I couldn't process that request.",
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, there was an error processing your request.",
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSummarize = async (type: "summary" | "keypoints" | "questions" | "flashcards") => {
    if (!notes?.trim()) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "No notes to summarize. Add some notes first!",
        timestamp: new Date(),
      }])
      return
    }

    setIsSummarizing(true)
    
    const typeLabels = {
      summary: "Generate Summary",
      keypoints: "Extract Key Points",
      questions: "Generate Study Questions",
      flashcards: "Create Flashcards",
    }

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content: typeLabels[type],
      timestamp: new Date(),
    }])

    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          videoTitle,
          type,
        }),
      })

      const data = await res.json()
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.result || data.error || "Could not generate content.",
        timestamp: new Date(),
      }])
    } catch (error) {
      console.error("Error summarizing:", error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, there was an error processing your request.",
        timestamp: new Date(),
      }])
    } finally {
      setIsSummarizing(false)
    }
  }

  if (!isExpanded) {
    return null
  }

  return (
    <div className="h-full flex flex-col bg-neutral-950 border-l border-neutral-900">
      {/* Header */}
      <div className="p-3 border-b border-neutral-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-neutral-200">AI Assistant</span>
          </div>
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="text-neutral-500 hover:text-white h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-1 mt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isSummarizing}
                className="text-xs border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
              >
                {isSummarizing ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Lightbulb className="w-3 h-3 mr-1" />
                )}
                AI Actions
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-neutral-950 border-neutral-800">
              <DropdownMenuItem 
                onClick={() => handleSummarize("summary")}
                className="text-neutral-300 focus:bg-neutral-900"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Summarize Notes
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleSummarize("keypoints")}
                className="text-neutral-300 focus:bg-neutral-900"
              >
                <ListChecks className="w-4 h-4 mr-2" />
                Extract Key Points
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleSummarize("questions")}
                className="text-neutral-300 focus:bg-neutral-900"
              >
                <FileQuestion className="w-4 h-4 mr-2" />
                Generate Questions
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleSummarize("flashcards")}
                className="text-neutral-300 focus:bg-neutral-900"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Flashcards
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-8 h-8 text-purple-400/50 mx-auto mb-3" />
            <p className="text-sm text-neutral-500 mb-2">Ask questions about the video</p>
            <p className="text-xs text-neutral-600">
              I can help explain concepts, summarize your notes, or answer questions about the content.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3 h-3 text-purple-400" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-blue-600/20 text-blue-100"
                      : "bg-neutral-900 text-neutral-300"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-blue-400" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-600/20 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-purple-400" />
                </div>
                <div className="bg-neutral-900 rounded-lg px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-neutral-900">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about the video..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={isLoading}
            className="bg-neutral-900 border-neutral-800 text-neutral-200 placeholder:text-neutral-600 text-sm"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
