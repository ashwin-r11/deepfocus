"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Cloud, CloudOff } from "lucide-react"
import { useSession } from "next-auth/react"

interface Note {
  id: number
  timestamp: string
  timestampSeconds: number
  text: string
  flashing: boolean
}

interface NotepadProps {
  videoId?: string
  currentVideoTime?: number
  onNotesChange?: (notes: Note[]) => void
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

function ObsidianLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 65 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M47.5 0L24.3 22.5L0 47.5L24.3 100L47.5 77.5L65 47.5L47.5 0Z" fill="currentColor" fillOpacity="0.9" />
      <path d="M24.3 22.5L47.5 0L65 47.5L24.3 22.5Z" fill="currentColor" fillOpacity="0.6" />
      <path d="M24.3 22.5L65 47.5L47.5 77.5L24.3 22.5Z" fill="currentColor" fillOpacity="0.7" />
      <path d="M24.3 22.5L47.5 77.5L24.3 100L24.3 22.5Z" fill="currentColor" fillOpacity="0.5" />
      <path d="M0 47.5L24.3 22.5L24.3 100L0 47.5Z" fill="currentColor" fillOpacity="0.4" />
    </svg>
  )
}

function GoogleDriveLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 87.3 78" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M6.6 66.85l14.5-25h57.6l-14.5 25z" fill="#0066da" />
      <path d="M57.7 0L28.4 52l14.5 25 43.6-77z" fill="#00ac47" />
      <path d="M0 51.85L14.5 77h43.4L43.4 52z" fill="#ea4335" />
      <path d="M28.6 52l14.5-25-14.5-25H0l28.6 50z" fill="#00832d" />
      <path d="M28.6 52H0l14.5 25h28.4z" fill="#2684fc" />
      <path d="M57.7 0H28.6l14.5 25 14.6 25h28.6z" fill="#ffba00" />
    </svg>
  )
}

export function Notepad({ videoId, currentVideoTime = 0, onNotesChange }: NotepadProps) {
  const { data: session } = useSession()
  const [notes, setNotes] = useState<Note[]>([])
  const [inputValue, setInputValue] = useState("")
  const [exportSuccess, setExportSuccess] = useState(false)
  const [driveSync, setDriveSync] = useState<"idle" | "syncing" | "synced" | "error">("idle")
  const notesContainerRef = useRef<HTMLDivElement>(null)

  // Notify parent of notes changes
  useEffect(() => {
    onNotesChange?.(notes)
  }, [notes, onNotesChange])

  const handleExportToObsidian = () => {
    if (notes.length === 0) return

    // Auto-generate title from date and first note
    const date = new Date()
    const dateStr = date.toISOString().split("T")[0]
    const titlePreview = notes[0].text.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, "")
    const title = `Lecture Notes - ${dateStr} - ${titlePreview}`

    // Auto-generate tags from note content
    const commonTerms = ["concept", "architecture", "scaling", "system", "design", "algorithm", "data", "performance"]
    const tags = commonTerms.filter((term) => notes.some((note) => note.text.toLowerCase().includes(term))).slice(0, 5)

    // Build markdown content
    const frontmatter = `---
title: "${title}"
date: ${dateStr}
tags: [${tags.map((t) => `"${t}"`).join(", ")}]
type: lecture-notes
videoId: ${videoId || "unknown"}
---

`

    const notesContent = notes.map((note) => `- **[${note.timestamp}]** ${note.text}`).join("\n")

    const fullContent = frontmatter + `# ${title}\n\n## Timestamps & Notes\n\n${notesContent}\n`

    // Encode for Obsidian URI
    const encodedTitle = encodeURIComponent(title)
    const encodedContent = encodeURIComponent(fullContent)

    // Open Obsidian with the note content
    const obsidianUri = `obsidian://new?name=${encodedTitle}&content=${encodedContent}`

    window.open(obsidianUri, "_blank")

    // Show success feedback
    setExportSuccess(true)
    setTimeout(() => setExportSuccess(false), 2000)
  }

  const handleSaveToGoogleDrive = async () => {
    if (notes.length === 0 || !session?.accessToken) return

    setDriveSync("syncing")

    try {
      const response = await fetch("/api/drive/save-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          notes: notes.map((n) => ({
            timestamp: n.timestamp,
            timestampSeconds: n.timestampSeconds,
            text: n.text,
          })),
        }),
      })

      if (response.ok) {
        setDriveSync("synced")
        setTimeout(() => setDriveSync("idle"), 3000)
      } else {
        setDriveSync("error")
      }
    } catch {
      setDriveSync("error")
    }
  }

  const handleCapture = () => {
    if (!inputValue.trim()) return

    const newNote: Note = {
      id: Date.now(),
      timestamp: formatTime(currentVideoTime),
      timestampSeconds: currentVideoTime,
      text: inputValue.trim(),
      flashing: false,
    }

    setNotes((prev) => [...prev, newNote])
    setInputValue("")

    setTimeout(() => {
      if (notesContainerRef.current) {
        notesContainerRef.current.scrollTop = notesContainerRef.current.scrollHeight
      }
    }, 50)
  }

  const handleTimestampClick = (noteId: number) => {
    setNotes((prev) => prev.map((note) => (note.id === noteId ? { ...note, flashing: true } : note)))

    setTimeout(() => {
      setNotes((prev) => prev.map((note) => (note.id === noteId ? { ...note, flashing: false } : note)))
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCapture()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with export buttons */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center justify-between gap-2">
        <h2 className="text-xs sm:text-sm font-medium text-slate-400 tracking-wide uppercase">Session Notes</h2>
        <div className="flex items-center gap-2">
          {/* Google Drive Sync Button */}
          {session && (
            <button
              onClick={handleSaveToGoogleDrive}
              disabled={notes.length === 0 || driveSync === "syncing"}
              className={`
                flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono
                transition-all duration-200 touch-manipulation shrink-0
                ${
                  driveSync === "synced"
                    ? "bg-emerald-900/50 text-emerald-400 ring-1 ring-emerald-500/30"
                    : driveSync === "error"
                      ? "bg-red-900/50 text-red-400 ring-1 ring-red-500/30"
                      : "bg-slate-800 text-blue-400/80 hover:bg-slate-700 hover:text-blue-400"
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
              title="Save to Google Drive"
            >
              {driveSync === "syncing" ? (
                <Cloud className="w-4 h-4 animate-pulse" />
              ) : driveSync === "synced" ? (
                <Cloud className="w-4 h-4" />
              ) : driveSync === "error" ? (
                <CloudOff className="w-4 h-4" />
              ) : (
                <GoogleDriveLogo className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {driveSync === "syncing" ? "Saving..." : driveSync === "synced" ? "Saved!" : driveSync === "error" ? "Error" : "Drive"}
              </span>
            </button>
          )}
          {/* Obsidian Export Button */}
          <button
            onClick={handleExportToObsidian}
            disabled={notes.length === 0}
            className={`
              flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-mono
              transition-all duration-200 touch-manipulation shrink-0
              ${
                exportSuccess
                  ? "bg-emerald-900/50 text-emerald-400 ring-1 ring-emerald-500/30"
                  : "bg-slate-800 text-purple-400/80 hover:bg-slate-700 hover:text-purple-400"
              }
              disabled:opacity-40 disabled:cursor-not-allowed
            `}
            title="Export to Obsidian"
          >
            <ObsidianLogo className="w-4 h-4" />
            <span className="hidden sm:inline">{exportSuccess ? "Exported!" : "Obsidian"}</span>
          </button>
        </div>
      </div>

      {/* Note Stream */}
      <div ref={notesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="flex gap-2 sm:gap-3 items-start">
            <button
              onClick={() => handleTimestampClick(note.id)}
              className={`
                shrink-0 px-2 py-1 rounded text-[11px] sm:text-xs font-mono touch-manipulation
                bg-slate-800 text-blue-400/80 
                hover:bg-slate-700 hover:text-blue-400 
                transition-all duration-150
                ${note.flashing ? "ring-2 ring-blue-500/50 bg-slate-700" : ""}
              `}
            >
              [{note.timestamp}]
            </button>
            <p className="text-[13px] sm:text-sm text-slate-300 font-mono leading-relaxed">{note.text}</p>
          </div>
        ))}

        {notes.length === 0 && (
          <div className="text-center text-slate-600 text-sm font-mono py-8">
            No notes yet. Start capturing your thoughts.
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 p-3 sm:p-4 border-t border-border bg-background">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a note..."
            className="flex-1 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500 font-mono text-sm focus-visible:ring-slate-600"
          />
          <Button
            onClick={handleCapture}
            variant="secondary"
            className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-mono w-full sm:w-auto touch-manipulation"
          >
            Capture [{formatTime(currentVideoTime)}]
          </Button>
        </div>
      </div>
    </div>
  )
}
