'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MenuItem, LEFTOVER_RATIO_LABELS, REASON_TAGS, LeftoverRatio } from '@/types'

const RATIO_OPTIONS: { value: LeftoverRatio; emoji: string }[] = [
  { value: 'none', emoji: '✅' },
  { value: 'little', emoji: '🟡' },
  { value: 'half', emoji: '🟠' },
  { value: 'most', emoji: '🔴' },
  { value: 'all', emoji: '❌' },
]

export default function NewRecordForm({ menuItems }: { menuItems: MenuItem[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const currentHour = new Date().getHours()

  const [form, setForm] = useState({
    menu_item_id: '',
    record_date: today,
    meal_period: currentHour < 15 ? 'lunch' : 'dinner',
    table_size: 2,
    leftover_ratio: '' as LeftoverRatio | '',
    reason_tags: [] as string[],
    notes: '',
  })

  function toggleReason(tag: string) {
    setForm((prev) => ({
      ...prev,
      reason_tags: prev.reason_tags.includes(tag)
        ? prev.reason_tags.filter((t) => t !== tag)
        : [...prev.reason_tags, tag],
    }))
  }

  const categories = [...new Set(menuItems.map((m) => m.category))]
  const grouped = categories.map((cat) => ({
    cat,
    items: menuItems.filter((m) => m.category === cat),
  }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.menu_item_id) { setError('请选择菜品'); return }
    if (!form.leftover_ratio) { setError('请选择剩余情况'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      setError('提交失败，请重试')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      setForm({
        menu_item_id: '',
        record_date: today,
        meal_period: currentHour < 15 ? 'lunch' : 'dinner',
        table_size: 2,
        leftover_ratio: '',
        reason_tags: [],
        notes: '',
      })
    }, 1500)
    setLoading(false)
  }

  if (menuItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <p className="text-gray-500 text-sm">还没有菜品，请先去菜单管理添加菜品</p>
        <button
          onClick={() => router.push('/menu')}
          className="mt-4 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600"
        >
          去添加菜品
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 日期 + 时段 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">日期</label>
          <input
            type="date"
            value={form.record_date}
            onChange={(e) => setForm((p) => ({ ...p, record_date: e.target.value }))}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">时段</label>
          <div className="flex gap-2">
            {(['lunch', 'dinner'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, meal_period: p }))}
                className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors ${
                  form.meal_period === p
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'border-gray-200 text-gray-600 hover:border-orange-300'
                }`}
              >
                {p === 'lunch' ? '午市' : '晚市'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 桌均人数 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <label className="text-xs text-gray-500 mb-2 block">桌均人数</label>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setForm((p) => ({ ...p, table_size: n }))}
              className={`w-10 h-10 rounded-lg text-sm font-medium border transition-colors ${
                form.table_size === n
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'border-gray-200 text-gray-600 hover:border-orange-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* 菜品选择 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <label className="text-xs text-gray-500 mb-2 block">选择菜品</label>
        <select
          value={form.menu_item_id}
          onChange={(e) => setForm((p) => ({ ...p, menu_item_id: e.target.value }))}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">-- 选择菜品 --</option>
          {grouped.map(({ cat, items }) => (
            <optgroup key={cat} label={cat}>
              {items.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* 剩余情况 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <label className="text-xs text-gray-500 mb-3 block">剩余情况</label>
        <div className="grid grid-cols-5 gap-2">
          {RATIO_OPTIONS.map(({ value, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, leftover_ratio: value }))}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-colors ${
                form.leftover_ratio === value
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-100 hover:border-orange-200'
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-xs text-gray-600 text-center leading-tight">
                {LEFTOVER_RATIO_LABELS[value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 原因标签（可选） */}
      {form.leftover_ratio && form.leftover_ratio !== 'none' && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <label className="text-xs text-gray-500 mb-3 block">原因（可多选）</label>
          <div className="flex flex-wrap gap-2">
            {REASON_TAGS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleReason(value)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  form.reason_tags.includes(value)
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'border-gray-200 text-gray-600 hover:border-orange-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 备注 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <label className="text-xs text-gray-500 mb-1 block">备注（可选）</label>
        <input
          type="text"
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="客人说了什么？其他补充…"
        />
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <button
        type="submit"
        disabled={loading || success}
        className={`w-full py-3 rounded-xl text-white font-semibold text-base transition-colors ${
          success
            ? 'bg-green-500'
            : loading
            ? 'bg-orange-300'
            : 'bg-orange-500 hover:bg-orange-600'
        }`}
      >
        {success ? '提交成功 ✓' : loading ? '提交中...' : '提交记录'}
      </button>
    </form>
  )
}
