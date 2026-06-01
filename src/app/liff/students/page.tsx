"use client"

import { useState } from "react"
import { useMockData } from "@/context/MockDataContext"
import { Search, ChevronLeft, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function CoachStudentsPage() {
  const { coaches, students, leaveRequests, activeUser } = useMockData()
  const [search, setSearch] = useState("")

  const coach = coaches.find(c => c.lineUserId === activeUser.userId)

  if (!coach) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        請切換為導師身份後查看
      </div>
    )
  }

  const myStudents = students
    .filter(s => s.coachId === coach.id)
    .filter(s => s.name.includes(search) || s.phone.includes(search))

  function getAttendanceRate(studentId: string) {
    const s = students.find(st => st.id === studentId)
    if (!s || s.totalSessions === 0) return 0
    return Math.round((s.attendedSessions / s.totalSessions) * 100)
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/liff" className="p-1 -ml-1">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">我的學員</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋學員姓名或電話"
            className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 bg-gray-50 px-4 py-3 gap-3 border-b border-gray-100">
        {[
          { label: "總學員數", value: myStudents.length },
          { label: "堂數不足", value: myStudents.filter(s => s.remainingSessions <= 3).length },
          { label: "未付款", value: myStudents.filter(s => s.paymentStatus === "unpaid").length },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-2.5 text-center shadow-sm">
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {myStudents.map(student => {
          const rate = getAttendanceRate(student.id)
          const isLow = student.remainingSessions <= 3
          const pendingLeaveCount = leaveRequests.filter(l => l.studentId === student.id && l.status === "pending").length

          return (
            <div key={student.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                    student.bindingStatus === "bound" ? "bg-[#06C755]" : "bg-gray-300"
                  }`}>
                    {student.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    student.bindingStatus === "bound"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {student.bindingStatus === "bound" ? "已綁定" : "未綁定"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className={`rounded-xl px-2 py-2 ${isLow ? "bg-red-50" : "bg-gray-50"}`}>
                  <p className={`text-lg font-bold ${isLow ? "text-red-600" : "text-gray-900"}`}>
                    {student.remainingSessions}
                  </p>
                  <p className="text-[10px] text-gray-500">剩餘堂數</p>
                  {isLow && <AlertCircle className="w-3 h-3 text-red-400 mx-auto mt-0.5" />}
                </div>
                <div className="bg-gray-50 rounded-xl px-2 py-2">
                  <p className="text-lg font-bold text-gray-900">{rate}%</p>
                  <p className="text-[10px] text-gray-500">出席率</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-2 py-2">
                  <p className={`text-lg font-bold ${pendingLeaveCount > 0 ? "text-amber-600" : "text-gray-900"}`}>
                    {pendingLeaveCount}
                  </p>
                  <p className="text-[10px] text-gray-500">待確認假</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
