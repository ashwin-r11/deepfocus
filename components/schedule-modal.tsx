"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarPlus, Loader2 } from "lucide-react"

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  video: {
    videoId: string
    title: string
    thumbnail?: string
  }
}

export function ScheduleModal({ isOpen, onClose, video }: ScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSchedule = async () => {
    if (!selectedDate) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.videoId,
          title: video.title,
          dueDate: selectedDate.toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to schedule video")
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setSelectedDate(undefined)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule video")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-950 border-neutral-800 text-neutral-200 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-neutral-100">
            <CalendarPlus className="w-5 h-5" />
            Schedule Video to Tasks
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Video Preview */}
          <div className="flex gap-3 mb-4 p-3 bg-neutral-900 rounded-lg">
            {video.thumbnail && (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-24 h-14 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-300 line-clamp-2">{video.title}</p>
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border border-neutral-800"
            />
          </div>

          {selectedDate && (
            <p className="text-center text-sm text-neutral-400 mt-3">
              Scheduled for: {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}

          {error && (
            <p className="text-center text-sm text-red-400 mt-3">{error}</p>
          )}

          {success && (
            <p className="text-center text-sm text-green-400 mt-3">
              ✓ Added to Google Tasks!
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!selectedDate || isLoading || success}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : success ? (
              "Scheduled!"
            ) : (
              "Add to Tasks"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
