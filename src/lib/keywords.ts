export type MessageType = "text" | "flex" | "button_list" | "course_select" | "action_buttons"

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

export interface CourseSelectMessage {
  type: "course_select"
  prompt: string
  courses: { id: string; title: string; dayLabel: string; time: string; coachName: string }[]
}

export interface ActionButtonsMessage {
  type: "action_buttons"
  text: string
  buttons: { label: string; action: string; style?: "primary" | "secondary" | "danger" }[]
}

export type LineMessage =
  | TextMessage
  | FlexMessage
  | ButtonListMessage
  | CourseSelectMessage
  | ActionButtonsMessage

export type MessageAction =
  | { type: "select_course"; courseId: string; courseTitle: string }
  | { type: "button_action"; action: string }

// ─── Intent Detection ─────────────────────────────────────────────────────────

export type Intent =
  | "leave"
  | "book"
  | "schedule"
  | "sessions"
  | "contact_coach"
  | "coach_today"
  | "coach_students"
  | "coach_leaves"
  | "coach_broadcast"
  | "coach_availability"
  | "coach_admin"
  | "unknown"

const INTENT_PATTERNS: { intent: Intent; patterns: string[] }[] = [
  {
    intent: "leave",
    patterns: ["請假", "調課", "改時間", "來不了", "有事", "取消", "不能來", "沒辦法來", "請個假", "缺席", "可能來不了"],
  },
  {
    intent: "book",
    patterns: ["預約", "報名", "想上", "想預約", "下週", "想參加"],
  },
  {
    intent: "schedule",
    patterns: ["課表", "幾點", "什麼課", "這週", "上什麼", "排課", "哪幾堂", "有什麼課"],
  },
  {
    intent: "sessions",
    patterns: ["剩餘", "堂數", "幾堂", "快用完", "還有幾", "還剩", "堂課"],
  },
  {
    intent: "contact_coach",
    patterns: ["聯絡教練", "聯繫教練", "教練電話", "教練LINE", "教練聯絡"],
  },
  {
    intent: "coach_today",
    patterns: ["今天", "今日課", "今天課", "今天要上", "今日課表"],
  },
  {
    intent: "coach_students",
    patterns: ["學員", "學生", "名單", "誰在", "有誰"],
  },
  {
    intent: "coach_leaves",
    patterns: ["請假申請", "有誰請假", "有誰要請假", "誰要請假", "查看請假", "請假件數", "待確認請假", "待確認", "請假"],
  },
  {
    intent: "coach_broadcast",
    patterns: ["推播提醒", "推播", "發通知", "通知學員", "提醒學員", "群發"],
  },
  {
    intent: "coach_availability",
    patterns: ["我的空檔", "本週空檔", "空檔", "可以排課", "有空的時間", "排課時間"],
  },
  {
    intent: "coach_admin",
    patterns: ["後台管理", "後台", "管理後台", "去後台"],
  },
]

const DAY_PATTERNS: { pattern: string; day: number }[] = [
  { pattern: "週一", day: 1 },
  { pattern: "星期一", day: 1 },
  { pattern: "週二", day: 2 },
  { pattern: "星期二", day: 2 },
  { pattern: "週三", day: 3 },
  { pattern: "星期三", day: 3 },
  { pattern: "週四", day: 4 },
  { pattern: "星期四", day: 4 },
  { pattern: "週五", day: 5 },
  { pattern: "星期五", day: 5 },
  { pattern: "週六", day: 6 },
  { pattern: "星期六", day: 6 },
  { pattern: "週日", day: 0 },
  { pattern: "星期日", day: 0 },
  { pattern: "週天", day: 0 },
]

export function detectIntent(text: string): { intent: Intent; dayOfWeek?: number } {
  let matchedIntent: Intent = "unknown"
  let maxMatches = 0

  for (const { intent, patterns } of INTENT_PATTERNS) {
    const matches = patterns.filter(p => text.includes(p)).length
    if (matches > maxMatches) {
      maxMatches = matches
      matchedIntent = intent
    }
  }

  let dayOfWeek: number | undefined
  for (const { pattern, day } of DAY_PATTERNS) {
    if (text.includes(pattern)) {
      dayOfWeek = day
      break
    }
  }

  return { intent: matchedIntent, dayOfWeek }
}

// ─── Legacy keyword resolvers (coach flows) ───────────────────────────────────

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
  我的課表: ({ courses = [] }) => ({
    messages:
      courses.length === 0
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
            footer:
              remainingSessions <= 3
                ? "⚠️ 堂數不足，請盡快聯繫教練續費"
                : "課程使用正常",
            color: remainingSessions <= 3 ? "#EF4444" : "#10B981",
          },
        ],
      },
    ],
  }),
}

export const COACH_KEYWORDS: Record<string, ResolverFn> = {
  今日課表: ({ courses = [], coachName = "" }) => ({
    messages:
      courses.length === 0
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
    messages:
      pendingLeaves.length === 0
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
