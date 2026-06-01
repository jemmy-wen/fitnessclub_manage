"use client"

import { useMockData } from "@/context/MockDataContext"
import { format } from "date-fns"
import { Users, Calendar, Phone } from "lucide-react"

const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]

export default function CoachesPage() {
  const { coaches, courses, students, enrollments } = useMockData()

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">導師管理</h1>
        <p className="text-sm text-gray-500">{coaches.length} 位導師</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {coaches.map(coach => {
          const myStudents = students.filter(s => s.coachId === coach.id)
          const myCourses = courses.filter(c => c.coachId === coach.id).sort((a, b) => a.dayOfWeek - b.dayOfWeek)
          const totalEnrolled = myCourses.reduce((sum, c) => sum + c.enrolledCount, 0)

          return (
            <div key={coach.id} className="bg-white rounded-2xl overflow-hidden">
              {/* Coach header */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold">
                    {coach.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{coach.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <Phone className="w-3 h-3" /> {coach.phone}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {coach.specialties.map(s => (
                    <span key={s} className="text-xs bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                {[
                  { label: "負責學員", value: myStudents.length, icon: Users },
                  { label: "週課數", value: myCourses.length, icon: Calendar },
                  { label: "總報名", value: totalEnrolled, icon: Users },
                ].map(stat => (
                  <div key={stat.label} className="px-4 py-3 text-center">
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Weekly schedule */}
              <div className="px-5 py-3">
                <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">本週課表</p>
                {myCourses.length === 0 ? (
                  <p className="text-xs text-gray-400">尚未安排課程</p>
                ) : (
                  <div className="space-y-1.5">
                    {myCourses.map(course => (
                      <div key={course.id} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
                        <span className="text-xs text-gray-500 w-6 shrink-0">週{DAY_LABELS[course.dayOfWeek]}</span>
                        <span className="text-xs text-gray-700 flex-1">{course.title}</span>
                        <span className="text-xs text-gray-400">{format(new Date(course.startTime), "HH:mm")}</span>
                        <span className="text-xs text-gray-400">{course.enrolledCount}/{course.capacity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
