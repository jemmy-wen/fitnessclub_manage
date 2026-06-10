"use client"

import { MobileShell } from "@/components/MobileShell"
import { LiffNav } from "@/components/liff/LiffNav"
import { useMockData } from "@/context/MockDataContext"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"

export default function LiffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { activeUser, availableUsers, setActiveUser } = useMockData()
  const isEmbed = searchParams.get("embed") === "1"
  const forcedRole = searchParams.get("role")
  const forcedUserId = searchParams.get("userId")
  const targetUser = availableUsers.find(user => user.userId === forcedUserId)
    ?? availableUsers.find(user => user.role === forcedRole)
  const shouldSwitchUser = Boolean(
    isEmbed &&
    targetUser &&
    targetUser.userId !== activeUser.userId &&
    (forcedRole === "student" || forcedRole === "coach")
  )

  useEffect(() => {
    if (!shouldSwitchUser || !targetUser) return
    setActiveUser(targetUser)
  }, [setActiveUser, shouldSwitchUser, targetUser])

  if (pathname === "/liff" && !isEmbed) {
    return children
  }

  if (shouldSwitchUser) {
    return (
      <MobileShell>
        <div className="flex flex-1 items-center justify-center bg-white text-sm text-gray-400">
          載入中
        </div>
      </MobileShell>
    )
  }

  return (
    <MobileShell>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          {children}
        </div>
        <LiffNav />
      </div>
    </MobileShell>
  )
}
