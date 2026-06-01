"use client"

import { useState } from "react"
import { useMockData } from "@/context/MockDataContext"
import { useViewMode } from "@/context/ViewModeContext"
import { Course } from "@/mock/courses"
import { format } from "date-fns"
import { Plus, Pencil, Trash2, Users, MapPin, Clock } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]
const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06C755"]

// ── Course Form ───────────────────────────────────────────────────────────────

function CourseForm({ course, onSave, onClose }: {
  course?: Course | null
  onSave: (data: Omit<Course, "id" | "enrolledCount">) => void
  onClose: () => void
}) {
  const { coaches } = useMockData()
  const [form, setForm] = useState({
    title: course?.title ?? "",
    coachId: course?.coachId ?? coaches[0]?.id ?? "",
    dayOfWeek: course?.dayOfWeek ?? 1,
    startHour: course ? new Date(course.startTime).getHours() : 7,
    startMin: course ? new Date(course.startTime).getMinutes() : 0,
    duration: course ? Math.round((new Date(course.endTime).getTime() - new Date(course.startTime).getTime()) / 60000) : 60,
    capacity: course?.capacity ?? 8,
    location: course?.location ?? "訓練室 A",
    color: course?.color ?? "#3B82F6",
  })

  function handleSave() {
    if (!form.title.trim()) return
    const now = new Date()
    const diff = (form.dayOfWeek - now.getDay() + 7) % 7 || 7
    const start = new Date(now)
    start.setDate(now.getDate() + diff)
    start.setHours(form.startHour, form.startMin, 0, 0)
    const end = new Date(start.getTime() + form.duration * 60000)
    onSave({ ...form, startTime: start.toISOString(), endTime: end.toISOString() })
    onClose()
  }

  return (
    <div className="space-y-4 pt-2">
      {/* 課程名稱 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">課程名稱</label>
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="例：TRX 基礎班"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
        />
      </div>

      {/* 導師 + 星期 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">導師</label>
          <select value={form.coachId} onChange={e => setForm(f => ({ ...f, coachId: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
            {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">星期</label>
          <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: parseInt(e.target.value) }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
            {DAY_LABELS.map((d, i) => <option key={i} value={i}>週{d}</option>)}
          </select>
        </div>
      </div>

      {/* 時間 + 時長 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">開始時間</label>
          <input type="time"
            value={`${String(form.startHour).padStart(2, "0")}:${String(form.startMin).padStart(2, "0")}`}
            onChange={e => {
              const [h, m] = e.target.value.split(":").map(Number)
              setForm(f => ({ ...f, startHour: h, startMin: m }))
            }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">時長（分鐘）</label>
          <input type="number" value={form.duration}
            onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 60 }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
        </div>
      </div>

      {/* 名額 + 地點 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">名額上限</label>
          <input type="number" value={form.capacity}
            onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">地點</label>
          <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
        </div>
      </div>

      {/* 顏色標籤 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">顏色標籤</label>
        <div className="flex gap-3">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setForm(f => ({ ...f, color: c }))}
              className="w-9 h-9 rounded-full transition-all focus:outline-none"
              style={{
                backgroundColor: c,
                transform: form.color === c ? "scale(1.2)" : "scale(1)",
                boxShadow: form.color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button onClick={onClose}
          className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-200 transition-colors">
          取消
        </button>
        <button onClick={handleSave}
          className="flex-1 bg-[#06C755] text-white rounded-xl py-3 text-sm font-medium hover:bg-green-600 transition-colors">
          儲存
        </button>
      </div>
    </div>
  )
}

// ── Mobile Course Row (手機版：橫向單行卡片) ──────────────────────────────────

function MobileCourseRow({ course, enrolledNames, onEdit, onDelete }: {
  course: Course; enrolledNames: string[]; onEdit: () => void; onDelete: () => void
}) {
  const { coaches } = useMockData()
  const coach = coaches.find(c => c.id === course.coachId)
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{course.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {format(new Date(course.startTime), "HH:mm")}–{format(new Date(course.endTime), "HH:mm")}
          {coach && ` · ${coach.name}`}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{course.location} · {course.enrolledCount}/{course.capacity} 人</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Course Card ───────────────────────────────────────────────────────────────

function CourseCard({ course, enrolledNames, onEdit, onDelete }: {
  course: Course
  enrolledNames: string[]
  onEdit: () => void
  onDelete: () => void
}) {
  const { coaches } = useMockData()
  const coach = coaches.find(c => c.id === course.coachId)
  const isFull = course.enrolledCount >= course.capacity

  return (
    <div className="bg-white rounded-xl p-3 space-y-2 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
          <span className="font-semibold text-gray-900 text-sm leading-tight">{course.title}</span>
        </div>
        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3 h-3 shrink-0" />
          {format(new Date(course.startTime), "HH:mm")} – {format(new Date(course.endTime), "HH:mm")}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <MapPin className="w-3 h-3 shrink-0" />
          {course.location}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Users className="w-3 h-3 shrink-0 text-gray-400" />
          <span className={isFull ? "text-red-500 font-medium" : "text-gray-500"}>
            {course.enrolledCount}/{course.capacity}
            {isFull && " 已額滿"}
          </span>
        </div>
        {coach && (
          <div className="text-xs text-gray-400">{coach.name}</div>
        )}
      </div>

      {/* Enrolled chips */}
      {enrolledNames.length > 0 && (
        <div className="pt-1 border-t border-gray-50">
          <div className="flex flex-wrap gap-1">
            {enrolledNames.map((name, i) => (
              <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const { courses, coaches, enrollments, students, addCourse, updateCourse, deleteCourse } = useMockData()
  const { isMobile } = useViewMode()
  const [editTarget, setEditTarget] = useState<Course | null | "new">(null)
  const [newDayOfWeek, setNewDayOfWeek] = useState<number | undefined>()

  function getEnrolledNames(courseId: string) {
    return enrollments
      .filter(e => e.courseId === courseId && e.status === "confirmed")
      .map(e => students.find(s => s.id === e.studentId)?.name ?? "")
      .filter(Boolean)
  }

  function handleAddForDay(dow: number) {
    setNewDayOfWeek(dow)
    setEditTarget("new")
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">課程管理</h1>
          <p className="text-sm text-gray-500">{courses.length} 個課程</p>
        </div>
        <button
          onClick={() => { setNewDayOfWeek(undefined); setEditTarget("new") }}
          className="flex items-center gap-2 bg-[#06C755] text-white px-3 py-2 rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> 新增
        </button>
      </div>

      {isMobile ? (
        /* 手機：按天垂直列表 */
        <div className="space-y-4">
          {DAY_LABELS.map((dayLabel, dow) => {
            const dayCourses = courses.filter(c => c.dayOfWeek === dow)
            if (dayCourses.length === 0) return null
            return (
              <div key={dow}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">週{dayLabel}</span>
                  <button onClick={() => handleAddForDay(dow)}
                    className="text-xs text-[#06C755] font-medium flex items-center gap-0.5">
                    <Plus className="w-3 h-3" /> 新增
                  </button>
                </div>
                <div className="space-y-2">
                  {dayCourses.map(course => (
                    <MobileCourseRow
                      key={course.id}
                      course={course}
                      enrolledNames={getEnrolledNames(course.id)}
                      onEdit={() => setEditTarget(course)}
                      onDelete={() => deleteCourse(course.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
          {DAY_LABELS.every((_, dow) => courses.filter(c => c.dayOfWeek === dow).length === 0) && (
            <p className="text-center text-gray-400 text-sm py-8">尚無課程，點擊「新增」建立</p>
          )}
        </div>
      ) : (
        /* 桌面：7 欄週曆 */
        <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[700px]" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "8px" }}>
          {DAY_LABELS.map((dayLabel, dow) => {
            const dayCourses = courses.filter(c => c.dayOfWeek === dow)
            return (
              <div key={dow} className="flex flex-col gap-2">
                {/* Day header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-gray-500">週{dayLabel}</span>
                  <button
                    onClick={() => handleAddForDay(dow)}
                    className="w-5 h-5 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    title={`新增週${dayLabel}課程`}
                  >
                    <Plus className="w-3 h-3 text-gray-500" />
                  </button>
                </div>

                {/* Course cards */}
                {dayCourses.length === 0 ? (
                  <button
                    onClick={() => handleAddForDay(dow)}
                    className="rounded-xl border-2 border-dashed border-gray-200 p-3 text-center hover:border-gray-300 hover:bg-gray-50 transition-colors group"
                  >
                    <Plus className="w-4 h-4 text-gray-300 group-hover:text-gray-400 mx-auto" />
                  </button>
                ) : (
                  dayCourses.map(course => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      enrolledNames={getEnrolledNames(course.id)}
                      onEdit={() => setEditTarget(course)}
                      onDelete={() => deleteCourse(course.id)}
                    />
                  ))
                )}
              </div>
            )
          })}
        </div>
        </div>
      )}

      {/* Edit / Create dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => { setEditTarget(null); setNewDayOfWeek(undefined) }}>
        <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget === "new" ? "新增課程" : "編輯課程"}</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <CourseForm
              course={editTarget === "new"
                ? (newDayOfWeek !== undefined ? { dayOfWeek: newDayOfWeek } as Course : null)
                : editTarget
              }
              onSave={data => {
                if (editTarget === "new") addCourse(data)
                else updateCourse(editTarget.id, data)
              }}
              onClose={() => { setEditTarget(null); setNewDayOfWeek(undefined) }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
