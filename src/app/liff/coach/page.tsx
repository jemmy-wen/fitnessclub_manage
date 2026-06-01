"use client"

import { useState } from "react"
import { useMockData } from "@/context/MockDataContext"
import { format } from "date-fns"
import { Users, Clock, ChevronRight, CheckCircle, Calendar, MessageSquare } from "lucide-react"

type Tab = "schedule" | "leaves"

const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]

export default function CoachPage() {
  const { coaches, courses, enrollments, students, leaveRequests, activeUser, updateLeaveStatus, addNotification } = useMockData()
  const [activeTab, setActiveTab] = useState<Tab>("schedule")
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null)
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})

  const coach = coaches.find(c => c.lineUserId === activeUser.userId)

  if (!coach) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        請切換為導師身份後查看
      </div>
    )
  }

  const myCourses = courses
    .filter(c => c.coachId === coach.id)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)

  const pendingLeaves = leaveRequests.filter(l => {
    const student = students.find(s => s.id === l.studentId)
    return student?.coachId === coach.id && l.status === "pending"
  })

  function getEnrolledStudents(courseId: string) {
    return enrollments
      .filter(e => e.courseId === courseId && e.status === "confirmed")
      .map(e => students.find(s => s.id === e.studentId))
      .filter(Boolean)
  }

  function handleConfirmLeave(leaveId: string) {
    const leave = leaveRequests.find(l => l.id === leaveId)
    const student = students.find(s => s.id === leave?.studentId)
    updateLeaveStatus(leaveId, "confirmed", noteInputs[leaveId] || "")
    if (student) {
      addNotification({
        targetUserId: student.lineUserId ?? "",
        targetRole: "student",
        message: `您的請假申請已確認，剩餘堂數 ${student.remainingSessions} 堂`,
        type: "leave_confirmed",
      })
    }
  }

  function handleRejectLeave(leaveId: string) {
    updateLeaveStatus(leaveId, "rejected", noteInputs[leaveId] || "")
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#06C755] rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">{coach.name.slice(0, 2)}</span>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">導師</p>
            <h1 className="font-bold text-gray-900 text-base leading-tight">{coach.name}</h1>
          </div>
          {pendingLeaves.length > 0 && (
            <span className="ml-auto text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-medium">
              {pendingLeaves.length} 件待確認
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-5">
        <div className="flex gap-5">
          {([["schedule", "本週課表"], ["leaves", "待確認請假"]] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative py-3.5 text-sm font-medium transition-colors ${
                activeTab === key ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {label}
              {key === "leaves" && pendingLeaves.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                  {pendingLeaves.length}
                </span>
              )}
              {activeTab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#06C755] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {activeTab === "schedule" && (
          <>
            {myCourses.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">本週尚未安排課程</div>
            ) : (
              myCourses.map(course => {
                const enrolledStudents = getEnrolledStudents(course.id)
                const isExpanded = expandedCourseId === course.id
                return (
                  <div key={course.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                    <button
                      onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                      className="w-full px-4 py-4 flex items-center justify-between text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
                          <p className="font-semibold text-gray-900 text-sm truncate">{course.title}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            週{DAY_LABELS[course.dayOfWeek]} {format(new Date(course.startTime), "HH:mm")}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Users className="w-3 h-3" />
                            {course.enrolledCount}/{course.capacity}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-50 bg-gray-50 px-4 py-3.5">
                        <p className="text-xs text-gray-400 font-medium mb-2.5">已報名學員 ({enrolledStudents.length})</p>
                        {enrolledStudents.length === 0 ? (
                          <p className="text-sm text-gray-400">目前無人報名</p>
                        ) : (
                          <div className="space-y-2">
                            {enrolledStudents.map(s => s && (
                              <div key={s.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">
                                    {s.name[0]}
                                  </div>
                                  <span className="text-sm text-gray-800">{s.name}</span>
                                </div>
                                <span className="text-xs text-gray-400">剩 {s.remainingSessions} 堂</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </>
        )}

        {activeTab === "leaves" && (
          <>
            {pendingLeaves.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="w-14 h-14 bg-[#06C755]/10 rounded-2xl flex items-center justify-center mb-3">
                  <CheckCircle className="w-7 h-7 text-[#06C755]" />
                </div>
                <p className="text-gray-500 text-sm font-medium">沒有待確認的請假申請</p>
                <p className="text-gray-400 text-xs mt-1">所有請假已處理完畢</p>
              </div>
            ) : (
              pendingLeaves.map(leave => {
                const student = students.find(s => s.id === leave.studentId)
                const course = courses.find(c => c.id === leave.courseId)
                return (
                  <div key={leave.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {/* Top: student + status */}
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                            {student?.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{student?.name}</p>
                            <p className="text-xs text-gray-400">{course?.title}</p>
                          </div>
                        </div>
                        <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-medium shrink-0">待確認</span>
                      </div>

                      <div className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                          {leave.date}
                        </div>
                        <div className="flex items-start gap-2 text-xs text-gray-500">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-gray-400 mt-0.5" />
                          <span>{leave.reason}</span>
                        </div>
                      </div>
                    </div>

                    {/* Note + actions */}
                    <div className="border-t border-gray-50 px-4 pb-4 pt-3 bg-gray-50 space-y-2.5">
                      <input
                        value={noteInputs[leave.id] ?? ""}
                        onChange={e => setNoteInputs(prev => ({ ...prev, [leave.id]: e.target.value }))}
                        placeholder="備註（選填）"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#06C755]"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirmLeave(leave.id)}
                          className="flex-1 bg-[#06C755] text-white rounded-xl py-2.5 text-sm font-semibold"
                        >
                          確認請假
                        </button>
                        <button
                          onClick={() => handleRejectLeave(leave.id)}
                          className="flex-1 bg-white border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-medium"
                        >
                          拒絕
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}
      </div>
    </div>
  )
}
