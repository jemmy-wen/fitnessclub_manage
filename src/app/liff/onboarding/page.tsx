"use client"

import { useState } from "react"
import { useMockData } from "@/context/MockDataContext"
import { CheckCircle, ClipboardList, Dumbbell, Phone, UserRound, WalletCards } from "lucide-react"
import { useSearchParams } from "next/navigation"

type Step = "form" | "success"

export default function OnboardingPage() {
  const { activeUser, students, coaches, bindStudent, addNotification } = useMockData()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>("form")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState("")
  const [boundStudent, setBoundStudent] = useState<{ name: string; coachId: string } | null>(null)
  const isEmbed = searchParams.get("embed") === "1"
  const liffHref = (path: string) => {
    if (!isEmbed) return path
    const params = new URLSearchParams()
    params.set("embed", "1")
    params.set("role", activeUser.role)
    params.set("userId", activeUser.userId)
    return `${path}?${params.toString()}`
  }
  const profileStudent = students.find(s => s.lineUserId === activeUser.userId)
  const profileCoach = coaches.find(c => c.lineUserId === activeUser.userId)
  const studentCoach = coaches.find(c => c.id === profileStudent?.coachId)
  const sessionPercent = profileStudent
    ? Math.min(100, Math.round((profileStudent.attendedSessions / Math.max(profileStudent.totalSessions, 1)) * 100))
    : 0
  const paymentText = {
    paid: "已付款",
    unpaid: "未付款",
    pending: "待確認",
  } as const

  function handleSubmit() {
    setError("")
    if (!name.trim() || !phone.trim() || !inviteCode.trim()) {
      setError("請填寫所有欄位")
      return
    }
    const student = students.find(s => s.inviteCode === inviteCode.trim() && s.bindingStatus === "unbound")
    if (!student) {
      setError("邀請碼無效或已使用，請向導師確認")
      return
    }
    bindStudent(student.id, `Unew${Date.now()}`)
    addNotification({
      targetUserId: "Uadmin001",
      targetRole: "admin",
      message: `新學員 ${name} 已完成身份綁定`,
      type: "binding_complete",
    })
    setBoundStudent({ name, coachId: student.coachId })
    setStep("success")
  }

  if (step === "success") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-[#06C755] rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">綁定成功！</h1>
        <p className="text-gray-500 text-sm mb-1">歡迎加入 Actflow</p>
        <p className="text-gray-700 font-medium mb-8">{boundStudent?.name}</p>
        <div className="w-full bg-gray-50 rounded-2xl p-4 text-left space-y-2 mb-8">
          <p className="text-xs text-gray-500">接下來你可以透過 LINE OA：</p>
          <p className="text-sm text-gray-700">・輸入「我的課表」查看本週課程</p>
          <p className="text-sm text-gray-700">・輸入「請假」申請請假</p>
          <p className="text-sm text-gray-700">・輸入「剩餘堂數」查看課程包</p>
        </div>
        <a
          href={liffHref("/liff/onboarding")}
          className="w-full bg-[#06C755] text-white rounded-xl py-3.5 font-semibold text-sm text-center block"
        >
          返回個人資料
        </a>
      </div>
    )
  }

  if (profileStudent) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 px-5 pb-6 pt-5">
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06C755] text-lg font-bold text-white">
              {profileStudent.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-400">個人資料</p>
              <h1 className="mt-1 truncate text-xl font-bold text-gray-950">{profileStudent.name}</h1>
            </div>
            <span className="rounded-full bg-[#06C755]/10 px-3 py-1 text-xs font-semibold text-[#06C755]">
              已綁定
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <ProfileStat label="剩餘堂數" value={`${profileStudent.remainingSessions} 堂`} />
            <ProfileStat label="付款狀態" value={paymentText[profileStudent.paymentStatus]} />
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-gray-500">出席進度</span>
              <span className="font-semibold text-gray-900">
                {profileStudent.attendedSessions} / {profileStudent.totalSessions}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-[#06C755]" style={{ width: `${sessionPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">基本資訊</p>
          <div className="space-y-3">
            <ProfileRow icon={<Phone className="h-4 w-4" />} label="手機" value={profileStudent.phone} />
            <ProfileRow icon={<Dumbbell className="h-4 w-4" />} label="負責教練" value={studentCoach?.name ?? "未指定"} />
            <ProfileRow icon={<WalletCards className="h-4 w-4" />} label="邀請碼" value={profileStudent.inviteCode} />
            <ProfileRow icon={<ClipboardList className="h-4 w-4" />} label="加入日期" value={profileStudent.joinedAt} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <a href={liffHref("/liff/schedule")} className="rounded-2xl bg-[#06C755] py-3 text-center text-sm font-bold text-white">
            預約課程
          </a>
          <a href={liffHref("/liff/leave")} className="rounded-2xl bg-white py-3 text-center text-sm font-bold text-gray-700 border border-gray-100">
            請假申請
          </a>
        </div>
      </div>
    )
  }

  if (profileCoach) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 px-5 pb-6 pt-5">
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900 text-lg font-bold text-white">
              {profileCoach.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-400">教練資料</p>
              <h1 className="mt-1 truncate text-xl font-bold text-gray-950">{profileCoach.name}</h1>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              教練
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <ProfileRow icon={<Phone className="h-4 w-4" />} label="手機" value={profileCoach.phone} />
            <ProfileRow icon={<Dumbbell className="h-4 w-4" />} label="專長" value={profileCoach.specialties.join("、")} />
            <ProfileRow icon={<UserRound className="h-4 w-4" />} label="負責學員" value={`${students.filter(s => s.coachId === profileCoach.id).length} 位`} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <a href={liffHref("/liff/coach")} className="rounded-2xl bg-[#06C755] py-3 text-center text-sm font-bold text-white">
            本週課表
          </a>
          <a href={liffHref("/liff/students")} className="rounded-2xl bg-white py-3 text-center text-sm font-bold text-gray-700 border border-gray-100">
            我的學員
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-5 border-b border-gray-100">
        <div className="w-10 h-10 bg-[#06C755] rounded-2xl flex items-center justify-center mb-4">
          <span className="text-white font-bold text-sm">AC</span>
        </div>
        <h1 className="text-gray-900 text-lg font-bold">加入 Actflow</h1>
        <p className="text-gray-400 text-sm mt-0.5">填寫資料完成身份綁定</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pt-6 pb-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="請輸入真實姓名"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755] bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">手機號碼</label>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="0912-345-678"
            type="tel"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755] bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">邀請碼</label>
          <input
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            placeholder="由導師提供，例如 TRX-A001"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755] bg-gray-50 font-mono tracking-wider"
          />
          <p className="text-xs text-gray-400 mt-1.5">請向您的導師索取邀請碼（目前可用：YOGA-B002）</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-[#06C755] text-white rounded-xl py-3.5 font-semibold text-sm mt-2"
        >
          完成綁定
        </button>
      </div>
    </div>
  )
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-base font-bold text-gray-950">{value}</p>
    </div>
  )
}

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-gray-500">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
