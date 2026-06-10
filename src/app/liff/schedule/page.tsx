"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useMockData } from "@/context/MockDataContext"
import { addDays, format, isSameDay, startOfDay } from "date-fns"
import { zhTW } from "date-fns/locale"
import { CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Clock, MapPin, Users } from "lucide-react"
import { useSearchParams } from "next/navigation"

type Step = "booking" | "success"

const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]
const SESSION_OPTIONS = [1, 2, 4, 8]

type BookingSlot = {
  id: string
  coachId: string
  date: string
  startTime: string
  endTime: string
  title: string
  location: string
  capacity: number
  enrolledCount: number
  source: "weekly" | "event"
}

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

export default function SchedulePage() {
  const {
    activeUser,
    students,
    coaches,
    weeklyAvailability,
    coachCalendarItems,
    addCoachCalendarItem,
    adjustStudentSessions,
    addNotification,
  } = useMockData()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>("booking")
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()))
  const [selectedSessions, setSelectedSessions] = useState(1)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)

  const student = students.find(s => s.lineUserId === activeUser.userId)
  const isEmbed = searchParams.get("embed") === "1"
  const liffHref = (path: string) => {
    if (!isEmbed) return path
    const params = new URLSearchParams()
    params.set("embed", "1")
    params.set("role", activeUser.role)
    params.set("userId", activeUser.userId)
    return `${path}?${params.toString()}`
  }
  const coach = coaches.find(c => c.id === student?.coachId) ?? coaches[0]
  const today = startOfDay(new Date())
  const dateKey = format(selectedDate, "yyyy-MM-dd")

  const calendarDays = useMemo(() => Array.from({ length: 21 }, (_, i) => addDays(today, i)), [today])
  const dateSlots = useMemo<BookingSlot[]>(() => {
    if (!coach) return []

    const existing = coachCalendarItems.filter(item => item.date === dateKey)
    const leaveBlocks = existing.filter(item => item.type === "leave" && item.coachId === coach.id)
    const weeklySlots = weeklyAvailability
      .filter(item => item.coachId === coach.id && item.enabled && item.dayOfWeek === selectedDate.getDay())
      .flatMap(rule => {
        const slots: BookingSlot[] = []
        for (let current = rule.startTime; minutesOf(current) + selectedSessions * 60 <= minutesOf(rule.endTime); current = addMinutes(current, 30)) {
          const end = addMinutes(current, selectedSessions * 60)
          const isBlocked = leaveBlocks.some(block => overlaps(current, end, block.startTime, block.endTime))
          const conflictingBookings = existing.filter(item =>
            item.type === "class" &&
            item.location === rule.location &&
            overlaps(current, end, item.startTime, item.endTime)
          )
          const occupied = conflictingBookings.reduce((sum, item) => sum + (item.enrolledCount ?? 1), 0)
          if (!isBlocked) {
            slots.push({
              id: `weekly-${rule.id}-${dateKey}-${current}-${selectedSessions}`,
              coachId: coach.id,
              date: dateKey,
              startTime: current,
              endTime: end,
              title: `${coach.name} 教練 ${selectedSessions} 堂課`,
              location: rule.location,
              capacity: rule.capacity,
              enrolledCount: occupied,
              source: "weekly",
            })
          }
        }
        return slots
      })

    const eventSlots = existing
      .filter(item => item.coachId === coach.id && item.type === "class" && (item.capacity ?? 1) > (item.enrolledCount ?? 0))
      .map(item => ({
        id: item.id,
        coachId: item.coachId,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        title: item.title,
        location: item.location ?? "未指定場地",
        capacity: item.capacity ?? 1,
        enrolledCount: item.enrolledCount ?? 0,
        source: "event" as const,
      }))

    return [...weeklySlots, ...eventSlots]
      .filter((slot, index, arr) => arr.findIndex(s => s.startTime === slot.startTime && s.location === slot.location) === index)
      .sort((a, b) => minutesOf(a.startTime) - minutesOf(b.startTime))
  }, [coach, coachCalendarItems, dateKey, selectedDate, selectedSessions, weeklyAvailability])

  const selectedSlot = dateSlots.find(slot => slot.id === selectedSlotId) ?? null

  function handleBooking() {
    if (!student || !coach || !selectedSlot) return

    addCoachCalendarItem({
      coachId: coach.id,
      date: selectedSlot.date,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      title: `${student.name} 預約 ${selectedSessions} 堂`,
      type: "class",
      location: selectedSlot.location,
      capacity: selectedSlot.capacity,
      enrolledCount: 1,
      color: "#06C755",
    })
    adjustStudentSessions(student.id, -selectedSessions)
    addNotification({
      targetUserId: activeUser.userId,
      targetRole: "student",
      message: `預約成功：${format(selectedDate, "M月d日 EEEE", { locale: zhTW })} ${selectedSlot.startTime}`,
      type: "booking_confirmed",
    })
    setStep("success")
  }

  if (!student) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-gray-500 mb-4">請先完成身份綁定</p>
          <Link href={liffHref("/liff/onboarding")} className="bg-[#06C755] text-white rounded-xl px-6 py-3 text-sm font-medium">
            前往綁定
          </Link>
        </div>
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#06C755] flex items-center justify-center mb-5">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">預約成功</h1>
        <p className="mt-2 text-sm text-gray-500">
          {format(selectedDate, "yyyy年M月d日 EEEE", { locale: zhTW })} {selectedSlot?.startTime}
        </p>
        <div className="mt-6 w-full rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">扣除堂數</span>
            <span className="font-bold text-gray-900">{selectedSessions} 堂</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-gray-500">剩餘堂數</span>
            <span className="font-bold text-[#06C755]">{student.remainingSessions} 堂</span>
          </div>
        </div>
        <button
          onClick={() => {
            setStep("booking")
            setSelectedSlotId(null)
          }}
          className="mt-6 w-full rounded-2xl bg-[#06C755] py-3.5 text-sm font-bold text-white"
        >
          繼續預約
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white">
      <div className="shrink-0 border-b border-gray-100 px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-gray-400">學員預約</p>
            <h1 className="mt-1 text-xl font-bold text-gray-950">選擇教練時段</h1>
          </div>
          <div className="rounded-2xl bg-gray-50 px-3 py-2 text-right">
            <p className="text-[11px] text-gray-400">剩餘</p>
            <p className="text-sm font-bold text-gray-900">{student.remainingSessions} 堂</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-3">
          <div className="h-9 w-9 rounded-xl bg-[#06C755] text-white flex items-center justify-center text-xs font-bold">
            {coach?.name.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">{coach?.name} 教練</p>
            <p className="truncate text-xs text-gray-500">{coach?.specialties.join("、")}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28 pt-5">
        <section>
          <h2 className="text-sm font-bold text-gray-950">預約堂數</h2>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {SESSION_OPTIONS.map(value => (
              <button
                key={value}
                onClick={() => {
                  setSelectedSessions(value)
                  setSelectedSlotId(null)
                }}
                disabled={value > student.remainingSessions}
                className={`rounded-xl border py-3 text-sm font-bold ${
                  selectedSessions === value
                    ? "border-[#06C755] bg-[#06C755] text-white"
                    : "border-gray-200 bg-white text-gray-700 disabled:bg-gray-50 disabled:text-gray-300"
                }`}
              >
                {value} 堂
              </button>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <h2 className="text-sm font-bold text-gray-950">預約日期</h2>
          <button
            onClick={() => setShowCalendar(v => !v)}
            className="mt-3 flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-left"
          >
            <span className="font-semibold text-gray-950">{format(selectedDate, "M月d日 EEEE", { locale: zhTW })}</span>
            <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${showCalendar ? "rotate-180" : ""}`} />
          </button>

          {showCalendar && (
            <div className="mt-4">
              <div className="flex items-center justify-between px-1">
                <ChevronLeft className="h-5 w-5 text-gray-300" />
                <p className="text-lg font-bold text-gray-950">{format(selectedDate, "yyyy年M月")}</p>
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
                {DAY_LABELS.map(day => <span key={day}>週{day}</span>)}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1.5">
                {calendarDays.map(date => {
                  const isSelected = isSameDay(date, selectedDate)
                  const hasSlots = weeklyAvailability.some(item =>
                    item.coachId === coach?.id && item.enabled && item.dayOfWeek === date.getDay()
                  )
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => {
                        setSelectedDate(date)
                        setSelectedSlotId(null)
                      }}
                      className={`aspect-square rounded-xl border text-sm font-bold ${
                        isSelected
                          ? "border-[#06C755] bg-[#06C755] text-white"
                          : hasSlots
                            ? "border-gray-200 bg-white text-gray-800"
                            : "border-transparent bg-gray-50 text-gray-300"
                      }`}
                    >
                      {format(date, "d")}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        <section className="mt-7 border-t border-gray-200 pt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-950">可預約時段</h2>
            <span className="text-xs text-gray-400">{dateSlots.length} 個可選</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-gray-500">
            依教練每週開放時間與當日請假自動產生；若場地已被其他教練使用，該時段會顯示剩餘名額或不可選。
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {dateSlots.length === 0 ? (
              <div className="col-span-2 rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
                這天沒有可預約時段
              </div>
            ) : (
              dateSlots.map(slot => {
                const isFull = slot.enrolledCount >= slot.capacity
                const isSelected = selectedSlotId === slot.id
                return (
                  <button
                    key={slot.id}
                    onClick={() => !isFull && setSelectedSlotId(slot.id)}
                    disabled={isFull}
                    className={`rounded-xl border px-3 py-3.5 text-left ${
                      isSelected
                        ? "border-[#06C755] bg-[#06C755] text-white"
                        : isFull
                          ? "border-gray-200 bg-gray-50 text-gray-300"
                          : "border-gray-200 bg-white text-gray-900"
                    }`}
                  >
                    <span className="block text-lg font-bold">{slot.startTime}</span>
                    <span className={`mt-1 flex items-center gap-1 text-[11px] ${isSelected ? "text-white/85" : "text-gray-400"}`}>
                      <Users className="h-3 w-3" />
                      {isFull ? "已滿" : `剩 ${slot.capacity - slot.enrolledCount} 位`}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </section>

        {selectedSlot && (
          <section className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-bold text-gray-900">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
                <p className="mt-1 text-xs text-gray-500">{selectedSessions} 堂連續課程</p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-600">{selectedSlot.location}</p>
            </div>
          </section>
        )}
      </div>

      <div className="absolute bottom-[61px] left-0 right-0 border-t border-gray-100 bg-white/95 px-5 py-3 backdrop-blur">
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="rounded-xl bg-gray-50 px-3 py-2 font-bold text-gray-900">{selectedSessions} 堂</span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="rounded-xl bg-gray-50 px-3 py-2 font-semibold text-gray-900">{format(selectedDate, "yyyy年M月d日")}</span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className={`rounded-xl border px-3 py-2 font-semibold ${selectedSlot ? "border-gray-300 text-gray-900" : "border-gray-200 text-gray-400"}`}>
            {selectedSlot?.startTime ?? "時段"}
          </span>
        </div>
        <button
          onClick={handleBooking}
          disabled={!selectedSlot || selectedSessions > student.remainingSessions}
          className="w-full rounded-xl bg-[#06C755] py-3.5 text-base font-bold text-white disabled:bg-gray-300"
        >
          {selectedSlot ? "確認預約" : "請選擇預約時段"}
        </button>
      </div>
    </div>
  )
}
