import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "剩菜分析 - 餐饮运营优化系统",
  description: "通过剩菜数据发现问题，优化菜品，提升复购",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className={`${geist.className} min-h-full bg-gray-50`}>{children}</body>
    </html>
  );
}
