import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MenuManager from '@/components/menu/MenuManager'
import InviteSection from '@/components/menu/InviteSection'

export default async function MenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/register')

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('category')
    .order('name')

  return (
    <div className="sm:ml-48 pb-20 sm:pb-0">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">菜单管理</h1>
        <p className="text-sm text-gray-500 mt-1">添加和管理你的菜品</p>
      </div>
      <MenuManager menuItems={menuItems ?? []} />
      {profile.role === 'owner' && (
        <div className="mt-4">
          <InviteSection />
        </div>
      )}
    </div>
  )
}
