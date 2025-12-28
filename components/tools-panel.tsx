"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { FileText, Calendar, CheckSquare, X, ChevronDown, ExternalLink, GraduationCap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"

interface ToolButton {
  id: string
  label: string
  icon: React.ReactNode
}

const tools: ToolButton[] = [
  { id: "calendar", label: "Schedule", icon: <Calendar className="w-4 h-4" /> },
  { id: "todo", label: "Tasks", icon: <CheckSquare className="w-4 h-4" /> },
  { id: "classroom", label: "Classroom", icon: <GraduationCap className="w-4 h-4" /> },
]

interface CalendarEvent {
  id: string
  title: string
  start: string
  type: "lecture" | "deadline" | "exam" | "office" | "other"
  htmlLink?: string
}

interface Task {
  id: string
  title: string
  completed: boolean
  due?: string
}

interface Course {
  id: string
  name: string
  alternateLink?: string
  assignments: {
    id: string
    title: string
    dueDate?: string
    dueTime?: string
    state: string
    alternateLink?: string
  }[]
}

export function ToolsPanel() {
  const { data: session } = useSession()
  const [activeTool, setActiveTool] = useState<string | null>(null)
  
  // API data states
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskListId, setTaskListId] = useState<string>("")
  const [courses, setCourses] = useState<Course[]>([])
  
  // Loading states
  const [loadingCalendar, setLoadingCalendar] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [loadingClassroom, setLoadingClassroom] = useState(false)

  const fetchCalendarEvents = useCallback(async () => {
    if (!session?.accessToken) return
    setLoadingCalendar(true)
    try {
      const res = await fetch("/api/calendar/events")
      if (res.ok) {
        const data = await res.json()
        setCalendarEvents(data.events || [])
      }
    } catch (error) {
      console.error("Failed to fetch calendar:", error)
    } finally {
      setLoadingCalendar(false)
    }
  }, [session?.accessToken])

  const fetchTasks = useCallback(async () => {
    if (!session?.accessToken) return
    setLoadingTasks(true)
    try {
      const res = await fetch("/api/tasks")
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
        setTaskListId(data.taskListId || "")
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    } finally {
      setLoadingTasks(false)
    }
  }, [session?.accessToken])

  const fetchClassroom = useCallback(async () => {
    if (!session?.accessToken) return
    setLoadingClassroom(true)
    try {
      const res = await fetch("/api/classroom/courses")
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error("Failed to fetch classroom:", error)
    } finally {
      setLoadingClassroom(false)
    }
  }, [session?.accessToken])

  // Fetch data when panel opens
  useEffect(() => {
    if (activeTool === "calendar" && calendarEvents.length === 0) {
      fetchCalendarEvents()
    } else if (activeTool === "todo" && tasks.length === 0) {
      fetchTasks()
    } else if (activeTool === "classroom" && courses.length === 0) {
      fetchClassroom()
    }
  }, [activeTool, calendarEvents.length, tasks.length, courses.length, fetchCalendarEvents, fetchTasks, fetchClassroom])

  const toggleTool = (toolId: string) => {
    setActiveTool(activeTool === toolId ? null : toolId)
  }

  const toggleTask = async (taskId: string, currentCompleted: boolean) => {
    // Optimistic update
    setTasks(tasks.map((task) => 
      task.id === taskId ? { ...task, completed: !currentCompleted } : task
    ))

    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          taskListId,
          completed: !currentCompleted,
        }),
      })
    } catch (error) {
      // Revert on error
      setTasks(tasks.map((task) => 
        task.id === taskId ? { ...task, completed: currentCompleted } : task
      ))
      console.error("Failed to update task:", error)
    }
  }

  const formatEventTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString("en-US", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="px-4 sm:px-6 pb-4">
      {/* Tool Buttons - scrollable on mobile */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-hide">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant="ghost"
            size="sm"
            onClick={() => toggleTool(tool.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm font-mono
              transition-all duration-200 shrink-0 touch-manipulation
              ${
                activeTool === tool.id
                  ? "bg-slate-800 text-slate-200 ring-1 ring-slate-700"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
              }
            `}
          >
            {tool.icon}
            <span>{tool.label}</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${activeTool === tool.id ? "rotate-180" : ""}`}
            />
          </Button>
        ))}
      </div>

      {/* Expandable Content Panels */}
      {activeTool && (
        <div className="bg-slate-900/70 rounded-lg border border-slate-800 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-medium text-slate-300">{tools.find((t) => t.id === activeTool)?.label}</h3>
            <button
              onClick={() => setActiveTool(null)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Panel */}
          {activeTool === "calendar" && (
            <div className="p-4 max-h-48 overflow-y-auto">
              {loadingCalendar ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                </div>
              ) : calendarEvents.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No upcoming events</p>
              ) : (
                <div className="space-y-2">
                  {calendarEvents.map((event) => (
                    <a
                      key={event.id}
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-md hover:bg-slate-800 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            event.type === "deadline"
                              ? "bg-red-400/70"
                              : event.type === "exam"
                                ? "bg-amber-400/70"
                                : event.type === "office"
                                  ? "bg-green-400/70"
                                  : "bg-blue-400/70"
                          }`}
                        />
                        <span className="text-sm text-slate-300">{event.title}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">{formatEventTime(event.start)}</span>
                    </a>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-600 mt-3 font-mono">Synced from Google Calendar</p>
            </div>
          )}

          {/* Tasks Panel */}
          {activeTool === "todo" && (
            <div className="p-4 max-h-48 overflow-y-auto">
              {loadingTasks ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                </div>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No tasks found</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task.id, task.completed)}
                      className="w-full flex items-center gap-3 p-3 bg-slate-800/50 rounded-md hover:bg-slate-800 transition-colors text-left"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          task.completed ? "bg-blue-500/30 border-blue-500/50" : "border-slate-600"
                        }`}
                      >
                        {task.completed && (
                          <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`text-sm font-mono transition-colors ${
                          task.completed ? "text-slate-500 line-through" : "text-slate-300"
                        }`}
                      >
                        {task.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-600 mt-3 font-mono">Synced from Google Tasks</p>
            </div>
          )}

          {/* Classroom Panel */}
          {activeTool === "classroom" && (
            <div className="p-4 max-h-64 overflow-y-auto">
              {loadingClassroom ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                </div>
              ) : courses.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No courses found</p>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id} className="space-y-2">
                      <a
                        href={course.alternateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-slate-300 hover:text-slate-100 flex items-center gap-2"
                      >
                        <GraduationCap className="w-4 h-4 text-blue-400/70" />
                        {course.name}
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                      {course.assignments.length > 0 ? (
                        <div className="pl-6 space-y-1">
                          {course.assignments.map((assignment) => (
                            <a
                              key={assignment.id}
                              href={assignment.alternateLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2 bg-slate-800/30 rounded hover:bg-slate-800/50 transition-colors text-xs"
                            >
                              <span className={`text-slate-400 ${assignment.state === "TURNED_IN" ? "line-through" : ""}`}>
                                {assignment.title}
                              </span>
                              {assignment.dueDate && (
                                <span className="text-slate-600 font-mono">
                                  Due {assignment.dueDate}
                                </span>
                              )}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="pl-6 text-xs text-slate-600">No upcoming assignments</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-600 mt-3 font-mono">Synced from Google Classroom</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
