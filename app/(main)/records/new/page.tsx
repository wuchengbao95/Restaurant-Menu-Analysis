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
    <div>
      <p className="text-xs text-gray-400 mb-4">收台时填写，30秒完成</p>
      <NewRecordForm menuItems={menuItems ?? []} />
    </div>
  )
}
