"use client"

import { useEffect, useRef, useState } from "react"

const SECTIONS = [
  { id: "competitive", label: "競品分析", emoji: "🔍" },
  { id: "flows",       label: "主要 Flow", emoji: "🔄" },
  { id: "product",     label: "產品規劃",  emoji: "🎯" },
  { id: "design",      label: "介面設計",  emoji: "🎨" },
]

// ── Competitive Analysis ─────────────────────────────────────────────────────

const COMPETITORS = [
  {
    name: "Super 8",
    summary: "LINE CRM 與行銷自動化平台，跨產業通用型工具。核心是強化 LINE OA 的訊息管理與自動化行銷。與 Actflow 的關係較接近基礎設施層，而非直接競品。",
    tag: "基礎設施",
    tagColor: "bg-blue-100 text-blue-700",
  },
  {
    name: "17FIT",
    summary: "台灣健身美業主流管理系統，市佔最高（1,200 間以上商家）。有提供 LINE 外掛模組，但受技術限制無法雙向操作，LINE 互動以單向通知為主。",
    tag: "中大型場館",
    tagColor: "bg-orange-100 text-orange-700",
  },
  {
    name: "BookFast",
    summary: "2020 年成立，主打一站式管理，積極發展 LINE Mini APP。服務超過 1,000 間品牌，功能涵蓋 IoT 智能門禁、候補名單、手機點名。目標客群以中大型場館為主。",
    tag: "中大型場館",
    tagColor: "bg-orange-100 text-orange-700",
  },
  {
    name: "Actflow",
    summary: "專為小型運動工作室設計，以 LINE OA 為核心入口，透過 LIFF App 實現學員雙向互動。輕量化設計，MVP 排除金流與門禁，聚焦課程、請假、學員管理三大核心流程。",
    tag: "小型工作室",
    tagColor: "bg-green-100 text-green-700",
  },
]

type CellValue = string
const FEATURE_TABLE: { feature: string; super8: CellValue; fit17: CellValue; bookfast: CellValue; actflow: CellValue }[] = [
  { feature: "LINE OA 串接",      super8: "✓（核心）",  fit17: "✓（外掛）",   bookfast: "✓（Mini APP）", actflow: "✓" },
  { feature: "學員雙向 LINE 互動", super8: "✗",         fit17: "✗",           bookfast: "✗",             actflow: "✓" },
  { feature: "課程排程管理",       super8: "✗",         fit17: "✓",           bookfast: "✓",             actflow: "✓（輕量）" },
  { feature: "學員堂數追蹤",       super8: "✗",         fit17: "✓（付費）",   bookfast: "✓",             actflow: "✓" },
  { feature: "請假補課流程",       super8: "✗",         fit17: "✓",           bookfast: "✓",             actflow: "✓" },
  { feature: "自動推播通知",       super8: "✓",         fit17: "✓（Email）",  bookfast: "✓",             actflow: "✓（LINE）" },
  { feature: "金流整合",           super8: "✗",         fit17: "✓",           bookfast: "✓",             actflow: "✗（MVP 排除）" },
  { feature: "教練薪資計算",       super8: "✗",         fit17: "✓",           bookfast: "✗",             actflow: "✗" },
  { feature: "學員專屬 APP",       super8: "✗",         fit17: "✓",           bookfast: "✓",             actflow: "✗（LINE 取代）" },
  { feature: "門禁整合",           super8: "✗",         fit17: "✗",           bookfast: "✓",             actflow: "✗" },
  { feature: "行銷自動化",         super8: "✓（核心）", fit17: "✓",           bookfast: "部分",           actflow: "✗" },
  { feature: "目標場館規模",       super8: "跨產業",    fit17: "中大型",       bookfast: "中大型",         actflow: "小型工作室" },
]

function cellStyle(val: string, isActflow = false) {
  if (val === "✓") return isActflow ? "text-green-600 font-bold" : "text-green-600"
  if (val === "✗") return "text-gray-300"
  if (val.startsWith("✓")) return isActflow ? "text-green-600 font-semibold" : "text-green-600"
  if (val.startsWith("✗")) return "text-gray-400"
  return isActflow ? "text-gray-700 font-semibold" : "text-gray-500"
}

function CompetitiveSection() {
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-4">
        {COMPETITORS.map(c => (
          <div key={c.name} className={`bg-white rounded-2xl p-5 shadow-sm ${c.name === "Actflow" ? "ring-2 ring-green-400" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-bold text-base ${c.name === "Actflow" ? "text-green-700" : "text-gray-900"}`}>{c.name}</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${c.tagColor}`}>{c.tag}</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{c.summary}</p>
          </div>
        ))}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">功能對照表</h3>
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[180px]">功能</th>
                {["Super 8","17FIT","BookFast"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold text-gray-400 text-center">{h}</th>
                ))}
                <th className="px-4 py-3.5 text-xs font-bold text-green-600 text-center bg-green-50/50">Actflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {FEATURE_TABLE.map(row => (
                <tr key={row.feature} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 text-gray-700 font-medium text-sm">{row.feature}</td>
                  <td className={`px-4 py-3 text-center text-sm ${cellStyle(row.super8)}`}>{row.super8}</td>
                  <td className={`px-4 py-3 text-center text-sm ${cellStyle(row.fit17)}`}>{row.fit17}</td>
                  <td className={`px-4 py-3 text-center text-sm ${cellStyle(row.bookfast)}`}>{row.bookfast}</td>
                  <td className={`px-4 py-3 text-center text-sm bg-green-50/30 ${cellStyle(row.actflow, true)}`}>{row.actflow}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── User Flow ────────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<string, string> = { student: "#3B82F6", coach: "#06C755", admin: "#8B5CF6" }
const ROLE_BG: Record<string, string>    = { student: "#EFF6FF", coach: "#F0FDF4", admin: "#F5F3FF" }
const ROLE_LABEL: Record<string, string> = { student: "學員", coach: "導師", admin: "管理者" }

interface FlowStep {
  role: "student" | "coach" | "admin"
  label: string
  platform?: string
  trigger?: string
}
interface UserFlow { title: string; steps: FlowStep[] }

const USER_FLOWS: UserFlow[] = [
  {
    title: "Onboarding — 學員綁定",
    steps: [
      { role: "admin",   label: "新增學員\n產生邀請碼",                platform: "後台" },
      { role: "admin",   label: "將邀請碼\n提供給學員",                platform: "線下" },
      { role: "student", label: "加入 LINE OA",                        platform: "LINE", trigger: "邀請碼交接" },
      { role: "student", label: "收到歡迎推播\n+ 綁定連結",            platform: "LINE 推播" },
      { role: "student", label: "填寫 LIFF 表單\n姓名 / 電話 / 邀請碼", platform: "LIFF App" },
      { role: "student", label: "綁定完成",                            platform: "系統" },
      { role: "admin",   label: "收到新學員\n綁定完成通知",            platform: "LINE 推播", trigger: "系統通知" },
    ],
  },
  {
    title: "排課 — 學員預約課程",
    steps: [
      { role: "admin",   label: "建立課程\n設定時段 / 名額",          platform: "後台" },
      { role: "student", label: "LINE 輸入\n「我的課表」",             platform: "LINE OA", trigger: "課程上線" },
      { role: "student", label: "LIFF 瀏覽\n可預約課程",              platform: "LIFF App" },
      { role: "student", label: "選擇時段\n確認預約",                  platform: "LIFF App" },
      { role: "student", label: "收到預約成功\n推播通知",              platform: "LINE 推播" },
      { role: "coach",   label: "LIFF 查看\n課表與報名名單",           platform: "LIFF App", trigger: "名單更新" },
    ],
  },
  {
    title: "請假 — 申請與確認",
    steps: [
      { role: "student", label: "LINE 輸入「請假」\n或點 Chip",        platform: "LINE OA" },
      { role: "student", label: "LIFF 選擇\n課程 / 日期 / 原因",      platform: "LIFF App" },
      { role: "student", label: "送出\n請假申請",                      platform: "系統" },
      { role: "coach",   label: "收到推播\n請假通知",                  platform: "LINE 推播", trigger: "推播通知" },
      { role: "coach",   label: "LIFF 確認\n或拒絕 + 備註",            platform: "LIFF App" },
      { role: "student", label: "收到確認推播\n+ 剩餘堂數",            platform: "LINE 推播", trigger: "推播通知" },
      { role: "admin",   label: "後台查看\n全部請假紀錄",              platform: "後台", trigger: "自動同步" },
    ],
  },
]

function RoleChip({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: ROLE_BG[role], color: ROLE_COLOR[role] }}>
      {ROLE_LABEL[role]}
    </span>
  )
}

function HArrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center shrink-0 gap-0.5" style={{ width: 52 }}>
      {label && <span className="text-[9px] text-gray-400 font-medium text-center leading-tight whitespace-nowrap">{label}</span>}
      <svg width="38" height="12" viewBox="0 0 38 12">
        <line x1="0" y1="6" x2="32" y2="6" stroke="#CBD5E1" strokeWidth="1.5"/>
        <polyline points="26,2 34,6 26,10" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

function FlowSection() {
  return (
    <div className="space-y-8">
      {USER_FLOWS.map((flow, fi) => (
        <div key={fi} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0">{fi + 1}</span>
            <h3 className="font-semibold text-gray-900 text-sm">{flow.title}</h3>
          </div>
          <div className="px-6 py-6 overflow-x-auto">
            <div className="flex items-center gap-0 min-w-max">
              {flow.steps.map((step, si) => {
                const crossRole = si > 0 && flow.steps[si - 1].role !== step.role
                return (
                  <div key={si} className="flex items-center">
                    {si > 0 && <HArrow label={crossRole && step.trigger ? step.trigger : undefined} />}
                    <div className="flex flex-col items-center gap-1.5 w-[110px] shrink-0">
                      <RoleChip role={step.role} />
                      <div className="w-full rounded-xl px-3 py-3 text-center"
                        style={{ backgroundColor: ROLE_BG[step.role], border: `1.5px solid ${ROLE_COLOR[step.role]}22` }}>
                        <p className="text-xs font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">{step.label}</p>
                        {step.platform && <p className="text-[10px] text-gray-400 mt-1">{step.platform}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="px-6 pb-4 flex gap-3">
            {Array.from(new Set(flow.steps.map(s => s.role))).map(role => (
              <div key={role} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ROLE_COLOR[role] }} />
                <span className="text-xs text-gray-400">{ROLE_LABEL[role]}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── UI Flow Wireframes ───────────────────────────────────────────────────────

// Primitive wireframe shapes
function WBar({ h = 6, w = "full", color = "#E5E7EB" }: { h?: number; w?: string; color?: string }) {
  return <div className={`rounded w-${w}`} style={{ height: h, backgroundColor: color }} />
}
function WLines({ n = 3, last = 80 }: { n?: number; last?: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-[5px] rounded bg-gray-200"
          style={{ width: i === n - 1 ? `${last}%` : "100%" }} />
      ))}
    </div>
  )
}
function WBtn({ label, primary }: { label: string; primary?: boolean }) {
  return (
    <div className={`rounded-lg flex items-center justify-center py-1.5 ${primary ? "bg-[#06C755]" : "bg-gray-200"}`}>
      <span className={`text-[8px] font-semibold ${primary ? "text-white" : "text-gray-500"}`}>{label}</span>
    </div>
  )
}
function WInput({ label }: { label: string }) {
  return (
    <div className="border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50">
      <span className="text-[8px] text-gray-400">{label}</span>
    </div>
  )
}
function WCard({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl border border-gray-100 p-2 shadow-sm">{children}</div>
}
function WHeader({ title, green }: { title: string; green?: boolean }) {
  return (
    <div className={`px-3 py-2.5 flex items-center gap-1.5 ${green ? "bg-[#3d6b96]" : "bg-white border-b border-gray-100"}`}>
      {green ? (
        <>
          <div className="w-2 h-2 rounded bg-[#06C755]" />
          <span className="text-[9px] font-bold text-white flex-1 text-center">{title}</span>
        </>
      ) : (
        <span className="text-[9px] font-bold text-gray-800">{title}</span>
      )}
    </div>
  )
}

// Phone shell wrapper
function WPhone({ title, label, children }: { title: string; label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="w-[136px] rounded-[16px] overflow-hidden bg-gray-50 flex flex-col"
        style={{ height: 272, border: "2px solid #D1D5DB", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        {children}
      </div>
      <div className="text-center">
        <p className="text-[10px] font-semibold text-gray-700 leading-tight">{title}</p>
        {label && <p className="text-[9px] text-gray-400 mt-0.5">{label}</p>}
      </div>
    </div>
  )
}

// Desktop shell wrapper
function WDesktop({ title, label, children }: { title: string; label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="w-[220px] rounded-lg overflow-hidden bg-white flex flex-col"
        style={{ height: 186, border: "2px solid #D1D5DB", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        {children}
      </div>
      <div className="text-center">
        <p className="text-[10px] font-semibold text-gray-700 leading-tight">{title}</p>
        {label && <p className="text-[9px] text-gray-400 mt-0.5">{label}</p>}
      </div>
    </div>
  )
}

function WArrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center shrink-0 self-start mt-[76px] gap-0.5" style={{ width: 36 }}>
      {label && <span className="text-[8px] text-gray-400 text-center leading-tight whitespace-nowrap">{label}</span>}
      <svg width="28" height="10" viewBox="0 0 28 10">
        <line x1="0" y1="5" x2="22" y2="5" stroke="#D1D5DB" strokeWidth="1.5"/>
        <polyline points="17,1 25,5 17,9" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

interface UIFlow { title: string; role: string; nodes: React.ReactNode[] }

function UIFlowSection() {
  const flows: UIFlow[] = [
    {
      title: "Onboarding — 學員綁定",
      role: "admin + student",
      nodes: [
        // 1. Admin creates student
        <WDesktop key="a1" title="1. 新增學員" label="後台 · 管理者">
          <div className="flex h-full">
            <div className="w-12 bg-gray-100 shrink-0 p-2 space-y-1.5">
              {["學員","課程","導師"].map(l => (
                <div key={l} className="h-4 rounded bg-gray-200 flex items-center px-1">
                  <span className="text-[6px] text-gray-500">{l}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 p-2 space-y-2">
              <div className="flex justify-between items-center">
                <WBar h={7} w="16" color="#374151" />
                <div className="w-12 h-5 rounded-lg bg-[#06C755] flex items-center justify-center">
                  <span className="text-[7px] text-white font-bold">+ 新增學員</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <WInput label="姓名" />
                <WInput label="指派導師" />
                <WInput label="課程包堂數" />
                <div className="bg-gray-100 rounded-lg px-2 py-1">
                  <span className="text-[7px] text-purple-600 font-mono font-bold">邀請碼：TRX-A004</span>
                </div>
                <WBtn label="建立學員" primary />
              </div>
            </div>
          </div>
        </WDesktop>,

        // 2. Student joins LINE OA
        <WPhone key="s1" title="2. 加入 LINE OA" label="LINE · 學員">
          <WHeader title="Actflow" green />
          <div className="flex-1 bg-[#3d6b96]/20 p-2 space-y-2">
            <div className="flex items-start gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[#06C755] shrink-0 mt-0.5" />
              <WCard>
                <WLines n={3} last={70} />
                <div className="mt-2">
                  <WBtn label="前往綁定 →" primary />
                </div>
              </WCard>
            </div>
          </div>
          <div className="bg-white border-t border-gray-100 px-2 py-1.5 flex items-center gap-1.5">
            <div className="flex-1 bg-gray-100 rounded-full px-2 py-1"><span className="text-[8px] text-gray-400">Aa</span></div>
          </div>
        </WPhone>,

        // 3. LIFF onboarding form
        <WPhone key="s2" title="3. LIFF 綁定表單" label="LIFF · 學員">
          <WHeader title="加入 Actflow" />
          <div className="flex-1 p-2 space-y-1.5 overflow-hidden">
            <WInput label="姓名" />
            <WInput label="手機號碼" />
            <WInput label="邀請碼  TRX-A004" />
            <div className="pt-1">
              <WBtn label="完成綁定" primary />
            </div>
          </div>
        </WPhone>,

        // 4. Success
        <WPhone key="s3" title="4. 綁定完成" label="LIFF · 學員">
          <WHeader title="加入 Actflow" />
          <div className="flex-1 flex flex-col items-center justify-center p-3 space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center">
              <span className="text-white text-lg">✓</span>
            </div>
            <WBar h={6} w="20" color="#374151" />
            <WLines n={2} last={80} />
          </div>
        </WPhone>,
      ],
    },
    {
      title: "排課 — 學員預約課程",
      role: "admin + student + coach",
      nodes: [
        // 1. Admin creates course
        <WDesktop key="a1" title="1. 建立課程" label="後台 · 管理者">
          <div className="flex h-full">
            <div className="w-12 bg-gray-100 shrink-0 p-2 space-y-1.5">
              {["Dashboard","學員","課程"].map(l => (
                <div key={l} className={`h-5 rounded flex items-center px-1.5 ${l === "課程" ? "bg-gray-800" : "bg-gray-200"}`}>
                  <span className={`text-[7px] ${l === "課程" ? "text-white" : "text-gray-500"}`}>{l}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 p-2 space-y-1.5">
              <WInput label="課程名稱" />
              <div className="grid grid-cols-2 gap-1">
                <WInput label="導師" />
                <WInput label="星期" />
                <WInput label="時間" />
                <WInput label="名額" />
              </div>
              <WBtn label="建立課程" primary />
            </div>
          </div>
        </WDesktop>,

        // 2. Student LINE chat
        <WPhone key="s1" title="2. 查詢課表" label="LINE · 學員">
          <WHeader title="Actflow" green />
          <div className="flex-1 bg-[#3d6b96]/20 p-2 space-y-1.5">
            <div className="flex justify-end">
              <div className="bg-[#06C755] text-white text-[8px] rounded-xl rounded-br-sm px-2 py-1.5">我的課表</div>
            </div>
            <div className="flex items-start gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[#06C755] shrink-0 mt-0.5" />
              <WCard><WLines n={2} last={75} /></WCard>
            </div>
          </div>
          <div className="bg-white border-t border-gray-100 px-2 py-1.5">
            <div className="flex gap-1 overflow-hidden">
              {["請假","我的課表","剩餘堂數"].map(c => (
                <div key={c} className="bg-gray-100 rounded-full px-1.5 py-0.5 shrink-0">
                  <span className="text-[7px] text-gray-600">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </WPhone>,

        // 3. LIFF course list
        <WPhone key="s2" title="3. 選擇課程" label="LIFF · 學員">
          <WHeader title="預約課程" />
          <div className="flex-1 p-2 space-y-1.5 overflow-hidden">
            {[
              { name: "TRX 基礎班", color: "#3B82F6" },
              { name: "晨間瑜伽",   color: "#10B981" },
              { name: "流動瑜伽",   color: "#10B981" },
            ].map(c => (
              <div key={c.name} className="bg-white rounded-xl border border-gray-100 px-2 py-1.5 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <div className="flex-1">
                  <div className="h-[5px] rounded bg-gray-700 w-16 mb-1" />
                  <div className="h-[4px] rounded bg-gray-200 w-12" />
                </div>
                <div className="text-[7px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">餘 5 位</div>
              </div>
            ))}
          </div>
        </WPhone>,

        // 4. Confirm
        <WPhone key="s3" title="4. 確認預約" label="LIFF · 學員">
          <WHeader title="確認預約" />
          <div className="flex-1 p-2 space-y-2">
            <div className="bg-gray-50 rounded-xl p-2 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <WBar h={6} w="20" color="#374151" />
              </div>
              <WLines n={3} last={65} />
            </div>
            <div className="bg-amber-50 rounded-xl p-1.5">
              <WLines n={2} last={85} />
            </div>
            <WBtn label="確認預約" primary />
          </div>
        </WPhone>,

        // 5. Coach sees roster
        <WPhone key="c1" title="5. 查看名單" label="LIFF · 導師">
          <WHeader title="本週課表" />
          <div className="flex-1 p-2 space-y-1.5 overflow-hidden">
            {["TRX 基礎班","TRX 進階班"].map((name, i) => (
              <WCard key={i}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-[8px] font-bold text-gray-700">{name}</span>
                </div>
                <div className="flex gap-1">
                  {["王","李","陳"].map(s => (
                    <div key={s} className="w-5 h-5 rounded-full bg-[#06C755] flex items-center justify-center">
                      <span className="text-[7px] text-white font-bold">{s}</span>
                    </div>
                  ))}
                </div>
              </WCard>
            ))}
          </div>
        </WPhone>,
      ],
    },
    {
      title: "請假 — 申請與確認",
      role: "student + coach + admin",
      nodes: [
        // 1. Student taps chip
        <WPhone key="s1" title="1. 點擊請假" label="LINE · 學員">
          <WHeader title="Actflow" green />
          <div className="flex-1 bg-[#3d6b96]/20 p-2">
            <div className="flex justify-end mb-2">
              <div className="bg-[#06C755] text-white text-[8px] rounded-xl rounded-br-sm px-2 py-1.5">請假</div>
            </div>
            <div className="flex items-start gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[#06C755] shrink-0 mt-0.5" />
              <WCard>
                <WLines n={2} last={75} />
                <div className="mt-1.5"><WBtn label="填寫請假表單 →" primary /></div>
              </WCard>
            </div>
          </div>
          <div className="bg-white border-t border-gray-100 px-2 py-1.5">
            <div className="flex gap-1">
              {["請假","我的課表"].map(c => (
                <div key={c} className="bg-gray-100 rounded-full px-1.5 py-0.5">
                  <span className="text-[7px] text-gray-600">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </WPhone>,

        // 2. LIFF leave form
        <WPhone key="s2" title="2. 填寫請假表單" label="LIFF · 學員">
          <WHeader title="請假申請" />
          <div className="flex-1 p-2 space-y-1.5 overflow-hidden">
            <div className="space-y-1">
              <div className="text-[7px] text-gray-500 font-medium">請假課程</div>
              {["TRX 基礎班","晨間瑜伽"].map((c, i) => (
                <div key={c} className={`rounded-lg border px-2 py-1 text-[7px] ${i === 0 ? "border-[#06C755] bg-green-50 text-[#06C755]" : "border-gray-200 text-gray-500"}`}>{c}</div>
              ))}
            </div>
            <WInput label="請假日期" />
            <WInput label="請假原因" />
            <WBtn label="送出申請" primary />
          </div>
        </WPhone>,

        // 3. Coach gets notification
        <WPhone key="c1" title="3. 導師收到通知" label="LINE · 導師">
          <WHeader title="Actflow" green />
          <div className="flex-1 bg-[#3d6b96]/20 p-2 space-y-2">
            <div className="flex items-start gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[#06C755] shrink-0 mt-0.5" />
              <WCard>
                <div className="text-[8px] text-amber-600 font-bold mb-1">🔔 請假通知</div>
                <WLines n={2} last={80} />
              </WCard>
            </div>
          </div>
          <div className="bg-white border-t border-gray-100 px-2 py-1.5">
            <div className="flex gap-1">
              <div className="bg-gray-100 rounded-full px-1.5 py-0.5">
                <span className="text-[7px] text-gray-600">請假申請</span>
              </div>
            </div>
          </div>
        </WPhone>,

        // 4. Coach confirms in LIFF
        <WPhone key="c2" title="4. 確認 / 拒絕" label="LIFF · 導師">
          <WHeader title="待確認請假" />
          <div className="flex-1 p-2 space-y-1.5 overflow-hidden">
            <WCard>
              <div className="flex justify-between items-start mb-1">
                <div>
                  <WBar h={6} w="14" color="#374151" />
                  <WBar h={4} w="20" color="#D1D5DB" />
                </div>
                <div className="text-[7px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">待確認</div>
              </div>
              <WLines n={2} last={70} />
              <WInput label="備註（選填）" />
              <div className="grid grid-cols-2 gap-1 mt-1.5">
                <WBtn label="確認請假" primary />
                <WBtn label="拒絕" />
              </div>
            </WCard>
          </div>
        </WPhone>,

        // 5. Student gets confirmation
        <WPhone key="s3" title="5. 學員收到確認" label="LINE · 學員">
          <WHeader title="Actflow" green />
          <div className="flex-1 bg-[#3d6b96]/20 p-2 space-y-2">
            <div className="flex items-start gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[#06C755] shrink-0 mt-0.5" />
              <WCard>
                <div className="text-[8px] text-green-600 font-bold mb-1">✓ 請假已確認</div>
                <WLines n={2} last={75} />
              </WCard>
            </div>
          </div>
          <div className="bg-white border-t border-gray-100 px-2 py-1.5">
            <div className="flex-1 bg-gray-100 rounded-full px-2 py-1">
              <span className="text-[8px] text-gray-400">Aa</span>
            </div>
          </div>
        </WPhone>,

        // 6. Admin dashboard
        <WDesktop key="a1" title="6. 後台紀錄" label="後台 · 管理者">
          <div className="flex h-full">
            <div className="w-12 bg-gray-100 shrink-0 p-2 space-y-1.5">
              {["Dashboard","學員","請假"].map(l => (
                <div key={l} className={`h-5 rounded flex items-center px-1.5 ${l === "請假" ? "bg-gray-800" : "bg-gray-200"}`}>
                  <span className={`text-[7px] ${l === "請假" ? "text-white" : "text-gray-500"}`}>{l}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 p-2 space-y-1.5">
              <WBar h={6} w="20" color="#374151" />
              <div className="space-y-1">
                {[["王小明","TRX 基礎班","已確認"],["張建國","晨間瑜伽","待確認"]].map(([name, course, status]) => (
                  <div key={name} className="flex items-center gap-1 text-[7px] border-b border-gray-100 pb-1">
                    <span className="text-gray-700 font-medium w-10">{name}</span>
                    <span className="text-gray-400 flex-1">{course}</span>
                    <span className={status === "已確認" ? "text-green-600" : "text-amber-600"}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </WDesktop>,
      ],
    },
  ]

  return (
    <div className="space-y-10">
      {flows.map((flow, fi) => (
        <div key={fi} className="space-y-3">
          {/* Flow title */}
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0">{fi + 1}</span>
            <h3 className="font-semibold text-gray-900 text-sm">{flow.title}</h3>
            <span className="text-xs text-gray-400">{flow.role}</span>
          </div>
          {/* Wireframe strip */}
          <div className="bg-white rounded-2xl shadow-sm p-5 overflow-x-auto">
            <div className="flex items-start gap-0 min-w-max">
              {flow.nodes.map((node, ni) => (
                <div key={ni} className="flex items-start">
                  {ni > 0 && <WArrow />}
                  {node}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Design Section ────────────────────────────────────────────────────────────

function DesignSection() {
  return (
    <div className="space-y-10">

      {/* Color System */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900">色彩系統</h3>
        <p className="text-sm text-gray-500">整個產品只使用一個 accent 色。狀態提示色只出現在 badge，不用於大面積填色。</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "品牌綠", hex: "#06C755", usage: "CTA 按鈕、active 狀態、progress bar、icon 背景", role: "唯一 accent" },
            { name: "灰色系", hex: "#F9FAFB → #111827", usage: "頁面底色、卡片、文字層次", role: "主結構色" },
            { name: "紅色", hex: "#EF4444", usage: "未付款、待確認 badge（小 pill 限定）", role: "Alert only" },
            { name: "琥珀色", hex: "#F59E0B", usage: "付款警告 badge（小 pill 限定）", role: "Warning only" },
          ].map(c => (
            <div key={c.name} className="rounded-xl border border-gray-100 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg shrink-0" style={{ background: c.hex === "#F9FAFB → #111827" ? "linear-gradient(135deg,#F9FAFB,#111827)" : c.hex }} />
                <div>
                  <p className="text-xs font-semibold text-gray-900">{c.name}</p>
                  <p className="text-[10px] text-gray-400">{c.role}</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 leading-snug">{c.usage}</p>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
          ⚠️ 禁止在同一頁面為不同功能各自分配顏色（如每個 action card 用不同色）。紅、琥珀色僅能用於面積極小的 badge，不能做為區塊背景色。
        </div>
      </div>

      {/* LIFF Navigation Architecture */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900">LIFF 導航架構</h3>
        <p className="text-sm text-gray-500">LIFF App 採用底部固定 Tab 導航（LiffNav），依角色顯示不同選項。</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">學</span>
              <p className="text-sm font-semibold text-gray-800">學員 Tab</p>
            </div>
            {[
              { label: "首頁", desc: "身份資訊、剩餘堂數 progress bar、功能捷徑" },
              { label: "預約課程", desc: "可預約課程列表、名額填充進度條、確認預約流程" },
              { label: "請假申請", desc: "選擇課程 → 填日期 → 填原因 → 送出" },
            ].map(t => (
              <div key={t.label} className="flex gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-800">{t.label}</p>
                  <p className="text-[11px] text-gray-400">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px] font-bold">師</span>
              <p className="text-sm font-semibold text-gray-800">教練 Tab</p>
            </div>
            {[
              { label: "首頁", desc: "待確認請假件數提示、今日狀態摘要" },
              { label: "本週課表", desc: "展開課程查看已報名學員，顯示堂數狀態" },
              { label: "我的學員", desc: "搜尋學員、出席率、剩餘堂數、待假件數" },
            ].map(t => (
              <div key={t.label} className="flex gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-800">{t.label}</p>
                  <p className="text-[11px] text-gray-400">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-gray-600">Badge 規則</p>
          <p className="text-[11px] text-gray-500">教練「本週課表」tab 在有待確認請假時顯示紅色數字 badge。學員 tab 不顯示 badge（待確認請假由教練端處理）。</p>
        </div>
      </div>

      {/* Prototype Navigation */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900">Prototype 導航機制</h3>
          <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-semibold">Prototype only</span>
        </div>
        <p className="text-sm text-gray-500">以下機制僅存在於 Prototype 環境，正式產品透過 LINE 身份驗證自動判斷角色。</p>
        <div className="space-y-3">
          {[
            {
              name: "GlobalNav Pill（右下角）",
              desc: "固定浮在右下角，提供 LINE / LIFF / 後台 / PRD 四個入口快速切換。進入 LIFF 頁面時左側額外顯示「學員 / 教練」切換 pill，直接變更 activeUser 以模擬不同角色的 LIFF 體驗。",
            },
            {
              name: "後台 桌面/手機版 Toggle",
              desc: "後台頁面右上角提供桌面版 / 手機版切換。手機版透過 ViewModeContext 傳遞 isMobile 狀態，所有頁面以此控制欄數（grid-cols-2 vs grid-cols-4）而非 Tailwind md: breakpoint，因為手機模擬器是嵌在桌面視窗內，viewport 寬度不等於內容寬度。",
            },
            {
              name: "LINE RoleSwitcher",
              desc: "LINE 模擬器頁面頂部提供身份切換列，可在學員 / 教練 / 管理者間切換，模擬不同角色收到的訊息與 LIFF 連結。",
            },
          ].map(item => (
            <div key={item.name} className="border border-gray-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-800 mb-1">{item.name}</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* LINE UX Behaviors */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900">LINE OA UX 行為規範</h3>
        <div className="space-y-3">
          {[
            {
              title: "訊息逐則顯示（500ms 間隔）",
              desc: "Bot 回覆若包含多則訊息（如課表列表），每則訊息以 500ms 延遲依序出現，等待期間顯示三點跳動的 typing indicator。模擬真實 LINE OA 的訊息發送節奏，避免大量訊息瞬間湧現。",
            },
            {
              title: "Quick Reply Chips",
              desc: "輸入欄上方顯示常用關鍵字 chip（學員：請假、我的課表、剩餘堂數；教練：今日課表、學員列表、請假申請）。點擊 chip 效果等同於手動輸入關鍵字並送出，回覆同樣套用 500ms 逐則顯示機制。",
            },
            {
              title: "LIFF 連結入口",
              desc: "Bot 回覆中的 Button template 點擊後直接導向對應 LIFF 頁面（/liff/schedule、/liff/leave 等），不另開新視窗。Prototype 中以 Link 元件模擬此行為。",
            },
            {
              title: "身份通知推播",
              desc: "系統事件（預約成功、請假確認、新學員綁定）會觸發 addNotification，切換角色時未讀通知會在 LINE 模擬器聊天室頂部以推播訊息顯示。",
            },
          ].map(item => (
            <div key={item.title} className="flex gap-3">
              <div className="w-1.5 shrink-0 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#06C755]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-0.5">{item.title}</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Design Rules */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900">後台介面規範</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              title: "Sidebar 三分區",
              items: ["總覽：Dashboard", "管理：學員 / 導師 / 課程 / 請假", "設定：推播設定"],
              note: "Active 狀態用品牌綠 10% tint + 深色文字，不使用填滿綠底。Badge 用紅色小 pill 標示待處理件數。",
            },
            {
              title: "Stats 卡片",
              items: ["數字（text-3xl）置頂左", "標籤（text-sm）置底左", "Alert 狀態：右上角紅色圓點", "副標籤（如 ≤ 3 堂）用 text-xs gray-400"],
              note: "手機版 2×2 grid，桌面版 1×4 grid，以 isMobile context 控制，不使用 Tailwind md: breakpoint。",
            },
            {
              title: "資料表格",
              items: ["border-gray-100 取代 shadow", "hover:bg-gray-50 row highlight", "操作欄 icon + 文字標示", "狀態 badge：背景色 + 對應文字色（各色系均為 50/600 配對）"],
              note: "桌面版顯示完整表格，手機版轉為 accordion 卡片列表。",
            },
            {
              title: "課程週曆",
              items: ["桌面：7 欄週曆格，每格可展開查看報名名單", "手機：依星期分組的垂直列表", "名額填充率：細進度條（h-1）顯示於卡片內", "空格：虛線邊框 + + icon，點擊直接開啟新增表單"],
              note: "新增與編輯共用同一 CourseForm，以 Dialog 呈現。",
            },
          ].map(section => (
            <div key={section.title} className="border border-gray-100 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-800">{section.title}</p>
              <ul className="space-y-1">
                {section.items.map(item => (
                  <li key={item} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                    <span className="mt-1 w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-gray-400 leading-snug border-t border-gray-50 pt-2">{section.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PRDPage() {
  const [activeId, setActiveId] = useState("competitive")
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActiveId(e.target.id) }) },
      { rootMargin: "-20% 0px -70% 0px" }
    )
    SECTIONS.forEach(s => { const el = sectionRefs.current[s.id]; if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  function scrollTo(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Side menu */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 sticky top-0 h-screen border-r border-gray-200 bg-white pt-10 px-4">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4 px-2">目錄</p>
        <nav className="space-y-0.5">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)}
              className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                activeId === s.id ? "bg-gray-900 text-white font-medium" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}>
              <span>{s.emoji}</span>{s.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200 flex gap-1 px-4 py-2.5">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => scrollTo(s.id)}
            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
              activeId === s.id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 min-w-0 px-6 md:px-10 py-10 md:py-16 mt-12 md:mt-0 pb-32">
        <div className="mb-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Actflow</p>
          <h1 className="text-3xl font-bold text-gray-900">Product Requirements</h1>
          <p className="text-gray-500 mt-2 text-sm">產品規劃文件 · 持續更新中</p>
        </div>

        {/* 競品分析 */}
        <section id="competitive" ref={el => { sectionRefs.current["competitive"] = el }} className="mb-20 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🔍</span>
            <h2 className="text-xl font-bold text-gray-900">競品分析</h2>
            <div className="flex-1 h-px bg-gray-200 ml-2" />
          </div>
          <CompetitiveSection />
        </section>

        {/* 主要 Flow */}
        <section id="flows" ref={el => { sectionRefs.current["flows"] = el }} className="mb-20 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🔄</span>
            <h2 className="text-xl font-bold text-gray-900">主要 Flow</h2>
            <div className="flex-1 h-px bg-gray-200 ml-2" />
          </div>
          <FlowSection />
        </section>

        {/* 產品規劃 (UI Flow Wireframes) */}
        <section id="product" ref={el => { sectionRefs.current["product"] = el }} className="mb-20 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🎯</span>
            <h2 className="text-xl font-bold text-gray-900">產品規劃</h2>
            <div className="flex-1 h-px bg-gray-200 ml-2" />
          </div>
          <UIFlowSection />
        </section>

        {/* 介面設計 */}
        <section id="design" ref={el => { sectionRefs.current["design"] = el }} className="mb-20 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🎨</span>
            <h2 className="text-xl font-bold text-gray-900">介面設計</h2>
            <div className="flex-1 h-px bg-gray-200 ml-2" />
          </div>
          <DesignSection />
        </section>
      </main>
    </div>
  )
}
