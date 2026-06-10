"use client"

import { useMemo, useState } from "react"
import { useMockData } from "@/context/MockDataContext"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import { CalendarDays, CheckCircle, Clock, FileX, MapPin } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { LeaveStatus } from "@/mock/leaves"

type View = "form" | "records"
type Step = "form" | "success"
type LeaveCourse = {
  id: string
  title: string
  coachId: string
  date: string
  startTime: string
  endTime: string
  location: string
  color: string
  source: "enrollment" | "booking"
}

const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]
const STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: "待教練確認",
  confirmed: "已確認",
  rejected: "未通過",
}
const STATUS_CLASS: Record<LeaveStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-600",
}

function dateFromParts(date: string, time: string) {
  return new Date(`${date}T${time}:00`)
}

export default function LeavePage() {
  const {
    students,
    courses,
    enrollments,
    coaches,
    coachCalendarItems,
    leaveRequests,
    activeUser,
    addLeaveRequest,
    addNotification,
  } = useMockData()
  const searchParams = useSearchParams()
  const [view, setView] = useState<View>("form")
  const [step, setStep] = useState<Step>("form")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [date, setDate] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const student = students.find(s => s.lineUserId === activeUser.userId)
  const isEmbed = searchParams.get("embed") === "1"
  const liffHref = (path: string) => {
    if (!isEmbed) return path
    const params = new URLSearchParams()
    params.set("embed", "1")
    params.set("role", activeUser.role)
    params.set("userId", activeUser.userId)
    return `${path}?${params.toString()}`
  }

  const leaveCourses = useMemo<LeaveCourse[]>(() => {
    if (!student) return []

    const enrollmentCourseIds = enrollments
      .filter(e => e.studentId === student.id && e.status === "confirmed")
      .map(e => e.courseId)

    const fixedCourses = courses
      .filter(course => enrollmentCourseIds.includes(course.id))
      .map(course => ({
        id: course.id,
        title: course.title,
        coachId: course.coachId,
        date: format(new Date(course.startTime), "yyyy-MM-dd"),
        startTime: format(new Date(course.startTime), "HH:mm"),
        endTime: format(new Date(course.endTime), "HH:mm"),
        location: course.location,
        color: course.color,
        source: "enrollment" as const,
      }))

    const bookingCourses = coachCalendarItems
      .filter(item =>
        item.type === "class" &&
        item.coachId === student.coachId &&
        item.title.includes(student.name)
      )
      .map(item => ({
        id: item.id,
        title: item.title.replace(`${student.name} `, ""),
        coachId: item.coachId,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        location: item.location ?? "未指定場地",
        color: item.color ?? "#06C755",
        source: "booking" as const,
      }))

    return [...fixedCourses, ...bookingCourses]
      .sort((a, b) => dateFromParts(a.date, a.startTime).getTime() - dateFromParts(b.date, b.startTime).getTime())
  }, [coachCalendarItems, courses, enrollments, student])

  const myLeaves = leaveRequests
    .filter(item => item.studentId === student?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const selectedCourse = leaveCourses.find(course => course.id === selectedCourseId)

  function handleSubmit() {
    setError("")
    if (!student) return
    if (!selectedCourse || !date || !reason.trim()) {
      setError("請選擇課程、日期並填寫請假原因")
      return
    }

    const coach = coaches.find(c => c.id === selectedCourse.coachId)
    addLeaveRequest({
      studentId: student.id,
      courseId: selectedCourse.id,
      date,
      reason,
      status: "pending",
      coachNote: "",
    })

    if (coach) {
      const coachStudentIds = students.filter(item => item.coachId === coach.id).map(item => item.id)
      const pendingCount = leaveRequests.filter(item =>
        item.status === "pending" &&
        coachStudentIds.includes(item.studentId)
      ).length + 1

      addNotification({
        targetUserId: coach.lineUserId,
        targetRole: "coach",
        message: `今日待確認請假 ${pendingCount} 件`,
        type: "leave_request",
      })
    }
    addNotification({
      targetUserId: activeUser.userId,
      targetRole: "student",
      message: `請假申請已送出：${selectedCourse.title}`,
      type: "leave_confirmed",
    })

    setStep("success")
    setView("records")
  }

  if (!student) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <div>
          <p className="mb-4 text-gray-500">請先完成身份綁定</p>
          <Link href={liffHref("/liff/onboarding")} className="rounded-xl bg-[#06C755] px-6 py-3 text-sm font-bold text-white">
            前往綁定
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-gray-50">
      <header className="shrink-0 border-b border-gray-100 bg-white px-5 pb-4 pt-5">
        <p className="text-xs font-medium text-gray-400">學員請假</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-950">請假申請</h1>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
            {myLeaves.length} 筆紀錄
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
          {([
            ["form", "送出申請"],
            ["records", "查看紀錄"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`rounded-xl py-2 text-sm font-bold ${
                view === key ? "bg-white text-gray-950 shadow-sm" : "text-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {step === "success" && (
          <section className="mb-5 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#06C755]">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-950">請假申請已送出</p>
                <p className="mt-0.5 text-xs text-gray-400">教練確認後會透過 LINE 通知你。</p>
              </div>
            </div>
          </section>
        )}

        {view === "form" ? (
          <div className="space-y-5">
            <section>
              <h2 className="text-sm font-bold text-gray-950">選擇請假的課程</h2>
              {leaveCourses.length === 0 ? (
                <div className="mt-3 rounded-3xl border border-dashed border-gray-200 bg-white px-5 py-8 text-center">
                  <CalendarDays className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-3 text-sm font-bold text-gray-800">目前沒有可請假的課程</p>
                  <Link href={liffHref("/liff/schedule")} className="mt-3 inline-block text-sm font-bold text-[#06C755]">
                    前往預約
                  </Link>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {leaveCourses.map(course => (
                    <button
                      key={course.id}
                      onClick={() => {
                        setSelectedCourseId(course.id)
                        setDate(course.date)
                      }}
                      className={`w-full rounded-3xl border bg-white p-4 text-left transition ${
                        selectedCourseId === course.id ? "border-[#06C755] ring-1 ring-[#06C755]" : "border-gray-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: course.color }} />
                            <p className="truncate text-sm font-bold text-gray-950">{course.title}</p>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            {course.date} {course.startTime}-{course.endTime}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">{course.location}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500">
                          {course.source === "booking" ? "預約" : `週${DAY_LABELS[dateFromParts(course.date, course.startTime).getDay()]}`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section>
              <label className="mb-2.5 block text-xs font-bold uppercase tracking-widest text-gray-500">
                請假日期
              </label>
              <input
                type="date"
                value={date}
                onChange={event => setDate(event.target.value)}
                className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3.5 text-sm outline-none focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]"
              />
            </section>

            <section>
              <label className="mb-2.5 block text-xs font-bold uppercase tracking-widest text-gray-500">
                請假原因
              </label>
              <textarea
                value={reason}
                onChange={event => setReason(event.target.value)}
                placeholder="例如：身體不適、出差、家庭因素..."
                rows={3}
                className="w-full resize-none rounded-2xl border border-gray-100 bg-white px-4 py-3.5 text-sm outline-none focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]"
              />
            </section>

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="w-full rounded-2xl bg-[#06C755] py-3.5 text-sm font-bold text-white"
            >
              送出申請
            </button>
          </div>
        ) : (
          <section>
            {myLeaves.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center">
                <FileX className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm font-bold text-gray-800">目前沒有請假紀錄</p>
                <p className="mt-1 text-xs text-gray-400">LINE 或 LIFF 送出的請假都會集中在這裡。</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myLeaves.map(leave => {
                  const course = leaveCourses.find(item => item.id === leave.courseId) ?? courses.find(item => item.id === leave.courseId)
                  return (
                    <article key={leave.id} className="rounded-3xl bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-950">{course?.title ?? "課程請假"}</p>
                          <p className="mt-1 text-xs text-gray-400">送出於 {format(new Date(leave.createdAt), "M/d HH:mm")}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_CLASS[leave.status]}`}>
                          {STATUS_LABEL[leave.status]}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{format(new Date(`${leave.date}T00:00:00`), "yyyy年M月d日 EEEE", { locale: zhTW })}</span>
                        </div>
                        {"location" in (course ?? {}) && course?.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{course.location}</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-3 rounded-2xl bg-gray-50 px-3 py-2 text-sm leading-6 text-gray-700">
                        {leave.reason}
                      </p>
                      {leave.coachNote && (
                        <p className="mt-2 text-xs leading-5 text-gray-500">教練備註：{leave.coachNote}</p>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
