import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { leftoverRatioToNumber } from '@/lib/utils'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/register')

  // 最近30天记录
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const startDate = thirtyDaysAgo.toISOString().split('T')[0]

  const { data: records } = await supabase
    .from('leftover_records')
    .select('*, menu_item:menu_items(id, name, category)')
    .eq('restaurant_id', profile.restaurant_id)
    .gte('record_date', startDate)
    .order('record_date', { ascending: false })

  if (!records || records.length === 0) {
    return (
      <div>
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm mb-4">还没有剩菜记录</p>
          <Link
            href="/records/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600"
          >
            <Plus size={16} />
            记录第一条剩菜
          </Link>
        </div>
      </div>
    )
  }

  // 统计
  const totalRecords = records.length
  const highLeftoverRecords = records.filter((r) => leftoverRatioToNumber(r.leftover_ratio) >= 0.5)
  const highLeftoverRate = ((highLeftoverRecords.length / totalRecords) * 100).toFixed(0)

  // 按菜品聚合
  const dishMap = new Map<string, { name: string; category: string; records: typeof records }>()
  for (const r of records) {
    const item = r.menu_item as { id: string; name: string; category: string } | null
    if (!item) continue
    if (!dishMap.has(item.id)) {
      dishMap.set(item.id, { name: item.name, category: item.category, records: [] })
    }
    dishMap.get(item.id)!.records.push(r)
  }

  const dishStats = Array.from(dishMap.entries()).map(([, d]) => {
    const avgLeftover = d.records.reduce((sum, r) => sum + leftoverRatioToNumber(r.leftover_ratio), 0) / d.records.length
    return { name: d.name, category: d.category, count: d.records.length, leftoverRate: avgLeftover }
  }).sort((a, b) => b.leftoverRate - a.leftoverRate)

  const topProblems = dishStats.slice(0, 5)

  // 最近7天趋势
  const trendMap = new Map<string, { total: number; leftover: number }>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    trendMap.set(d.toISOString().split('T')[0], { total: 0, leftover: 0 })
  }
  for (const r of records) {
    if (trendMap.has(r.record_date)) {
      const entry = trendMap.get(r.record_date)!
      entry.total++
      entry.leftover += leftoverRatioToNumber(r.leftover_ratio)
    }
  }
  const trendData = Array.from(trendMap.entries()).map(([date, d]) => ({
    date: date.slice(5),
    leftoverRate: d.total > 0 ? Math.round((d.leftover / d.total) * 100) : 0,
    count: d.total,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400">最近30天数据概览</p>
        <Link
          href="/records/new"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 active:scale-95 transition-transform"
        >
          <Plus size={15} />
          记录剩菜
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">记录总次数</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalRecords}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">高剩余比例</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{highLeftoverRate}%</p>
          <p className="text-xs text-gray-400">半盘以上</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 col-span-2 sm:col-span-1 p-4">
          <p className="text-xs text-gray-500">问题菜品数</p>
          <p className="text-2xl font-bold text-red-500 mt-1">
            {dishStats.filter((d) => d.leftoverRate >= 0.5).length}
          </p>
          <p className="text-xs text-gray-400">剩余率≥50%</p>
        </div>
      </div>

      <DashboardCharts trendData={trendData} topProblems={topProblems} />
    </div>
  )
}
