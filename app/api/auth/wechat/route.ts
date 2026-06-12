import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function openidToEmail(openid: string) {
  return `wx_${openid}@wx.app`
}

export async function POST(request: Request) {
  const { code } = await request.json()

  if (!code) {
    return NextResponse.json({ error: '参数缺失' }, { status: 400 })
  }

  // 用 code 换取 openid
  const wxRes = await fetch(
    `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WECHAT_APPID}&secret=${process.env.WECHAT_APP_SECRET}&js_code=${code}&grant_type=authorization_code`
  )
  const wxData = await wxRes.json()

  if (wxData.errcode) {
    console.error('WeChat jscode2session error:', wxData)
    return NextResponse.json({ error: '微信登录失败，请重试' }, { status: 400 })
  }

  const { openid } = wxData
  const email = openidToEmail(openid)
  const admin = createAdminClient()

  // 生成临时密码（和手机号登录保持同一模式）
  const tempPassword = `wx_${openid}_${Date.now()}`

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
    const { data: profile } = await admin.from('user_profiles').select('id').eq('id', userId).single()
    isNewUser = !profile
  } else {
    console.error('createUser error:', createError)
    return NextResponse.json({ error: '账号创建失败' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, email, password: tempPassword, userId, isNewUser })
}
