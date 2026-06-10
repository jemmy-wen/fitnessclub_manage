import type { Metadata } from "next";
import "./globals.css";
import { MockDataProvider } from "@/context/MockDataContext";
import { Toaster } from "@/components/ui/sonner";
import { GlobalNav } from "@/components/GlobalNav";

export const metadata: Metadata = {
  title: "Actflow — 運動工作室管理平台",
  description: "小型運動工作室的學員、排課、請假管理 SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <MockDataProvider>
          {children}
          <GlobalNav />
          <Toaster />
        </MockDataProvider>
      </body>
    </html>
  );
}
