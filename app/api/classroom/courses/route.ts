import { NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })

    const classroom = google.classroom({ version: "v1", auth: oauth2Client })

    // Get courses the user is enrolled in as a student
    const coursesResponse = await classroom.courses.list({
      studentId: "me",
      courseStates: ["ACTIVE"],
    })

    const courses = coursesResponse.data.courses || []
    
    // Get upcoming assignments for each course
    const coursesWithAssignments = await Promise.all(
      courses.slice(0, 5).map(async (course) => {
        try {
          const workResponse = await classroom.courses.courseWork.list({
            courseId: course.id!,
            orderBy: "dueDate asc",
          })

          // Get student submissions to check completion status
          const submissions = await Promise.all(
            (workResponse.data.courseWork || []).slice(0, 5).map(async (work) => {
              try {
                const submissionResponse = await classroom.courses.courseWork.studentSubmissions.list({
                  courseId: course.id!,
                  courseWorkId: work.id!,
                  userId: "me",
                })
                return {
                  workId: work.id,
                  submission: submissionResponse.data.studentSubmissions?.[0],
                }
              } catch {
                return { workId: work.id, submission: null }
              }
            })
          )

          const submissionMap = new Map(
            submissions.map((s) => [s.workId, s.submission])
          )

          const assignments = (workResponse.data.courseWork || [])
            .filter((work) => work.dueDate) // Only show items with due dates
            .slice(0, 5)
            .map((work) => {
              const submission = submissionMap.get(work.id!)
              return {
                id: work.id,
                title: work.title,
                description: work.description,
                dueDate: work.dueDate
                  ? `${work.dueDate.year}-${String(work.dueDate.month).padStart(2, "0")}-${String(work.dueDate.day).padStart(2, "0")}`
                  : null,
                dueTime: work.dueTime
                  ? `${String(work.dueTime.hours || 0).padStart(2, "0")}:${String(work.dueTime.minutes || 0).padStart(2, "0")}`
                  : null,
                maxPoints: work.maxPoints,
                workType: work.workType,
                state: submission?.state || "NEW",
                alternateLink: work.alternateLink,
              }
            })

          return {
            id: course.id,
            name: course.name,
            section: course.section,
            room: course.room,
            alternateLink: course.alternateLink,
            assignments,
          }
        } catch (error) {
          console.error(`Error fetching coursework for ${course.name}:`, error)
          return {
            id: course.id,
            name: course.name,
            section: course.section,
            room: course.room,
            alternateLink: course.alternateLink,
            assignments: [],
          }
        }
      })
    )

    return NextResponse.json({ courses: coursesWithAssignments })
  } catch (error) {
    console.error("Classroom error:", error)
    return NextResponse.json({ error: "Failed to fetch classroom data" }, { status: 500 })
  }
}
