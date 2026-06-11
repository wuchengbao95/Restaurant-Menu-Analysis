'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

type Preset = 'today' | 'week' | 'month' | 'all'

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
]

function getDateRange(preset: Preset): { start?: string; end?: string } {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  if (preset === 'today') return { start: fmt(today), end: fmt(today) }
  if (preset === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    return { start: fmt(start), end: fmt(today) }
  }
  if (preset === 'week') {
    const day = today.getDay() || 7
    const start = new Date(today)
    start.setDate(today.getDate() - day + 1)
    return { start: fmt(start), end: fmt(today) }
  }
  return {}
}

export default function RecordFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  function getActive(): Preset {
    if (!start && !end) return 'all'
    const today = new Date().toISOString().split('T')[0]
    if (start === today && end === today) return 'today'
    const { start: ws, end: we } = getDateRange('week')
    if (start === ws && end === we) return 'week'
    const { start: ms } = getDateRange('month')
    if (start === ms && end === today) return 'month'
    return 'all'
  }

  const active = getActive()

  function apply(preset: Preset) {
    const range = getDateRange(preset)
    const params = new URLSearchParams()
    if (range.start) params.set('start', range.start)
    if (range.end) params.set('end', range.end)
    router.push(`/records?${params.toString()}`)
  }

  return (
    <div className="flex gap-1.5 mb-4">
      {PRESETS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => apply(value)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
            active === value
              ? 'bg-orange-500 text-white'
              : 'bg-white border border-gray-200 text-gray-500 hover:border-orange-300'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
