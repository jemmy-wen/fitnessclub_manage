"use client"

import { useState } from "react"
import { useMockData } from "@/context/MockDataContext"
import { format } from "date-fns"
import { CheckCircle, ChevronLeft } from "lucide-react"
import Link from "next/link"

type Step = "form" | "success"

const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]

export default function LeavePage() {
  const { students, courses, enrollments, coaches, activeUser, addLeaveRequest, addNotification } = useMockData()
  const [step, setStep] = useState<Step>("form")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [date, setDate] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const student = students.find(s => s.lineUserId === activeUser.userId)
  const myEnrollmentIds = enrollments
    .filter(e => e.studentId === student?.id && e.status === "confirmed")
    .map(e => e.courseId)
  const myCourses = courses.filter(c => myEnrollmentIds.includes(c.id))

  function handleSubmit() {
    setError("")
    if (!selectedCourseId || !date || !reason.trim()) {
      setError("請填寫所有欄位")
      return
    }
    const course = courses.find(c => c.id === selectedCourseId)
    const coach = coaches.find(c => c.id === course?.coachId)

    addLeaveRequest({
      studentId: student!.id,
      courseId: selectedCourseId,
      date,
      reason,
      status: "pending",
      coachNote: "",
    })

    if (coach) {
      addNotification({
        targetUserId: coach.lineUserId,
        targetRole: "coach",
        message: `學員 ${student?.name} 已申請 ${date} 請假（${course?.title}）`,
        type: "leave_request",
      })
    }
    addNotification({
      targetUserId: activeUser.userId,
      targetRole: "student",
      message: `您的請假申請已送出，等待導師確認。剩餘堂數 ${student?.remainingSessions} 堂`,
      type: "leave_confirmed",
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
    const course = courses.find(c => c.id === selectedCourseId)
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center bg-gray-50">
        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-5">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1.5">請假申請已送出</h1>
        <p className="text-gray-500 text-sm">{course?.title}</p>
        <p className="text-gray-700 font-semibold mt-1 mb-6">{date}</p>

        <div className="w-full bg-white rounded-2xl p-4 mb-3 border border-gray-100 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">申請狀態</span>
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full font-medium">待導師確認</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">剩餘堂數</span>
            <span className="font-bold text-gray-900">{student.remainingSessions} 堂</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-6">確認後您將收到 LINE 通知</p>

        <Link
          href="/liff"
          className="w-full bg-[#06C755] text-white rounded-2xl py-3.5 font-semibold text-sm text-center block"
        >
          返回首頁
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Nav */}
      <div className="bg-white px-4 py-3.5 flex items-center gap-3 border-b border-gray-100">
        <Link href="/liff" className="p-1 -ml-1">
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="font-semibold text-gray-900 text-sm">請假申請</h1>
          <p className="text-xs text-gray-400">{student.name}</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
        {/* Course select */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2.5">
            請假課程
          </label>
          {myCourses.length === 0 ? (
            <p className="text-sm text-gray-400 bg-white rounded-xl px-4 py-3 border border-gray-100">
              尚未預約任何課程
            </p>
          ) : (
            <div className="space-y-2">
              {myCourses.map(course => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all ${
                    selectedCourseId === course.id
                      ? "border-[#06C755] bg-white ring-1 ring-[#06C755]"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
                      <span className="font-medium text-gray-900 text-sm truncate">{course.title}</span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      週{DAY_LABELS[course.dayOfWeek]} {format(new Date(course.startTime), "HH:mm")}
                    </span>
                  </div>
                  {selectedCourseId === course.id && (
                    <div className="mt-2 flex justify-end">
                      <span className="text-[11px] text-[#06C755] font-medium">已選擇</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2.5">
            請假日期
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2.5">
            請假原因
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="例如：出差、家庭因素、身體不適…"
            rows={3}
            className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755] resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-[#06C755] text-white rounded-2xl py-3.5 font-semibold text-sm"
        >
          送出申請
        </button>
      </div>
    </div>
  )
}
