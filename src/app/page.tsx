import Link from "next/link"

export default function HomePage() {
  const sections = [
    {
      title: "LINE OA 模擬器",
      description: "模擬學員與導師在 LINE 上的關鍵字查詢與推播通知",
      href: "/line",
      color: "bg-[#06C755]",
      badge: "手機版",
      items: ["關鍵字觸發", "角色切換", "推播模擬"],
    },
    {
      title: "LIFF App",
      description: "學員排課、請假申請與導師管理介面",
      href: "/liff/schedule",
      color: "bg-blue-500",
      badge: "手機優先",
      items: ["學員綁定", "排課預約", "請假申請", "導師課表"],
    },
    {
      title: "後台管理系統",
      description: "全局管理學員、課程、導師與推播設定",
      href: "/admin/dashboard",
      color: "bg-purple-600",
      badge: "桌面 + 手機",
      items: ["Dashboard", "學員管理", "課程排課", "請假紀錄"],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-[#06C755] rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-white font-bold text-xl">AC</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">Actflow</h1>
        <p className="text-gray-400 text-lg">小型運動工作室管理平台 · Prototype</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 w-full max-w-4xl">
        {sections.map(section => (
          <Link
            key={section.href}
            href={section.href}
            className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-all hover:scale-[1.02]"
          >
            <div className={`w-10 h-10 ${section.color} rounded-xl flex items-center justify-center mb-4`}>
              <span className="text-white text-xs font-bold">{section.title[0]}</span>
            </div>
            <div className="flex items-start justify-between mb-1">
              <h2 className="font-bold text-white text-lg leading-tight">{section.title}</h2>
            </div>
            <span className="inline-block text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full mb-3">
              {section.badge}
            </span>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">{section.description}</p>
            <ul className="space-y-1">
              {section.items.map(item => (
                <li key={item} className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-gray-600" />
                  {item}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>

      <p className="mt-12 text-gray-600 text-sm text-center">
        LINE 模擬器中可切換 <span className="text-gray-400">學員 / 導師</span> 身份，體驗不同角色的完整流程
      </p>
    </div>
  )
}
