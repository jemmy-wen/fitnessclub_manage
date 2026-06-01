"use client"

import { useState } from "react"
import { useMockData } from "@/context/MockDataContext"
import { CheckCircle, ChevronLeft } from "lucide-react"

type Step = "form" | "success"

export default function OnboardingPage() {
  const { students, bindStudent, addNotification } = useMockData()
  const [step, setStep] = useState<Step>("form")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState("")
  const [boundStudent, setBoundStudent] = useState<{ name: string; coachId: string } | null>(null)

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
          href="/line"
          className="w-full bg-[#06C755] text-white rounded-xl py-3.5 font-semibold text-sm text-center block"
        >
          返回 LINE OA
        </a>
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
