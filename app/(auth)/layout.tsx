export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles').select('id').eq('id', user.id).single()
    if (profile) redirect('/dashboard')
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      {/* 顶部品牌区 */}
      <div className="flex-shrink-0 pt-16 pb-8 px-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-lg shadow-orange-200">
          <span className="text-3xl">🍽️</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">剩菜分析</h1>
        <p className="mt-1 text-sm text-gray-400">帮餐厅减少浪费，提升复购</p>
      </div>

      {/* 表单区 */}
      <div className="flex-1 px-4 pb-8">
        <div className="w-full max-w-sm mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
