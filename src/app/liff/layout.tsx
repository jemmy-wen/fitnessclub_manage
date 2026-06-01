import { MobileShell } from "@/components/MobileShell"
import { LiffNav } from "@/components/liff/LiffNav"

export default function LiffLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileShell>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          {children}
        </div>
        <LiffNav />
      </div>
    </MobileShell>
  )
}
