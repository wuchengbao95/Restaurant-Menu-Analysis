'use client'

import { useState } from 'react'
import { MenuItem } from '@/types'
import { Plus, Pencil, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['凉菜', '热菜', '汤类', '主食', '海鲜', '烧烤', '饮品', '甜品', '其他']

export default function MenuManager({ menuItems }: { menuItems: MenuItem[] }) {
  const router = useRouter()
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
    setItems((prev) => [...prev, data])
    setForm({ name: '', category: '热菜' })
    setShowAdd(false)
    setLoading(false)
    router.refresh()
  }

  async function handleToggle(item: MenuItem) {
    const res = await fetch('/api/menu-items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
    })
    const data = await res.json()
    setItems((prev) => prev.map((m) => (m.id === item.id ? data : m)))
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
    setItems((prev) => prev.map((m) => (m.id === editItem.id ? data : m)))
    setEditItem(null)
    setForm({ name: '', category: '热菜' })
    setLoading(false)
  }

  const grouped = [...new Set([...categories, ...CATEGORIES.filter((c) => !categories.includes(c))])]
    .map((cat) => ({ cat, items: items.filter((m) => m.category === cat && m.is_active) }))
    .filter((g) => g.items.length > 0)

  const inactive = items.filter((m) => !m.is_active)

  return (
    <div className="space-y-4">
      <button
        onClick={() => { setShowAdd(true); setForm({ name: '', category: '热菜' }) }}
        className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors"
      >
        <Plus size={16} />
        添加菜品
      </button>

      {/* 添加/编辑表单 */}
      {(showAdd || editItem) && (
        <div className="bg-white rounded-xl border border-orange-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-800">{editItem ? '编辑菜品' : '添加新菜品'}</h3>
            <button onClick={() => { setShowAdd(false); setEditItem(null) }} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="菜品名称"
              autoFocus
            />
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={editItem ? handleEdit : handleAdd}
              disabled={loading}
              className="w-full py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:bg-orange-300"
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
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{cat}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {catItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-800">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditItem(item)
                        setForm({ name: item.name, category: item.category })
                        setShowAdd(false)
                      }}
                      className="text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleToggle(item)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      下架
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* 已下架 */}
      {inactive.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden opacity-60">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400">已下架</span>
          </div>
          <div className="divide-y divide-gray-50">
            {inactive.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-400 line-through">{item.name}</span>
                <button
                  onClick={() => handleToggle(item)}
                  className="text-xs text-green-500 hover:text-green-700"
                >
                  恢复上架
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
