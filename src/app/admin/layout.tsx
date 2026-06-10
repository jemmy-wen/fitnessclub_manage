"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DesktopSidebar, MobileNavbar } from "@/components/admin/Sidebar"
import { AdminBottomNav } from "@/components/admin/BottomNav"
import { Monitor, Smartphone } from "lucide-react"
import { ViewModeContext } from "@/context/ViewModeContext"

function StatusBar() {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
  return (
    <div className="shrink-0 flex items-center justify-between px-6 bg-white border-b border-gray-100" style={{ height: 44 }}>
      <span className="text-[13px] font-semibold text-gray-900">{time}</span>
      <div className="flex items-center gap-1.5">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="#111">
          <rect x="0" y="5" width="3" height="6" rx="1" opacity=".3"/>
          <rect x="4.5" y="3" width="3" height="8" rx="1" opacity=".5"/>
          <rect x="9" y="1" width="3" height="10" rx="1" opacity=".7"/>
          <rect x="13.5" y="0" width="3" height="11" rx="1"/>
        </svg>
        <div className="flex items-center gap-0.5">
          <div className="w-[22px] h-[11px] rounded-[3px] border border-gray-400 relative p-px">
            <div className="bg-gray-800 rounded-sm h-full w-4/5" />
          </div>
          <div className="w-[2px] h-[5px] bg-gray-400 rounded-r-sm" />
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  )
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [mobilePreview, setMobilePreview] = useState(false)
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get("embed") === "1"

  const toggle = (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm shrink-0">
      <button
        onClick={() => setMobilePreview(false)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          !mobilePreview ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        <Monitor className="w-3.5 h-3.5" /> 桌面版
      </button>
      <button
        onClick={() => setMobilePreview(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          mobilePreview ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        <Smartphone className="w-3.5 h-3.5" /> 手機版
      </button>
    </div>
  )

  if (mobilePreview) {
    return (
      <ViewModeContext.Provider value={{ isMobile: true }}>
      {/* 手機預覽：全螢幕深色背景 + 手機框置中 */}
      <div className="fixed inset-0 bg-[#1a1d27] flex flex-col items-center justify-center z-40">
        {/* Toggle 浮在右上 */}
        <div className="absolute top-4 right-4 z-50">{toggle}</div>

        {/* Phone shell */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            width: 375,
            height: "min(812px, calc(100vh - 80px))",
            borderRadius: 44,
            border: "10px solid #111",
            outline: "1px solid #2a2d3a",
            boxShadow: "0 0 0 1px #2a2d3a, 0 30px 80px rgba(0,0,0,0.8)",
            background: "#fff",
          }}
        >
          <StatusBar />
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
            <main className="flex-1 p-4 min-h-0">{children}</main>
          </div>
          <AdminBottomNav />
          <div className="shrink-0 flex justify-center bg-white py-2">
            <div className="w-[120px] h-[5px] bg-gray-900 rounded-full" />
          </div>
        </div>
      </div>
      </ViewModeContext.Provider>
    )
  }

  return (
    <ViewModeContext.Provider value={{ isMobile: false }}>
    {/* 桌面版：正常佈局 */}
    <div className="min-h-screen bg-gray-50 flex">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {!isEmbed && (
          <div className="flex items-center justify-between px-4 pt-3 pb-1 border-b border-gray-100 bg-white">
            <span className="text-xs text-gray-400">後台管理系統</span>
            {toggle}
          </div>
        )}
        <MobileNavbar />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
    </ViewModeContext.Provider>
  )
}
