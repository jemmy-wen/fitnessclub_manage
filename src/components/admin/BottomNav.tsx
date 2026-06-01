"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Calendar, ClipboardList, MoreHorizontal } from "lucide-react"

const NAV_ITEMS = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "總覽" },
  { href: "/admin/students",  icon: Users,            label: "學員" },
  { href: "/admin/courses",   icon: Calendar,         label: "課程" },
  { href: "/admin/leaves",    icon: ClipboardList,    label: "請假" },
  { href: "/admin/settings",  icon: MoreHorizontal,   label: "設定" },
]

export function AdminBottomNav() {
  const pathname = usePathname()
  return (
    <div className="shrink-0 bg-white border-t border-gray-100 flex items-center px-1 safe-area-pb"
      style={{ height: 60 }}>
      {NAV_ITEMS.map(item => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors"
          >
            <item.icon
              size={20}
              className={isActive ? "text-[#06C755]" : "text-gray-400"}
            />
            <span className={`text-[10px] font-medium ${isActive ? "text-[#06C755]" : "text-gray-400"}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
