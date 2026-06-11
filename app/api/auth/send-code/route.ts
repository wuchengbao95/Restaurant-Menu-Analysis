import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function isValidPhone(phone: string) {
  return /^1[3-9]\d{9}$/.test(phone)
}

export async function POST(request: Request) {
  const { phone } = await request.json()

  if (!phone || !isValidPhone(phone)) {
    return NextResponse.json({ error: '请输入正确的手机号' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 清理该手机号的旧验证码
  await admin.from('verification_codes').delete().eq('phone', phone).eq('used', false)

  // 生成 6 位验证码
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5分钟有效

  const { error } = await admin.from('verification_codes').insert({ phone, code, expires_at: expiresAt })
  if (error) return NextResponse.json({ error: '发送失败，请重试' }, { status: 500 })

  // 生产环境：接入阿里云/腾讯云短信发送真实短信
  // 开发阶段：直接返回验证码（方便测试）
  return NextResponse.json({ ok: true, dev_code: code })
}
