"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { coaches as initialCoaches, Coach } from "@/mock/coaches"
import { students as initialStudents, Student, PaymentStatus } from "@/mock/students"
import { courses as initialCourses, enrollments as initialEnrollments, Course, Enrollment } from "@/mock/courses"
import { leaveRequests as initialLeaves, LeaveRequest, LeaveStatus } from "@/mock/leaves"
import { notifications as initialNotifications, Notification } from "@/mock/notifications"

export type ActiveRole = "student" | "coach" | "admin"
export type ActiveUser = { role: ActiveRole; userId: string; name: string; entityId: string }

const DEFAULT_USERS: ActiveUser[] = [
  { role: "student", userId: "Ustudent001", name: "王小明", entityId: "s1" },
  { role: "student", userId: "Ustudent002", name: "李佳慧", entityId: "s2" },
  { role: "coach", userId: "Ucoach001", name: "陳志豪", entityId: "c1" },
  { role: "coach", userId: "Ucoach002", name: "林美華", entityId: "c2" },
  { role: "admin", userId: "Uadmin001", name: "管理者", entityId: "admin" },
]

interface MockDataContextType {
  // Data
  coaches: Coach[]
  students: Student[]
  courses: Course[]
  enrollments: Enrollment[]
  leaveRequests: LeaveRequest[]
  notifications: Notification[]
  // Active user (LINE simulator)
  activeUser: ActiveUser
  availableUsers: ActiveUser[]
  setActiveUser: (user: ActiveUser) => void
  // Student ops
  updateStudentPayment: (studentId: string, status: PaymentStatus) => void
  adjustStudentSessions: (studentId: string, delta: number) => void
  addStudent: (student: Omit<Student, "id">) => void
  bindStudent: (studentId: string, lineUserId: string) => void
  generateInviteCode: () => string
  // Course ops
  addCourse: (course: Omit<Course, "id" | "enrolledCount">) => void
  updateCourse: (courseId: string, updates: Partial<Course>) => void
  deleteCourse: (courseId: string) => void
  enrollStudent: (studentId: string, courseId: string) => void
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

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  const [coachList, setCoachList] = useState<Coach[]>(initialCoaches)
  const [studentList, setStudentList] = useState<Student[]>(initialStudents)
  const [courseList, setCourseList] = useState<Course[]>(initialCourses)
  const [enrollmentList, setEnrollmentList] = useState<Enrollment[]>(initialEnrollments)
  const [leaveList, setLeaveList] = useState<LeaveRequest[]>(initialLeaves)
  const [notifList, setNotifList] = useState<Notification[]>(initialNotifications)
  const [activeUser, setActiveUser] = useState<ActiveUser>(DEFAULT_USERS[0])
  const [settings, setSettings] = useState({ reminderHoursBefore: 24, lowSessionsThreshold: 3 })

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
    setStudentList(prev => [...prev, { ...student, id }])
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

  const addLeaveRequest = useCallback((req: Omit<LeaveRequest, "id" | "createdAt">) => {
    setLeaveList(prev => [...prev, { ...req, id: `l${Date.now()}`, createdAt: new Date().toISOString() }])
  }, [])

  const updateLeaveStatus = useCallback((leaveId: string, status: LeaveStatus, note?: string) => {
    setLeaveList(prev => prev.map(l => l.id === leaveId ? { ...l, status, coachNote: note ?? l.coachNote } : l))
  }, [])

  const addNotification = useCallback((notif: Omit<Notification, "id" | "createdAt" | "read">) => {
    setNotifList(prev => [...prev, { ...notif, id: `n${Date.now()}`, createdAt: new Date().toISOString(), read: false }])
  }, [])

  const getNotificationsFor = useCallback((userId: string) => {
    return notifList.filter(n => n.targetUserId === userId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [notifList])

  const markNotificationRead = useCallback((id: string) => {
    setNotifList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
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
      activeUser,
      availableUsers: DEFAULT_USERS,
      setActiveUser,
      updateStudentPayment,
      adjustStudentSessions,
      addStudent,
      bindStudent,
      generateInviteCode,
      addCourse,
      updateCourse,
      deleteCourse,
      enrollStudent,
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
