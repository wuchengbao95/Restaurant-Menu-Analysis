'use client'

import { useState, useRef } from 'react'
import { LEFTOVER_RATIO_LABELS, REASON_TAGS, LeftoverRatio } from '@/types'
import { formatDate } from '@/lib/utils'
import { Trash2, Pencil, X } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface LeftoverRecord {
  id: string
  menu_item: { name: string; category: string } | null
  record_date: string
  meal_period: string
  table_size: number
  leftover_ratio: string
  reason_tags?: string[]
  notes?: string
  image_url?: string | null
}

const RATIO_NUM: { [key: string]: number } = {
  none: 0, little: 0.2, half: 0.5, most: 0.8, all: 1,
}

const RATIO_OPTIONS: { value: LeftoverRatio; emoji: string; color: string }[] = [
  { value: 'none', emoji: '✅', color: 'border-green-400 bg-green-50' },
  { value: 'little', emoji: '🟡', color: 'border-yellow-400 bg-yellow-50' },
  { value: 'half', emoji: '🟠', color: 'border-orange-400 bg-orange-50' },
  { value: 'most', emoji: '🔴', color: 'border-red-400 bg-red-50' },
  { value: 'all', emoji: '❌', color: 'border-red-600 bg-red-100' },
]

// 编辑抽屉
function EditDrawer({
  record,
  onClose,
  onSaved,
}: {
  record: LeftoverRecord
  onClose: () => void
  onSaved: (updated: LeftoverRecord) => void
}) {
  const { show: showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    record_date: record.record_date,
    meal_period: record.meal_period as 'lunch' | 'dinner',
    table_size: record.table_size,
    leftover_ratio: record.leftover_ratio as LeftoverRatio,
    reason_tags: record.reason_tags ?? [],
    notes: record.notes ?? '',
  })

  function toggleReason(tag: string) {
    setForm((prev) => ({
      ...prev,
      reason_tags: prev.reason_tags.includes(tag)
        ? prev.reason_tags.filter((t) => t !== tag)
        : [...prev.reason_tags, tag],
    }))
  }

  async function handleSave() {
    setLoading(true)
    const res = await fetch(`/api/records/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { showToast(data.error || '保存失败', 'error'); return }
    showToast('修改已保存')
    onSaved(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col drawer-slide-up"
        style={{ maxHeight: '90dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 拖动条 */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* 标题 */}
        <div className="flex items-center justify-between px-4 pt-1 pb-3 shrink-0 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            编辑记录 · {record.menu_item?.name ?? '未知菜品'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* 内容 */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>

          {/* 日期 + 时段 */}
          <div className="grid grid-cols-2 gap-3">
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
                  <button key={p} type="button"
                    onClick={() => setForm((prev) => ({ ...prev, meal_period: p }))}
                    className={`flex-1 py-2.5 text-sm rounded-xl border font-medium transition-colors ${
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
          <div>
            <label className="text-xs text-gray-500 mb-2.5 block">桌均人数</label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                <button key={n} type="button"
                  onClick={() => setForm((p) => ({ ...p, table_size: n }))}
                  className={`w-11 h-11 rounded-xl text-sm font-medium border transition-colors ${
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

          {/* 剩余情况 */}
          <div>
            <label className="text-xs text-gray-500 mb-2.5 block">剩余情况</label>
            <div className="grid grid-cols-5 gap-1.5">
              {RATIO_OPTIONS.map(({ value, emoji, color }) => (
                <button key={value} type="button"
                  onClick={() => setForm((p) => ({ ...p, leftover_ratio: value }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
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

          {/* 原因标签 */}
          {form.leftover_ratio && form.leftover_ratio !== 'none' && (
            <div>
              <label className="text-xs text-gray-500 mb-2.5 block">原因（可多选）</label>
              <div className="flex flex-wrap gap-2">
                {REASON_TAGS.map(({ value, label }) => (
                  <button key={value} type="button"
                    onClick={() => toggleReason(value)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
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
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">备注</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="补充说明..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-base bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 transition-all active:scale-[0.98]"
          >
            {loading ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SwipeCard({
  record,
  onDelete,
  onDeleteError,
  onEdit,
}: {
  record: LeftoverRecord
  onDelete: (id: string) => void
  onDeleteError: () => void
  onEdit: (record: LeftoverRecord) => void
}) {
  const [offset, setOffset] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)
  const liveOffsetRef = useRef(0)
  const REVEAL = 144 // 两个按钮宽度

  const item = record.menu_item
  const ratioNum = RATIO_NUM[record.leftover_ratio] ?? 0
  const ratioColor = ratioNum >= 0.5 ? 'text-red-500' : ratioNum > 0 ? 'text-orange-400' : 'text-green-500'
  const barColor = ratioNum >= 0.5 ? 'bg-red-400' : ratioNum > 0 ? 'bg-orange-400' : 'bg-green-400'

  function updateOffset(val: number) {
    liveOffsetRef.current = val
    setOffset(val)
  }

  function onTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX
    currentXRef.current = liveOffsetRef.current
  }

  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startXRef.current
    const next = Math.min(0, Math.max(-REVEAL - 8, currentXRef.current + dx))
    updateOffset(next)
  }

  function onTouchEnd() {
    updateOffset(liveOffsetRef.current < -REVEAL / 2 ? -REVEAL : 0)
  }

  async function confirmDelete() {
    setDeleting(true)
    const res = await fetch(`/api/records/${record.id}`, { method: 'DELETE' })
    if (res.ok) {
      onDelete(record.id)
    } else {
      setDeleting(false)
      setOffset(0)
      onDeleteError()
    }
  }

  if (deleting) return null

  const isOpen = offset <= -REVEAL / 2

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      onClick={() => { if (isOpen) updateOffset(0) }}
    >
      {/* 右侧操作区：编辑 + 删除 */}
      <div className="absolute right-0 top-0 bottom-0 w-36 flex">
        <button
          onClick={(e) => { e.stopPropagation(); updateOffset(0); onEdit(record) }}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-blue-500 text-white"
        >
          <Pencil size={16} />
          <span className="text-xs">编辑</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); confirmDelete() }}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-red-500 text-white rounded-r-xl"
        >
          <Trash2 size={16} />
          <span className="text-xs">删除</span>
        </button>
      </div>

      {/* 主卡片 */}
      <div
        className="relative bg-white border border-gray-100 rounded-xl p-4 transition-transform duration-150 ease-out"
        style={{
          transform: `translateX(${offset}px)`,
          pointerEvents: isOpen ? 'none' : 'auto',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <span className="font-medium text-gray-900">{item?.name ?? '未知菜品'}</span>
            <span className="ml-2 text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
              {item?.category}
            </span>
          </div>
          <span className={`text-xs font-semibold shrink-0 ${ratioColor}`}>
            {LEFTOVER_RATIO_LABELS[record.leftover_ratio as keyof typeof LEFTOVER_RATIO_LABELS]}
          </span>
        </div>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${ratioNum * 100}%` }} />
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{formatDate(record.record_date)}</span>
          <span className="text-gray-200">·</span>
          <span>{record.meal_period === 'lunch' ? '午市' : '晚市'}</span>
          <span className="text-gray-200">·</span>
          <span>{record.table_size}人桌</span>
        </div>
        {record.notes && <p className="mt-1.5 text-xs text-gray-500 italic">{record.notes}</p>}
        {record.image_url && (
          <div className="mt-2 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={record.image_url} alt="剩菜照片" className="w-full max-h-44 object-cover rounded-lg" />
          </div>
        )}
      </div>
    </div>
  )
}

export default function RecordList({ initialRecords }: { initialRecords: LeftoverRecord[] }) {
  const [records, setRecords] = useState(initialRecords)
  const [editingRecord, setEditingRecord] = useState<LeftoverRecord | null>(null)
  const { show: showToast } = useToast()

  function handleDelete(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id))
    showToast('记录已删除')
  }

  function handleDeleteError() {
    showToast('删除失败，请重试', 'error')
  }

  function handleSaved(updated: LeftoverRecord) {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p className="text-gray-400 text-sm">没有找到记录</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {records.map((r) => (
          <SwipeCard
            key={r.id}
            record={r}
            onDelete={handleDelete}
            onDeleteError={handleDeleteError}
            onEdit={setEditingRecord}
          />
        ))}
        <p className="text-center text-xs text-gray-300 pt-1">← 左滑可编辑或删除</p>
      </div>

      {editingRecord && (
        <EditDrawer
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
