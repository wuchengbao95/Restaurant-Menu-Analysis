'use client'

import { useEffect, useState } from 'react'
import { Copy, RefreshCw, Users } from 'lucide-react'

interface Invite { code: string; expires_at: string }

export default function InviteSection() {
  const [invite, setInvite] = useState<Invite | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { fetchInvite() }, [])

  async function fetchInvite() {
    setLoading(true)
    const res = await fetch('/api/invites')
    const data = await res.json()
    setInvite(res.ok ? data : null)
    setLoading(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    const res = await fetch('/api/invites', { method: 'POST' })
    const data = await res.json()
    setInvite(data)
    setRefreshing(false)
  }

  function handleCopy() {
    if (!invite) return
    navigator.clipboard.writeText(invite.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const expiryText = invite
    ? `有效至 ${new Date(invite.expires_at).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}`
    : ''

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users size={16} className="text-gray-400" />
        <h3 className="text-sm font-medium text-gray-700">邀请员工</h3>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">加载中...</p>
      ) : invite ? (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold tracking-widest text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
              {invite.code}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
              title="复制邀请码"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
              title="刷新邀请码"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xs text-gray-400">{expiryText}</p>
            {copied && <span className="text-xs text-green-500 font-medium">已复制</span>}
          </div>
          <p className="text-xs text-gray-400 mt-1">员工注册时选择「加入已有餐厅」并输入此码</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-400 mb-2">还没有邀请码</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:bg-orange-300 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            生成邀请码
          </button>
        </div>
      )}
    </div>
  )
}
