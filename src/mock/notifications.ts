export interface Notification {
  id: string
  targetUserId: string
  targetRole: "student" | "coach" | "admin"
  message: string
  type: "leave_request" | "booking_confirmed" | "reminder" | "low_sessions" | "binding_complete" | "leave_confirmed" | "leave_rejected" | "broadcast" | "course_reminder"
  createdAt: string
  read: boolean
}

export const notifications: Notification[] = [
  {
    id: "n1",
    targetUserId: "Ucoach001",
    targetRole: "coach",
    message: "學員 王小明 已申請 3/18 請假",
    type: "leave_request",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: "n2",
    targetUserId: "Ustudent001",
    targetRole: "student",
    message: "預約成功：TRX 基礎班，時間 週一 07:00",
    type: "booking_confirmed",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    read: true,
  },
  {
    id: "n3",
    targetUserId: "Ustudent002",
    targetRole: "student",
    message: "您的課程包剩餘 3 堂，請聯繫導師續費",
    type: "low_sessions",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    read: false,
  },
]
