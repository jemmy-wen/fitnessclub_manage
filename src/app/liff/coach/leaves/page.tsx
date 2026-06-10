"use client"

import { useMemo } from "react"
import { useMockData } from "@/context/MockDataContext"
import { CheckCircle, XCircle } from "lucide-react"

export default function CoachLeavesPage() {
  const {
    activeUser,
    coaches,
    students,
    courses,
    leaveRequests,
    updateLeaveStatus,
    addNotification,
  } = useMockData()

  const coach = coaches.find(item => item.lineUserId === activeUser.userId) ?? coaches[0]
  const myStudentIds = useMemo(
    () => students.filter(student => student.coachId === coach.id).map(student => student.id),
    [coach.id, students]
  )
  const pendingLeaves = leaveRequests.filter(leave => leave.status === "pending" && myStudentIds.includes(leave.studentId))
  const processedLeaves = leaveRequests
    .filter(leave => leave.status !== "pending" && myStudentIds.includes(leave.studentId))
    .slice(0, 5)

  function confirmLeave(leaveId: string) {
    const leave = leaveRequests.find(item => item.id === leaveId)
    const student = students.find(item => item.id === leave?.studentId)
    const course = courses.find(item => item.id === leave?.courseId)
    updateLeaveStatus(leaveId, "confirmed", "教練已確認收到")
    if (student?.lineUserId) {
      addNotification({
        targetUserId: student.lineUserId,
        targetRole: "student",
        message: `教練已收到你的請假申請（${course?.title ?? "課程"}）`,
        type: "leave_confirmed",
      })
    }
  }

  function rejectLeave(leaveId: string) {
    const leave = leaveRequests.find(item => item.id === leaveId)
    const student = students.find(item => item.id === leave?.studentId)
    const course = courses.find(item => item.id === leave?.courseId)
    updateLeaveStatus(leaveId, "rejected", "教練無法批准，請直接聯繫教練")
    if (student?.lineUserId) {
      addNotification({
        targetUserId: student.lineUserId,
        targetRole: "student",
        message: `教練無法批准你的請假申請（${course?.title ?? "課程"}），請直接聯繫教練。`,
        type: "leave_rejected",
      })
    }
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 px-5 py-5">
      <header className="mb-5">
        <p className="text-xs font-medium text-gray-400">教練任務</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-950">請假審核</h1>
          <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white">
            {pendingLeaves.length} 件待確認
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-gray-500">
          LINE 只顯示摘要；請假明細與確認動作集中在這裡處理。
        </p>
      </header>

      {pendingLeaves.length === 0 ? (
        <section className="rounded-3xl border border-gray-100 bg-white px-5 py-10 text-center shadow-sm">
          <CheckCircle className="mx-auto h-9 w-9 text-[#06C755]" />
          <h2 className="mt-3 text-base font-bold text-gray-950">目前沒有待確認請假</h2>
          <p className="mt-1 text-sm text-gray-400">新的請假申請會即時出現在這裡。</p>
        </section>
      ) : (
        <section className="space-y-3">
          {pendingLeaves.map(leave => {
            const student = students.find(item => item.id === leave.studentId)
            const course = courses.find(item => item.id === leave.courseId)
            return (
              <article key={leave.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-gray-950">{student?.name ?? "學員"}</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {course?.title ?? "課程"} · {leave.date}
                    </p>
                    <p className="mt-3 rounded-2xl bg-gray-50 px-3 py-2 text-sm leading-6 text-gray-700">
                      {leave.reason ? `原因：${leave.reason}` : "未填寫原因"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => confirmLeave(leave.id)}
                    className="rounded-2xl bg-gray-950 py-3 text-sm font-bold text-white"
                  >
                    確認收到
                  </button>
                  <button
                    onClick={() => rejectLeave(leave.id)}
                    className="rounded-2xl bg-red-50 py-3 text-sm font-bold text-red-600"
                  >
                    拒絕
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      )}

      {processedLeaves.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-bold text-gray-950">最近已處理</h2>
          <div className="space-y-2">
            {processedLeaves.map(leave => {
              const student = students.find(item => item.id === leave.studentId)
              const course = courses.find(item => item.id === leave.courseId)
              const confirmed = leave.status === "confirmed"
              return (
                <div key={leave.id} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                  {confirmed ? (
                    <CheckCircle className="h-4 w-4 text-[#06C755]" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">{student?.name ?? "學員"} · {course?.title ?? "課程"}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{leave.date}</p>
                  </div>
                  <span className={`text-xs font-bold ${confirmed ? "text-[#06C755]" : "text-red-500"}`}>
                    {confirmed ? "已確認" : "已拒絕"}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
