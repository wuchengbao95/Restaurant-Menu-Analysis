import { createAdminClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'

function openidToEmail(openid: string) {
  return `wx_${openid}@wx.app`
}

function openidToPassword(openid: string) {
  return createHmac('sha256', process.env.WECHAT_APP_SECRET!)
    .update(openid)
    .digest('hex')
    .slice(0, 32)
}

export async function POST(request: Request) {
  const { code } = await request.json()
  if (!code) return NextResponse.json({ error: '参数缺失' }, { status: 400 })

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
  const password = openidToPassword(openid)
  const admin = createAdminClient()

  let userId: string
  let isNewUser: boolean

  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (!createError) {
    // 新用户
    userId = newUser.user!.id
    isNewUser = true
  } else {
    // 用户已存在，先尝试用稳定密码直接登录
    const anonClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )

    const { data: signInData } = await anonClient.auth.signInWithPassword({ email, password })

    if (signInData?.user) {
      // 稳定密码匹配，直接登录成功
      userId = signInData.user.id
    } else {
      // 旧密码，用 generateLink 找到 userId 后更新为稳定密码
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
      })

      if (linkError || !linkData?.user?.id) {
        console.error('generateLink error:', linkError, 'createUser error:', createError)
        return NextResponse.json({ error: '登录失败，请重试' }, { status: 500 })
      }

      userId = linkData.user.id
      await admin.auth.admin.updateUserById(userId, { password })
    }

    const { data: profile } = await admin.from('user_profiles').select('id').eq('id', userId).single()
    isNewUser = !profile
  }

  return NextResponse.json({ ok: true, email, password, userId, isNewUser })
}
