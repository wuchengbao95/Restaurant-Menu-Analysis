'use client'

import { useState } from 'react'
import { AnalysisReport } from '@/types'
import { formatDate } from '@/lib/utils'
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AnalysisPanel({ reports: initialReports }: { reports: AnalysisReport[] }) {
  const [reports, setReports] = useState(initialReports)
  const [expanded, setExpanded] = useState<string | null>(initialReports[0]?.id ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const defaultStart = thirtyDaysAgo.toISOString().split('T')[0]

  const [periodStart, setPeriodStart] = useState(defaultStart)
  const [periodEnd, setPeriodEnd] = useState(today)

  async function handleGenerate() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period_start: periodStart, period_end: periodEnd }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || '生成失败，请重试')
      setLoading(false)
      return
    }

    setReports((prev) => [data, ...prev])
    setExpanded(data.id)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* 生成新分析 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">生成新分析报告</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">开始日期</label>
            <input
              type="date"
              value={periodStart}
              max={periodEnd}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">结束日期</label>
            <input
              type="date"
              value={periodEnd}
              min={periodStart}
              max={today}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              AI 分析中，约需30秒...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              生成分析报告
            </>
          )}
        </button>
      </div>

      {/* 历史报告 */}
      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">还没有分析报告，点击上方生成</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-600">历史报告</h3>
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === report.id ? null : report.id)}
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">
                    {formatDate(report.period_start)} — {formatDate(report.period_end)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    生成于 {new Date(report.created_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {expanded === report.id ? (
                  <ChevronUp size={18} className="text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400 shrink-0" />
                )}
              </button>
              {expanded === report.id && (
                <div className="px-4 pb-4 border-t border-gray-50">
                  <div className="mt-3 prose prose-sm prose-gray max-w-none
                    prose-headings:font-semibold prose-headings:text-gray-800
                    prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
                    prose-p:text-gray-700 prose-p:leading-relaxed
                    prose-li:text-gray-700 prose-li:leading-relaxed
                    prose-strong:text-gray-900 prose-strong:font-semibold
                    prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {report.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
