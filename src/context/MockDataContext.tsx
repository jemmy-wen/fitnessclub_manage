"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { coaches as initialCoaches, Coach } from "@/mock/coaches"
import { students as initialStudents, Student, PaymentStatus } from "@/mock/students"
import { courses as initialCourses, enrollments as initialEnrollments, Course, Enrollment } from "@/mock/courses"
import { leaveRequests as initialLeaves, LeaveRequest, LeaveStatus } from "@/mock/leaves"
import { notifications as initialNotifications, Notification } from "@/mock/notifications"

export type ActiveRole = "student" | "coach" | "admin"
export type ActiveUser = { role: ActiveRole; userId: string; name: string; entityId: string }
export type CalendarItemType = "class" | "leave"
export type WeeklyAvailability = {
  id: string
  coachId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  location: string
  capacity: number
  enabled: boolean
}
export type CoachCalendarItem = {
  id: string
  coachId: string
  date: string
  startTime: string
  endTime: string
  title: string
  type: CalendarItemType
  location?: string
  capacity?: number
  enrolledCount?: number
  color?: string
}

const DEFAULT_USERS: ActiveUser[] = [
  { role: "student", userId: "Ustudent001", name: "王小明", entityId: "s1" },
  { role: "student", userId: "Ustudent002", name: "李佳慧", entityId: "s2" },
  { role: "coach", userId: "Ucoach001", name: "陳志豪", entityId: "c1" },
  { role: "coach", userId: "Ucoach002", name: "林美華", entityId: "c2" },
  { role: "admin", userId: "Uadmin001", name: "管理者", entityId: "admin" },
]

const DEFAULT_WEEKLY_AVAILABILITY: WeeklyAvailability[] = [
  { id: "wa1", coachId: "c1", dayOfWeek: 1, startTime: "18:00", endTime: "21:00", location: "訓練室 A", capacity: 1, enabled: true },
  { id: "wa2", coachId: "c1", dayOfWeek: 3, startTime: "18:00", endTime: "21:00", location: "訓練室 A", capacity: 1, enabled: true },
  { id: "wa3", coachId: "c1", dayOfWeek: 6, startTime: "09:00", endTime: "12:00", location: "訓練室 B", capacity: 2, enabled: true },
  { id: "wa4", coachId: "c2", dayOfWeek: 2, startTime: "10:00", endTime: "13:00", location: "瑜伽教室", capacity: 4, enabled: true },
  { id: "wa5", coachId: "c2", dayOfWeek: 4, startTime: "10:00", endTime: "13:00", location: "瑜伽教室", capacity: 4, enabled: true },
  { id: "wa6", coachId: "c2", dayOfWeek: 6, startTime: "14:00", endTime: "17:00", location: "瑜伽教室", capacity: 6, enabled: false },
]

function toDateKey(offsetDays: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

const DEFAULT_CALENDAR_ITEMS: CoachCalendarItem[] = [
  {
    id: "ci1",
    coachId: "c1",
    date: toDateKey(1),
    startTime: "19:00",
    endTime: "20:00",
    title: "王小明 個人訓練",
    type: "class",
    location: "訓練室 A",
    capacity: 1,
    enrolledCount: 1,
    color: "#2563EB",
  },
  {
    id: "ci2",
    coachId: "c2",
    date: toDateKey(1),
    startTime: "18:30",
    endTime: "19:30",
    title: "林教練 場地使用",
    type: "class",
    location: "訓練室 A",
    capacity: 4,
    enrolledCount: 3,
    color: "#059669",
  },
  {
    id: "ci3",
    coachId: "c1",
    date: toDateKey(4),
    startTime: "18:00",
    endTime: "21:00",
    title: "私人行程",
    type: "leave",
    location: "訓練室 A",
    color: "#DC2626",
  },
]

interface MockDataContextType {
  // Data
  coaches: Coach[]
  students: Student[]
  courses: Course[]
  enrollments: Enrollment[]
  leaveRequests: LeaveRequest[]
  notifications: Notification[]
  weeklyAvailability: WeeklyAvailability[]
  coachCalendarItems: CoachCalendarItem[]
  // Active user (LINE simulator)
  activeUser: ActiveUser
  availableUsers: ActiveUser[]
  setActiveUser: (user: ActiveUser) => void
  // Student ops
  updateStudentPayment: (studentId: string, status: PaymentStatus) => void
  adjustStudentSessions: (studentId: string, delta: number) => void
  addStudent: (student: Omit<Student, "id">) => void
  addCoach: (coach: Omit<Coach, "id">) => void
  bindStudent: (studentId: string, lineUserId: string) => void
  generateInviteCode: () => string
  // Course ops
  addCourse: (course: Omit<Course, "id" | "enrolledCount">) => void
  updateCourse: (courseId: string, updates: Partial<Course>) => void
  deleteCourse: (courseId: string) => void
  enrollStudent: (studentId: string, courseId: string) => void
  addCoachCalendarItem: (item: Omit<CoachCalendarItem, "id">) => void
  deleteCoachCalendarItem: (itemId: string) => void
  updateWeeklyAvailability: (availabilityId: string, updates: Partial<WeeklyAvailability>) => void
  // Leave ops
  addLeaveRequest: (req: Omit<LeaveRequest, "id" | "createdAt">) => void
  updateLeaveStatus: (leaveId: string, status: LeaveStatus, note?: string) => void
  // Notification ops
  addNotification: (notif: Omit<Notification, "id" | "createdAt" | "read">) => void
  getNotificationsFor: (userId: string) => Notification[]
  markNotificationRead: (id: string) => void
  // Settings
  settings: { reminderHoursBefore: number; lowSessionsThreshold: number }
  updateSettings: (s: Partial<{ reminderHoursBefore: number; lowSessionsThreshold: number }>) => void
}

const MockDataContext = createContext<MockDataContextType | null>(null)
const SYNC_CHANNEL = "actflow-mock-data"
const LEAVES_SYNC_KEY = "actflow:leaveRequests"
const NOTIFICATIONS_SYNC_KEY = "actflow:notifications"

function readSyncedList<T>(key: string): T[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T[] : null
  } catch {
    return null
  }
}

function publishSyncedList<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(value))
  const channel = new BroadcastChannel(SYNC_CHANNEL)
  channel.postMessage({ key, value })
  channel.close()
}

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  const [coachList, setCoachList] = useState<Coach[]>(initialCoaches)
  const [studentList, setStudentList] = useState<Student[]>(initialStudents)
  const [courseList, setCourseList] = useState<Course[]>(initialCourses)
  const [enrollmentList, setEnrollmentList] = useState<Enrollment[]>(initialEnrollments)
  const [leaveList, setLeaveList] = useState<LeaveRequest[]>(initialLeaves)
  const [notifList, setNotifList] = useState<Notification[]>(initialNotifications)
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability[]>(DEFAULT_WEEKLY_AVAILABILITY)
  const [coachCalendarItems, setCoachCalendarItems] = useState<CoachCalendarItem[]>(DEFAULT_CALENDAR_ITEMS)
  const [activeUser, setActiveUser] = useState<ActiveUser>(DEFAULT_USERS[0])
  const [availableUsers, setAvailableUsers] = useState<ActiveUser[]>(DEFAULT_USERS)
  const [settings, setSettings] = useState({ reminderHoursBefore: 24, lowSessionsThreshold: 3 })

  useEffect(() => {
    const syncedLeaves = readSyncedList<LeaveRequest>(LEAVES_SYNC_KEY)
    const syncedNotifications = readSyncedList<Notification>(NOTIFICATIONS_SYNC_KEY)
    queueMicrotask(() => {
      if (syncedLeaves) setLeaveList(syncedLeaves)
      if (syncedNotifications) setNotifList(syncedNotifications)
    })

    const channel = new BroadcastChannel(SYNC_CHANNEL)
    channel.onmessage = event => {
      if (event.data?.key === LEAVES_SYNC_KEY) setLeaveList(event.data.value)
      if (event.data?.key === NOTIFICATIONS_SYNC_KEY) setNotifList(event.data.value)
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === LEAVES_SYNC_KEY) {
        const next = readSyncedList<LeaveRequest>(LEAVES_SYNC_KEY)
        if (next) setLeaveList(next)
      }
      if (event.key === NOTIFICATIONS_SYNC_KEY) {
        const next = readSyncedList<Notification>(NOTIFICATIONS_SYNC_KEY)
        if (next) setNotifList(next)
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => {
      channel.close()
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  const updateStudentPayment = useCallback((studentId: string, status: PaymentStatus) => {
    setStudentList(prev => prev.map(s => s.id === studentId ? { ...s, paymentStatus: status } : s))
  }, [])

  const adjustStudentSessions = useCallback((studentId: string, delta: number) => {
    setStudentList(prev => prev.map(s =>
      s.id === studentId ? { ...s, remainingSessions: Math.max(0, s.remainingSessions + delta) } : s
    ))
  }, [])

  const addStudent = useCallback((student: Omit<Student, "id">) => {
    const id = `s${Date.now()}`
    const newStudent = { ...student, id }
    setStudentList(prev => [...prev, newStudent])
    if (newStudent.lineUserId) {
      setAvailableUsers(prev => [...prev, {
        role: "student",
        userId: newStudent.lineUserId ?? `Ustudent${Date.now()}`,
        name: newStudent.name,
        entityId: id,
      }])
    }
  }, [])

  const addCoach = useCallback((coach: Omit<Coach, "id">) => {
    const id = `c${Date.now()}`
    const newCoach = { ...coach, id }
    setCoachList(prev => [...prev, newCoach])
    setAvailableUsers(prev => [...prev, {
      role: "coach",
      userId: newCoach.lineUserId,
      name: newCoach.name,
      entityId: id,
    }])
  }, [])

  const bindStudent = useCallback((studentId: string, lineUserId: string) => {
    setStudentList(prev => prev.map(s =>
      s.id === studentId ? { ...s, lineUserId, bindingStatus: "bound" } : s
    ))
  }, [])

  const generateInviteCode = useCallback(() => {
    const prefix = ["TRX", "YOGA", "FIT"][Math.floor(Math.random() * 3)]
    const code = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${prefix}-${code}`
  }, [])

  const addCourse = useCallback((course: Omit<Course, "id" | "enrolledCount">) => {
    setCourseList(prev => [...prev, { ...course, id: `cr${Date.now()}`, enrolledCount: 0 }])
  }, [])

  const updateCourse = useCallback((courseId: string, updates: Partial<Course>) => {
    setCourseList(prev => prev.map(c => c.id === courseId ? { ...c, ...updates } : c))
  }, [])

  const deleteCourse = useCallback((courseId: string) => {
    setCourseList(prev => prev.filter(c => c.id !== courseId))
  }, [])

  const enrollStudent = useCallback((studentId: string, courseId: string) => {
    const exists = enrollmentList.find(e => e.studentId === studentId && e.courseId === courseId)
    if (exists) return
    setEnrollmentList(prev => [...prev, {
      id: `e${Date.now()}`, studentId, courseId, status: "confirmed", createdAt: new Date().toISOString()
    }])
    setCourseList(prev => prev.map(c => c.id === courseId ? { ...c, enrolledCount: c.enrolledCount + 1 } : c))
    setStudentList(prev => prev.map(s => s.id === studentId ? { ...s, remainingSessions: Math.max(0, s.remainingSessions - 1) } : s))
  }, [enrollmentList])

  const addCoachCalendarItem = useCallback((item: Omit<CoachCalendarItem, "id">) => {
    setCoachCalendarItems(prev => [...prev, { ...item, id: `ci${Date.now()}` }])
  }, [])

  const deleteCoachCalendarItem = useCallback((itemId: string) => {
    setCoachCalendarItems(prev => prev.filter(item => item.id !== itemId))
  }, [])

  const updateWeeklyAvailability = useCallback((availabilityId: string, updates: Partial<WeeklyAvailability>) => {
    setWeeklyAvailability(prev => prev.map(item =>
      item.id === availabilityId ? { ...item, ...updates } : item
    ))
  }, [])

  const addLeaveRequest = useCallback((req: Omit<LeaveRequest, "id" | "createdAt">) => {
    setLeaveList(prev => {
      const next = [...prev, { ...req, id: `l${Date.now()}`, createdAt: new Date().toISOString() }]
      publishSyncedList(LEAVES_SYNC_KEY, next)
      return next
    })
  }, [])

  const updateLeaveStatus = useCallback((leaveId: string, status: LeaveStatus, note?: string) => {
    setLeaveList(prev => {
      const next = prev.map(l => l.id === leaveId ? { ...l, status, coachNote: note ?? l.coachNote } : l)
      publishSyncedList(LEAVES_SYNC_KEY, next)
      return next
    })
  }, [])

  const addNotification = useCallback((notif: Omit<Notification, "id" | "createdAt" | "read">) => {
    setNotifList(prev => {
      const next = [...prev, { ...notif, id: `n${Date.now()}`, createdAt: new Date().toISOString(), read: false }]
      publishSyncedList(NOTIFICATIONS_SYNC_KEY, next)
      return next
    })
  }, [])

  const getNotificationsFor = useCallback((userId: string) => {
    return notifList.filter(n => n.targetUserId === userId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [notifList])

  const markNotificationRead = useCallback((id: string) => {
    setNotifList(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n)
      publishSyncedList(NOTIFICATIONS_SYNC_KEY, next)
      return next
    })
  }, [])

  const updateSettings = useCallback((s: Partial<typeof settings>) => {
    setSettings(prev => ({ ...prev, ...s }))
  }, [])

  return (
    <MockDataContext.Provider value={{
      coaches: coachList,
      students: studentList,
      courses: courseList,
      enrollments: enrollmentList,
      leaveRequests: leaveList,
      notifications: notifList,
      weeklyAvailability,
      coachCalendarItems,
      activeUser,
      availableUsers,
      setActiveUser,
      updateStudentPayment,
      adjustStudentSessions,
      addStudent,
      addCoach,
      bindStudent,
      generateInviteCode,
      addCourse,
      updateCourse,
      deleteCourse,
      enrollStudent,
      addCoachCalendarItem,
      deleteCoachCalendarItem,
      updateWeeklyAvailability,
      addLeaveRequest,
      updateLeaveStatus,
      addNotification,
      getNotificationsFor,
      markNotificationRead,
      settings,
      updateSettings,
    }}>
      {children}
    </MockDataContext.Provider>
  )
}

export function useMockData() {
  const ctx = useContext(MockDataContext)
  if (!ctx) throw new Error("useMockData must be used within MockDataProvider")
  return ctx
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  return isMobile
}
