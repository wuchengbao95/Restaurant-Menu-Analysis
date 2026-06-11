import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalysisPanel from '@/components/analysis/AnalysisPanel'

export default async function AnalysisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/register')

  const { data: reports } = await supabase
    .from('analysis_reports')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">基于剩菜数据，生成优化建议</p>
      <AnalysisPanel reports={reports ?? []} />
    </div>
  )
}
