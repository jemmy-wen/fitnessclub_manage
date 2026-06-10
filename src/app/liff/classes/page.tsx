"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useMemo } from "react"
import { useMockData } from "@/context/MockDataContext"
import { format, isPast } from "date-fns"
import { zhTW } from "date-fns/locale"
import { CalendarDays, Clock, MapPin, TicketCheck, UserRound } from "lucide-react"

type StudentClass = {
  id: string
  title: string
  coachName: string
  location: string
  start: Date
  end: Date
  source: "enrollment" | "booking"
}

function dateFromParts(date: string, time: string) {
  return new Date(`${date}T${time}:00`)
}

export default function StudentClassesPage() {
  return (
    <Suspense>
      <StudentClassesContent />
    </Suspense>
  )
}

function StudentClassesContent() {
  const {
    activeUser,
    students,
    coaches,
    courses,
    enrollments,
    coachCalendarItems,
  } = useMockData()
  const searchParams = useSearchParams()
  const student = students.find(item => item.lineUserId === activeUser.userId)
  const coach = coaches.find(item => item.id === student?.coachId)
  const isEmbed = searchParams.get("embed") === "1"

  const liffHref = (path: string) => {
    if (!isEmbed) return path
    const params = new URLSearchParams()
    params.set("embed", "1")
    params.set("role", activeUser.role)
    params.set("userId", activeUser.userId)
    return `${path}?${params.toString()}`
  }

  const classes = useMemo<StudentClass[]>(() => {
    if (!student) return []

    const enrolledClasses = enrollments
      .filter(item => item.studentId === student.id && item.status === "confirmed")
      .reduce<StudentClass[]>((list, item) => {
        const course = courses.find(courseItem => courseItem.id === item.courseId)
        if (!course) return list
        const courseCoach = coaches.find(coachItem => coachItem.id === course.coachId)
        list.push({
          id: item.id,
          title: course.title,
          coachName: courseCoach?.name ?? "教練",
          location: course.location,
          start: new Date(course.startTime),
          end: new Date(course.endTime),
          source: "enrollment" as const,
        })
        return list
      }, [])

    const bookedClasses = coachCalendarItems
      .filter(item =>
        item.type === "class" &&
        item.coachId === student.coachId &&
        item.title.includes(student.name)
      )
      .map(item => ({
        id: item.id,
        title: item.title.replace(`${student.name} `, ""),
        coachName: coach?.name ?? "教練",
        location: item.location ?? "未指定場地",
        start: dateFromParts(item.date, item.startTime),
        end: dateFromParts(item.date, item.endTime),
        source: "booking" as const,
      }))

    return [...enrolledClasses, ...bookedClasses]
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [coach?.name, coachCalendarItems, coaches, courses, enrollments, student])

  const upcomingClasses = classes.filter(item => !isPast(item.end))
  const pastClasses = classes.filter(item => isPast(item.end)).slice(-3).reverse()

  if (!student) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-gray-500 mb-4">請先完成身份綁定</p>
          <Link href={liffHref("/liff/onboarding")} className="rounded-xl bg-[#06C755] px-6 py-3 text-sm font-bold text-white">
            前往綁定
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 px-5 py-5">
      <header>
        <p className="text-xs font-medium text-gray-400">學員課程</p>
        <h1 className="mt-1 text-xl font-bold text-gray-950">我的課程</h1>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <TicketCheck className="h-5 w-5 text-[#06C755]" />
            <p className="mt-3 text-xs text-gray-400">剩餘堂數</p>
            <p className="mt-1 text-2xl font-black text-gray-950">{student.remainingSessions}</p>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <CalendarDays className="h-5 w-5 text-gray-900" />
            <p className="mt-3 text-xs text-gray-400">已排課程</p>
            <p className="mt-1 text-2xl font-black text-gray-950">{upcomingClasses.length}</p>
          </div>
        </div>
      </header>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-950">接下來的課</h2>
          <Link href={liffHref("/liff/schedule")} className="text-xs font-bold text-[#06C755]">
            新增預約
          </Link>
        </div>

        {upcomingClasses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-bold text-gray-800">目前沒有已排課程</p>
            <p className="mt-1 text-xs text-gray-400">完成預約後會出現在這裡。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingClasses.map(item => (
              <ClassCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {pastClasses.length > 0 && (
        <section className="mt-7 pb-4">
          <h2 className="mb-3 text-sm font-bold text-gray-950">最近完成</h2>
          <div className="space-y-2">
            {pastClasses.map(item => (
              <div key={item.id} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-bold text-gray-700">{item.title}</p>
                  <span className="shrink-0 text-xs text-gray-400">
                    {format(item.start, "M/d")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ClassCard({ item }: { item: StudentClass }) {
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="h-1.5 bg-[#06C755]" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold text-gray-950">{item.title}</p>
            <p className="mt-1 text-xs font-medium text-gray-400">
              {item.source === "booking" ? "LIFF 預約" : "固定課程"}
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
            {format(item.start, "M/d")}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{format(item.start, "EEEE HH:mm", { locale: zhTW })} - {format(item.end, "HH:mm")}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{item.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-gray-400" />
            <span>{item.coachName} 教練</span>
          </div>
        </div>
      </div>
    </article>
  )
}
