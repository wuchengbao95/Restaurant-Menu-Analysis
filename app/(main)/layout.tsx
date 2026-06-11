export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { ToastProvider } from '@/components/ui/Toast'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, restaurant:restaurants(name)')
    .eq('id', user.id)
    .single()

  return (
    <ToastProvider>
      <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden">
        <NavBar
          restaurantName={(profile?.restaurant as { name: string } | null)?.name ?? ''}
          userRole={profile?.role ?? 'staff'}
        />
        {/* 桌面端：侧边栏占位 */}
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden sm:block w-48 shrink-0" />
          <main className="flex-1 overflow-y-auto px-4 pt-5 pb-tab sm:pb-5">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
