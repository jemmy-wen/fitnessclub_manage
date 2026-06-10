"use client"

import { useMemo, useState } from "react"
import { useMockData, CoachCalendarItem } from "@/context/MockDataContext"
import { addDays, format, isSameDay, startOfDay } from "date-fns"
import { zhTW } from "date-fns/locale"
import {
  Calendar,
  CalendarPlus,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  Users,
} from "lucide-react"

type Tab = "calendar" | "day" | "rules"
type QuickType = "class" | "leave"

const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]
const LOCATIONS = ["訓練室 A", "訓練室 B", "瑜伽教室"]

function minutesOf(time: string) {
  const [hour, minute] = time.split(":").map(Number)
  return hour * 60 + minute
}

function addMinutes(time: string, minutes: number) {
  const total = minutesOf(time) + minutes
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return minutesOf(aStart) < minutesOf(bEnd) && minutesOf(bStart) < minutesOf(aEnd)
}

function courseToItem(course: {
  id: string
  coachId: string
  title: string
  startTime: string
  endTime: string
  location: string
  capacity: number
  enrolledCount: number
  color: string
}): CoachCalendarItem {
  return {
    id: course.id,
    coachId: course.coachId,
    date: format(new Date(course.startTime), "yyyy-MM-dd"),
    startTime: format(new Date(course.startTime), "HH:mm"),
    endTime: format(new Date(course.endTime), "HH:mm"),
    title: course.title,
    type: "class",
    location: course.location,
    capacity: course.capacity,
    enrolledCount: course.enrolledCount,
    color: course.color,
  }
}

export default function CoachPage() {
  const {
    activeUser,
    coaches,
    courses,
    weeklyAvailability,
    coachCalendarItems,
    addCoachCalendarItem,
    deleteCoachCalendarItem,
    updateWeeklyAvailability,
  } = useMockData()
  const [activeTab, setActiveTab] = useState<Tab>("calendar")
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()))
  const [quickType, setQuickType] = useState<QuickType>("class")
  const [draft, setDraft] = useState({
    title: "臨時加開課程",
    startTime: "18:00",
    endTime: "19:00",
    location: LOCATIONS[0],
    capacity: 1,
  })

  const coach = coaches.find(c => c.lineUserId === activeUser.userId) ?? coaches[0]
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd")
  const today = startOfDay(new Date())
  const visibleDays = useMemo(() => Array.from({ length: 28 }, (_, i) => addDays(today, i)), [today])

  const allCalendarItems = [
    ...courses.map(courseToItem),
    ...coachCalendarItems,
  ]

  const selectedDayItems = allCalendarItems
    .filter(item => item.date === selectedDateKey)
    .sort((a, b) => minutesOf(a.startTime) - minutesOf(b.startTime))

  const mySelectedDayItems = selectedDayItems.filter(item => item.coachId === coach.id)
  const selectedRules = weeklyAvailability.filter(rule => rule.coachId === coach.id && rule.dayOfWeek === selectedDate.getDay() && rule.enabled)
  const generatedSlots = selectedRules.flatMap(rule => {
    const slots: string[] = []
    const myLeaves = mySelectedDayItems.filter(item => item.type === "leave")
    for (let current = rule.startTime; minutesOf(current) + 60 <= minutesOf(rule.endTime); current = addMinutes(current, 30)) {
      const end = addMinutes(current, 60)
      if (!myLeaves.some(item => overlaps(current, end, item.startTime, item.endTime))) {
        slots.push(`${current}-${end}`)
      }
    }
    return slots
  })

  function addQuickItem() {
    if (!coach) return
    addCoachCalendarItem({
      coachId: coach.id,
      date: selectedDateKey,
      startTime: draft.startTime,
      endTime: draft.endTime,
      title: quickType === "leave" ? "教練請假" : draft.title,
      type: quickType,
      location: draft.location,
      capacity: quickType === "leave" ? undefined : draft.capacity,
      enrolledCount: quickType === "leave" ? undefined : 0,
      color: quickType === "leave" ? "#DC2626" : "#06C755",
    })
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white">
      <div className="shrink-0 border-b border-gray-100 px-5 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111827] text-sm font-bold text-white">
            {coach.name.slice(0, 2)}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">教練端排課</p>
            <h1 className="text-lg font-bold text-gray-950">{coach.name}</h1>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-gray-100 p-1">
          {([
            ["calendar", Calendar, "行事曆"],
            ["day", CalendarPlus, "當日"],
            ["rules", SlidersHorizontal, "每週"],
          ] as const).map(([key, Icon, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold ${
                activeTab === key ? "bg-white text-gray-950 shadow-sm" : "text-gray-500"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {activeTab === "calendar" && (
          <div>
            <div className="flex items-center justify-between">
              <ChevronLeft className="h-5 w-5 text-gray-300" />
              <h2 className="text-lg font-bold text-gray-950">{format(selectedDate, "yyyy年M月")}</h2>
              <ChevronRight className="h-5 w-5 text-gray-500" />
            </div>
            <div className="mt-4 grid grid-cols-7 text-center text-xs text-gray-400">
              {DAY_LABELS.map(day => <span key={day}>週{day}</span>)}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {visibleDays.map(date => {
                const key = format(date, "yyyy-MM-dd")
                const dayItems = allCalendarItems.filter(item => item.date === key)
                const hasMine = dayItems.some(item => item.coachId === coach.id)
                const hasOther = dayItems.some(item => item.coachId !== coach.id)
                const isSelected = isSameDay(date, selectedDate)
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square rounded-xl border px-1 text-center ${
                      isSelected ? "border-[#111827] bg-[#111827] text-white" : "border-gray-100 bg-white text-gray-800"
                    }`}
                  >
                    <span className="block text-sm font-bold">{format(date, "d")}</span>
                    <span className="mt-1 flex justify-center gap-0.5">
                      {hasMine && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-[#06C755]"}`} />}
                      {hasOther && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white/60" : "bg-blue-500"}`} />}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-950">{format(selectedDate, "M月d日 EEEE", { locale: zhTW })}</h3>
                <button onClick={() => setActiveTab("day")} className="flex items-center gap-1 text-xs font-bold text-[#06C755]">
                  <Plus className="h-3.5 w-3.5" />
                  新增
                </button>
              </div>
              <DayTimeline items={selectedDayItems} coaches={coaches} currentCoachId={coach.id} />
            </div>
          </div>
        )}

        {activeTab === "day" && (
          <div className="space-y-5">
            <section>
              <h2 className="text-base font-bold text-gray-950">{format(selectedDate, "M月d日 EEEE", { locale: zhTW })}</h2>
              <p className="mt-1 text-xs text-gray-500">新增當天課程、登記請假，會立即影響學員端可預約時段。</p>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-1">
                {([
                  ["class", "加開課程"],
                  ["leave", "登記請假"],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setQuickType(key)}
                    className={`rounded-lg py-2 text-sm font-bold ${quickType === key ? "bg-[#06C755] text-white" : "text-gray-500"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {quickType === "class" && (
                  <input
                    value={draft.title}
                    onChange={event => setDraft(prev => ({ ...prev, title: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
                  />
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={draft.startTime}
                    onChange={event => setDraft(prev => ({ ...prev, startTime: event.target.value }))}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
                  />
                  <input
                    type="time"
                    value={draft.endTime}
                    onChange={event => setDraft(prev => ({ ...prev, endTime: event.target.value }))}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={draft.location}
                    onChange={event => setDraft(prev => ({ ...prev, location: event.target.value }))}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
                  >
                    {LOCATIONS.map(location => <option key={location}>{location}</option>)}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={draft.capacity}
                    onChange={event => setDraft(prev => ({ ...prev, capacity: Number(event.target.value) }))}
                    disabled={quickType === "leave"}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#06C755] disabled:text-gray-300"
                  />
                </div>
              </div>
              <button
                onClick={addQuickItem}
                className="mt-3 w-full rounded-xl bg-[#111827] py-3 text-sm font-bold text-white"
              >
                儲存到當日行事曆
              </button>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold text-gray-950">當日安排</h3>
              <DayTimeline
                items={selectedDayItems}
                coaches={coaches}
                currentCoachId={coach.id}
                onDelete={deleteCoachCalendarItem}
              />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold text-gray-950">每週規則產生的可預約時段</h3>
              {generatedSlots.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 py-6 text-center text-sm text-gray-400">
                  這天沒有每週開放時段
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {generatedSlots.map(slot => (
                    <div key={slot} className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-sm font-bold text-gray-700">
                      {slot}
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        )}

        {activeTab === "rules" && (
          <div className="space-y-4">
            <section>
              <h2 className="text-base font-bold text-gray-950">每週開放排課時間</h2>
              <p className="mt-1 text-xs leading-5 text-gray-500">開啟後會自動在學員端產生可預約時段；當日請假會覆蓋這裡的規則。</p>
            </section>
            {weeklyAvailability.filter(rule => rule.coachId === coach.id).map(rule => (
              <div key={rule.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-950">週{DAY_LABELS[rule.dayOfWeek]}</p>
                    <p className="mt-1 text-xs text-gray-500">{rule.location} · {rule.capacity} 位</p>
                  </div>
                  <button
                    onClick={() => updateWeeklyAvailability(rule.id, { enabled: !rule.enabled })}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${rule.enabled ? "bg-[#06C755]" : "bg-gray-300"}`}
                    aria-label="切換開放"
                  >
                    <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${rule.enabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={rule.startTime}
                    onChange={event => updateWeeklyAvailability(rule.id, { startTime: event.target.value })}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
                  />
                  <input
                    type="time"
                    value={rule.endTime}
                    onChange={event => updateWeeklyAvailability(rule.id, { endTime: event.target.value })}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DayTimeline({
  items,
  coaches,
  currentCoachId,
  onDelete,
}: {
  items: CoachCalendarItem[]
  coaches: { id: string; name: string }[]
  currentCoachId: string
  onDelete?: (itemId: string) => void
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center">
        <CheckCircle className="mx-auto h-8 w-8 text-gray-300" />
        <p className="mt-2 text-sm text-gray-400">當天尚無課程或場地使用</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map(item => {
        const isMine = item.coachId === currentCoachId
        const coachName = coaches.find(coach => coach.id === item.coachId)?.name ?? "其他教練"
        return (
          <div
            key={item.id}
            className={`rounded-2xl border p-3 ${
              item.type === "leave"
                ? "border-red-100 bg-red-50"
                : isMine
                  ? "border-gray-100 bg-white"
                  : "border-blue-100 bg-blue-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-1 h-3 w-3 rounded-full"
                style={{ backgroundColor: item.type === "leave" ? "#DC2626" : item.color ?? (isMine ? "#06C755" : "#2563EB") }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-gray-950">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{coachName}</p>
                  </div>
                  {onDelete && item.id.startsWith("ci") && isMine && (
                    <button onClick={() => onDelete(item.id)} className="rounded-lg p-1 text-gray-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1 rounded-lg bg-white/70 px-2 py-1">
                    <Clock className="h-3 w-3" />
                    {item.startTime}-{item.endTime}
                  </span>
                  {item.location && (
                    <span className="flex items-center gap-1 rounded-lg bg-white/70 px-2 py-1">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </span>
                  )}
                  {item.type === "class" && (
                    <span className="flex items-center gap-1 rounded-lg bg-white/70 px-2 py-1">
                      <Users className="h-3 w-3" />
                      {item.enrolledCount ?? 0}/{item.capacity ?? 1}
                    </span>
                  )}
                  {!isMine && (
                    <span className="flex items-center gap-1 rounded-lg bg-white/70 px-2 py-1 text-blue-600">
                      <ShieldAlert className="h-3 w-3" />
                      場地占用
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
