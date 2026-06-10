export interface Course {
  id: string
  title: string
  coachId: string
  startTime: string
  endTime: string
  capacity: number
  enrolledCount: number
  location: string
  dayOfWeek: number // 0=Sun, 1=Mon...
  color: string
}

export interface Enrollment {
  id: string
  studentId: string
  courseId: string
  status: "confirmed" | "cancelled"
  createdAt: string
}

// Generate dates for current week
function getNextWeekday(dayOfWeek: number, hour: number, minute: number = 0): string {
  const now = new Date()
  const today = now.getDay()
  const diff = (dayOfWeek - today + 7) % 7 || 7
  const target = new Date(now)
  target.setDate(now.getDate() + diff)
  target.setHours(hour, minute, 0, 0)
  return target.toISOString()
}

function getNextWeekdayEnd(startIso: string, durationMin: number): string {
  const d = new Date(startIso)
  d.setMinutes(d.getMinutes() + durationMin)
  return d.toISOString()
}

const c1Start = getNextWeekday(1, 7) // Mon 07:00
const c2Start = getNextWeekday(3, 7) // Wed 07:00
const c3Start = getNextWeekday(5, 7) // Fri 07:00
const c4Start = getNextWeekday(2, 10) // Tue 10:00
const c5Start = getNextWeekday(4, 10) // Thu 10:00
const c6Start = getNextWeekday(6, 9) // Sat 09:00

export const courses: Course[] = [
  {
    id: "cr1",
    title: "TRX 基礎班",
    coachId: "c1",
    startTime: c1Start,
    endTime: getNextWeekdayEnd(c1Start, 60),
    capacity: 8,
    enrolledCount: 5,
    location: "訓練室 A",
    dayOfWeek: 1,
    color: "#3B82F6",
  },
  {
    id: "cr2",
    title: "TRX 進階班",
    coachId: "c1",
    startTime: c2Start,
    endTime: getNextWeekdayEnd(c2Start, 60),
    capacity: 6,
    enrolledCount: 6,
    location: "訓練室 A",
    dayOfWeek: 3,
    color: "#8B5CF6",
  },
  {
    id: "cr3",
    title: "TRX 核心強化",
    coachId: "c1",
    startTime: c3Start,
    endTime: getNextWeekdayEnd(c3Start, 60),
    capacity: 8,
    enrolledCount: 3,
    location: "訓練室 A",
    dayOfWeek: 5,
    color: "#3B82F6",
  },
  {
    id: "cr4",
    title: "晨間瑜伽",
    coachId: "c2",
    startTime: c4Start,
    endTime: getNextWeekdayEnd(c4Start, 75),
    capacity: 10,
    enrolledCount: 7,
    location: "瑜伽教室",
    dayOfWeek: 2,
    color: "#10B981",
  },
  {
    id: "cr5",
    title: "流動瑜伽",
    coachId: "c2",
    startTime: c5Start,
    endTime: getNextWeekdayEnd(c5Start, 75),
    capacity: 10,
    enrolledCount: 4,
    location: "瑜伽教室",
    dayOfWeek: 4,
    color: "#10B981",
  },
  {
    id: "cr6",
    title: "週末瑜伽深化",
    coachId: "c2",
    startTime: c6Start,
    endTime: getNextWeekdayEnd(c6Start, 90),
    capacity: 12,
    enrolledCount: 10,
    location: "瑜伽教室",
    dayOfWeek: 6,
    color: "#F59E0B",
  },
]

export const enrollments: Enrollment[] = [
  { id: "e1", studentId: "s1", courseId: "cr1", status: "confirmed", createdAt: "2024-03-01" },
  { id: "e2", studentId: "s2", courseId: "cr1", status: "confirmed", createdAt: "2024-03-01" },
  { id: "e3", studentId: "s5", courseId: "cr1", status: "confirmed", createdAt: "2024-03-02" },
  { id: "e4", studentId: "s1", courseId: "cr2", status: "confirmed", createdAt: "2024-03-01" },
  { id: "e5", studentId: "s2", courseId: "cr2", status: "confirmed", createdAt: "2024-03-01" },
  { id: "e6", studentId: "s3", courseId: "cr4", status: "confirmed", createdAt: "2024-03-02" },
  { id: "e7", studentId: "s6", courseId: "cr4", status: "confirmed", createdAt: "2024-03-02" },
  { id: "e8", studentId: "s3", courseId: "cr5", status: "confirmed", createdAt: "2024-03-03" },
  { id: "e9", studentId: "s1", courseId: "cr6", status: "confirmed", createdAt: "2024-03-01" },
]
