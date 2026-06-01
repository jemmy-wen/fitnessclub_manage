"use client"

import { useState, useRef, useEffect } from "react"
import { MessageBubble, ChatMessage } from "@/components/line/MessageBubble"
import { RoleSwitcher } from "@/components/line/RoleSwitcher"
import { useMockData } from "@/context/MockDataContext"
import { resolveKeyword, LineMessage } from "@/lib/keywords"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import Image from "next/image"

const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]

function getWelcomeMessages(role: string, name: string): LineMessage[] {
  if (role === "student") {
    return [
      {
        type: "text",
        text: `嗨 ${name} 👋 歡迎使用 Actflow！\n\n可以輸入以下關鍵字：\n・請假\n・我的課表\n・剩餘堂數`,
      },
    ]
  }
  if (role === "coach") {
    return [
      {
        type: "text",
        text: `${name} 導師，您好 👋\n\n可以輸入以下關鍵字：\n・今日課表\n・學員列表\n・請假申請`,
      },
    ]
  }
  return [{ type: "text", text: `管理者 ${name}，歡迎使用後台系統。` }]
}

export default function LinePage() {
  const { activeUser, students, courses, enrollments, leaveRequests, coaches, getNotificationsFor } = useMockData()
  const [input, setInput] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevUserIdRef = useRef(activeUser.userId)

  // 逐則顯示 bot 訊息，每則間隔 500ms
  function sendBotMessages(messages: LineMessage[]) {
    setIsTyping(true)
    messages.forEach((msg, i) => {
      setTimeout(() => {
        setChatHistory(prev => [
          ...prev,
          {
            id: `r-${Date.now()}-${i}`,
            messages: [msg],
            isUser: false,
            timestamp: new Date(),
          },
        ])
        if (i === messages.length - 1) setIsTyping(false)
      }, (i + 1) * 500)
    })
  }

  useEffect(() => {
    prevUserIdRef.current = activeUser.userId
    setIsTyping(false)
    const welcome: ChatMessage = {
      id: `welcome-${activeUser.userId}-${Date.now()}`,
      messages: getWelcomeMessages(activeUser.role, activeUser.name),
      isUser: false,
      timestamp: new Date(),
    }
    const notifs = getNotificationsFor(activeUser.userId).filter(n => !n.read)
    const notifMsgs: ChatMessage[] = notifs.map(n => ({
      id: n.id,
      messages: [{ type: "text" as const, text: `🔔 ${n.message}` }],
      isUser: false,
      timestamp: new Date(n.createdAt),
    }))
    setChatHistory([welcome, ...notifMsgs])
  }, [activeUser.userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory])

  function buildResolverParams() {
    const student = students.find(s => s.lineUserId === activeUser.userId)
    const coach = coaches.find(c => c.lineUserId === activeUser.userId)
    const todayDow = new Date().getDay()

    const myCourseIds = enrollments
      .filter(e => e.studentId === student?.id && e.status === "confirmed")
      .map(e => e.courseId)

    const myCourses = courses.filter(c => myCourseIds.includes(c.id)).map(c => ({
      title: c.title,
      dayLabel: `週${DAY_LABELS[c.dayOfWeek]}`,
      time: format(new Date(c.startTime), "HH:mm"),
      enrolled: c.enrolledCount,
      capacity: c.capacity,
    }))

    const todayCourses = courses
      .filter(c => c.coachId === coach?.id && c.dayOfWeek === todayDow)
      .map(c => ({
        title: c.title,
        dayLabel: `週${DAY_LABELS[c.dayOfWeek]}`,
        time: format(new Date(c.startTime), "HH:mm"),
        enrolled: c.enrolledCount,
        capacity: c.capacity,
      }))

    const myStudentIds = students.filter(s => s.coachId === coach?.id).map(s => s.id)
    const pendingLeaves = leaveRequests
      .filter(l => l.status === "pending" && myStudentIds.includes(l.studentId))
      .map(l => {
        const st = students.find(s => s.id === l.studentId)
        const cr = courses.find(c => c.id === l.courseId)
        return { studentName: st?.name ?? "", date: l.date, courseName: cr?.title ?? "" }
      })

    return {
      studentName: student?.name ?? activeUser.name,
      remainingSessions: student?.remainingSessions ?? 0,
      coachName: coach?.name ?? activeUser.name,
      courses: activeUser.role === "coach" ? todayCourses : myCourses,
      pendingLeaves,
    }
  }

  function sendMessage() {
    const text = input.trim()
    if (!text) return
    setInput("")

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      messages: [{ type: "text", text }],
      isUser: true,
      timestamp: new Date(),
    }

    const response = resolveKeyword(text, activeUser.role, buildResolverParams())
    const replyMessages: LineMessage[] = response
      ? response.messages
      : [{ type: "text", text: `抱歉，我不太了解「${text}」。\n\n請嘗試輸入：\n・請假\n・我的課表\n・剩餘堂數` }]

    setChatHistory(prev => [...prev, userMsg])
    sendBotMessages(replyMessages)
  }

  // Simulated status bar time
  const timeStr = format(new Date(), "HH:mm")
  const todayStr = format(new Date(), "M月d日 EEEE", { locale: zhTW })

  return (
    <div className="h-screen overflow-hidden bg-[#0f1218] flex items-center justify-center gap-8 px-6">
      {/* Phone frame */}
      <div className="w-[375px] shrink-0">
        <div
          className="w-[375px] rounded-[44px] overflow-hidden shadow-2xl flex flex-col"
          style={{
            height: "812px",
            minHeight: 0,
            border: "10px solid #1a1d27",
            boxShadow: "0 0 0 1px #2a2d3a, 0 30px 80px rgba(0,0,0,0.8)",
          }}
        >
          {/* iOS Status Bar */}
          <div className="bg-[#3d6b96] flex items-center justify-between px-6 pt-2 pb-1 shrink-0" style={{ height: 44 }}>
            <span className="text-white text-[15px] font-semibold">{timeStr}</span>
            <div className="flex items-center gap-1.5">
              {/* Signal bars */}
              <svg width="17" height="12" viewBox="0 0 17 12" fill="white">
                <rect x="0" y="6" width="3" height="6" rx="1" />
                <rect x="4.5" y="4" width="3" height="8" rx="1" />
                <rect x="9" y="2" width="3" height="10" rx="1" />
                <rect x="13.5" y="0" width="3" height="12" rx="1" />
              </svg>
              {/* WiFi */}
              <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
                <path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
                <path d="M3.5 6.5C4.9 5.1 6.35 4.4 8 4.4s3.1.7 4.5 2.1l1.4-1.4C12.1 3.3 10.15 2.4 8 2.4s-4.1.9-5.9 2.7l1.4 1.4z" opacity=".7"/>
                <path d="M1 4C2.8 2.2 5.25 1 8 1s5.2 1.2 7 3l1.4-1.4C14.4.9 11.35-.1 8-.1S1.6.9-.4 2.6L1 4z" opacity=".4"/>
              </svg>
              {/* Battery */}
              <div className="flex items-center gap-0.5">
                <div className="w-[22px] h-[11px] rounded-[2.5px] border border-white/80 relative p-px">
                  <div className="bg-white rounded-sm h-full w-4/5" />
                </div>
                <div className="w-[2px] h-[5px] bg-white/60 rounded-r-sm" />
              </div>
            </div>
          </div>

          {/* LINE Header */}
          <div className="bg-[#3d6b96] px-4 pb-3 pt-1 flex items-center gap-2 shrink-0" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.15)" }}>
            {/* Back button */}
            <button className="p-1.5 -ml-1">
              <Image src="/line/chevron-left.svg" alt="back" width={9} height={19} />
            </button>

            {/* Account name + official badge */}
            <div className="flex-1 flex items-center gap-2 justify-center">
              <Image src="/line/official-badge.svg" alt="official" width={12} height={14} />
              <span className="text-white font-semibold text-[17px]">Actflow</span>
            </div>

            {/* Right icons: home + chevron down */}
            <div className="flex items-center gap-3">
              <button className="p-1">
                <Image src="/line/home.svg" alt="home" width={21} height={17} />
              </button>
              <button className="p-1">
                <Image src="/line/chevron-down.svg" alt="more" width={19} height={9} />
              </button>
            </div>
          </div>

          {/* Role switcher */}
          <RoleSwitcher />

          {/* Chat area — blue sky background */}
          <div
            className="flex-1 min-h-0 overflow-y-auto px-3 py-3"
            style={{
              backgroundImage: "url('/line/background.png')",
              backgroundSize: "cover",
              backgroundPosition: "center bottom",
            }}
          >
            {/* Date chip */}
            <div className="flex justify-center mb-4">
              <span className="bg-black/30 text-white text-[11px] px-3 py-1 rounded-full backdrop-blur-sm">
                {todayStr}
              </span>
            </div>

            {chatHistory.map(chat => (
              <div key={chat.id}>
                {!chat.isUser ? (
                  /* Incoming — avatar + bubble */
                  <div className="flex items-start gap-2 mb-1">
                    <div className="w-8 h-8 bg-[#06C755] rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <span className="text-white text-[10px] font-bold">AC</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      {chat.messages.map((msg, i) => (
                        <MessageBubble key={i} message={msg} isUser={false} />
                      ))}
                      <p className="text-[10px] text-white/60 ml-1">
                        {format(chat.timestamp, "HH:mm")}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Outgoing */
                  <div className="flex flex-col items-end">
                    {chat.messages.map((msg, i) => (
                      <MessageBubble key={i} message={msg} isUser={true} />
                    ))}
                    <p className="text-[10px] text-white/60 mr-1 -mt-1 mb-2">
                      {format(chat.timestamp, "HH:mm")}
                    </p>
                  </div>
                )}
              </div>
            ))}
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start gap-2 mb-1">
                <div className="w-8 h-8 bg-[#06C755] rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <span className="text-white text-[10px] font-bold">AC</span>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick reply chips */}
          {(() => {
            const chips =
              activeUser.role === "student"
                ? ["請假", "我的課表", "剩餘堂數"]
                : activeUser.role === "coach"
                ? ["今日課表", "學員列表", "請假申請"]
                : []
            if (chips.length === 0) return null
            return (
              <div className="bg-white border-t border-gray-100 px-3 py-2 flex gap-1.5 overflow-x-auto shrink-0">
                {chips.map(chip => (
                  <button
                    key={chip}
                    onClick={() => {
                      const text = chip
                      const userMsg: ChatMessage = {
                        id: `u-${Date.now()}`,
                        messages: [{ type: "text", text }],
                        isUser: true,
                        timestamp: new Date(),
                      }
                      const response = resolveKeyword(text, activeUser.role, buildResolverParams())
                      const replyMessages: LineMessage[] = response
                        ? response.messages
                        : [{ type: "text", text: `抱歉，我不太了解「${text}」。` }]
                      setChatHistory(prev => [...prev, userMsg])
                      sendBotMessages(replyMessages)
                    }}
                    className="shrink-0 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )
          })()}

          {/* Input bar — exact LINE layout */}
          <div className="bg-white px-4 py-2.5 flex items-center gap-2 shrink-0">
            {/* Plus */}
            <button className="shrink-0 p-1">
              <Image src="/line/plus.svg" alt="add" width={21} height={20} />
            </button>
            {/* Text input */}
            <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Aa"
                className="flex-1 bg-transparent text-[14px] text-gray-800 placeholder:text-gray-400 outline-none"
              />
              {/* Three dots */}
              <svg width="16" height="4" viewBox="0 0 16 4" fill="#9AA1AE">
                <circle cx="2" cy="2" r="2"/><circle cx="8" cy="2" r="2"/><circle cx="14" cy="2" r="2"/>
              </svg>
            </div>

            {/* Send button (shows when typing) or Voice */}
            {input.trim() ? (
              <button
                onClick={sendMessage}
                className="shrink-0 w-8 h-8 bg-[#06C755] rounded-full flex items-center justify-center shadow-sm"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            ) : (
              <button className="shrink-0">
                <Image src="/line/voice.svg" alt="voice" width={14} height={23} />
              </button>
            )}
          </div>

          {/* iOS Home Indicator */}
          <div className="bg-white flex justify-center pb-2 pt-1 shrink-0">
            <div className="w-[134px] h-[5px] bg-black rounded-full" />
          </div>
        </div>

      </div>

      {/* Side panel */}
      <div className="hidden lg:block max-w-[240px] pt-2">
        <h2 className="text-white font-semibold text-base mb-4">LINE OA 模擬器</h2>
        <div className="space-y-3">
          <div className="bg-[#1e2535] rounded-2xl p-4">
            <p className="text-[#8892a4] text-[11px] font-medium mb-2.5 uppercase tracking-wider">學員關鍵字</p>
            <div className="space-y-1.5">
              {["請假", "我的課表", "剩餘堂數"].map(k => (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <span className="text-[13px] text-gray-300">{k}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#1e2535] rounded-2xl p-4">
            <p className="text-[#8892a4] text-[11px] font-medium mb-2.5 uppercase tracking-wider">導師關鍵字</p>
            <div className="space-y-1.5">
              {["今日課表", "學員列表", "請假申請"].map(k => (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06C755] shrink-0" />
                  <span className="text-[13px] text-gray-300">{k}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#1e2535] rounded-2xl p-4 text-[12px] text-[#8892a4] leading-relaxed">
            切換身份列可模擬不同角色的 LINE 對話體驗。LIFF 連結點擊後會開啟對應頁面。
          </div>
        </div>
      </div>
    </div>
  )
}
