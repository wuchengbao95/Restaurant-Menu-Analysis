'use client'

import { useState, useRef } from 'react'
import { MenuItem } from '@/types'
import { Plus, Pencil, X, EyeOff, Eye } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

const CATEGORIES = ['凉菜', '热菜', '汤类', '主食', '海鲜', '烧烤', '饮品', '甜品', '其他']
const SWIPE_THRESHOLD = 64

function MenuItemRow({
  item,
  onEdit,
  onToggle,
}: {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onToggle: (item: MenuItem) => void
}) {
  const [offset, setOffset] = useState(0)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)
  const liveOffsetRef = useRef(0)

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
    const next = Math.min(0, Math.max(-SWIPE_THRESHOLD - 8, currentXRef.current + dx))
    updateOffset(next)
  }
  function onTouchEnd() {
    updateOffset(liveOffsetRef.current < -SWIPE_THRESHOLD / 2 ? -SWIPE_THRESHOLD : 0)
  }

  const isOpen = offset <= -SWIPE_THRESHOLD / 2

  return (
    <div
      className="relative overflow-hidden"
      onClick={() => { if (isOpen) setOffset(0) }}
    >
      {/* 右侧操作区 */}
      <div className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center bg-orange-500">
        <button
          onClick={(e) => { e.stopPropagation(); setOffset(0); onToggle(item) }}
          className="flex flex-col items-center gap-1 text-white"
        >
          <EyeOff size={16} />
          <span className="text-[10px]">下架</span>
        </button>
      </div>

      {/* 主行 */}
      <div
        className="relative bg-white flex items-center justify-between px-4 py-3 transition-transform duration-150 ease-out"
        style={{
          transform: `translateX(${offset}px)`,
          pointerEvents: isOpen ? 'none' : 'auto',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <span className="text-sm text-gray-800">{item.name}</span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEdit(item) }}
          className="text-gray-400 hover:text-orange-500 transition-colors p-1"
        >
          <Pencil size={15} />
        </button>
      </div>
    </div>
  )
}

export default function MenuManager({ menuItems }: { menuItems: MenuItem[] }) {
  const { show: showToast } = useToast()
  const [items, setItems] = useState(menuItems)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState({ name: '', category: '热菜' })
  const [loading, setLoading] = useState(false)

  const categories = [...new Set(items.map((m) => m.category))]

  async function handleAdd() {
    if (!form.name.trim()) return
    setLoading(true)
    const res = await fetch('/api/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { showToast(data.error || '添加失败', 'error'); return }
    setItems((prev) => [...prev, data])
    setForm({ name: '', category: '热菜' })
    setShowAdd(false)
    showToast(`「${data.name}」已添加`)
  }

  async function handleToggle(item: MenuItem) {
    const res = await fetch('/api/menu-items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
    })
    const data = await res.json()
    if (!res.ok) { showToast(data.error || '操作失败', 'error'); return }
    setItems((prev) => prev.map((m) => (m.id === item.id ? data : m)))
    showToast(item.is_active ? `「${item.name}」已下架` : `「${item.name}」已上架`)
  }

  async function handleEdit() {
    if (!editItem || !form.name.trim()) return
    setLoading(true)
    const res = await fetch('/api/menu-items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editItem.id, ...form }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { showToast(data.error || '修改失败', 'error'); return }
    setItems((prev) => prev.map((m) => (m.id === editItem.id ? data : m)))
    setEditItem(null)
    setForm({ name: '', category: '热菜' })
    showToast('修改已保存')
  }

  function openEdit(item: MenuItem) {
    setEditItem(item)
    setForm({ name: item.name, category: item.category })
    setShowAdd(false)
  }

  const grouped = [...new Set([...categories, ...CATEGORIES.filter((c) => !categories.includes(c))])]
    .map((cat) => ({ cat, items: items.filter((m) => m.category === cat && m.is_active) }))
    .filter((g) => g.items.length > 0)

  const inactive = items.filter((m) => !m.is_active)

  return (
    <div className="space-y-3">
      <button
        onClick={() => { setShowAdd(true); setEditItem(null); setForm({ name: '', category: '热菜' }) }}
        className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 active:scale-95 transition-all"
      >
        <Plus size={16} />
        添加菜品
      </button>

      {/* 添加/编辑表单 */}
      {(showAdd || editItem) && (
        <div className="bg-white rounded-xl border border-orange-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-800">{editItem ? '编辑菜品' : '添加新菜品'}</h3>
            <button
              onClick={() => { setShowAdd(false); setEditItem(null) }}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={18} />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="菜品名称"
              autoFocus
            />
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={editItem ? handleEdit : handleAdd}
              disabled={loading || !form.name.trim()}
              className="w-full py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 disabled:bg-orange-300 active:scale-95 transition-all"
            >
              {loading ? '保存中...' : editItem ? '保存修改' : '添加'}
            </button>
          </div>
        </div>
      )}

      {/* 菜品列表 */}
      {grouped.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">还没有菜品，点击上方添加</p>
        </div>
      ) : (
        grouped.map(({ cat, items: catItems }) => (
          <div key={cat} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{cat}</span>
              <span className="text-xs text-gray-300">{catItems.length}个菜品</span>
            </div>
            <div className="divide-y divide-gray-50">
              {catItems.map((item) => (
                <MenuItemRow key={item.id} item={item} onEdit={openEdit} onToggle={handleToggle} />
              ))}
            </div>
            <div className="px-4 py-2 bg-gray-50/50">
              <p className="text-[10px] text-gray-300">← 左滑可下架</p>
            </div>
          </div>
        ))
      )}

      {/* 已下架 */}
      {inactive.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">已下架</span>
            <span className="text-xs text-gray-300">{inactive.length}个</span>
          </div>
          <div className="divide-y divide-gray-50">
            {inactive.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-400 line-through">{item.name}</span>
                <button
                  onClick={() => handleToggle(item)}
                  className="flex items-center gap-1 text-xs text-green-500 hover:text-green-700 active:scale-95 transition-all"
                >
                  <Eye size={13} />
                  上架
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
