export type PaymentStatus = "paid" | "unpaid" | "pending"
export type BindingStatus = "bound" | "unbound"

export interface Student {
  id: string
  name: string
  phone: string
  lineUserId: string | null
  coachId: string
  inviteCode: string
  remainingSessions: number
  paymentStatus: PaymentStatus
  bindingStatus: BindingStatus
  joinedAt: string
  totalSessions: number
  attendedSessions: number
}

export const students: Student[] = [
  {
    id: "s1",
    name: "王小明",
    phone: "0912-111-001",
    lineUserId: "Ustudent001",
    coachId: "c1",
    inviteCode: "TRX-A001",
    remainingSessions: 8,
    paymentStatus: "paid",
    bindingStatus: "bound",
    joinedAt: "2024-01-15",
    totalSessions: 20,
    attendedSessions: 12,
  },
  {
    id: "s2",
    name: "李佳慧",
    phone: "0912-111-002",
    lineUserId: "Ustudent002",
    coachId: "c1",
    inviteCode: "TRX-A002",
    remainingSessions: 3,
    paymentStatus: "paid",
    bindingStatus: "bound",
    joinedAt: "2024-02-01",
    totalSessions: 16,
    attendedSessions: 13,
  },
  {
    id: "s3",
    name: "張建國",
    phone: "0912-111-003",
    lineUserId: "Ustudent003",
    coachId: "c2",
    inviteCode: "YOGA-B001",
    remainingSessions: 12,
    paymentStatus: "paid",
    bindingStatus: "bound",
    joinedAt: "2024-01-20",
    totalSessions: 24,
    attendedSessions: 12,
  },
  {
    id: "s4",
    name: "劉雅婷",
    phone: "0912-111-004",
    lineUserId: null,
    coachId: "c2",
    inviteCode: "YOGA-B002",
    remainingSessions: 10,
    paymentStatus: "unpaid",
    bindingStatus: "unbound",
    joinedAt: "2024-03-10",
    totalSessions: 10,
    attendedSessions: 0,
  },
  {
    id: "s5",
    name: "陳俊杰",
    phone: "0912-111-005",
    lineUserId: "Ustudent005",
    coachId: "c1",
    inviteCode: "TRX-A003",
    remainingSessions: 2,
    paymentStatus: "unpaid",
    bindingStatus: "bound",
    joinedAt: "2024-02-15",
    totalSessions: 12,
    attendedSessions: 10,
  },
  {
    id: "s6",
    name: "黃淑芬",
    phone: "0912-111-006",
    lineUserId: "Ustudent006",
    coachId: "c2",
    inviteCode: "YOGA-B003",
    remainingSessions: 6,
    paymentStatus: "paid",
    bindingStatus: "bound",
    joinedAt: "2024-01-05",
    totalSessions: 18,
    attendedSessions: 12,
  },
]
