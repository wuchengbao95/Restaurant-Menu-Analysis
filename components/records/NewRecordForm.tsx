'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MenuItem, LEFTOVER_RATIO_LABELS, REASON_TAGS, LeftoverRatio } from '@/types'
import { Search, ChevronDown, X, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import PhotoPicker from '@/components/ui/PhotoPicker'

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const idx = text.indexOf(query.trim())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-orange-200 text-orange-800 rounded px-0.5 not-italic">{text.slice(idx, idx + query.trim().length)}</mark>
      {text.slice(idx + query.trim().length)}
    </>
  )
}

const RATIO_OPTIONS: { value: LeftoverRatio; emoji: string; color: string }[] = [
  { value: 'none', emoji: '✅', color: 'border-green-400 bg-green-50' },
  { value: 'little', emoji: '🟡', color: 'border-yellow-400 bg-yellow-50' },
  { value: 'half', emoji: '🟠', color: 'border-orange-400 bg-orange-50' },
  { value: 'most', emoji: '🔴', color: 'border-red-400 bg-red-50' },
  { value: 'all', emoji: '❌', color: 'border-red-600 bg-red-100' },
]

interface DishPickerProps {
  menuItems: MenuItem[]
  value: string
  onChange: (id: string, name: string) => void
}

function DishPicker({ menuItems, value, onChange }: DishPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedItem = menuItems.find((m) => m.id === value)

  const categories = [...new Set(menuItems.map((m) => m.category))]
  const filtered = query.trim()
    ? menuItems.filter((m) => m.name.includes(query.trim()))
    : menuItems

  const grouped = categories
    .map((cat) => ({ cat, items: filtered.filter((m) => m.category === cat) }))
    .filter((g) => g.items.length > 0)

  function handleOpen() {
    setOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleSelect(item: MenuItem) {
    onChange(item.id, item.name)
    setOpen(false)
    setQuery('')
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center justify-between px-3 py-3 border rounded-xl text-sm transition-colors ${
          value
            ? 'border-orange-300 bg-orange-50 text-gray-900'
            : 'border-gray-200 bg-white text-gray-400'
        }`}
      >
        <span className={value ? 'font-medium text-gray-900' : ''}>
          {selectedItem ? selectedItem.name : '点击选择菜品'}
        </span>
        <ChevronDown size={16} className="text-gray-400 shrink-0" />
      </button>

      {/* 背景遮罩 + 底部抽屉 */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* 半透明遮罩 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />

          {/* 抽屉主体 */}
          <div
            className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col drawer-slide-up"
            style={{ maxHeight: '80dvh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 拖动条 */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* 搜索框 */}
            <div className="px-4 pt-2 pb-3 shrink-0">
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索菜品名称..."
                  className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder:text-gray-400"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')}>
                    <X size={14} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* 菜品列表 */}
            <div
              className="overflow-y-auto flex-1 px-2"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            >
              {grouped.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">没有找到菜品</p>
              ) : (
                grouped.map(({ cat, items }) => (
                  <div key={cat} className="mb-1">
                    <div className="px-3 py-1.5">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{cat}</span>
                    </div>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item)}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm transition-colors ${
                          item.id === value
                            ? 'bg-orange-50 text-orange-600 font-medium'
                            : 'text-gray-800 hover:bg-gray-50 active:bg-gray-100'
                        }`}
                      >
                        <Highlight text={item.name} query={query} />
                        {item.id === value && <CheckCircle2 size={16} className="text-orange-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function NewRecordForm({ menuItems }: { menuItems: MenuItem[] }) {
  const router = useRouter()
  const { show: showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const currentHour = new Date().getHours()

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [form, setForm] = useState({
    menu_item_id: '',
    menu_item_name: '',
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

  function resetForm() {
    setForm((prev) => ({
      menu_item_id: '',
      menu_item_name: '',
      record_date: today,
      meal_period: prev.meal_period,
      table_size: prev.table_size,
      leftover_ratio: '',
      reason_tags: [],
      notes: '',
    }))
    setImageUrl(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.menu_item_id) { showToast('请选择菜品', 'error'); return }
    if (!form.leftover_ratio) { showToast('请选择剩余情况', 'error'); return }

    setLoading(true)

    const { menu_item_name: _, ...payload } = form
    // 只有已上传到服务器的 URL（以 https 开头）才附带
    const finalImageUrl = imageUrl?.startsWith('https') ? imageUrl : null
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, image_url: finalImageUrl }),
    })

    setLoading(false)

    if (!res.ok) {
      showToast('提交失败，请重试', 'error')
      return
    }

    showToast(`已记录「${form.menu_item_name}」的剩余情况`)
    resetForm()
  }

  if (menuItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <p className="text-gray-500 text-sm">还没有菜品，请先去菜单管理添加菜品</p>
        <button
          onClick={() => router.push('/menu')}
          className="mt-4 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 active:scale-95 transition-transform"
        >
          去添加菜品
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 日期 + 时段 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">日期</label>
          <input
            type="date"
            value={form.record_date}
            onChange={(e) => setForm((p) => ({ ...p, record_date: e.target.value }))}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">时段</label>
          <div className="flex gap-2">
            {(['lunch', 'dinner'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, meal_period: p }))}
                className={`flex-1 py-2.5 text-sm rounded-xl border font-medium transition-colors active:scale-95 ${
                  form.meal_period === p
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'border-gray-200 text-gray-600'
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
        <label className="text-xs text-gray-500 mb-2.5 block">桌均人数</label>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setForm((p) => ({ ...p, table_size: n }))}
              className={`w-11 h-11 rounded-xl text-sm font-medium border transition-colors active:scale-95 ${
                form.table_size === n
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* 菜品选择 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <label className="text-xs text-gray-500 mb-2.5 block">选择菜品</label>
        <DishPicker
          menuItems={menuItems}
          value={form.menu_item_id}
          onChange={(id, name) => setForm((p) => ({ ...p, menu_item_id: id, menu_item_name: name }))}
        />
      </div>

      {/* 剩余情况 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <label className="text-xs text-gray-500 mb-2.5 block">剩余情况</label>
        <div className="grid grid-cols-5 gap-1.5">
          {RATIO_OPTIONS.map(({ value, emoji, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, leftover_ratio: value }))}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all active:scale-95 ${
                form.leftover_ratio === value ? color + ' scale-105' : 'border-gray-100'
              }`}
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-[10px] text-gray-600 text-center leading-tight">
                {LEFTOVER_RATIO_LABELS[value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 原因标签（可选） */}
      {form.leftover_ratio && form.leftover_ratio !== 'none' && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <label className="text-xs text-gray-500 mb-2.5 block">原因（可多选）</label>
          <div className="flex flex-wrap gap-2">
            {REASON_TAGS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleReason(value)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors active:scale-95 ${
                  form.reason_tags.includes(value)
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'border-gray-200 text-gray-600'
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
        <label className="text-xs text-gray-500 mb-1.5 block">备注（可选）</label>
        <input
          type="text"
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="客人说了什么？其他补充…"
        />
      </div>

      {/* 拍照上传 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <label className="text-xs text-gray-500 mb-2.5 block">上传照片（可选）</label>
        <PhotoPicker value={imageUrl} onChange={setImageUrl} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-all active:scale-[0.98] bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
      >
        {loading ? '提交中...' : '提交记录'}
      </button>
    </form>
  )
}
