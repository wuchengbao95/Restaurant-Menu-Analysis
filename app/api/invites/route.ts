import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function getOwnerRestaurantId(): Promise<{ restaurantId: string; error?: never } | { error: string; restaurantId?: never }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'No profile' }
  if (profile.role !== 'owner') return { error: '仅店主可管理邀请码' }
  return { restaurantId: profile.restaurant_id }
}

export async function GET() {
  const result = await getOwnerRestaurantId()
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('restaurant_invites')
    .select('code, expires_at')
    .eq('restaurant_id', result.restaurantId)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json(data ?? null)
}

export async function POST() {
  const result = await getOwnerRestaurantId()
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })

  const admin = createAdminClient()

  // 删除旧码，生成新码
  await admin.from('restaurant_invites').delete().eq('restaurant_id', result.restaurantId)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  let code = generateCode()
  // 极小概率碰撞重试
  for (let i = 0; i < 3; i++) {
    const { error } = await admin.from('restaurant_invites').insert({
      restaurant_id: result.restaurantId,
      code,
      expires_at: expiresAt.toISOString(),
    })
    if (!error) break
    code = generateCode()
  }

  return NextResponse.json({ code, expires_at: expiresAt.toISOString() })
}
