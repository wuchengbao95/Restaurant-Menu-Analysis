import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function phoneToEmail(phone: string) {
  return `${phone.replace(/\D/g, '')}@phone.app`
}

export async function POST(request: Request) {
  const body = await request.json()
  const { mode } = body

  // ── 微信用户通过邀请码加入餐厅 ──────────────────────────
  if (mode === 'join-wx') {
    const { staffName, inviteCode } = body
    if (!staffName || !inviteCode) {
      return NextResponse.json({ error: '信息不完整' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: invite } = await admin
      .from('restaurant_invites')
      .select('restaurant_id, expires_at')
      .eq('code', (inviteCode as string).toUpperCase())
      .single()

    if (!invite) return NextResponse.json({ error: '邀请码无效' }, { status: 400 })
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: '邀请码已过期，请联系店主刷新' }, { status: 400 })
    }

    const { data: existingProfile } = await admin
      .from('user_profiles').select('id').eq('id', user.id).single()

    if (!existingProfile) {
      const { error: pErr } = await admin.from('user_profiles').insert({
        id: user.id,
        restaurant_id: invite.restaurant_id,
        role: 'staff',
        name: staffName,
      })
      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  // ── OTP 已验证用户补全信息（无需再填账号密码）──────────
  if (mode === 'complete-otp') {
    const { restaurantName, contactName } = body
    if (!restaurantName || !contactName) {
      return NextResponse.json({ error: '请填写餐厅名称和负责人姓名' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 幂等：已有 profile 直接返回
    const { data: existing } = await supabase
      .from('user_profiles').select('id').eq('id', user.id).single()
    if (existing) return NextResponse.json({ ok: true })

    const adminForOtp = createAdminClient()
    const { data: restaurant, error: rErr } = await adminForOtp
      .from('restaurants')
      .insert({ name: restaurantName, contact_name: contactName, contact_phone: '' })
      .select().single()

    if (rErr || !restaurant) return NextResponse.json({ error: rErr?.message }, { status: 500 })

    const { error: pErr } = await adminForOtp.from('user_profiles').insert({
      id: user.id, restaurant_id: restaurant.id, role: 'owner', name: contactName,
    })
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  }

  const admin = createAdminClient()

  const { identifier, password } = body
  if (!identifier || !password) {
    return NextResponse.json({ error: '请填写手机号/邮箱和密码' }, { status: 400 })
  }

  const email = identifier.includes('@') ? identifier : phoneToEmail(identifier)

  // ── 员工加入模式 ──────────────────────────────────────
  if (mode === 'join') {
    const { staffName, inviteCode } = body
    if (!staffName || !inviteCode) {
      return NextResponse.json({ error: '信息不完整' }, { status: 400 })
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

    // 尝试创建用户；若已存在则更新密码
    let userId: string
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    })

    if (createErr) {
      if (!createErr.message.toLowerCase().includes('already')) {
        return NextResponse.json({ error: createErr.message }, { status: 500 })
      }
      // 已存在 → 找出 userId
      const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const found = listData?.users.find((u) => u.email === email)
      if (!found) return NextResponse.json({ error: '账号异常' }, { status: 500 })
      userId = found.id
      await admin.auth.admin.updateUserById(userId, { password })
    } else {
      userId = created.user!.id
    }

    const { data: existingProfile } = await admin
      .from('user_profiles').select('id').eq('id', userId).single()
    if (!existingProfile) {
      await admin.from('user_profiles').insert({
        id: userId, restaurant_id: invite.restaurant_id, role: 'staff', name: staffName,
      })
    }

    return NextResponse.json({ ok: true, email, password })
  }

  // ── 店主创建新餐厅模式 ────────────────────────────────
  const { restaurantName, contactName, contactPhone } = body
  if (!restaurantName || !contactName) {
    return NextResponse.json({ error: '请填写餐厅名称和负责人姓名' }, { status: 400 })
  }

  // 尝试创建 Auth 用户
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })

  if (createErr) {
    if (createErr.message.toLowerCase().includes('already')) {
      // 已有账号 → 检查是否已完成注册
      const { data: listData2 } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const existing = listData2?.users.find((u) => u.email === email)
      if (existing) {
        const { data: profile } = await admin
          .from('user_profiles').select('restaurant_id').eq('id', existing.id).single()
        if (profile) {
          return NextResponse.json({ error: '该手机号/邮箱已注册，请直接登录' }, { status: 409 })
        }
        // 有账号但无 profile → 继续创建餐厅
        await admin.auth.admin.updateUserById(existing.id, { password })
        const { data: restaurant, error: rErr } = await admin
          .from('restaurants')
          .insert({ name: restaurantName, contact_name: contactName, contact_phone: contactPhone ?? '' })
          .select().single()
        if (rErr || !restaurant) return NextResponse.json({ error: rErr?.message }, { status: 500 })
        await admin.from('user_profiles').insert({
          id: existing.id, restaurant_id: restaurant.id, role: 'owner', name: contactName,
        })
        return NextResponse.json({ ok: true, email, password })
      }
    }
    return NextResponse.json({ error: createErr.message }, { status: 500 })
  }

  const userId = created.user!.id

  // 创建餐厅
  const { data: restaurant, error: rErr } = await admin
    .from('restaurants')
    .insert({ name: restaurantName, contact_name: contactName, contact_phone: contactPhone ?? '' })
    .select().single()

  if (rErr || !restaurant) {
    await admin.auth.admin.deleteUser(userId) // 回滚
    return NextResponse.json({ error: rErr?.message }, { status: 500 })
  }

  // 创建 Profile
  const { error: pErr } = await admin.from('user_profiles').insert({
    id: userId, restaurant_id: restaurant.id, role: 'owner', name: contactName,
  })
  if (pErr) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: pErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, email, password })
}
