"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, Calendar, UserCog, ClipboardList, Bell, X, Menu
} from "lucide-react"
import { useState } from "react"
import { useMockData } from "@/context/MockDataContext"

const NAV_SECTIONS = [
  {
    label: "總覽",
    items: [
      { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "管理",
    items: [
      { href: "/admin/students", icon: Users, label: "學員管理" },
      { href: "/admin/coaches", icon: UserCog, label: "導師管理" },
      { href: "/admin/courses", icon: Calendar, label: "課程管理" },
      { href: "/admin/leaves", icon: ClipboardList, label: "請假紀錄" },
    ],
  },
  {
    label: "設定",
    items: [
      { href: "/admin/settings", icon: Bell, label: "推播設定" },
    ],
  },
]

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { leaveRequests, students } = useMockData()
  const pendingLeaves = leaveRequests.filter(l => l.status === "pending").length
  const unpaidStudents = students.filter(s => s.paymentStatus === "unpaid").length

  const badges: Record<string, number> = {
    "/admin/leaves": pendingLeaves,
    "/admin/students": unpaidStudents,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-100 shrink-0">
        <div className="w-7 h-7 bg-[#06C755] rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-[10px] tracking-wide">AC</span>
        </div>
        <span className="font-bold text-gray-900 text-sm">Actflow</span>
        <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">後台</span>
        {onClose && (
          <button onClick={onClose} className="ml-1 p-1 text-gray-400 hover:text-gray-700">
            <X className="w-4.5 h-4.5" size={18} />
          </button>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-1.5">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                const badge = badges[item.href]
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                      isActive
                        ? "bg-[#06C755]/10 text-[#06C755]"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" size={16} />
                    <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
                      {item.label}
                    </span>
                    {badge != null && badge > 0 && (
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? "bg-[#06C755]/20 text-[#06C755]"
                          : "bg-red-50 text-red-500 border border-red-100"
                      }`}>
                        {badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer quick links */}
      <div className="px-5 pb-5 border-t border-gray-100 pt-4 shrink-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">切換介面</p>
        <div className="space-y-1">
          <Link href="/liff" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-800 py-1 transition-colors">
            <span className="w-1.5 h-1.5 bg-[#06C755] rounded-full" /> LIFF App
          </Link>
          <Link href="/line" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-800 py-1 transition-colors">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" /> LINE 模擬器
          </Link>
        </div>
      </div>
    </div>
  )
}

export function DesktopSidebar() {
  return (
    <aside className="hidden md:flex flex-col w-52 shrink-0 bg-white border-r border-gray-100 h-screen sticky top-0">
      <NavContent />
    </aside>
  )
}

export function MobileNavbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const allItems = NAV_SECTIONS.flatMap(s => s.items)
  const label = allItems.find(n => pathname.startsWith(n.href))?.label ?? "後台"

  return (
    <>
      <header className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => setOpen(true)} className="p-1 -ml-1">
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-6 h-6 bg-[#06C755] rounded-md flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-[9px]">AC</span>
        </div>
        <span className="font-semibold text-gray-900 text-sm">{label}</span>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-60 bg-white shadow-2xl">
            <NavContent onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
