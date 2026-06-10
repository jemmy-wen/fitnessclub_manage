"use client"

import { useMockData, ActiveUser } from "@/context/MockDataContext"

export function RoleSwitcher() {
  const { activeUser, availableUsers, setActiveUser } = useMockData()

  const roleLabel = { student: "學員", coach: "導師", admin: "管理者" }
  const roleColor = {
    student: "bg-blue-500",
    coach: "bg-[#06C755]",
    admin: "bg-purple-600"
  }

  return (
    <div className="bg-[#1e2535] px-3 py-2 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-[#2a3247]">
      <span className="text-[#8892a4] text-[10px] shrink-0 font-medium">模擬身份：</span>
      {availableUsers.map(user => (
        <button
          key={user.userId}
          onClick={() => setActiveUser(user)}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
            activeUser.userId === user.userId
              ? `${roleColor[user.role]} text-white shadow-sm`
              : "bg-[#2a3247] text-[#8892a4] hover:bg-[#323b52]"
          }`}
        >
          <span className="opacity-70">{roleLabel[user.role]}</span>
          <span>{user.name}</span>
        </button>
      ))}
    </div>
  )
}
