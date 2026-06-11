import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function phoneToEmail(phone: string) {
  return `${phone}@phone.app`
}

export async function POST(request: Request) {
  const { phone, code } = await request.json()

  if (!phone || !code) {
    return NextResponse.json({ error: '参数缺失' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 查找有效验证码
  const { data: record } = await admin
    .from('verification_codes')
    .select('*')
    .eq('phone', phone)
    .eq('code', code)
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!record) {
    return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 })
  }

  // 标记为已使用
  await admin.from('verification_codes').update({ used: true }).eq('id', record.id)

  const email = phoneToEmail(phone)
  const tempPassword = `otp_${record.id}_${Date.now()}`

  // 尝试创建用户；已存在则查找后更新密码
  let userId: string
  let isNewUser: boolean

  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (!createError) {
    userId = newUser.user!.id
    isNewUser = true
  } else if (createError.message.toLowerCase().includes('already')) {
    const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = listData?.users.find((u) => u.email === email)
    if (!existing) return NextResponse.json({ error: '账号异常，请重试' }, { status: 500 })
    userId = existing.id
    await admin.auth.admin.updateUserById(userId, { password: tempPassword })
    // 用 profile 是否存在判断是否需要补全信息，比仅凭 auth 用户是否存在更准确
    const { data: profile } = await admin.from('user_profiles').select('id').eq('id', userId).single()
    isNewUser = !profile
  } else {
    return NextResponse.json({ error: '账号创建失败' }, { status: 500 })
  }

  // 返回凭证，由前端调用 signInWithPassword 获取 session
  return NextResponse.json({ ok: true, email, password: tempPassword, userId, isNewUser })
}
