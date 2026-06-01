"use client"

import { useMockData } from "@/context/MockDataContext"
import { useViewMode } from "@/context/ViewModeContext"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { students, courses, leaveRequests, coaches } = useMockData()
  const { isMobile } = useViewMode()

  const today = new Date()
  const todayDow = today.getDay()
  const todayCourses = courses.filter(c => c.dayOfWeek === todayDow)
  const pendingLeaves = leaveRequests.filter(l => l.status === "pending")
  const unpaidStudents = students.filter(s => s.paymentStatus === "unpaid")
  const lowSessionStudents = students.filter(s => s.remainingSessions <= 3 && s.bindingStatus === "bound")

  const stats = [
    { label: "今日課程", value: todayCourses.length, href: "/admin/courses", alert: false },
    { label: "待確認請假", value: pendingLeaves.length, href: "/admin/leaves", alert: pendingLeaves.length > 0 },
    { label: "未付款學員", value: unpaidStudents.length, href: "/admin/students", alert: unpaidStudents.length > 0 },
    { label: "堂數不足", value: lowSessionStudents.length, href: "/admin/students", alert: lowSessionStudents.length > 0, sub: "≤ 3 堂" },
  ]

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {format(today, "yyyy年 M月 d日 EEEE", { locale: zhTW })}
        </p>
      </div>

      {/* Stats — 2×2 on mobile (via isMobile context), 4-col on desktop */}
      <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
        {stats.map(stat => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition-colors group flex flex-col justify-between min-h-[100px]"
          >
            <div className="flex items-start justify-between">
              <span className="text-3xl font-bold text-gray-900 leading-none">{stat.value}</span>
              {stat.alert && stat.value > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-400 mt-1 shrink-0" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 leading-snug">{stat.label}</p>
              {"sub" in stat && stat.sub && (
                <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Today's courses */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">今日課程</h2>
          <Link href="/admin/courses" className="text-xs text-[#06C755] font-medium flex items-center gap-0.5">
            全部 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {todayCourses.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">今日沒有排課</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {todayCourses.map(course => {
              const coach = coaches.find(c => c.id === course.coachId)
              const fillRate = Math.round((course.enrolledCount / course.capacity) * 100)
              return (
                <div key={course.id} className="px-4 py-3 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{course.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(course.startTime), "HH:mm")}–{format(new Date(course.endTime), "HH:mm")}
                      {coach && ` · ${coach.name}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-700">{course.enrolledCount}/{course.capacity}</p>
                    <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-[#06C755] rounded-full" style={{ width: `${fillRate}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pending leaves */}
      {pendingLeaves.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 text-sm">待確認請假</h2>
              <span className="text-[10px] bg-red-50 text-red-500 border border-red-100 px-1.5 py-0.5 rounded-full font-semibold">
                {pendingLeaves.length}
              </span>
            </div>
            <Link href="/admin/leaves" className="text-xs text-[#06C755] font-medium flex items-center gap-0.5">
              全部 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingLeaves.slice(0, 3).map(leave => {
              const student = students.find(s => s.id === leave.studentId)
              const course = courses.find(c => c.id === leave.courseId)
              return (
                <div key={leave.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{student?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{course?.title} · {leave.date}</p>
                  </div>
                  <span className="ml-3 shrink-0 text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-1 rounded-full font-medium">
                    待確認
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom cards */}
      <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 text-sm">未付款學員</h2>
              {unpaidStudents.length > 0 && (
                <span className="text-[10px] bg-red-50 text-red-500 border border-red-100 px-1.5 py-0.5 rounded-full font-semibold">
                  {unpaidStudents.length}
                </span>
              )}
            </div>
            <Link href="/admin/students" className="text-xs text-[#06C755]">查看</Link>
          </div>
          {unpaidStudents.length === 0 ? (
            <p className="px-4 py-5 text-xs text-gray-400">目前無未付款學員</p>
          ) : (
            unpaidStudents.slice(0, 3).map(s => (
              <div key={s.id} className="px-4 py-2.5 flex items-center justify-between border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-800">{s.name}</span>
                <span className="text-[10px] bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full font-medium">未付款</span>
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 text-sm">堂數不足</h2>
              {lowSessionStudents.length > 0 && (
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-semibold">
                  {lowSessionStudents.length}
                </span>
              )}
            </div>
            <Link href="/admin/students" className="text-xs text-[#06C755]">查看</Link>
          </div>
          {lowSessionStudents.length === 0 ? (
            <p className="px-4 py-5 text-xs text-gray-400">目前無堂數不足學員</p>
          ) : (
            lowSessionStudents.slice(0, 3).map(s => (
              <div key={s.id} className="px-4 py-2.5 flex items-center justify-between border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-800">{s.name}</span>
                <span className="text-sm font-bold text-gray-700">{s.remainingSessions} 堂</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
