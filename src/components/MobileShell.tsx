"use client"

import React from "react"
import { useSearchParams } from "next/navigation"

const STATUS_TIME = "09:41"

function DefaultStatusBar() {
  return (
    <div className="shrink-0 flex items-center justify-between px-6 bg-white"
      style={{ height: 44, borderBottom: "1px solid #f3f4f6" }}>
      <span className="text-[13px] font-semibold text-gray-900">
        {STATUS_TIME}
      </span>
      <div className="flex items-center gap-1.5">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="#111">
          <rect x="0" y="5" width="3" height="6" rx="1" opacity=".3"/>
          <rect x="4.5" y="3" width="3" height="8" rx="1" opacity=".5"/>
          <rect x="9" y="1" width="3" height="10" rx="1" opacity=".7"/>
          <rect x="13.5" y="0" width="3" height="11" rx="1"/>
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="#111">
          <path d="M8 8a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
          <path d="M3.5 5.5C4.9 4.1 6.35 3.4 8 3.4s3.1.7 4.5 2.1l1.2-1.2C12.1 2.7 10.15 1.9 8 1.9s-4.1.8-5.7 2.4l1.2 1.2z" opacity=".6"/>
          <path d="M1 3C2.9 1.1 5.3 0 8 0s5.1 1.1 7 3l1.2-1.2C14.1.7 11.2-.3 8-.3S1.9.7 0 2.8L1 3z" opacity=".3"/>
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

function DefaultHomeIndicator() {
  return (
    <div className="shrink-0 flex justify-center bg-white py-2">
      <div className="w-[120px] h-[5px] bg-gray-900 rounded-full" />
    </div>
  )
}

export function PhoneFrame({
  children,
  embed = false,
  showChromeInEmbed = false,
  statusBar = <DefaultStatusBar />,
  homeIndicator = <DefaultHomeIndicator />,
  outerClassName = "min-h-screen bg-[#1a1d27] flex items-center justify-center py-8 px-4",
  phoneClassName = "",
  phoneStyle,
}: {
  children: React.ReactNode
  embed?: boolean
  showChromeInEmbed?: boolean
  statusBar?: React.ReactNode
  homeIndicator?: React.ReactNode
  outerClassName?: string
  phoneClassName?: string
  phoneStyle?: React.CSSProperties
}) {
  if (embed) {
    return (
      <div className="h-screen overflow-hidden flex flex-col bg-white">
        {showChromeInEmbed && statusBar}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {children}
        </div>
        {showChromeInEmbed && homeIndicator}
      </div>
    )
  }

  return (
    <div className={outerClassName}>
      <div
        className={`relative flex flex-col overflow-hidden ${phoneClassName}`}
        style={{
          width: 375,
          height: 812,
          borderRadius: 44,
          border: "10px solid #1a1d27",
          outline: "1px solid #2a2d3a",
          boxShadow: "0 0 0 1px #2a2d3a, 0 30px 80px rgba(0,0,0,0.7)",
          background: "#fff",
          ...phoneStyle,
        }}
      >
        {statusBar}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {children}
        </div>
        {homeIndicator}
      </div>
    </div>
  )
}

export function MobileShell({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get("embed") === "1"

  return (
    <PhoneFrame embed={isEmbed}>
      {children}
    </PhoneFrame>
  )
}

/**
 * Admin 手機預覽模式的包裝版本（無外層全螢幕背景，只有框本身）。
 */
export function MobileShellInline({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center py-6">
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: 375,
          minHeight: 700,
          borderRadius: 44,
          border: "10px solid #1a1d27",
          outline: "1px solid #2a2d3a",
          boxShadow: "0 0 0 1px #2a2d3a, 0 20px 60px rgba(0,0,0,0.5)",
          background: "#fff",
        }}
      >
        {/* Minimal status bar */}
        <div className="shrink-0 flex items-center justify-between px-6 bg-white border-b border-gray-100"
          style={{ height: 44 }}>
          <span className="text-[13px] font-semibold text-gray-900">
            {STATUS_TIME}
          </span>
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

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {children}
        </div>

        <div className="shrink-0 flex justify-center bg-white py-2">
          <div className="w-[120px] h-[5px] bg-gray-900 rounded-full" />
        </div>
      </div>
    </div>
  )
}
