'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BarChart2, ClipboardList, UtensilsCrossed, Sparkles, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: '看板', icon: BarChart2, match: '/dashboard' },
  { href: '/records/new', label: '记录剩菜', icon: ClipboardList, match: '/records' },
  { href: '/menu', label: '菜单管理', icon: UtensilsCrossed, match: '/menu' },
  { href: '/analysis', label: 'AI分析', icon: Sparkles, match: '/analysis' },
]

export default function NavBar({ restaurantName, userRole }: { restaurantName: string; userRole: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* 顶部栏 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-orange-500">剩菜分析</span>
            {restaurantName && (
              <span className="text-sm text-gray-400 hidden sm:inline">· {restaurantName}</span>
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

      {/* 底部导航（移动端） */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 sm:hidden">
        <div className="flex">
          {navItems.map(({ href, label, icon: Icon, match }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors',
                pathname.startsWith(match)
                  ? 'text-orange-500'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* 侧边导航（桌面端） */}
      <div className="hidden sm:block fixed left-0 top-14 bottom-0 w-48 bg-white border-r border-gray-100 py-4">
        <nav className="space-y-1 px-3">
          {navItems.map(({ href, label, icon: Icon, match }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(match)
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
