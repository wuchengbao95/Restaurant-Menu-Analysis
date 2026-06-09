import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewRecordForm from '@/components/records/NewRecordForm'
import Link from 'next/link'
import { History } from 'lucide-react'

export default async function NewRecordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/register')

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .eq('is_active', true)
    .order('category')
    .order('name')

  return (
    <div className="sm:ml-48 pb-24 sm:pb-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">记录剩菜</h1>
          <p className="text-sm text-gray-500 mt-1">收台时填写，30秒完成</p>
        </div>
        <Link
          href="/records"
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <History size={15} />
          历史记录
        </Link>
      </div>
      <NewRecordForm menuItems={menuItems ?? []} />
    </div>
  )
}
