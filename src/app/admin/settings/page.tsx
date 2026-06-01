"use client"

import { useState } from "react"
import { useMockData } from "@/context/MockDataContext"
import { useViewMode } from "@/context/ViewModeContext"
import { Bell, Clock, AlertCircle, Check, ChevronRight } from "lucide-react"

export default function SettingsPage() {
  const { settings, updateSettings, students, coaches, addNotification } = useMockData()
  const { isMobile } = useViewMode()
  const [saved, setSaved] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings)
  const [testTarget, setTestTarget] = useState<string>("all")

  function handleSave() {
    updateSettings(localSettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function sendTestPush() {
    const targets = testTarget === "all"
      ? students.filter(s => s.lineUserId)
      : students.filter(s => s.lineUserId && s.id === testTarget)

    targets.forEach(s => {
      addNotification({
        targetUserId: s.lineUserId!,
        targetRole: "student",
        message: `🔔 測試推播：明天有課，請準時參加`,
        type: "reminder",
      })
    })
    alert(`已對 ${targets.length} 位學員發送測試推播`)
  }

  const settingSections = [
    {
      title: "課前提醒",
      icon: Clock,
      color: "bg-blue-500",
      description: "自動在課程開始前推播提醒給學員",
      items: [
        {
          label: "提前提醒時間",
          description: "在課程開始前幾小時發送提醒",
          control: (
            <div className="flex items-center gap-2">
              {[12, 24, 48].map(h => (
                <button
                  key={h}
                  onClick={() => setLocalSettings(s => ({ ...s, reminderHoursBefore: h }))}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    localSettings.reminderHoursBefore === h
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {h}h 前
                </button>
              ))}
            </div>
          ),
        },
      ],
    },
    {
      title: "堂數不足警示",
      icon: AlertCircle,
      color: "bg-amber-500",
      description: "當學員剩餘堂數低於門檻時推播提醒",
      items: [
        {
          label: "警示門檻",
          description: "剩餘堂數低於此數值時發送提醒",
          control: (
            <div className="flex items-center gap-2">
              {[2, 3, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setLocalSettings(s => ({ ...s, lowSessionsThreshold: n }))}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    localSettings.lowSessionsThreshold === n
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  ≤ {n} 堂
                </button>
              ))}
            </div>
          ),
        },
      ],
    },
  ]

  if (isMobile) {
    // Mobile: one item per row, large tap targets
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">推播設定</h1>
          <p className="text-sm text-gray-500 mt-0.5">管理自動推播通知規則</p>
        </div>

        {settingSections.map(section => (
          <div key={section.title} className="bg-white rounded-2xl overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className={`w-8 h-8 ${section.color} rounded-xl flex items-center justify-center`}>
                <section.icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{section.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
              </div>
            </div>
            {section.items.map(item => (
              <div key={item.label} className="px-4 py-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                </div>
                {item.control}
              </div>
            ))}
          </div>
        ))}

        {/* Test push — mobile */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-xl flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">測試推播</p>
          </div>
          <div className="px-4 py-4 space-y-3">
            <p className="text-xs text-gray-500">選擇發送對象並測試推播功能</p>
            <select value={testTarget} onChange={e => setTestTarget(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none bg-gray-50">
              <option value="all">全部學員</option>
              {students.filter(s => s.lineUserId).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button onClick={sendTestPush} className="w-full bg-purple-500 text-white rounded-xl py-3 text-sm font-medium">
              發送測試推播
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
            saved ? "bg-green-500 text-white" : "bg-[#06C755] text-white"
          }`}
        >
          {saved ? <><Check className="w-4 h-4" /> 已儲存</> : "儲存設定"}
        </button>
      </div>
    )
  }

  // Desktop: side-by-side layout
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">推播設定</h1>
        <p className="text-sm text-gray-500 mt-0.5">管理自動推播通知規則</p>
      </div>

      <div className="space-y-4">
        {settingSections.map(section => (
          <div key={section.title} className="bg-white rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className={`w-9 h-9 ${section.color} rounded-xl flex items-center justify-center`}>
                <section.icon className="w-4.5 h-4.5 text-white" size={18} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{section.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
              </div>
            </div>
            {section.items.map(item => (
              <div key={item.label} className="px-6 py-4 flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                </div>
                {item.control}
              </div>
            ))}
          </div>
        ))}

        {/* Test push */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-500 rounded-xl flex items-center justify-center">
              <Bell className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <p className="font-semibold text-gray-900">測試推播</p>
          </div>
          <div className="px-6 py-4 flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-gray-900">發送對象</p>
              <p className="text-xs text-gray-400">推播將在 LINE 模擬器的對話中顯示</p>
            </div>
            <div className="flex items-center gap-3">
              <select value={testTarget} onChange={e => setTestTarget(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white min-w-[140px]">
                <option value="all">全部學員</option>
                {students.filter(s => s.lineUserId).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button onClick={sendTestPush} className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap">
                發送測試
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-colors ${
            saved ? "bg-green-500 text-white" : "bg-[#06C755] text-white"
          }`}
        >
          {saved ? <><Check className="w-4 h-4" /> 已儲存</> : "儲存設定"}
        </button>
      </div>
    </div>
  )
}
