import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const admin = createAdminClient()

  // 防止重复创建
  const { data: existing } = await admin
    .from('user_profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()
  if (existing) return NextResponse.json({ ok: true })

  // ── 员工加入模式 ──────────────────────────────────────
  if (body.mode === 'join') {
    const { inviteCode, staffName } = body
    if (!inviteCode || !staffName) {
      return NextResponse.json({ error: '缺少邀请码或姓名' }, { status: 400 })
    }

    const { data: invite } = await admin
      .from('restaurant_invites')
      .select('restaurant_id, expires_at')
      .eq('code', (inviteCode as string).toUpperCase())
      .single()

    if (!invite) return NextResponse.json({ error: '邀请码无效' }, { status: 400 })
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: '邀请码已过期，请联系店主刷新' }, { status: 400 })
    }

    const { error: pErr } = await admin.from('user_profiles').insert({
      id: user.id,
      restaurant_id: invite.restaurant_id,
      role: 'staff',
      name: staffName,
    })
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── 店主创建新餐厅模式 ────────────────────────────────
  const { restaurantName, contactName, contactPhone } = body

  const { data: restaurant, error: rErr } = await admin
    .from('restaurants')
    .insert({ name: restaurantName, contact_name: contactName, contact_phone: contactPhone })
    .select()
    .single()

  if (rErr || !restaurant) {
    return NextResponse.json({ error: rErr?.message }, { status: 500 })
  }

  const { error: pErr } = await admin.from('user_profiles').insert({
    id: user.id,
    restaurant_id: restaurant.id,
    role: 'owner',
    name: contactName,
  })
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
