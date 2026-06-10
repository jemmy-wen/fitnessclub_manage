"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

const LINKS = [
  { href: "/line", label: "LINE&LIFF" },
  { href: "/admin/dashboard", label: "後台" },
  { href: "/prd", label: "PRD" },
]

export function GlobalNav() {
  return (
    <Suspense>
      <GlobalNavInner />
    </Suspense>
  )
}

function GlobalNavInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (pathname === "/" || searchParams.get("embed") === "1") return null

  function isActive(href: string) {
    if (href === "/line") return pathname === "/line" || pathname.startsWith("/liff")
    if (href === "/prd") return pathname.startsWith("/prd")
    if (href === "/admin/dashboard") return pathname.startsWith("/admin")
    return false
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5">
      <div className="flex items-center gap-1 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-full px-2 py-1.5 shadow-xl">
        {LINKS.map(link => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                active ? "bg-white text-gray-900" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
