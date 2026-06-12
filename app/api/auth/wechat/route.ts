import { createAdminClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'

function openidToEmail(openid: string) {
  return `wx_${openid}@wx.app`
}

// 用 AppSecret 对 openid 做 HMAC，生成稳定密码——同一用户每次登录密码相同，无需查找/更新
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
  } else if (createError.message.toLowerCase().includes('already')) {
    // 用户已存在，密码是稳定的 HMAC 值，无需更新，直接找到 userId
    const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = listData?.users.find((u) => u.email === email)
    if (!existing) {
      // 极端情况：找不到用户，强制更新密码重试
      console.error('User not found in listUsers for email:', email)
      return NextResponse.json({ error: '账号异常，请联系客服' }, { status: 500 })
    }
    userId = existing.id
    const { data: profile } = await admin.from('user_profiles').select('id').eq('id', userId).single()
    isNewUser = !profile
  } else {
    console.error('createUser error:', createError)
    return NextResponse.json({ error: '账号创建失败' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, email, password, userId, isNewUser })
}
