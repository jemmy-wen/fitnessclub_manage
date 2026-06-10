"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { UserRound, Calendar, ClipboardList, FileX, Users } from "lucide-react"
import { useMockData } from "@/context/MockDataContext"

const STUDENT_NAV = [
  { href: "/liff/schedule", icon: Calendar, label: "預約課程" },
  { href: "/liff/classes", icon: ClipboardList, label: "我的課程" },
  { href: "/liff/leave", icon: FileX, label: "請假申請" },
  { href: "/liff/onboarding", icon: UserRound, label: "個人資料" },
]

const COACH_NAV = [
  { href: "/liff/coach", icon: Calendar, label: "本週課表" },
  { href: "/liff/coach/leaves", icon: FileX, label: "請假審核" },
  { href: "/liff/students", icon: Users, label: "我的學員" },
  { href: "/liff/onboarding", icon: UserRound, label: "個人資料" },
]

export function LiffNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { activeUser, coaches, leaveRequests, students } = useMockData()
  const isCoach = activeUser.role === "coach" || pathname.startsWith("/liff/coach")
  const navItems = isCoach ? COACH_NAV : STUDENT_NAV
  const isEmbed = searchParams.get("embed") === "1"

  function getHref(href: string) {
    if (!isEmbed) return href
    const params = new URLSearchParams()
    params.set("embed", "1")
    params.set("role", activeUser.role)
    params.set("userId", activeUser.userId)
    return `${href}?${params.toString()}`
  }

  const activeCoach = coaches.find(coach => coach.lineUserId === activeUser.userId)
  const pendingLeaves = isCoach && activeCoach
    ? leaveRequests.filter(leave => {
        const student = students.find(item => item.id === leave.studentId)
        return student?.coachId === activeCoach.id && leave.status === "pending"
      }).length
    : 0

  return (
    <div className="shrink-0 bg-white border-t border-gray-100 safe-area-inset-bottom">
      <div className="flex">
        {navItems.map(item => {
          const isActive = item.href === "/liff/coach"
            ? pathname === "/liff/coach"
            : pathname.startsWith(item.href)
          const showBadge = isCoach && item.href === "/liff/coach/leaves" && pendingLeaves > 0

          return (
            <Link
              key={item.href}
              href={getHref(item.href)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                isActive ? "text-[#06C755]" : "text-gray-400"
              }`}
            >
              <div className="relative">
                <item.icon
                  className="w-5 h-5"
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {pendingLeaves}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-[#06C755]" : "text-gray-400"}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
