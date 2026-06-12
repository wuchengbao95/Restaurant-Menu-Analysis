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
    userId = newUser.user!.id
    isNewUser = true
  } else {
    // 用户已存在（或其他错误），用稳定密码直接登录取得 userId
    const anonClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({ email, password })

    if (signInError || !signInData.user) {
      console.error('createUser error:', createError, 'signIn error:', signInError)
      return NextResponse.json({ error: '登录失败，请重试' }, { status: 500 })
    }

    userId = signInData.user.id
    const { data: profile } = await admin.from('user_profiles').select('id').eq('id', userId).single()
    isNewUser = !profile
  }

  return NextResponse.json({ ok: true, email, password, userId, isNewUser })
}
