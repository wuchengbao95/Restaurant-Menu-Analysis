'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BarChart2, ClipboardList, UtensilsCrossed, Sparkles, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: '看板', icon: BarChart2, match: '/dashboard' },
  { href: '/records/new', label: '记录', icon: ClipboardList, match: '/records' },
  { href: '/menu', label: '菜单', icon: UtensilsCrossed, match: '/menu' },
  { href: '/analysis', label: 'AI分析', icon: Sparkles, match: '/analysis' },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': '运营看板',
  '/records': '剩菜记录',
  '/menu': '菜单管理',
  '/analysis': 'AI 分析',
}

export default function NavBar({ restaurantName, userRole }: { restaurantName: string; userRole: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ?? '剩菜分析'

  return (
    <>
      {/* 顶部栏 */}
      <header className="bg-white border-b border-gray-100 shrink-0 safe-top">
        {/* 移动端：居中标题 */}
        <div className="sm:hidden h-12 flex items-center justify-between px-4">
          <div className="w-8" />
          <div className="flex flex-col items-center">
            <span className="text-base font-semibold text-gray-900 leading-tight">{pageTitle}</span>
            {restaurantName && (
              <span className="text-[10px] text-gray-400 leading-tight">{restaurantName}</span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full"
            aria-label="退出登录"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* 桌面端：左对齐品牌 */}
        <div className="hidden sm:flex max-w-5xl mx-auto px-4 h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-orange-500">剩菜分析</span>
            {restaurantName && (
              <span className="text-sm text-gray-400">· {restaurantName}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {userRole === 'owner' && (
              <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">店主</span>
            )}
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="退出登录"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* 底部 Tab（移动端小程序风格） */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 safe-bottom">
        <div className="flex h-14">
          {navItems.map(({ href, label, icon: Icon, match }) => {
            const active = pathname.startsWith(match)
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full" />
                )}
                <Icon
                  size={22}
                  className={cn(
                    'transition-colors',
                    active ? 'text-orange-500' : 'text-gray-400'
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors',
                    active ? 'text-orange-500' : 'text-gray-400'
                  )}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* 侧边导航（桌面端） */}
      <div className="hidden sm:block fixed left-0 top-14 bottom-0 w-48 bg-white border-r border-gray-100 py-4 z-10">
        <nav className="space-y-1 px-3">
          {navItems.map(({ href, label, icon: Icon, match }) => {
            const active = pathname.startsWith(match)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-6 left-0 right-0 px-4">
          <div className="text-xs text-gray-400 truncate text-center">{restaurantName}</div>
          {userRole === 'owner' && (
            <div className="text-xs text-orange-500 text-center mt-0.5">店主</div>
          )}
        </div>
      </div>
    </>
  )
}
