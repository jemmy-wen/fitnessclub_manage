"use client"

import { useState } from "react"
import { useMockData } from "@/context/MockDataContext"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import { CheckCircle, Users, MapPin, Clock, ChevronLeft } from "lucide-react"
import Link from "next/link"

type Step = "list" | "confirm" | "success"

const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]

export default function SchedulePage() {
  const { courses, enrollments, students, activeUser, enrollStudent, addNotification } = useMockData()
  const [step, setStep] = useState<Step>("list")
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const student = students.find(s => s.lineUserId === activeUser.userId)
  const myEnrollmentIds = enrollments
    .filter(e => e.studentId === student?.id)
    .map(e => e.courseId)

  const availableCourses = courses.filter(c => !myEnrollmentIds.includes(c.id))
  const enrolledCourses = courses.filter(c => myEnrollmentIds.includes(c.id))
  const selectedCourse = courses.find(c => c.id === selectedCourseId)

  function handleEnroll() {
    if (!selectedCourseId || !student) return
    enrollStudent(student.id, selectedCourseId)
    addNotification({
      targetUserId: activeUser.userId,
      targetRole: "student",
      message: `預約成功：${selectedCourse?.title}，時間 週${DAY_LABELS[selectedCourse?.dayOfWeek ?? 0]} ${format(new Date(selectedCourse?.startTime ?? ""), "HH:mm")}`,
      type: "booking_confirmed",
    })
    setStep("success")
  }

  if (!student) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-gray-500 mb-4">請先完成身份綁定</p>
          <Link href="/liff/onboarding" className="bg-[#06C755] text-white rounded-xl px-6 py-3 text-sm font-medium">
            前往綁定
          </Link>
        </div>
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center bg-gray-50">
        <div className="w-16 h-16 bg-[#06C755] rounded-2xl flex items-center justify-center mb-5 shadow-sm">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1.5">預約成功</h1>
        <p className="text-gray-500 text-sm">{selectedCourse?.title}</p>
        <p className="text-gray-700 font-semibold mt-1 mb-6">
          週{DAY_LABELS[selectedCourse?.dayOfWeek ?? 0]}{" "}
          {format(new Date(selectedCourse?.startTime ?? ""), "HH:mm")} –{" "}
          {format(new Date(selectedCourse?.endTime ?? ""), "HH:mm")}
        </p>

        <div className="w-full bg-white rounded-2xl px-5 py-4 mb-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">扣除後剩餘堂數</span>
            <span className="text-xl font-bold text-gray-900">{student.remainingSessions - 1} 堂</span>
          </div>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#06C755] rounded-full"
              style={{ width: `${Math.round(((student.remainingSessions - 1) / student.totalSessions) * 100)}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => setStep("list")}
          className="w-full bg-[#06C755] text-white rounded-2xl py-3.5 font-semibold text-sm"
        >
          繼續瀏覽課程
        </button>
      </div>
    )
  }

  if (step === "confirm" && selectedCourse) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Nav */}
        <div className="bg-white px-4 py-3.5 flex items-center gap-3 border-b border-gray-100">
          <button onClick={() => setStep("list")} className="p-1 -ml-1">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h1 className="font-semibold text-gray-900 text-sm">確認預約</h1>
        </div>

        <div className="flex-1 px-5 py-5 flex flex-col gap-4">
          {/* Course info */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedCourse.color }} />
              <h2 className="font-bold text-gray-900">{selectedCourse.title}</h2>
            </div>
            <div className="space-y-2.5">
              {[
                { icon: Clock, text: `週${DAY_LABELS[selectedCourse.dayOfWeek]} ${format(new Date(selectedCourse.startTime), "HH:mm")} – ${format(new Date(selectedCourse.endTime), "HH:mm")}` },
                { icon: MapPin, text: selectedCourse.location },
                { icon: Users, text: `剩餘名額 ${selectedCourse.capacity - selectedCourse.enrolledCount} / ${selectedCourse.capacity}` },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deduction notice */}
          <div className="bg-gray-50 rounded-2xl px-4 py-3.5 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">預約後堂數變化</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">目前剩餘</span>
              <span className="font-bold text-gray-900">{student.remainingSessions} 堂</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-600">預約扣除</span>
              <span className="font-bold text-gray-500">- 1 堂</span>
            </div>
            <div className="border-t border-gray-200 mt-2 pt-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">確認後剩餘</span>
              <span className="font-bold text-[#06C755]">{student.remainingSessions - 1} 堂</span>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2.5">
            <button
              onClick={handleEnroll}
              disabled={selectedCourse.enrolledCount >= selectedCourse.capacity}
              className="w-full bg-[#06C755] text-white rounded-2xl py-3.5 font-semibold text-sm disabled:bg-gray-200 disabled:text-gray-400"
            >
              確認預約
            </button>
            <button onClick={() => setStep("list")} className="w-full text-gray-500 text-sm py-2">
              取消
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900">預約課程</h1>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-gray-500">剩餘 <span className="font-semibold text-gray-900">{student.remainingSessions}</span> 堂</p>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#06C755] rounded-full"
              style={{ width: `${Math.min(100, Math.round((student.remainingSessions / student.totalSessions) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Course list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {availableCourses.length === 0 ? (
          <div className="text-center text-gray-400 py-12 text-sm">目前已預約所有可用課程</div>
        ) : (
          availableCourses.map(course => {
            const isFull = course.enrolledCount >= course.capacity
            const fillRate = Math.round((course.enrolledCount / course.capacity) * 100)
            return (
              <button
                key={course.id}
                onClick={() => { if (!isFull) { setSelectedCourseId(course.id); setStep("confirm") } }}
                className={`w-full text-left bg-white rounded-2xl p-4 border transition-all ${
                  isFull
                    ? "opacity-50 border-gray-100"
                    : "border-gray-100 active:border-[#06C755] active:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
                      <p className="font-semibold text-gray-900 text-sm truncate">{course.title}</p>
                    </div>
                    <p className="text-xs text-gray-400 ml-4">
                      週{DAY_LABELS[course.dayOfWeek]} · {format(new Date(course.startTime), "HH:mm")}–{format(new Date(course.endTime), "HH:mm")} · {course.location}
                    </p>
                  </div>
                  {isFull ? (
                    <span className="shrink-0 text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">已額滿</span>
                  ) : (
                    <span className="shrink-0 text-xs text-gray-500 font-medium">{course.capacity - course.enrolledCount} 位</span>
                  )}
                </div>
                {/* Fill rate bar */}
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isFull ? "bg-gray-400" : "bg-[#06C755]"}`}
                    style={{ width: `${fillRate}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-right">{course.enrolledCount}/{course.capacity} 人</p>
              </button>
            )
          })
        )}

        {/* Already enrolled */}
        {enrolledCourses.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest px-1 mb-2.5">已預約</p>
            {enrolledCourses.map(course => (
              <div key={course.id} className="flex items-center gap-2.5 bg-white/60 rounded-2xl p-4 mb-2 border border-gray-100">
                <span className="w-2 h-2 rounded-full shrink-0 opacity-50" style={{ backgroundColor: course.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-600 text-sm truncate">{course.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    週{DAY_LABELS[course.dayOfWeek]} {format(new Date(course.startTime), "HH:mm")}
                  </p>
                </div>
                <span className="text-xs text-[#06C755] font-medium shrink-0">已預約</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
