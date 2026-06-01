"use client"

import { useState } from "react"
import { useMockData } from "@/context/MockDataContext"
import { useViewMode } from "@/context/ViewModeContext"
import { LeaveRequest, LeaveStatus } from "@/mock/leaves"
import { CheckCircle, XCircle, Clock, Calendar, MessageSquare, TrendingUp } from "lucide-react"

type FilterStatus = "all" | "pending" | "confirmed" | "rejected"

function StatusBadge({ status }: { status: LeaveStatus }) {
  const config = {
    pending: { label: "待確認", class: "bg-amber-100 text-amber-700" },
    confirmed: { label: "已確認", class: "bg-green-100 text-green-700" },
    rejected: { label: "已拒絕", class: "bg-red-100 text-red-600" },
  }
  const c = config[status]
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.class}`}>{c.label}</span>
}

// ── Desktop Table ─────────────────────────────────────────────────────────────
function DesktopTable({ leaves }: { leaves: (LeaveRequest & { studentName: string; courseName: string; coachName: string })[] }) {
  const { updateLeaveStatus } = useMockData()
  const [notes, setNotes] = useState<Record<string, string>>({})

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            {["學員", "課程 / 導師", "請假日期", "原因", "狀態", "備註", "操作"].map(h => (
              <th key={h} className="px-4 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {leaves.map(l => (
            <tr key={l.id} className="hover:bg-gray-50">
              <td className="px-4 py-3.5 font-medium text-gray-900">{l.studentName}</td>
              <td className="px-4 py-3.5">
                <p className="text-gray-700">{l.courseName}</p>
                <p className="text-xs text-gray-400">{l.coachName}</p>
              </td>
              <td className="px-4 py-3.5 text-gray-700">{l.date}</td>
              <td className="px-4 py-3.5 text-gray-600 max-w-[120px] truncate">{l.reason}</td>
              <td className="px-4 py-3.5"><StatusBadge status={l.status} /></td>
              <td className="px-4 py-3.5">
                {l.status === "pending" ? (
                  <input
                    value={notes[l.id] ?? ""}
                    onChange={e => setNotes(prev => ({ ...prev, [l.id]: e.target.value }))}
                    placeholder="備註"
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none w-24"
                  />
                ) : (
                  <span className="text-xs text-gray-500">{l.coachNote || "—"}</span>
                )}
              </td>
              <td className="px-4 py-3.5">
                {l.status === "pending" && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => updateLeaveStatus(l.id, "confirmed", notes[l.id])}
                      className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateLeaveStatus(l.id, "rejected", notes[l.id])}
                      className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Mobile Cards ─────────────────────────────────────────────────────────────
function MobileLeaveList({ leaves }: { leaves: (LeaveRequest & { studentName: string; courseName: string; coachName: string })[] }) {
  const { updateLeaveStatus } = useMockData()
  const [notes, setNotes] = useState<Record<string, string>>({})

  return (
    <div className="space-y-2.5">
      {leaves.map(l => (
        <div key={l.id} className="bg-white rounded-2xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{l.studentName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{l.courseName} · {l.coachName}</p>
            </div>
            <StatusBadge status={l.status} />
          </div>
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" /> {l.date}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MessageSquare className="w-3.5 h-3.5" /> {l.reason}
            </div>
            {l.coachNote && (
              <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">備註：{l.coachNote}</div>
            )}
          </div>
          {l.status === "pending" && (
            <>
              <input
                value={notes[l.id] ?? ""}
                onChange={e => setNotes(prev => ({ ...prev, [l.id]: e.target.value }))}
                placeholder="備註（選填）"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none mb-3 bg-gray-50"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => updateLeaveStatus(l.id, "confirmed", notes[l.id])}
                  className="flex-1 bg-green-500 text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> 確認
                </button>
                <button
                  onClick={() => updateLeaveStatus(l.id, "rejected", notes[l.id])}
                  className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> 拒絕
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export default function LeavesPage() {
  const { leaveRequests, students, courses, coaches } = useMockData()
  const { isMobile } = useViewMode()
  const [filter, setFilter] = useState<FilterStatus>("all")

  const enriched = leaveRequests
    .filter(l => filter === "all" || l.status === filter)
    .map(l => {
      const student = students.find(s => s.id === l.studentId)
      const course = courses.find(c => c.id === l.courseId)
      const coach = coaches.find(c => c.id === course?.coachId)
      return { ...l, studentName: student?.name ?? "", courseName: course?.title ?? "", coachName: coach?.name ?? "" }
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter(l => l.status === "pending").length,
    confirmed: leaveRequests.filter(l => l.status === "confirmed").length,
    attendanceRate: students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + (s.totalSessions > 0 ? s.attendedSessions / s.totalSessions : 0), 0) / students.length * 100)
      : 0,
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">請假紀錄</h1>
      </div>

      {/* Stats */}
      <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
        {[
          { label: "總請假次數", value: stats.total },
          { label: "待確認", value: stats.pending, alert: stats.pending > 0 },
          { label: "已確認", value: stats.confirmed },
          { label: "平均出席率", value: `${stats.attendanceRate}%` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-start justify-between">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              {"alert" in s && s.alert && <span className="w-2 h-2 rounded-full bg-red-400 mt-1 shrink-0" />}
            </div>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {([["all", "全部"], ["pending", "待確認"], ["confirmed", "已確認"], ["rejected", "已拒絕"]] as [FilterStatus, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`shrink-0 text-xs px-3 py-2 rounded-xl font-medium transition-colors ${
              filter === key ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {label}
            {key !== "all" && leaveRequests.filter(l => l.status === key).length > 0 && (
              <span className="ml-1.5 bg-white/20 px-1.5 rounded-full">
                {leaveRequests.filter(l => l.status === key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {enriched.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">沒有符合條件的請假紀錄</div>
      ) : isMobile ? (
        <MobileLeaveList leaves={enriched} />
      ) : (
        <DesktopTable leaves={enriched} />
      )}
    </div>
  )
}
