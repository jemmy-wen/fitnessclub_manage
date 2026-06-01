"use client"

import Link from "next/link"
import { useMockData } from "@/context/MockDataContext"
import { Calendar, FileX, BookOpen, Users, ClipboardList, ChevronRight } from "lucide-react"

const STUDENT_ACTIONS = [
  { href: "/liff/schedule", icon: Calendar, label: "預約課程", desc: "瀏覽本週可預約的課程" },
  { href: "/liff/leave", icon: FileX, label: "請假申請", desc: "填寫請假表單並送出申請" },
  { href: "/liff/onboarding", icon: BookOpen, label: "我的資料", desc: "查看綁定狀態與個人資料" },
]

const COACH_ACTIONS = [
  { href: "/liff/coach", icon: Calendar, label: "本週課表", desc: "查看課程與每堂報名名單" },
  { href: "/liff/coach", icon: ClipboardList, label: "待確認請假", desc: "審核學員請假申請" },
  { href: "/liff/students", icon: Users, label: "我的學員", desc: "查看負責學員的堂數與出席" },
]

export default function LiffHomePage() {
  const { activeUser, students, leaveRequests, enrollments } = useMockData()
  const isCoach = activeUser.role === "coach"

  const student = students.find(s => s.lineUserId === activeUser.userId)

  const pendingLeaves = leaveRequests.filter(l => {
    if (!isCoach) return false
    const st = students.find(s => s.id === l.studentId)
    return st?.coachId && l.status === "pending"
  }).length

  const myEnrollmentCount = student
    ? enrollments.filter(e => e.studentId === student.id && e.status === "confirmed").length
    : 0

  const sessionPercent = student
    ? Math.min(100, Math.round((student.remainingSessions / Math.max(student.totalSessions, 1)) * 100))
    : 0

  const actions = isCoach ? COACH_ACTIONS : STUDENT_ACTIONS
  const initials = activeUser.name.slice(0, 2)

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-5 border-b border-gray-100">
        {/* Identity */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 bg-[#06C755] rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm tracking-wide">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">{isCoach ? "導師" : "學員"}</p>
            <p className="font-bold text-gray-900 text-base leading-tight">{activeUser.name}</p>
          </div>
          {pendingLeaves > 0 && (
            <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-medium shrink-0">
              {pendingLeaves} 件待確認
            </span>
          )}
        </div>

        {/* Student stat card */}
        {!isCoach && student && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">剩餘堂數</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-gray-900">{student.remainingSessions}</span>
                  <span className="text-sm text-gray-400">/ {student.totalSessions} 堂</span>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium mt-0.5 ${
                student.paymentStatus === "paid"
                  ? "bg-[#06C755]/10 text-[#06C755]"
                  : "bg-amber-50 text-amber-600 border border-amber-200"
              }`}>
                {student.paymentStatus === "paid" ? "已付款" : "未付款"}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#06C755] rounded-full transition-all duration-500"
                style={{ width: `${sessionPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-gray-400">已預約 {myEnrollmentCount} 堂</span>
              <span className="text-[11px] text-gray-400">{sessionPercent}%</span>
            </div>
          </div>
        )}

        {/* Coach stat card */}
        {isCoach && (
          <div className="bg-gray-50 rounded-2xl px-4 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">今日狀態</p>
              <p className="font-semibold text-gray-900 text-sm mt-0.5">
                {pendingLeaves > 0 ? `${pendingLeaves} 件請假待審核` : "無待處理事項"}
              </p>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${pendingLeaves > 0 ? "bg-amber-400" : "bg-[#06C755]"}`} />
          </div>
        )}
      </div>

      {/* Action list */}
      <div className="flex-1 px-4 py-5">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest px-1 mb-3">功能選單</p>
        <div className="space-y-2">
          {actions.map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3.5 active:bg-gray-50 active:scale-[0.98] transition-all border border-gray-100"
            >
              <div className="w-9 h-9 bg-[#06C755]/10 rounded-xl flex items-center justify-center shrink-0">
                <action.icon className="w-4.5 h-4.5 text-[#06C755]" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{action.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{action.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
