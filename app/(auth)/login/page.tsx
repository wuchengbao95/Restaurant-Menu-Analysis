'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type LoginMode = 'otp' | 'password'

function phoneToEmail(phone: string) {
  return `${phone}@phone.app`
}

const WechatIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.048.213.167.295.295.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c-.305-.888-.463-1.83-.463-2.808 0-3.726 3.469-6.75 7.752-6.75.28 0 .556.012.83.036C15.67 4.516 12.469 2.188 8.69 2.188zm-2.87 4.329c.63 0 1.14.512 1.14 1.142 0 .63-.51 1.141-1.14 1.141-.63 0-1.141-.511-1.141-1.14 0-.63.511-1.143 1.14-1.143zm5.739 0c.63 0 1.14.512 1.14 1.142 0 .63-.51 1.141-1.14 1.141-.63 0-1.14-.511-1.14-1.14 0-.63.51-1.143 1.14-1.143zm1.635 5.234c-3.623 0-6.559 2.61-6.559 5.828 0 3.218 2.936 5.828 6.56 5.828.724 0 1.42-.098 2.077-.275a.614.614 0 0 1 .522.071l1.387.812a.237.237 0 0 0 .121.04.215.215 0 0 0 .215-.215c0-.053-.021-.1-.035-.155l-.284-1.08a.43.43 0 0 1 .155-.485c1.335-1.015 2.197-2.54 2.197-4.24 0-3.219-2.936-5.829-6.56-5.829h.004zm-1.738 2.76c.46 0 .833.374.833.834 0 .46-.373.833-.833.833a.834.834 0 0 1-.833-.833c0-.46.372-.833.833-.833zm3.476 0c.46 0 .833.374.833.834 0 .46-.373.833-.833.833a.834.834 0 0 1-.833-.833c0-.46.372-.833.833-.833z"/>
  </svg>
)

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('otp')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState('')     // 开发模式显示验证码
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [password, setPassword] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function startCountdown() {
    setCountdown(60)
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }

  async function handleSendCode() {
    const cleaned = phone.replace(/\s/g, '')
    if (!/^1[3-9]\d{9}$/.test(cleaned)) {
      setError('请输入正确的11位手机号')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleaned }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error || '发送失败'); return }

    setCodeSent(true)
    startCountdown()
    // 开发阶段显示验证码
    if (data.dev_code) setDevCode(data.dev_code)
  }

  async function handleOtpLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!code || code.length !== 6) { setError('请输入6位验证码'); return }
    setLoading(true)
    setError('')

    const cleaned = phone.replace(/\s/g, '')
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleaned, code }),
    })
    const data = await res.json()

    if (!res.ok) { setError(data.error || '验证失败'); setLoading(false); return }

    // 如果是新用户（没有 profile），跳到注册完善信息
    if (data.isNewUser) {
      // 先登录拿到 session
      await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
      window.location.href = '/register?from=otp'
      return
    }

    // 老用户直接登录
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (signInErr) { setError('登录失败，请重试'); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!identifier.trim() || !password) { setError('请填写完整信息'); return }
    setLoading(true)
    setError('')

    const email = identifier.includes('@') ? identifier : phoneToEmail(identifier)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })

    if (err) {
      setError(err.message.includes('Invalid login credentials') ? '账号或密码错误' : '登录失败，请重试')
      setLoading(false)
      return
    }
    window.location.href = '/dashboard'
  }

  const inputCls = 'w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-5 text-center">登录</h2>

      {/* 微信登录（禁用，即将上线） */}
      <div className="relative mb-4">
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-gray-100 text-sm text-gray-300 bg-gray-50 cursor-not-allowed"
        >
          <WechatIcon />
          微信一键登录
        </button>
        <span className="absolute -top-2 right-3 bg-gray-200 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">
          即将上线
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400">手机号登录</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* 模式切换 */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        {(['otp', 'password'] as LoginMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError('') }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {m === 'otp' ? '验证码登录' : '密码登录'}
          </button>
        ))}
      </div>

      {/* 验证码登录 */}
      {mode === 'otp' && (
        <form onSubmit={handleOtpLogin} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">手机号</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`flex-1 ${inputCls}`}
                placeholder="请输入手机号"
                maxLength={11}
                autoComplete="tel"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading || countdown > 0}
                className={`shrink-0 px-3 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  countdown > 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-50 text-orange-500 hover:bg-orange-100 active:scale-95'
                }`}
              >
                {countdown > 0 ? `${countdown}s后重发` : codeSent ? '重新发送' : '获取验证码'}
              </button>
            </div>
          </div>

          {/* 开发模式验证码提示 */}
          {devCode && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs text-blue-600">验证码（开发模式）</span>
              <span
                className="text-lg font-bold tracking-widest text-blue-700 cursor-pointer"
                onClick={() => setCode(devCode)}
              >
                {devCode}
              </span>
            </div>
          )}

          {codeSent && (
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">验证码</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`${inputCls} tracking-[0.5em] text-center font-bold text-lg`}
                placeholder="——  ——  ——"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {codeSent && (
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white font-semibold rounded-xl text-sm transition-colors active:scale-[0.98]"
            >
              {loading ? '验证中...' : '登录'}
            </button>
          )}

          {!codeSent && (
            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-xl text-sm transition-colors active:scale-[0.98]"
            >
              {loading ? '发送中...' : '获取验证码'}
            </button>
          )}
        </form>
      )}

      {/* 密码登录 */}
      {mode === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">手机号或邮箱</label>
            <input
              type="text"
              inputMode="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={inputCls}
              placeholder="13800138000 或 your@email.com"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-xl text-sm transition-colors active:scale-[0.98]"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-gray-400">
        还没有账号？
        <Link href="/register" className="text-orange-500 font-medium ml-1">注册餐厅</Link>
      </p>
    </div>
  )
}
