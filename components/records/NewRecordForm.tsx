'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MenuItem, LEFTOVER_RATIO_LABELS, REASON_TAGS, LeftoverRatio } from '@/types'
import { Camera, ImagePlus, Loader2, AlertCircle, ChevronDown, X, Search, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

type Step = 'photo' | 'analyzing' | 'confirm'

const RATIO_OPTIONS: { value: LeftoverRatio; emoji: string; color: string }[] = [
  { value: 'none', emoji: '✅', color: 'border-green-400 bg-green-50' },
  { value: 'little', emoji: '🟡', color: 'border-yellow-400 bg-yellow-50' },
  { value: 'half', emoji: '🟠', color: 'border-orange-400 bg-orange-50' },
  { value: 'most', emoji: '🔴', color: 'border-red-400 bg-red-50' },
  { value: 'all', emoji: '❌', color: 'border-red-600 bg-red-100' },
]

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

function DishPicker({ menuItems, value, onChange }: {
  menuItems: MenuItem[]
  value: string
  onChange: (id: string, name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedItem = menuItems.find((m) => m.id === value)
  const categories = [...new Set(menuItems.map((m) => m.category))]
  const filtered = query.trim() ? menuItems.filter((m) => m.name.includes(query.trim())) : menuItems
  const grouped = categories
    .map((cat) => ({ cat, items: filtered.filter((m) => m.category === cat) }))
    .filter((g) => g.items.length > 0)

  function handleOpen() {
    setOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <>
      <button type="button" onClick={handleOpen}
        className={`w-full flex items-center justify-between px-3 py-3 border rounded-xl text-sm transition-colors ${
          value ? 'border-orange-300 bg-orange-50 text-gray-900' : 'border-gray-200 bg-white text-gray-400'
        }`}
      >
        <span className={value ? 'font-medium text-gray-900' : ''}>
          {selectedItem ? selectedItem.name : '点击选择菜品'}
        </span>
        <ChevronDown size={16} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col drawer-slide-up" style={{ maxHeight: '80dvh' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-4 pt-2 pb-3 shrink-0">
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索菜品..." className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder:text-gray-400" />
                {query && <button type="button" onClick={() => setQuery('')}><X size={14} className="text-gray-400" /></button>}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-2" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
              {grouped.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">没有找到菜品</p>
              ) : grouped.map(({ cat, items }) => (
                <div key={cat} className="mb-1">
                  <div className="px-3 py-1.5">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{cat}</span>
                  </div>
                  {items.map((item) => (
                    <button key={item.id} type="button" onClick={() => { onChange(item.id, item.name); setOpen(false) }}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm transition-colors ${
                        item.id === value ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <Highlight text={item.name} query={query} />
                      {item.id === value && <CheckCircle2 size={16} className="text-orange-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              ))}
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
  const inputRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]
  const currentHour = new Date().getHours()

  const [step, setStep] = useState<Step>('photo')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [aiMatched, setAiMatched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    menu_item_id: '',
    menu_item_name: '',
    record_date: today,
    meal_period: currentHour < 15 ? 'lunch' : 'dinner' as 'lunch' | 'dinner',
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

  async function handleFile(file: File) {
    setStep('analyzing')
    setAnalyzing(true)

    // 先本地预览
    const localUrl = URL.createObjectURL(file)
    setImageUrl(localUrl)

    // 上传图片
    const fd = new FormData()
    fd.append('file', file)
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
    const uploadData = await uploadRes.json()

    if (!uploadRes.ok) {
      showToast(uploadData.error || '上传失败', 'error')
      setStep('photo')
      setImageUrl(null)
      URL.revokeObjectURL(localUrl)
      setAnalyzing(false)
      return
    }

    const serverUrl = uploadData.url
    setImageUrl(serverUrl)
    URL.revokeObjectURL(localUrl)

    // AI识别
    const identifyRes = await fetch('/api/records/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: serverUrl }),
    })
    const identifyData = await identifyRes.json()
    setAnalyzing(false)

    if (!identifyRes.ok) {
      showToast(identifyData.error || 'AI识别失败，请手动选择', 'error')
      setStep('confirm')
      return
    }

    setForm((prev) => ({
      ...prev,
      menu_item_id: identifyData.menu_item_id ?? '',
      menu_item_name: identifyData.menu_item_name ?? '',
      leftover_ratio: identifyData.leftover_ratio ?? '',
    }))
    setConfidence(identifyData.confidence ?? 0)
    setAiMatched(identifyData.matched ?? false)
    setStep('confirm')
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  async function handleSubmit() {
    if (!form.menu_item_id) { showToast('请选择菜品', 'error'); return }
    if (!form.leftover_ratio) { showToast('请选择剩余情况', 'error'); return }

    setSubmitting(true)
    const { menu_item_name: _, ...payload } = form
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, image_url: imageUrl }),
    })
    setSubmitting(false)

    if (!res.ok) { showToast('提交失败，请重试', 'error'); return }

    showToast(`已记录「${form.menu_item_name}」`)

    // 保留时段和人数，重置其他
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
    setConfidence(0)
    setStep('photo')
  }

  if (menuItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <p className="text-gray-500 text-sm">还没有菜品，请先去菜单管理添加菜品</p>
        <button onClick={() => router.push('/menu')}
          className="mt-4 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 active:scale-95 transition-transform">
          去添加菜品
        </button>
      </div>
    )
  }

  // Step 1: 拍照
  if (step === 'photo') {
    return (
      <div className="space-y-3">
        <input ref={inputRef} type="file" accept="image/*" onChange={handleInput} className="hidden" />

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <p className="text-center text-sm text-gray-400 mb-6">拍摄收台菜品，AI自动识别剩余情况</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button"
              onClick={() => { inputRef.current?.setAttribute('capture', 'environment'); inputRef.current?.click() }}
              className="flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-orange-200 rounded-2xl text-orange-400 hover:border-orange-400 hover:bg-orange-50 active:scale-95 transition-all"
            >
              <Camera size={32} />
              <span className="text-sm font-medium">拍照</span>
            </button>
            <button type="button"
              onClick={() => { inputRef.current?.removeAttribute('capture'); inputRef.current?.click() }}
              className="flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-orange-300 hover:bg-orange-50 active:scale-95 transition-all"
            >
              <ImagePlus size={32} />
              <span className="text-sm font-medium">从相册选</span>
            </button>
          </div>
        </div>

        {/* 快捷设置 */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">时段</label>
            <div className="flex gap-2">
              {(['lunch', 'dinner'] as const).map((p) => (
                <button key={p} type="button"
                  onClick={() => setForm((prev) => ({ ...prev, meal_period: p }))}
                  className={`flex-1 py-2 text-sm rounded-xl border font-medium transition-colors ${
                    form.meal_period === p ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {p === 'lunch' ? '午市' : '晚市'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">桌均人数</label>
            <div className="flex gap-1.5 flex-wrap">
              {[2, 3, 4, 6, 8].map((n) => (
                <button key={n} type="button"
                  onClick={() => setForm((p) => ({ ...p, table_size: n }))}
                  className={`w-10 h-10 rounded-xl text-sm font-medium border transition-colors ${
                    form.table_size === n ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: 识别中
  if (step === 'analyzing') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {imageUrl && (
          <div className="aspect-[4/3] bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="菜品照片" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6 flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-orange-500" />
          <p className="text-sm font-medium text-gray-700">AI识别中...</p>
          <p className="text-xs text-gray-400">正在分析菜品和剩余情况</p>
        </div>
      </div>
    )
  }

  // Step 3: 确认结果
  return (
    <div className="space-y-3">
      {/* 照片预览 */}
      {imageUrl && (
        <div className="relative bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="aspect-[16/9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="菜品照片" className="w-full h-full object-cover" />
          </div>
          <button
            onClick={() => { setImageUrl(null); setStep('photo') }}
            className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* AI识别结果 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">AI识别结果</span>
          {confidence > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              confidence >= 0.7 ? 'bg-green-50 text-green-600' :
              confidence >= 0.5 ? 'bg-yellow-50 text-yellow-600' :
              'bg-red-50 text-red-500'
            }`}>
              {confidence >= 0.7 ? '识别准确' : confidence >= 0.5 ? '请确认' : '请手动选择'}
            </span>
          )}
        </div>

        {!aiMatched && form.menu_item_name && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-yellow-50 rounded-lg">
            <AlertCircle size={14} className="text-yellow-500 shrink-0" />
            <p className="text-xs text-yellow-700">AI识别为「{form.menu_item_name}」，未在菜单中找到，请手动选择</p>
          </div>
        )}

        <label className="text-xs text-gray-500 mb-1.5 block">菜品</label>
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
            <button key={value} type="button"
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

      {/* 原因标签 */}
      {form.leftover_ratio && form.leftover_ratio !== 'none' && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <label className="text-xs text-gray-500 mb-2.5 block">原因（可多选）</label>
          <div className="flex flex-wrap gap-2">
            {REASON_TAGS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => toggleReason(value)}
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

      {/* 日期 + 时段 + 人数 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">日期</label>
          <input type="date" value={form.record_date}
            onChange={(e) => setForm((p) => ({ ...p, record_date: e.target.value }))}
            className="w-full text-xs border border-gray-200 rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">时段</label>
          <div className="flex gap-1">
            {(['lunch', 'dinner'] as const).map((p) => (
              <button key={p} type="button"
                onClick={() => setForm((prev) => ({ ...prev, meal_period: p }))}
                className={`flex-1 py-2 text-xs rounded-xl border font-medium transition-colors ${
                  form.meal_period === p ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600'
                }`}
              >
                {p === 'lunch' ? '午市' : '晚市'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">人数</label>
          <select value={form.table_size} onChange={(e) => setForm((p) => ({ ...p, table_size: Number(e.target.value) }))}
            className="w-full text-xs border border-gray-200 rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
            {[1,2,3,4,5,6,8,10].map((n) => <option key={n} value={n}>{n}人</option>)}
          </select>
        </div>
      </div>

      {/* 备注 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <label className="text-xs text-gray-500 mb-1.5 block">备注（可选）</label>
        <input type="text" value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="客人说了什么？其他补充…" />
      </div>

      <button onClick={handleSubmit} disabled={submitting}
        className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-all active:scale-[0.98] bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300">
        {submitting ? '提交中...' : '确认提交'}
      </button>
    </div>
  )
}
