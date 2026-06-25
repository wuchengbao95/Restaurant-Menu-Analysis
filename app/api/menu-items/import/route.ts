export const runtime = 'edge'

import { createClient } from '@/lib/supabase/server'
import { extractMenuItems } from '@/lib/deepseek-vision'
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

  const { image_url } = await request.json()
  if (!image_url) return NextResponse.json({ error: '缺少图片URL' }, { status: 400 })

  try {
    const items = await extractMenuItems(image_url)
    return NextResponse.json({ items })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI识别异常'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'No restaurant' }, { status: 404 })

  const { items } = await request.json()
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: '没有菜品数据' }, { status: 400 })
  }

  const rows = items.map((item: { name: string; category: string }) => ({
    name: item.name,
    category: item.category,
    restaurant_id: profile.restaurant_id,
  }))

  const { data, error } = await supabase
    .from('menu_items')
    .insert(rows)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ count: data.length, items: data })
}
