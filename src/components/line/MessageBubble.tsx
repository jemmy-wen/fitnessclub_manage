"use client"

import { LineMessage, MessageAction } from "@/lib/keywords"
import Link from "next/link"

interface BubbleProps {
  message: LineMessage
  isUser?: boolean
  onAction?: (action: MessageAction) => void
  onNavigate?: (href: string) => void
}

function OutgoingBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end mb-3 items-end gap-1.5 pl-12">
      <div className="bg-[#06C755] text-white rounded-[18px] rounded-br-[6px] px-4 py-2.5 text-[14px] leading-[1.5] shadow-sm whitespace-pre-wrap break-words">
        {text}
      </div>
      <img
        src="/line/bubble-tail.svg"
        alt=""
        className="shrink-0 mb-0.5"
        style={{
          width: 10,
          height: 13,
          filter: "brightness(0) saturate(100%) invert(52%) sepia(85%) saturate(500%) hue-rotate(105deg) brightness(97%)",
        }}
      />
    </div>
  )
}

function IncomingTextBubble({ text }: { text: string }) {
  return (
    <div className="bg-white text-[#333] rounded-[18px] rounded-tl-[4px] px-4 py-2.5 text-[14px] leading-[1.5] shadow-sm max-w-[75%] w-fit whitespace-pre-wrap">
      {text}
    </div>
  )
}

function FlexCard({ card }: { card: { title: string; subtitle?: string; body: string; footer?: string; color?: string } }) {
  const color = card.color ?? "#06C755"
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-[220px] shrink-0">
      <div className="p-3.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <p className="font-semibold text-gray-900 text-[13px]">{card.title}</p>
        </div>
        {card.subtitle && <p className="text-[11px] text-gray-500 ml-3.5">{card.subtitle}</p>}
        <p className="text-[13px] text-gray-700 mt-1.5">{card.body}</p>
        {card.footer && (
          <p className="text-[11px] mt-2 font-medium" style={{ color }}>
            {card.footer}
          </p>
        )}
      </div>
    </div>
  )
}

function ButtonList({
  text,
  buttons,
  onNavigate,
}: {
  text: string
  buttons: { label: string; href: string; style?: "primary" | "secondary" }[]
  onNavigate?: (href: string) => void
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-[75%] w-fit min-w-[180px]">
      {text && <div className="px-4 pt-3.5 pb-2 text-[14px] text-gray-700 leading-relaxed">{text}</div>}
      <div className="border-t border-gray-100">
        {buttons.map((btn, i) => (
          onNavigate ? (
            <button
              key={i}
              onClick={() => onNavigate(btn.href)}
              className={`block w-full text-center py-3 text-[14px] font-medium border-b border-gray-100 last:border-0 transition-colors active:bg-gray-50 ${
                btn.style === "primary" ? "text-[#06C755]" : "text-gray-600"
              }`}
            >
              {btn.label}
            </button>
          ) : (
            <Link
              key={i}
              href={btn.href}
              className={`block text-center py-3 text-[14px] font-medium border-b border-gray-100 last:border-0 transition-colors active:bg-gray-50 ${
              btn.style === "primary" ? "text-[#06C755]" : "text-gray-600"
              }`}
            >
              {btn.label}
            </Link>
          )
        ))}
      </div>
    </div>
  )
}

function CourseSelectGrid({
  prompt,
  courses,
  onSelect,
}: {
  prompt: string
  courses: { id: string; title: string; dayLabel: string; time: string; coachName: string }[]
  onSelect?: (courseId: string, courseTitle: string) => void
}) {
  return (
    <div className="max-w-[85%]">
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm mb-2 text-[14px] text-gray-700 leading-relaxed">
        {prompt}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {courses.map(course => (
          <button
            key={course.id}
            onClick={() => onSelect?.(course.id, course.title)}
            className="bg-white rounded-2xl p-3 shadow-sm text-left active:scale-95 transition-transform border-2 border-transparent hover:border-[#06C755]/30"
          >
            <p className="font-semibold text-gray-900 text-[13px] mb-1 leading-tight">{course.title}</p>
            <p className="text-[11px] text-gray-500">{course.dayLabel} {course.time}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{course.coachName} 教練</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function ActionButtons({
  text,
  buttons,
  onAction,
}: {
  text: string
  buttons: { label: string; action: string; style?: "primary" | "secondary" | "danger" }[]
  onAction?: (action: string) => void
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-[75%] min-w-[200px]">
      {text && (
        <div className="px-4 pt-3.5 pb-2 text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      )}
      <div className="border-t border-gray-100">
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={() => onAction?.(btn.action)}
            className={`w-full text-center py-3 text-[14px] font-medium border-b border-gray-100 last:border-0 transition-colors active:bg-gray-50 ${
              btn.style === "primary"
                ? "text-[#06C755]"
                : btn.style === "danger"
                ? "text-red-500"
                : "text-gray-600"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function MessageBubble({ message, isUser = false, onAction, onNavigate }: BubbleProps) {
  if (isUser) {
    const text = (message as { type: "text"; text: string }).text
    return <OutgoingBubble text={text} />
  }

  if (message.type === "text") {
    return (
      <div className="mb-2">
        <IncomingTextBubble text={message.text} />
      </div>
    )
  }

  if (message.type === "flex") {
    return (
      <div className="mb-3">
        {message.cards.length === 1 ? (
          <FlexCard card={message.cards[0]} />
        ) : (
          <div className="overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2 pb-1 w-max">
              {message.cards.map((card, i) => (
                <FlexCard key={i} card={card} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (message.type === "button_list") {
    return (
      <div className="mb-3">
        <ButtonList text={message.text} buttons={message.buttons} onNavigate={onNavigate} />
      </div>
    )
  }

  if (message.type === "course_select") {
    return (
      <div className="mb-3">
        <CourseSelectGrid
          prompt={message.prompt}
          courses={message.courses}
          onSelect={(courseId, courseTitle) =>
            onAction?.({ type: "select_course", courseId, courseTitle })
          }
        />
      </div>
    )
  }

  if (message.type === "action_buttons") {
    return (
      <div className="mb-3">
        <ActionButtons
          text={message.text}
          buttons={message.buttons}
          onAction={action => onAction?.({ type: "button_action", action })}
        />
      </div>
    )
  }

  return null
}

export interface ChatMessage {
  id: string
  messages: LineMessage[]
  isUser: boolean
  timestamp: Date
}
