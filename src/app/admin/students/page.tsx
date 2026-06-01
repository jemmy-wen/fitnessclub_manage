"use client"

import { useState } from "react"
import { useMockData } from "@/context/MockDataContext"
import { useViewMode } from "@/context/ViewModeContext"
import { Student, PaymentStatus } from "@/mock/students"
import {
  Search, Plus, ChevronDown, ChevronUp, Copy, Check,
  AlertCircle, UserCheck, UserX
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type SortKey = "name" | "remainingSessions" | "paymentStatus"
type FilterStatus = "all" | "paid" | "unpaid" | "bound" | "unbound"

function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
      status === "paid" ? "bg-green-100 text-green-700" :
      status === "unpaid" ? "bg-red-100 text-red-600" :
      "bg-gray-100 text-gray-500"
    }`}>
      {status === "paid" ? "已付款" : status === "unpaid" ? "未付款" : "待確認"}
    </span>
  )
}

function AdjustSessionsModal({
  student, onClose
}: { student: Student | null; onClose: () => void }) {
  const { adjustStudentSessions } = useMockData()
  const [delta, setDelta] = useState(0)
  const [note, setNote] = useState("")

  if (!student) return null

  return (
    <Dialog open={!!student} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle>調整堂數 — {student.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">目前剩餘堂數</p>
            <p className="text-3xl font-bold text-gray-900">{student.remainingSessions}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">調整數量</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDelta(d => d - 1)}
                className="w-10 h-10 bg-red-100 text-red-600 rounded-xl font-bold text-lg"
              >-</button>
              <input
                type="number"
                value={delta}
                onChange={e => setDelta(parseInt(e.target.value) || 0)}
                className="flex-1 text-center border border-gray-200 rounded-xl py-2 text-lg font-semibold outline-none"
              />
              <button
                onClick={() => setDelta(d => d + 1)}
                className="w-10 h-10 bg-green-100 text-green-700 rounded-xl font-bold text-lg"
              >+</button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-1">
              調整後：{Math.max(0, student.remainingSessions + delta)} 堂
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="例：補課、退課、額外贈堂…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 text-sm font-medium">
              取消
            </button>
            <button
              onClick={() => { adjustStudentSessions(student.id, delta); onClose() }}
              className="flex-1 bg-[#06C755] text-white rounded-xl py-2.5 text-sm font-medium"
            >
              確認調整
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddStudentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addStudent, coaches, generateInviteCode } = useMockData()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [coachId, setCoachId] = useState(coaches[0]?.id ?? "")
  const [sessions, setSessions] = useState(10)
  const [code] = useState(() => generateInviteCode())

  function handleAdd() {
    if (!name.trim() || !phone.trim()) return
    addStudent({
      name: name.trim(), phone, coachId,
      lineUserId: null, inviteCode: code,
      remainingSessions: sessions, totalSessions: sessions, attendedSessions: 0,
      paymentStatus: "unpaid", bindingStatus: "unbound",
      joinedAt: new Date().toISOString().split("T")[0],
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader><DialogTitle>新增學員</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          {[
            { label: "姓名", value: name, set: setName, placeholder: "學員姓名" },
            { label: "手機", value: phone, set: setPhone, placeholder: "0912-345-678" },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#06C755]" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">指派導師</label>
            <select value={coachId} onChange={e => setCoachId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
              {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">課程包堂數</label>
            <input type="number" value={sessions} onChange={e => setSessions(parseInt(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5">
            <p className="text-xs text-gray-500">邀請碼（自動產生）</p>
            <p className="font-mono font-semibold text-gray-900 mt-0.5">{code}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 text-sm font-medium">取消</button>
            <button onClick={handleAdd} className="flex-1 bg-[#06C755] text-white rounded-xl py-2.5 text-sm font-medium">新增學員</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Desktop Table ─────────────────────────────────────────────────────────────
function DesktopStudentTable({
  students, onAdjust
}: { students: Student[]; onAdjust: (s: Student) => void }) {
  const { updateStudentPayment, coaches, generateInviteCode } = useMockData()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            {["學員", "導師", "剩餘堂數", "付款狀態", "綁定狀態", "邀請碼", "操作"].map(h => (
              <th key={h} className="px-4 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {students.map(s => {
            const coach = coaches.find(c => c.id === s.coachId)
            return (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">{s.name[0]}</div>
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-gray-700">{coach?.name}</td>
                <td className="px-4 py-3.5">
                  <span className={`font-semibold ${s.remainingSessions <= 3 ? "text-red-600" : "text-gray-900"}`}>
                    {s.remainingSessions}
                  </span>
                  {s.remainingSessions <= 3 && <AlertCircle className="inline w-3 h-3 text-red-400 ml-1" />}
                </td>
                <td className="px-4 py-3.5">
                  <select
                    value={s.paymentStatus}
                    onChange={e => updateStudentPayment(s.id, e.target.value as PaymentStatus)}
                    className={`text-xs px-2 py-1 rounded-full border-0 outline-none font-medium cursor-pointer ${
                      s.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    }`}
                  >
                    <option value="paid">已付款</option>
                    <option value="unpaid">未付款</option>
                  </select>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`flex items-center gap-1 text-xs ${s.bindingStatus === "bound" ? "text-green-600" : "text-gray-400"}`}>
                    {s.bindingStatus === "bound" ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    {s.bindingStatus === "bound" ? "已綁定" : "未綁定"}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{s.inviteCode}</span>
                    <button onClick={() => copyCode(s.inviteCode, s.id)} className="p-1 text-gray-400 hover:text-gray-700">
                      {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <button onClick={() => onAdjust(s)} className="text-xs text-[#06C755] font-medium hover:underline">
                    調整堂數
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Mobile Card List ──────────────────────────────────────────────────────────
function MobileStudentList({
  students, onAdjust
}: { students: Student[]; onAdjust: (s: Student) => void }) {
  const { updateStudentPayment, coaches } = useMockData()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-2.5">
      {students.map(s => {
        const coach = coaches.find(c => c.id === s.coachId)
        const isExpanded = expandedId === s.id
        return (
          <div key={s.id} className="bg-white rounded-2xl overflow-hidden">
            {/* Card header — always visible */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : s.id)}
              className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 ${
                s.bindingStatus === "bound" ? "bg-[#06C755]" : "bg-gray-300"
              }`}>{s.name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                <p className="text-xs text-gray-400">{coach?.name} · {s.phone}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-lg font-bold ${s.remainingSessions <= 3 ? "text-red-600" : "text-gray-900"}`}>
                  {s.remainingSessions}
                </p>
                <p className="text-[10px] text-gray-400">堂</p>
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
            </button>

            {/* Expanded actions — bottom sheet style */}
            {isExpanded && (
              <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white rounded-xl p-2.5">
                    <p className="text-xs text-gray-500">付款狀態</p>
                    <PaymentBadge status={s.paymentStatus} />
                  </div>
                  <div className="bg-white rounded-xl p-2.5">
                    <p className="text-xs text-gray-500 mb-1">綁定</p>
                    <span className={`text-xs font-medium ${s.bindingStatus === "bound" ? "text-green-600" : "text-gray-400"}`}>
                      {s.bindingStatus === "bound" ? "已綁定" : "未綁定"}
                    </span>
                  </div>
                </div>

                {/* Payment toggle — big tap targets */}
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStudentPayment(s.id, "paid")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      s.paymentStatus === "paid" ? "bg-green-500 text-white" : "bg-white border border-gray-200 text-gray-600"
                    }`}
                  >已付款</button>
                  <button
                    onClick={() => updateStudentPayment(s.id, "unpaid")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      s.paymentStatus === "unpaid" ? "bg-red-500 text-white" : "bg-white border border-gray-200 text-gray-600"
                    }`}
                  >未付款</button>
                </div>

                <button
                  onClick={() => onAdjust(s)}
                  className="w-full bg-[#06C755] text-white rounded-xl py-2.5 text-sm font-medium"
                >
                  調整堂數
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StudentsPage() {
  const { students } = useMockData()
  const { isMobile } = useViewMode()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterStatus>("all")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortAsc, setSortAsc] = useState(true)
  const [adjustTarget, setAdjustTarget] = useState<Student | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const filtered = students
    .filter(s => {
      const matchSearch = s.name.includes(search) || s.phone.includes(search) || s.inviteCode.includes(search.toUpperCase())
      const matchFilter =
        filter === "all" ? true :
        filter === "paid" ? s.paymentStatus === "paid" :
        filter === "unpaid" ? s.paymentStatus === "unpaid" :
        filter === "bound" ? s.bindingStatus === "bound" :
        s.bindingStatus === "unbound"
      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      let diff = 0
      if (sortKey === "name") diff = a.name.localeCompare(b.name, "zh-TW")
      else if (sortKey === "remainingSessions") diff = a.remainingSessions - b.remainingSessions
      else diff = a.paymentStatus.localeCompare(b.paymentStatus)
      return sortAsc ? diff : -diff
    })

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">學員管理</h1>
          <p className="text-sm text-gray-500">{students.length} 位學員</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#06C755] text-white px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> 新增學員
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋姓名、電話、邀請碼…"
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {(["all", "paid", "unpaid", "bound", "unbound"] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 text-xs px-3 py-2 rounded-xl font-medium transition-colors ${
                filter === f ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              {{ all: "全部", paid: "已付款", unpaid: "未付款", bound: "已綁定", unbound: "未綁定" }[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Sort (desktop only) */}
      {!isMobile && (
        <div className="flex gap-2 text-xs">
          <span className="text-gray-500">排序：</span>
          {([["name", "姓名"], ["remainingSessions", "剩餘堂數"], ["paymentStatus", "付款狀態"]] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={`flex items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${sortKey === key ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            >
              {label}
              {sortKey === key && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
            </button>
          ))}
        </div>
      )}

      {/* Table / Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">找不到符合條件的學員</div>
      ) : isMobile ? (
        <MobileStudentList students={filtered} onAdjust={setAdjustTarget} />
      ) : (
        <DesktopStudentTable students={filtered} onAdjust={setAdjustTarget} />
      )}

      <AdjustSessionsModal student={adjustTarget} onClose={() => setAdjustTarget(null)} />
      <AddStudentModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}
