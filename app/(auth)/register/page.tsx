'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Mode = 'owner' | 'staff'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const fromOtp = searchParams.get('from') === 'otp'

  const [mode, setMode] = useState<Mode>('owner')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const [ownerForm, setOwnerForm] = useState({
    restaurantName: '', contactName: '', identifier: '', password: '',
  })
  const [staffForm, setStaffForm] = useState({
    inviteCode: '', staffName: '', identifier: '', password: '',
  })

  // OTP 来的用户已有 session，只需补填餐厅信息
  const [otpForm, setOtpForm] = useState({ restaurantName: '', contactName: '' })

  async function signInAfterRegister(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('注册成功，但自动登录失败，请返回登录页手动登录')
    window.location.href = '/dashboard'
  }

  async function handleOtpComplete(e: React.FormEvent) {
    e.preventDefault()
    if (!otpForm.restaurantName.trim() || !otpForm.contactName.trim()) {
      setError('请填写餐厅名称和负责人姓名')
      return
    }
    setLoading(true); setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'complete-otp',
        restaurantName: otpForm.restaurantName,
        contactName: otpForm.contactName,
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? '注册失败，请重试'); setLoading(false); return }

    // 已有 session，直接跳转
    window.location.href = '/dashboard'
  }

  async function handleOwnerSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: ownerForm.identifier,
        password: ownerForm.password,
        restaurantName: ownerForm.restaurantName,
        contactName: ownerForm.contactName,
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? '注册失败，请重试'); setLoading(false); return }

    try {
      await signInAfterRegister(data.email, data.password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败')
      setLoading(false)
    }
  }

  async function handleStaffSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'join',
        identifier: staffForm.identifier,
        password: staffForm.password,
        staffName: staffForm.staffName,
        inviteCode: staffForm.inviteCode,
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? '加入失败，请检查邀请码'); setLoading(false); return }

    try {
      await signInAfterRegister(data.email, data.password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败')
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500'

  // OTP 已验证手机号，只需补充餐厅信息
  if (fromOtp) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">完善餐厅信息</h2>
        <p className="text-sm text-gray-400 text-center mb-5">手机号已验证，填写餐厅信息即可开始使用</p>

        <form onSubmit={handleOtpComplete} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">餐厅名称</label>
            <input
              type="text"
              value={otpForm.restaurantName}
              onChange={(e) => setOtpForm(p => ({ ...p, restaurantName: e.target.value }))}
              className={inputCls}
              placeholder="例：老王烤鱼"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">负责人姓名</label>
            <input
              type="text"
              value={otpForm.contactName}
              onChange={(e) => setOtpForm(p => ({ ...p, contactName: e.target.value }))}
              className={inputCls}
              placeholder="您的姓名"
              required
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
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-xl text-sm active:scale-[0.98] transition-all"
          >
            {loading ? '创建中...' : '开始使用'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-5 text-center">注册并开始使用</h2>

      <div className="flex rounded-xl border border-gray-200 p-1 mb-5">
        {(['owner', 'staff'] as Mode[]).map((m) => (
          <button key={m} type="button"
            onClick={() => { setMode(m); setError('') }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === m ? 'bg-orange-500 text-white' : 'text-gray-500'
            }`}
          >
            {m === 'owner' ? '创建新餐厅' : '加入已有餐厅'}
          </button>
        ))}
      </div>

      {mode === 'owner' && (
        <form onSubmit={handleOwnerSubmit} className="space-y-3">
          {[
            { key: 'restaurantName', label: '餐厅名称', placeholder: '例：老王烤鱼', type: 'text' },
            { key: 'contactName', label: '负责人姓名', placeholder: '您的姓名', type: 'text' },
            { key: 'identifier', label: '手机号或邮箱', placeholder: '13800138000 或 your@email.com', type: 'text', inputMode: 'tel' as const },
            { key: 'password', label: '设置密码', placeholder: '至少6位', type: 'password' },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-gray-500 mb-1.5">{f.label}</label>
              <input
                type={f.type}
                inputMode={f.inputMode}
                value={ownerForm[f.key as keyof typeof ownerForm]}
                onChange={(e) => setOwnerForm(p => ({ ...p, [f.key]: e.target.value }))}
                className={inputCls}
                placeholder={f.placeholder}
                minLength={f.key === 'password' ? 6 : undefined}
                required
              />
            </div>
          ))}
          {error && <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2"><p className="text-sm text-red-600">{error}</p></div>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-xl text-sm active:scale-[0.98] transition-all">
            {loading ? '注册中...' : '注册并开始使用'}
          </button>
        </form>
      )}

      {mode === 'staff' && (
        <form onSubmit={handleStaffSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">邀请码</label>
            <input type="text" value={staffForm.inviteCode}
              onChange={(e) => setStaffForm(p => ({ ...p, inviteCode: e.target.value.toUpperCase() }))}
              className={`${inputCls} tracking-[0.5em] font-mono text-center`}
              placeholder="6位邀请码" maxLength={6} required />
            <p className="text-xs text-gray-400 mt-1">向店主索取邀请码</p>
          </div>
          {[
            { key: 'staffName', label: '你的姓名', placeholder: '例：小李', type: 'text' },
            { key: 'identifier', label: '手机号或邮箱', placeholder: '13800138000', type: 'text', inputMode: 'tel' as const },
            { key: 'password', label: '设置密码', placeholder: '至少6位', type: 'password' },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-gray-500 mb-1.5">{f.label}</label>
              <input
                type={f.type}
                inputMode={f.inputMode}
                value={staffForm[f.key as keyof typeof staffForm]}
                onChange={(e) => setStaffForm(p => ({ ...p, [f.key]: e.target.value }))}
                className={inputCls}
                placeholder={f.placeholder}
                minLength={f.key === 'password' ? 6 : undefined}
                required
              />
            </div>
          ))}
          {error && <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2"><p className="text-sm text-red-600">{error}</p></div>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-xl text-sm active:scale-[0.98] transition-all">
            {loading ? '加入中...' : '加入餐厅'}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-gray-400">
        已有账号？
        <Link href="/login" className="text-orange-500 font-medium ml-1">返回登录</Link>
      </p>
    </div>
  )
}
