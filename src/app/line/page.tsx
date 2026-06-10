"use client"

import { useState, useRef, useEffect, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MessageBubble, ChatMessage } from "@/components/line/MessageBubble"
import { PhoneFrame } from "@/components/MobileShell"
import { useMockData } from "@/context/MockDataContext"
import {
  detectIntent,
  resolveKeyword,
  LineMessage,
  MessageAction,
  CourseSelectMessage,
} from "@/lib/keywords"
import { format } from "date-fns"
import Image from "next/image"

const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]

// ─── Flow State ───────────────────────────────────────────────────────────────

interface CourseInfo {
  id: string
  title: string
  dayLabel: string
  time: string
  coachName: string
  courseDate: string
}

type FlowState =
  | null
  | { type: "leave_awaiting_course_select"; candidates: CourseInfo[] }
  | { type: "leave_awaiting_confirm"; course: CourseInfo }

type LineToast = {
  id: string
  title: string
  body: string
}

function getMessagePreview(message: LineMessage) {
  if (message.type === "text") return message.text.replace(/\s+/g, " ").trim()
  if (message.type === "flex") return message.altText
  if (message.type === "button_list") return message.text || message.buttons.map(button => button.label).join("、")
  if (message.type === "course_select") return message.prompt
  if (message.type === "action_buttons") return message.text || message.buttons.map(button => button.label).join("、")
  return "你有一則新訊息"
}

// ─── Welcome message ──────────────────────────────────────────────────────────

function getWelcomeMessages(role: string, name: string): LineMessage[] {
  if (role === "student") {
    return [
      {
        type: "text",
        text: `${name} 您好！我是你的 FitFlo 助手，請直接輸入你的需求或是點擊下方選單查看更多功能！`,
      },
    ]
  }
  if (role === "coach") {
    return [
      {
        type: "text",
        text: `${name} 您好！我是你的 FitFlo 助手，請直接輸入你的需求或是點擊下方選單查看更多功能！`,
      },
    ]
  }
  return [{ type: "text", text: `管理者 ${name}，歡迎使用後台系統。` }]
}

// ─── Side panel phrases ───────────────────────────────────────────────────────

const STUDENT_PHRASES = [
  { label: "訊息請假", text: "這週想請假" },
  { label: "指定請假", text: "這週六我可能來不了，想先請假" },
  { label: "查課表", text: "我這週上什麼課？" },
  { label: "查堂數", text: "我還有幾堂課？" },
  { label: "預約課程", text: "我想預約課程" },
  { label: "聯絡教練", text: "我想聯絡教練" },
]

const COACH_PHRASES = [
  { label: "今日課表", text: "今天要上哪些課？" },
  { label: "查看請假", text: "有誰要請假嗎？" },
  { label: "請假件數", text: "待確認的請假有幾件？" },
  { label: "學員名單", text: "我的學員有誰？" },
  { label: "推播提醒", text: "我要推播提醒" },
  { label: "本週空檔", text: "我的本週空檔" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LinePage() {
  return (
    <Suspense>
      <LinePageInner />
    </Suspense>
  )
}

function LinePageInner() {
  const {
    activeUser,
    students,
    courses,
    enrollments,
    leaveRequests,
    coaches,
    availableUsers,
    setActiveUser,
    notifications,
    getNotificationsFor,
    addLeaveRequest,
    addNotification,
    updateLeaveStatus,
  } = useMockData()

  const router = useRouter()
  const [input, setInput] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [flowState, setFlowState] = useState<FlowState>(null)
  const [showQuickMenu, setShowQuickMenu] = useState(false)
  const [activeLiffPath, setActiveLiffPath] = useState<string | null>(null)
  const [lineToast, setLineToast] = useState<LineToast | null>(null)
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get("embed") === "1"
  const forcedRole = searchParams.get("role")
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const shownNotificationIdsRef = useRef<Set<string>>(new Set())
  const notificationStartedAtRef = useRef(0)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastSeqRef = useRef(0)

  useEffect(() => {
    if (!isEmbed) return
    if (forcedRole !== "student" && forcedRole !== "coach") return
    const nextUser = availableUsers.find(user => user.role === forcedRole)
    if (nextUser && nextUser.userId !== activeUser.userId) {
      setActiveUser(nextUser)
    }
  }, [activeUser.userId, availableUsers, forcedRole, isEmbed, setActiveUser])

  const showLineToast = useCallback((message: LineMessage) => {
    if (!activeLiffPath) return
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastSeqRef.current += 1
    setLineToast({
      id: `toast-${toastSeqRef.current}`,
      title: "FitFlo",
      body: getMessagePreview(message),
    })
    toastTimerRef.current = setTimeout(() => {
      setLineToast(null)
      toastTimerRef.current = null
    }, 3600)
  }, [activeLiffPath])

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
        showLineToast(msg)
        if (i === messages.length - 1) setIsTyping(false)
      }, (i + 1) * 500)
    })
  }

  function addUserMessage(text: string) {
    setChatHistory(prev => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        messages: [{ type: "text", text }],
        isUser: true,
        timestamp: new Date(),
      },
    ])
  }

  function openInternalPath(href: string) {
    if (href.startsWith("/liff")) {
      setShowQuickMenu(false)
      const [pathname, query = ""] = href.split("?")
      const params = new URLSearchParams(query)
      params.set("embed", "1")
      params.set("role", activeUser.role)
      params.set("userId", activeUser.userId)
      setActiveLiffPath(`${pathname}?${params.toString()}`)
      return
    }

    router.push(href)
  }

  useEffect(() => {
    const welcome: ChatMessage = {
      id: `welcome-${activeUser.userId}-${Date.now()}`,
      messages: getWelcomeMessages(activeUser.role, activeUser.name),
      isUser: false,
      timestamp: new Date(),
    }
    notificationStartedAtRef.current = Date.now()
    const existingNotifs = getNotificationsFor(activeUser.userId)
    shownNotificationIdsRef.current = new Set(existingNotifs.map(n => n.id))

    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setIsTyping(false)
      setFlowState(null)
      setChatHistory([welcome])
    })

    return () => {
      cancelled = true
    }
  }, [activeUser.userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const nextNotifications = getNotificationsFor(activeUser.userId).filter(n =>
      !n.read &&
      !shownNotificationIdsRef.current.has(n.id) &&
      new Date(n.createdAt).getTime() >= notificationStartedAtRef.current
    )
    if (nextNotifications.length === 0) return

    nextNotifications.forEach(n => shownNotificationIdsRef.current.add(n.id))
    nextNotifications.forEach(n => {
      showLineToast({ type: "text", text: `🔔 ${n.message}` })
    })
    setChatHistory(prev => [
      ...prev,
      ...nextNotifications.map(n => ({
        id: n.id,
        messages: [{ type: "text" as const, text: `🔔 ${n.message}` }],
        isUser: false,
        timestamp: new Date(n.createdAt),
      })),
    ])
  }, [activeUser.userId, getNotificationsFor, notifications, showLineToast])

  useEffect(() => {
    const el = chatScrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: isEmbed ? "auto" : "smooth" })
  }, [chatHistory, isEmbed])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  // ─── Build resolver params (coach keyword flows) ──────────────────────────

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

  // ─── Get student's enrolled courses as CourseInfo ─────────────────────────

  function getStudentCourses(dayOfWeek?: number): CourseInfo[] {
    const student = students.find(s => s.lineUserId === activeUser.userId)
    if (!student) return []

    const enrolledCourseIds = enrollments
      .filter(e => e.studentId === student.id && e.status === "confirmed")
      .map(e => e.courseId)

    return courses
      .filter(c => {
        if (!enrolledCourseIds.includes(c.id)) return false
        if (dayOfWeek !== undefined && c.dayOfWeek !== dayOfWeek) return false
        return true
      })
      .map(c => {
        const coach = coaches.find(co => co.id === c.coachId)
        return {
          id: c.id,
          title: c.title,
          dayLabel: `週${DAY_LABELS[c.dayOfWeek]}`,
          time: format(new Date(c.startTime), "HH:mm"),
          coachName: coach?.name ?? "教練",
          courseDate: format(new Date(c.startTime), "yyyy-MM-dd"),
        }
      })
  }

  // ─── Leave flow helpers ───────────────────────────────────────────────────

  function buildConfirmMessage(course: CourseInfo): LineMessage[] {
    return [
      {
        type: "action_buttons",
        text: `確認請假以下課程嗎？\n\n課程：${course.title}\n時間：${course.dayLabel} ${course.time}\n教練：${course.coachName}\n\n請假後將扣除 1 堂課。`,
        buttons: [
          { label: "✓ 確認請假", action: "confirm_leave", style: "primary" },
          { label: "取消", action: "cancel_leave", style: "secondary" },
        ],
      },
    ]
  }

  function handleLeaveIntent(dayOfWeek?: number) {
    const candidateCourses = getStudentCourses(dayOfWeek)

    if (candidateCourses.length === 0) {
      const dayStr = dayOfWeek !== undefined ? `週${DAY_LABELS[dayOfWeek]}` : "你的課程"
      sendBotMessages([
        { type: "text", text: `找不到${dayStr}的課程記錄。\n\n如果想查看課表，可以說「我這週上什麼課？」` },
      ])
      return
    }

    if (candidateCourses.length === 1) {
      setFlowState({ type: "leave_awaiting_confirm", course: candidateCourses[0] })
      sendBotMessages(buildConfirmMessage(candidateCourses[0]))
      return
    }

    const dayStr = dayOfWeek !== undefined ? `週${DAY_LABELS[dayOfWeek]}` : "本週"
    const selectMsg: CourseSelectMessage = {
      type: "course_select",
      prompt: `你${dayStr}有幾堂課，請選擇要請假的是哪一堂：`,
      courses: candidateCourses,
    }
    setFlowState({ type: "leave_awaiting_course_select", candidates: candidateCourses })
    sendBotMessages([selectMsg])
  }

  // ─── Action handler (course select + action buttons) ─────────────────────

  function handleAction(action: MessageAction) {
    if (action.type === "select_course") {
      const course = flowState?.type === "leave_awaiting_course_select"
        ? flowState.candidates.find(c => c.id === action.courseId)
        : null
      if (!course) return

      addUserMessage(action.courseTitle)
      setFlowState({ type: "leave_awaiting_confirm", course })
      setTimeout(() => sendBotMessages(buildConfirmMessage(course)), 300)
    }

    if (action.type === "button_action") {
      if (action.action === "confirm_leave") {
        const course = flowState?.type === "leave_awaiting_confirm" ? flowState.course : null
        if (!course) return

        const student = students.find(s => s.lineUserId === activeUser.userId)
        if (!student) return

        addUserMessage("確認請假")
        setFlowState(null)

        addLeaveRequest({
          studentId: student.id,
          courseId: course.id,
          date: course.courseDate,
          reason: "",
          status: "pending",
          coachNote: "",
        })

        const coach = coaches.find(c => c.id === courses.find(cr => cr.id === course.id)?.coachId)
        if (coach) {
          addNotification({
            targetUserId: coach.lineUserId,
            targetRole: "coach",
            message: `${student.name} 請假了 ${course.title}（${course.dayLabel} ${course.time}）`,
            type: "leave_request",
          })
        }

        setTimeout(() => {
          sendBotMessages([
            {
              type: "text",
              text: `好的，請假申請已送出 ✓\n\n${course.coachName} 教練收到後會確認，我會再通知你。`,
            },
          ])
        }, 300)
      }

      if (action.action === "cancel_leave") {
        addUserMessage("取消")
        setFlowState(null)
        setTimeout(() => {
          sendBotMessages([{ type: "text", text: "好的，已取消請假申請。" }])
        }, 300)
      }

      if (action.action === "msg_coach") {
        sendBotMessages([{ type: "text", text: "請直接在這裡輸入你想留給教練的訊息，我會幫你轉達 📨" }])
      }

      if (action.action === "call_coach") {
        const student = students.find(s => s.lineUserId === activeUser.userId)
        const coach = coaches.find(c => c.id === student?.coachId)
        sendBotMessages([{ type: "text", text: `教練電話：${coach?.phone ?? "—"}\n\n點擊號碼即可撥打。` }])
      }

      if (action.action === "add_line") {
        sendBotMessages([{ type: "text", text: "教練的 LINE ID 已由管理員設定，請掃描 QR Code 加入好友。\n\n（此功能於後台「助理設定」中設定）" }])
      }

      if (action.action === "broadcast_all") {
        const coach = coaches.find(c => c.lineUserId === activeUser.userId)
        const myStudents = students.filter(s => s.coachId === coach?.id && s.lineUserId)
        myStudents.forEach(s => {
          addNotification({
            targetUserId: s.lineUserId ?? "",
            targetRole: "student",
            message: `${coach?.name ?? "教練"} 發送了一則提醒，請留意最新公告。`,
            type: "broadcast",
          })
        })
        sendBotMessages([{ type: "text", text: `✓ 已推播給 ${myStudents.length} 位學員。` }])
      }

      if (action.action === "broadcast_reminder") {
        const coach = coaches.find(c => c.lineUserId === activeUser.userId)
        const tomorrowDow = (new Date().getDay() + 1) % 7
        const tomorrowCourses = courses.filter(c => c.coachId === coach?.id && c.dayOfWeek === tomorrowDow)
        const myStudentIds = students.filter(s => s.coachId === coach?.id).map(s => s.id)

        if (tomorrowCourses.length === 0) {
          sendBotMessages([{ type: "text", text: "明天沒有安排課程，無需推播提醒。" }])
        } else {
          let notified = 0
          tomorrowCourses.forEach(course => {
            const enrolled = students.filter(s => myStudentIds.includes(s.id) && s.lineUserId)
            enrolled.forEach(s => {
              addNotification({
                targetUserId: s.lineUserId ?? "",
                targetRole: "student",
                message: `明天 ${course.title} 課程提醒，請準時出席 🏃`,
                type: "course_reminder",
              })
              notified++
            })
          })
          sendBotMessages([{ type: "text", text: `✓ 已推播明日課程提醒給 ${notified} 位學員。` }])
        }
      }

      if (action.action.startsWith("confirm_leave_")) {
        const leaveId = action.action.replace("confirm_leave_", "")
        const leave = leaveRequests.find(l => l.id === leaveId)
        const student = students.find(s => s.id === leave?.studentId)
        const course = courses.find(c => c.id === leave?.courseId)
        updateLeaveStatus(leaveId, "confirmed", "教練已確認收到")
        if (student?.lineUserId) {
          addNotification({
            targetUserId: student.lineUserId,
            targetRole: "student",
            message: `教練已收到你的請假申請（${course?.title ?? "課程"}）`,
            type: "leave_confirmed",
          })
        }
        sendBotMessages([{ type: "text", text: `✓ 已確認 ${student?.name ?? ""} 的請假，對方會收到通知。` }])
      }

      if (action.action.startsWith("decline_leave_")) {
        const leaveId = action.action.replace("decline_leave_", "")
        const leave = leaveRequests.find(l => l.id === leaveId)
        const student = students.find(s => s.id === leave?.studentId)
        const course = courses.find(c => c.id === leave?.courseId)
        updateLeaveStatus(leaveId, "rejected", "")
        if (student?.lineUserId) {
          addNotification({
            targetUserId: student.lineUserId,
            targetRole: "student",
            message: `教練無法批准你的請假申請（${course?.title ?? "課程"}），請直接聯繫教練。`,
            type: "leave_rejected",
          })
        }
        sendBotMessages([{ type: "text", text: `已拒絕 ${student?.name ?? ""} 的請假，對方會收到通知。` }])
      }
    }
  }

  // ─── Main send message ────────────────────────────────────────────────────

  function sendMessage(text?: string) {
    const raw = text ?? input.trim()
    if (!raw) return
    if (!text) setInput("")

    // If there's an active flow waiting for course selection, reset it on new text input
    if (flowState?.type === "leave_awaiting_course_select") {
      setFlowState(null)
    }

    addUserMessage(raw)

    if (activeUser.role === "student") {
      const { intent, dayOfWeek } = detectIntent(raw)

      if (intent === "leave") {
        handleLeaveIntent(dayOfWeek)
        return
      }

      if (intent === "book") {
        const available = courses
          .filter(c => c.enrolledCount < c.capacity)
          .map(c => ({
            title: c.title,
            subtitle: `週${DAY_LABELS[c.dayOfWeek]} ${format(new Date(c.startTime), "HH:mm")}`,
            body: `剩餘名額：${c.capacity - c.enrolledCount} 位`,
            color: c.color,
          }))
        sendBotMessages([
          { type: "text", text: "目前可預約的課程如下，點擊連結完成報名 👇" },
          { type: "flex", altText: "可預約課程", cards: available },
          { type: "button_list", text: "", buttons: [{ label: "📅 前往預約頁面", href: "/liff/schedule", style: "primary" }] },
        ])
        return
      }

      if (intent === "schedule") {
        const response = resolveKeyword("我的課表", "student", buildResolverParams())
        if (response) {
          sendBotMessages([
            ...response.messages,
            { type: "button_list", text: "", buttons: [{ label: "📋 查看完整課表", href: "/liff/schedule", style: "secondary" }] },
          ])
          return
        }
      }

      if (intent === "sessions") {
        const response = resolveKeyword("剩餘堂數", "student", buildResolverParams())
        if (response) {
          sendBotMessages([
            ...response.messages,
            { type: "button_list", text: "", buttons: [{ label: "➕ 加購課程", href: "/liff/schedule", style: "primary" }] },
          ])
          return
        }
      }

      if (intent === "contact_coach") {
        const student = students.find(s => s.lineUserId === activeUser.userId)
        const coach = coaches.find(c => c.id === student?.coachId)
        sendBotMessages([
          { type: "text", text: `以下是聯絡 ${coach?.name ?? "教練"} 的方式：` },
          {
            type: "action_buttons",
            text: "",
            buttons: [
              { label: "💬 留言給教練", action: "msg_coach", style: "primary" },
              { label: `📞 撥打電話 ${coach?.phone ?? ""}`, action: "call_coach", style: "secondary" },
              { label: "🟢 加教練的 LINE", action: "add_line", style: "secondary" },
            ],
          },
        ])
        return
      }

      sendBotMessages([
        {
          type: "text",
          text: "我不太確定你的意思，可以換個方式說嗎？\n\n例如：「我週六來不了」、「我這週上什麼課？」、「我還有幾堂課？」",
        },
      ])
      return
    }

    if (activeUser.role === "coach") {
      const { intent } = detectIntent(raw)

      if (intent === "coach_today") {
        const response = resolveKeyword("今日課表", "coach", buildResolverParams())
        if (response) {
          sendBotMessages([
            ...response.messages,
            { type: "button_list", text: "", buttons: [{ label: "👥 查看學員名單", href: "/liff/students", style: "secondary" }] },
          ])
          return
        }
      }

      if (intent === "coach_students") {
        const response = resolveKeyword("學員列表", "coach", buildResolverParams())
        if (response) { sendBotMessages(response.messages); return }
      }

      if (intent === "coach_broadcast") {
        sendBotMessages([
          {
            type: "text",
            text: "你想推播什麼訊息給學員？\n\n請選擇推播對象：",
          },
          {
            type: "action_buttons",
            text: "",
            buttons: [
              { label: "📢 推播給所有學員", action: "broadcast_all", style: "primary" },
              { label: "🔔 課前提醒（明日課程）", action: "broadcast_reminder", style: "secondary" },
            ],
          },
        ])
        return
      }

      if (intent === "coach_availability") {
        const coach = coaches.find(c => c.lineUserId === activeUser.userId)
        const weekDays = ["日", "一", "二", "三", "四", "五", "六"]
        const coachCourses = courses.filter(c => c.coachId === coach?.id)
        const busyDays = [...new Set(coachCourses.map(c => c.dayOfWeek))]
        const freeDays = [1,2,3,4,5,6,0].filter(d => !busyDays.includes(d))

        if (freeDays.length === 0) {
          sendBotMessages([
            { type: "text", text: "本週每天都有課程安排，目前沒有空檔。\n\n如需調整，請至後台管理排課。" },
            { type: "button_list", text: "", buttons: [{ label: "🗓️ 前往後台排課", href: "/admin/courses", style: "secondary" }] },
          ])
        } else {
          const freeStr = freeDays.map(d => `週${weekDays[d]}`).join("、")
          const busyStr = busyDays.length > 0
            ? busyDays.map(d => {
                const count = coachCourses.filter(c => c.dayOfWeek === d).length
                return `週${weekDays[d]}（${count} 堂）`
              }).join("、")
            : "無"
          sendBotMessages([
            {
              type: "flex",
              altText: "本週空檔",
              cards: [{
                title: "本週空檔",
                body: `空檔日：${freeStr}\n\n已排課：${busyStr}`,
                color: "#10B981",
              }],
            },
            { type: "button_list", text: "", buttons: [{ label: "🗓️ 前往後台排課", href: "/admin/courses", style: "secondary" }] },
          ])
        }
        return
      }

      if (intent === "coach_leaves") {
        const coach = coaches.find(c => c.lineUserId === activeUser.userId)
        const myStudentIds = students.filter(s => s.coachId === coach?.id).map(s => s.id)
        const pending = leaveRequests.filter(l => l.status === "pending" && myStudentIds.includes(l.studentId))

        sendBotMessages([
          {
            type: "flex",
            altText: "今日待確認請假",
            cards: [{
              title: "今日待確認請假",
              body: `${pending.length} 件`,
              footer: pending.length > 0 ? "請進入 LIFF 查看明細並確認" : "目前沒有需要處理的請假",
              color: pending.length > 0 ? "#111827" : "#10B981",
            }],
          },
          {
            type: "button_list",
            text: "",
            buttons: [{ label: "前往 LIFF 確認", href: "/liff/coach/leaves", style: "primary" }],
          },
        ])
        return
      }

      if (intent === "coach_admin") {
        sendBotMessages([
          { type: "text", text: "你可以到後台查看完整營運資料與排課設定。" },
          {
            type: "button_list",
            text: "",
            buttons: [{ label: "⚙️ 前往後台管理", href: "/admin/dashboard", style: "primary" }],
          },
        ])
        return
      }

      sendBotMessages([
        {
          type: "text",
          text: "我不太確定你的意思，可以換個方式說嗎？\n\n例如：「今天要上哪些課？」、「有誰要請假嗎？」、「我的學員有誰？」",
        },
      ])
    }
  }

  const timeStr = "09:41"
  const todayStr = "6月8日 星期一"
  const sidePhrases = activeUser.role === "student" ? STUDENT_PHRASES : activeUser.role === "coach" ? COACH_PHRASES : []
  const statusBar = (
    <div className="bg-[#3d6b96] flex items-center justify-between px-6 pt-2 pb-1 shrink-0" style={{ height: 44 }}>
      <span className="text-white text-[15px] font-semibold">{timeStr}</span>
      <div className="flex items-center gap-1.5">
        <svg width="17" height="12" viewBox="0 0 17 12" fill="white">
          <rect x="0" y="6" width="3" height="6" rx="1" />
          <rect x="4.5" y="4" width="3" height="8" rx="1" />
          <rect x="9" y="2" width="3" height="10" rx="1" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
          <path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
          <path d="M3.5 6.5C4.9 5.1 6.35 4.4 8 4.4s3.1.7 4.5 2.1l1.4-1.4C12.1 3.3 10.15 2.4 8 2.4s-4.1.9-5.9 2.7l1.4 1.4z" opacity=".7" />
          <path d="M1 4C2.8 2.2 5.25 1 8 1s5.2 1.2 7 3l1.4-1.4C14.4.9 11.35-.1 8-.1S1.6.9-.4 2.6L1 4z" opacity=".4" />
        </svg>
        <div className="flex items-center gap-0.5">
          <div className="w-[22px] h-[11px] rounded-[2.5px] border border-white/80 relative p-px">
            <div className="bg-white rounded-sm h-full w-4/5" />
          </div>
          <div className="w-[2px] h-[5px] bg-white/60 rounded-r-sm" />
        </div>
      </div>
    </div>
  )
  const homeIndicator = (
    <div className="bg-white flex justify-center pb-2 pt-1 shrink-0">
      <div className="w-[134px] h-[5px] bg-black rounded-full" />
    </div>
  )

  if (!isEmbed) {
    return (
      <div className="h-screen overflow-hidden bg-[#0f1218] px-6 pb-24 pt-6 text-white">
        <div className="mx-auto grid h-full max-w-5xl grid-cols-2 items-center gap-6">
          <RolePhone title="學員 LINE" src="/line?embed=1&role=student" />
          <RolePhone title="教練 LINE" src="/line?embed=1&role=coach" />
        </div>
      </div>
    )
  }

  return (
    <div className={isEmbed
      ? "h-screen overflow-hidden flex flex-col"
      : "h-screen overflow-hidden bg-[#0f1218] flex items-center justify-center gap-8 px-6"
    }>
    <PhoneFrame
      embed={isEmbed}
      showChromeInEmbed
      outerClassName=""
      statusBar={statusBar}
      homeIndicator={homeIndicator}
    >

          {activeLiffPath ? (
            <div className="relative flex flex-1 min-h-0 flex-col bg-white">
              {lineToast && (
                <button
                  key={lineToast.id}
                  onClick={() => {
                    setLineToast(null)
                    setActiveLiffPath(null)
                  }}
                  className="animate-in slide-in-from-top-4 fade-in absolute left-3 right-3 top-2 z-20 flex items-center gap-3 rounded-2xl bg-white/95 px-3 py-2.5 text-left shadow-[0_12px_34px_rgba(15,23,42,0.18)] ring-1 ring-black/5 backdrop-blur duration-200"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#06C755] text-xs font-bold text-white">
                    F
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] font-bold text-gray-950">{lineToast.title}</p>
                      <span className="shrink-0 text-[11px] text-gray-400">now</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-gray-600">
                      {lineToast.body}
                    </p>
                  </div>
                </button>
              )}
              <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => setActiveLiffPath(null)}
                  className="text-sm font-semibold text-gray-500 active:text-gray-900"
                >
                  返回
                </button>
                <div className="flex-1 text-center text-sm font-bold text-gray-900">
                  FitFlo
                </div>
                <div className="w-8" />
              </div>
              <iframe
                title="FitFlo LIFF"
                src={activeLiffPath}
                className="min-h-0 flex-1 border-0"
              />
            </div>
          ) : (
          <>
          {/* LINE Header */}
          <div className="bg-[#3d6b96] px-4 pb-3 pt-1 flex items-center gap-2 shrink-0" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.15)" }}>
            <button className="p-1.5 -ml-1">
              <Image src="/line/chevron-left.svg" alt="back" width={9} height={19} />
            </button>
            <div className="flex-1 flex items-center gap-2 justify-center">
              <Image src="/line/official-badge.svg" alt="official" width={12} height={14} />
              <span className="text-white font-semibold text-[17px]">FitFlo</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-1">
                <Image src="/line/home.svg" alt="home" width={21} height={17} />
              </button>
              <button className="p-1">
                <Image src="/line/chevron-down.svg" alt="more" width={19} height={9} />
              </button>
            </div>
          </div>

          {/* Chat area */}
          <div
            ref={chatScrollRef}
            className="flex-1 min-h-0 overflow-y-auto px-3 py-3"
            style={{
              backgroundImage: "url('/line/background.png')",
              backgroundSize: "cover",
              backgroundPosition: "center bottom",
            }}
          >
            <div className="flex justify-center mb-4">
              <span className="bg-black/30 text-white text-[11px] px-3 py-1 rounded-full backdrop-blur-sm">
                {todayStr}
              </span>
            </div>

            {chatHistory.map(chat => (
              <div key={chat.id}>
                {!chat.isUser ? (
                  <div className="flex items-start gap-2 mb-1">
                    <div className="w-8 h-8 bg-[#06C755] rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <span className="text-white text-[10px] font-bold">F</span>
                    </div>
                    <div className="min-w-0 overflow-visible space-y-1">
                      {chat.messages.map((msg, i) => (
                        <MessageBubble key={i} message={msg} isUser={false} onAction={handleAction} onNavigate={openInternalPath} />
                      ))}
                      <p className="text-[10px] text-white/60 ml-1">
                        {format(chat.timestamp, "HH:mm")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    {chat.messages.map((msg, i) => (
                      <MessageBubble key={i} message={msg} isUser={true} onAction={handleAction} onNavigate={openInternalPath} />
                    ))}
                    <p className="text-[10px] text-white/60 mr-1 -mt-1 mb-2">
                      {format(chat.timestamp, "HH:mm")}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-2 mb-1">
                <div className="w-8 h-8 bg-[#06C755] rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <span className="text-white text-[10px] font-bold">F</span>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Menu */}
          {showQuickMenu && (
            <div className="bg-white border-t border-gray-100 shrink-0" style={{ height: 200 }}>
              <div className="grid grid-cols-3 gap-px bg-gray-100 h-full">
                {(activeUser.role === "coach" ? [
                  { icon: "📋", label: "今日課表", text: "今天要上哪些課？" },
                  { icon: "👥", label: "學員管理", href: "/liff/students" },
                  { icon: "🙋", label: "待確認請假", text: "有誰要請假嗎？" },
                  { icon: "📢", label: "推播提醒", text: "我要推播提醒" },
                  { icon: "🗓️", label: "我的空檔", text: "我的本週空檔" },
                  { icon: "⚙️", label: "後台管理", href: "/admin/dashboard" },
                ] : [
                  { icon: "📅", label: "預約課程", href: "/liff/schedule" },
                  { icon: "👤", label: "個人資料", href: "/liff/onboarding" },
                  { icon: "🙋", label: "請假申請", text: "我這週想請假" },
                  { icon: "📋", label: "我的課表", text: "我這週上什麼課？" },
                  { icon: "🎫", label: "堂數查詢", text: "我的剩餘堂數" },
                  { icon: "📞", label: "聯絡教練", text: "我想聯絡教練" },
                ] as { icon: string; label: string; href?: string; text?: string }[]).map(item => (
                  item.href ? (
                    <button
                      key={item.label}
                      onClick={() => openInternalPath(item.href!)}
                      className="bg-white flex flex-col items-center justify-center gap-1.5 active:bg-gray-50 transition-colors"
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-[12px] text-gray-600 font-medium">{item.label}</span>
                    </button>
                  ) : (
                    <button
                      key={item.label}
                      onClick={() => { setShowQuickMenu(false); sendMessage(item.text!) }}
                      className="bg-white flex flex-col items-center justify-center gap-1.5 active:bg-gray-50 transition-colors"
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-[12px] text-gray-600 font-medium">{item.label}</span>
                    </button>
                  )
                ))}
              </div>
            </div>
          )}

          {!showQuickMenu && sidePhrases.length > 0 && (
            <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-2">
              <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {sidePhrases.map(phrase => (
                  <button
                    key={phrase.label}
                    onClick={() => sendMessage(phrase.text)}
                    className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-medium text-gray-600 transition-colors active:bg-gray-200"
                  >
                    {phrase.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input bar */}
          <div className="bg-white px-4 py-2.5 flex items-center gap-2 shrink-0">
            <button
              className="shrink-0 p-1 transition-transform"
              onClick={() => setShowQuickMenu(v => !v)}
            >
              <Image
                src="/line/plus.svg"
                alt="add"
                width={21}
                height={20}
                className={`transition-transform duration-200 ${showQuickMenu ? "rotate-45" : ""}`}
              />
            </button>
            <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); if (e.target.value) setShowQuickMenu(false) }}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="直接說你想做什麼..."
                className="flex-1 bg-transparent text-[14px] text-gray-800 placeholder:text-gray-400 outline-none"
              />
              <svg width="16" height="4" viewBox="0 0 16 4" fill="#9AA1AE">
                <circle cx="2" cy="2" r="2" /><circle cx="8" cy="2" r="2" /><circle cx="14" cy="2" r="2" />
              </svg>
            </div>
            {input.trim() ? (
              <button
                onClick={() => sendMessage()}
                className="shrink-0 w-8 h-8 bg-[#06C755] rounded-full flex items-center justify-center shadow-sm"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            ) : (
              <button className="shrink-0">
                <Image src="/line/voice.svg" alt="voice" width={14} height={23} />
              </button>
            )}
          </div>
          </>
          )}

    </PhoneFrame>

    {!isEmbed && (
      <div className="hidden lg:flex flex-col gap-3 max-w-[240px] pt-2">
        <div>
          <h2 className="text-white font-semibold text-base mb-0.5">FitFlo LINE 模擬器</h2>
          <p className="text-[#8892a4] text-[12px]">AI 語意分析，不需要特定關鍵字</p>
        </div>

        {sidePhrases.length > 0 && (
          <div className="bg-[#1e2535] rounded-2xl p-4">
            <p className="text-[#8892a4] text-[11px] font-medium mb-3 uppercase tracking-wider">
              {activeUser.role === "student" ? "學員" : "教練"}可以這樣說
            </p>
            <div className="space-y-2">
              {sidePhrases.map(p => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.text)}
                  className="w-full text-left group"
                >
                  <p className="text-[13px] text-gray-200 group-hover:text-white transition-colors leading-snug">
                    「{p.label}」
                  </p>
                  <p className="text-[11px] text-[#8892a4] mt-0.5">{p.text}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#1e2535] rounded-2xl p-4 text-[12px] text-[#8892a4] leading-relaxed">
          切換身份列可模擬不同角色的對話體驗。LIFF 連結點擊後會開啟對應頁面。
        </div>
      </div>
    )}
    </div>
  )
}

function RolePhone({ title, src }: { title: string; src: string }) {
  return (
    <section className="flex h-full items-center justify-center">
      <div
        className="overflow-hidden rounded-[44px] border-[10px] border-[#1a1d27] bg-white shadow-2xl"
        style={{ width: 375, height: "min(760px, calc(100vh - 150px))" }}
      >
        <iframe title={title} src={src} className="h-full w-full border-0" />
      </div>
    </section>
  )
}
