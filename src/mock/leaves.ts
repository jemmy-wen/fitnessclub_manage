export type LeaveStatus = "pending" | "confirmed" | "rejected"

export interface LeaveRequest {
  id: string
  studentId: string
  courseId: string
  date: string
  reason: string
  status: LeaveStatus
  coachNote: string
  createdAt: string
}

export const leaveRequests: LeaveRequest[] = [
  {
    id: "l1",
    studentId: "s1",
    courseId: "cr1",
    date: "2024-03-18",
    reason: "出差",
    status: "pending",
    coachNote: "",
    createdAt: "2024-03-14",
  },
  {
    id: "l2",
    studentId: "s2",
    courseId: "cr1",
    date: "2024-03-18",
    reason: "家庭因素",
    status: "confirmed",
    coachNote: "已確認，請假扣 1 堂",
    createdAt: "2024-03-13",
  },
  {
    id: "l3",
    studentId: "s3",
    courseId: "cr4",
    date: "2024-03-19",
    reason: "身體不適",
    status: "pending",
    coachNote: "",
    createdAt: "2024-03-14",
  },
  {
    id: "l4",
    studentId: "s6",
    courseId: "cr4",
    date: "2024-03-12",
    reason: "旅遊",
    status: "confirmed",
    coachNote: "已記錄",
    createdAt: "2024-03-10",
  },
  {
    id: "l5",
    studentId: "s5",
    courseId: "cr1",
    date: "2024-03-11",
    reason: "工作加班",
    status: "confirmed",
    coachNote: "",
    createdAt: "2024-03-09",
  },
]
