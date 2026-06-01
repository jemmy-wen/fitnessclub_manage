export type MessageType = "text" | "flex" | "button_list"

export interface TextMessage {
  type: "text"
  text: string
}

export interface FlexCard {
  title: string
  subtitle?: string
  body: string
  footer?: string
  color?: string
}

export interface FlexMessage {
  type: "flex"
  altText: string
  cards: FlexCard[]
}

export interface ButtonListMessage {
  type: "button_list"
  text: string
  buttons: { label: string; href: string; style?: "primary" | "secondary" }[]
}

export type LineMessage = TextMessage | FlexMessage | ButtonListMessage

export interface KeywordResponse {
  messages: LineMessage[]
  pushNotification?: { targetUserId: string; targetRole: "student" | "coach" | "admin"; message: string; type: string }
}

type ResolverFn = (params: {
  studentName?: string
  remainingSessions?: number
  coachName?: string
  courses?: { title: string; dayLabel: string; time: string; enrolled: number; capacity: number }[]
  pendingLeaves?: { studentName: string; date: string; courseName: string }[]
  students?: { name: string; remaining: number }[]
}) => KeywordResponse

export const STUDENT_KEYWORDS: Record<string, ResolverFn> = {
  請假: () => ({
    messages: [
      { type: "text", text: "好的，請點擊下方連結填寫請假申請表：" },
      {
        type: "button_list",
        text: "請假申請",
        buttons: [{ label: "📝 填寫請假表單", href: "/liff/leave", style: "primary" }],
      },
    ],
  }),
  我的課表: ({ courses = [] }) => ({
    messages: courses.length === 0
      ? [{ type: "text", text: "本週尚無排課" }]
      : [
          { type: "text", text: "📅 本週課表如下：" },
          {
            type: "flex",
            altText: "本週課表",
            cards: courses.map(c => ({
              title: c.title,
              subtitle: `${c.dayLabel} ${c.time}`,
              body: `名額：${c.enrolled}/${c.capacity}`,
              color: "#3B82F6",
            })),
          },
        ],
  }),
  剩餘堂數: ({ remainingSessions = 0, studentName = "" }) => ({
    messages: [
      {
        type: "flex",
        altText: "剩餘堂數",
        cards: [
          {
            title: `${studentName} 的課程包`,
            body: `剩餘堂數：${remainingSessions} 堂`,
            footer: remainingSessions <= 3 ? "⚠️ 堂數不足，請盡快聯繫導師續費" : "課程使用正常",
            color: remainingSessions <= 3 ? "#EF4444" : "#10B981",
          },
        ],
      },
    ],
  }),
}

export const COACH_KEYWORDS: Record<string, ResolverFn> = {
  今日課表: ({ courses = [], coachName = "" }) => ({
    messages: courses.length === 0
      ? [{ type: "text", text: "今日沒有課程" }]
      : [
          { type: "text", text: `📋 ${coachName}，今日課程：` },
          {
            type: "flex",
            altText: "今日課表",
            cards: courses.map(c => ({
              title: c.title,
              subtitle: c.time,
              body: `已報名：${c.enrolled}/${c.capacity} 人`,
              color: "#06C755",
            })),
          },
        ],
  }),
  學員列表: () => ({
    messages: [
      { type: "text", text: "點擊下方連結查看您的學員列表：" },
      {
        type: "button_list",
        text: "學員管理",
        buttons: [{ label: "👥 查看學員列表", href: "/liff/students", style: "primary" }],
      },
    ],
  }),
  請假申請: ({ pendingLeaves = [] }) => ({
    messages: pendingLeaves.length === 0
      ? [{ type: "text", text: "目前沒有待確認的請假申請 ✅" }]
      : [
          { type: "text", text: `📋 待確認請假申請（${pendingLeaves.length} 件）：` },
          {
            type: "flex",
            altText: "請假申請",
            cards: pendingLeaves.map(l => ({
              title: l.studentName,
              subtitle: `請假日期：${l.date}`,
              body: `課程：${l.courseName}`,
              color: "#F59E0B",
            })),
          },
          {
            type: "button_list",
            text: "",
            buttons: [{ label: "前往確認", href: "/liff/coach", style: "primary" }],
          },
        ],
  }),
}

export function resolveKeyword(
  keyword: string,
  role: "student" | "coach" | "admin",
  params: Parameters<ResolverFn>[0]
): KeywordResponse | null {
  const map = role === "student" ? STUDENT_KEYWORDS : role === "coach" ? COACH_KEYWORDS : {}
  const trimmed = keyword.trim()
  const resolver = (map as Record<string, ResolverFn>)[trimmed]
  if (!resolver) return null
  return resolver(params)
}
