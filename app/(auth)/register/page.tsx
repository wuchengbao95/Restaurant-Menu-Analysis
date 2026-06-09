'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Mode = 'owner' | 'staff'

export default function RegisterPage() {
  const [mode, setMode] = useState<Mode>('owner')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  // 店主表单
  const [ownerForm, setOwnerForm] = useState({
    restaurantName: '', contactName: '', contactPhone: '', email: '', password: '',
  })

  // 员工表单
  const [staffForm, setStaffForm] = useState({
    inviteCode: '', staffName: '', email: '', password: '',
  })

  async function getOrCreateAuthUser(email: string, password: string): Promise<string | null> {
    const { data: { user: existing } } = await supabase.auth.getUser()
    if (existing) return existing.id

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password })
    if (!signUpErr && signUpData.user) return signUpData.user.id

    // 邮箱已存在，尝试登录
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
    if (signInErr || !signInData.user) return null
    return signInData.user.id
  }

  async function handleOwnerSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const userId = await getOrCreateAuthUser(ownerForm.email, ownerForm.password)
    if (!userId) {
      setError('该邮箱已注册，请直接登录')
      setLoading(false); return
    }

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantName: ownerForm.restaurantName,
        contactName: ownerForm.contactName,
        contactPhone: ownerForm.contactPhone,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError('创建餐厅失败：' + (data.error ?? res.status))
      setLoading(false); return
    }
    window.location.href = '/dashboard'
  }

  async function handleStaffSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const userId = await getOrCreateAuthUser(staffForm.email, staffForm.password)
    if (!userId) {
      setError('该邮箱已注册，请直接登录')
      setLoading(false); return
    }

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'join',
        inviteCode: staffForm.inviteCode.trim(),
        staffName: staffForm.staffName,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? '加入失败，请检查邀请码')
      setLoading(false); return
    }
    window.location.href = '/dashboard'
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      {/* Tab 切换 */}
      <div className="flex rounded-lg border border-gray-200 p-1 mb-6">
        {(['owner', 'staff'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError('') }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === m ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m === 'owner' ? '🏠 创建新餐厅' : '👥 加入已有餐厅'}
          </button>
        ))}
      </div>

      {/* 店主注册 */}
      {mode === 'owner' && (
        <form onSubmit={handleOwnerSubmit} className="space-y-4">
          {[
            { key: 'restaurantName', label: '餐厅名称', placeholder: '例：老王烤鱼', type: 'text', required: true },
            { key: 'contactName',    label: '负责人姓名', placeholder: '您的姓名',     type: 'text', required: true },
            { key: 'contactPhone',   label: '联系电话',   placeholder: '13800138000', type: 'tel',  required: false },
            { key: 'email',          label: '邮箱',       placeholder: 'your@email.com', type: 'email', required: true },
            { key: 'password',       label: '密码',       placeholder: '至少6位',     type: 'password', required: true },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type}
                value={ownerForm[f.key as keyof typeof ownerForm]}
                onChange={(e) => setOwnerForm(p => ({ ...p, [f.key]: e.target.value }))}
                className={inputCls}
                placeholder={f.placeholder}
                required={f.required}
              />
            </div>
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium rounded-lg text-sm transition-colors">
            {loading ? '注册中...' : '注册并开始使用'}
          </button>
        </form>
      )}

      {/* 员工加入 */}
      {mode === 'staff' && (
        <form onSubmit={handleStaffSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邀请码</label>
            <input
              type="text"
              value={staffForm.inviteCode}
              onChange={(e) => setStaffForm(p => ({ ...p, inviteCode: e.target.value.toUpperCase() }))}
              className={`${inputCls} tracking-widest font-mono text-base`}
              placeholder="6位邀请码"
              maxLength={6}
              required
            />
            <p className="text-xs text-gray-400 mt-1">向店主索取邀请码</p>
          </div>
          {[
            { key: 'staffName', label: '你的姓名',  placeholder: '例：小李',          type: 'text',     required: true },
            { key: 'email',     label: '邮箱',      placeholder: 'your@email.com',    type: 'email',    required: true },
            { key: 'password',  label: '设置密码',  placeholder: '至少6位',           type: 'password', required: true },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type}
                value={staffForm[f.key as keyof typeof staffForm]}
                onChange={(e) => setStaffForm(p => ({ ...p, [f.key]: e.target.value }))}
                className={inputCls}
                placeholder={f.placeholder}
                required={f.required}
              />
            </div>
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium rounded-lg text-sm transition-colors">
            {loading ? '加入中...' : '加入餐厅'}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-gray-500">
        已有账号？
        <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium ml-1">登录</Link>
      </p>
    </div>
  )
}
