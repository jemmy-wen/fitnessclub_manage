"use client"

import { LineMessage } from "@/lib/keywords"
import Link from "next/link"
import Image from "next/image"

interface BubbleProps {
  message: LineMessage
  isUser?: boolean
}

// Outgoing (user) bubble — green with tail
function OutgoingBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end mb-3 items-end gap-1.5 pl-12">
      {/* Bubble tail SVG sits beside the bubble, not inside it */}
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

// Incoming plain text bubble — white
function IncomingTextBubble({ text }: { text: string }) {
  return (
    <div className="bg-white text-[#333] rounded-[18px] rounded-tl-[4px] px-4 py-2.5 text-[14px] leading-[1.5] shadow-sm max-w-[75%] w-fit whitespace-pre-wrap">
      {text}
    </div>
  )
}

// Flex card — styled like LINE Flex Message
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

// Button list — confirmation-style like LINE template messages
function ButtonList({ text, buttons }: { text: string; buttons: { label: string; href: string; style?: "primary" | "secondary" }[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden max-w-[75%] w-fit min-w-[180px]">
      {text && <div className="px-4 pt-3.5 pb-2 text-[14px] text-gray-700 leading-relaxed">{text}</div>}
      <div className="border-t border-gray-100">
        {buttons.map((btn, i) => (
          <Link
            key={i}
            href={btn.href}
            className={`block text-center py-3 text-[14px] font-medium border-b border-gray-100 last:border-0 transition-colors active:bg-gray-50 ${
              btn.style === "primary" ? "text-[#06C755]" : "text-gray-600"
            }`}
          >
            {btn.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function MessageBubble({ message, isUser = false }: BubbleProps) {
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
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-[85vw]">
            {message.cards.map((card, i) => <FlexCard key={i} card={card} />)}
          </div>
        )}
      </div>
    )
  }

  if (message.type === "button_list") {
    return (
      <div className="mb-3">
        <ButtonList text={message.text} buttons={message.buttons} />
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
