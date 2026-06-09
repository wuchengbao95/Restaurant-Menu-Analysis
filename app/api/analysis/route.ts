import { createClient } from '@/lib/supabase/server'
import { generateAnalysis } from '@/lib/deepseek'
import { leftoverRatioToNumber } from '@/lib/utils'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'No restaurant' }, { status: 404 })

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', profile.restaurant_id)
    .single()

  const { period_start, period_end } = await request.json()

  const { data: records, error } = await supabase
    .from('leftover_records')
    .select('*, menu_item:menu_items(id, name, category)')
    .eq('restaurant_id', profile.restaurant_id)
    .gte('record_date', period_start)
    .lte('record_date', period_end)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!records || records.length === 0) {
    return NextResponse.json({ error: '该时间段内没有剩菜记录' }, { status: 400 })
  }

  // 按菜品聚合数据
  const dishMap = new Map<string, {
    dishName: string
    category: string
    totalRecords: number
    totalLeftover: number
    reasons: string[]
    tableSizes: number[]
    lunchLeftover: number[]
    dinnerLeftover: number[]
  }>()

  for (const r of records) {
    const item = r.menu_item as { id: string; name: string; category: string }
    if (!item) continue
    const key = item.id
    if (!dishMap.has(key)) {
      dishMap.set(key, {
        dishName: item.name,
        category: item.category,
        totalRecords: 0,
        totalLeftover: 0,
        reasons: [],
        tableSizes: [],
        lunchLeftover: [],
        dinnerLeftover: [],
      })
    }
    const entry = dishMap.get(key)!
    const ratio = leftoverRatioToNumber(r.leftover_ratio)
    entry.totalRecords++
    entry.totalLeftover += ratio
    entry.reasons.push(...(r.reason_tags || []))
    entry.tableSizes.push(r.table_size)
    if (r.meal_period === 'lunch') entry.lunchLeftover.push(ratio)
    else entry.dinnerLeftover.push(ratio)
  }

  const aggregated = Array.from(dishMap.values()).map((d) => {
    const reasonCounts = d.reasons.reduce((acc, r) => {
      acc[r] = (acc[r] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topReasonKeys = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k)

    const REASON_LABELS: Record<string, string> = {
      too_spicy: '太辣', too_salty: '太咸', too_bland: '味道淡',
      too_much: '分量太多', texture: '口感问题', late_served: '上菜太晚',
      already_full: '客人已饱', not_expected: '不符期待',
    }

    return {
      dishName: d.dishName,
      category: d.category,
      totalRecords: d.totalRecords,
      leftoverRate: d.totalLeftover / d.totalRecords,
      commonReasons: topReasonKeys.map((k) => REASON_LABELS[k] || k),
      avgTableSize: d.tableSizes.reduce((a, b) => a + b, 0) / d.tableSizes.length,
      lunchLeftoverRate: d.lunchLeftover.length
        ? d.lunchLeftover.reduce((a, b) => a + b, 0) / d.lunchLeftover.length
        : 0,
      dinnerLeftoverRate: d.dinnerLeftover.length
        ? d.dinnerLeftover.reduce((a, b) => a + b, 0) / d.dinnerLeftover.length
        : 0,
    }
  })

  const content = await generateAnalysis({
    restaurantName: restaurant?.name || '未知餐厅',
    periodStart: period_start,
    periodEnd: period_end,
    records: aggregated,
  })

  const { data: report, error: saveError } = await supabase
    .from('analysis_reports')
    .insert({
      restaurant_id: profile.restaurant_id,
      period_start,
      period_end,
      content,
    })
    .select()
    .single()

  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 })
  return NextResponse.json(report)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'No restaurant' }, { status: 404 })

  const { data, error } = await supabase
    .from('analysis_reports')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
