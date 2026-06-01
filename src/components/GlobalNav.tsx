"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMockData } from "@/context/MockDataContext"

const LINKS = [
  { href: "/line", label: "LINE" },
  { href: "/liff", label: "LIFF" },
  { href: "/admin/dashboard", label: "後台" },
  { href: "/prd", label: "PRD" },
]

export function GlobalNav() {
  const pathname = usePathname()
  const { activeUser, availableUsers, setActiveUser } = useMockData()

  if (pathname === "/") return null

  const isOnLiff = pathname.startsWith("/liff")

  // 各 tab 的 active 判斷
  function isActive(href: string) {
    if (href === "/line") return pathname === "/line"
    if (href === "/liff") return pathname.startsWith("/liff")
    if (href === "/prd") return pathname.startsWith("/prd")
    if (href === "/admin/dashboard") return pathname.startsWith("/admin")
    return false
  }

  const liffStudents = availableUsers.filter(u => u.role === "student")
  const liffCoaches = availableUsers.filter(u => u.role === "coach")

  const isLiffCoach = activeUser.role === "coach"

  function toggleLiffRole() {
    if (isLiffCoach) {
      setActiveUser(liffStudents[0])
    } else {
      setActiveUser(liffCoaches[0])
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5">
      {/* LIFF 身份切換 pill — 只在 LIFF 頁面顯示 */}
      {isOnLiff && (
        <button
          onClick={toggleLiffRole}
          className="flex items-center gap-1.5 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 shadow-xl"
        >
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all ${
            !isLiffCoach ? "bg-blue-500 text-white" : "text-gray-400"
          }`}>
            學員
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all ${
            isLiffCoach ? "bg-[#06C755] text-white" : "text-gray-400"
          }`}>
            教練
          </span>
        </button>
      )}

      {/* 主導航 pill */}
      <div className="flex items-center gap-1 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-full px-2 py-1.5 shadow-xl">
        {LINKS.map(link => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                active ? "bg-white text-gray-900" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
