import { createClient } from '@/lib/supabase/server'
import { identifyLeftover } from '@/lib/deepseek-vision'
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

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('id, name, category')
    .eq('restaurant_id', profile.restaurant_id)
    .eq('is_active', true)
    .order('category')
    .order('name')

  if (!menuItems || menuItems.length === 0) {
    return NextResponse.json({ error: '请先在菜单管理中添加菜品' }, { status: 400 })
  }

  const result = await identifyLeftover(image_url, menuItems)

  const matched = menuItems.find((m) => m.name === result.dish_name)

  return NextResponse.json({
    menu_item_id: matched?.id ?? null,
    menu_item_name: result.dish_name,
    leftover_ratio: result.leftover_ratio,
    confidence: result.confidence,
    matched: !!matched,
  })
}
