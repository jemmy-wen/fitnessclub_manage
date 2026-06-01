"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, FileX, Users, ClipboardList } from "lucide-react"
import { useMockData } from "@/context/MockDataContext"

const STUDENT_NAV = [
  { href: "/liff", icon: Home, label: "首頁" },
  { href: "/liff/schedule", icon: Calendar, label: "預約課程" },
  { href: "/liff/leave", icon: FileX, label: "請假申請" },
]

const COACH_NAV = [
  { href: "/liff", icon: Home, label: "首頁" },
  { href: "/liff/coach", icon: Calendar, label: "本週課表" },
  { href: "/liff/students", icon: Users, label: "我的學員" },
]

export function LiffNav() {
  const pathname = usePathname()
  const { activeUser, leaveRequests, students } = useMockData()
  const isCoach = activeUser.role === "coach"
  const navItems = isCoach ? COACH_NAV : STUDENT_NAV

  const pendingLeaves = isCoach
    ? leaveRequests.filter(l => {
        const st = students.find(s => s.id === l.studentId)
        return st && l.status === "pending"
      }).length
    : 0

  return (
    <div className="shrink-0 bg-white border-t border-gray-100 safe-area-inset-bottom">
      <div className="flex">
        {navItems.map(item => {
          const isActive =
            item.href === "/liff"
              ? pathname === "/liff"
              : pathname.startsWith(item.href)
          const showBadge = isCoach && item.href === "/liff/coach" && pendingLeaves > 0

          return (
            <Link
              key={item.href}
              href={item.href}
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
