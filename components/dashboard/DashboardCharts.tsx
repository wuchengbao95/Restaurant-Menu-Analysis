'use client'

import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'

interface TrendPoint { date: string; leftoverRate: number; count: number }
interface DishStat { name: string; category: string; count: number; leftoverRate: number }

const RANK_COLORS = [
  'bg-red-100 text-red-600',
  'bg-orange-100 text-orange-600',
  'bg-yellow-100 text-yellow-600',
  'bg-gray-100 text-gray-500',
  'bg-gray-100 text-gray-500',
]

export default function DashboardCharts({
  trendData,
  topProblems,
}: {
  trendData: TrendPoint[]
  topProblems: DishStat[]
}) {
  return (
    <div className="space-y-3">
      {/* 趋势图 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">近7天剩余率趋势</h3>
        {trendData.every((d) => d.count === 0) ? (
          <div className="h-[160px] flex items-center justify-center">
            <p className="text-sm text-gray-300">近7天暂无记录</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                unit="%"
                domain={[0, 100]}
                width={32}
              />
              <Tooltip
                formatter={(v) => [`${v}%`, '剩余率']}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 13 }}
              />
              <Line
                type="monotone"
                dataKey="leftoverRate"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#f97316', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#f97316', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 问题菜品详细排名（纯列表，不用图表，移动端更清晰） */}
      {topProblems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">问题菜品 TOP {topProblems.length}</h3>
          <div className="space-y-3">
            {topProblems.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${RANK_COLORS[i] ?? 'bg-gray-100 text-gray-400'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm font-medium text-gray-800 truncate mr-2">{d.name}</span>
                    <span className={`text-sm font-bold tabular-nums shrink-0 ${d.leftoverRate >= 0.5 ? 'text-red-500' : 'text-orange-400'}`}>
                      {(d.leftoverRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${d.leftoverRate >= 0.5 ? 'bg-red-400' : 'bg-orange-400'}`}
                        style={{ width: `${d.leftoverRate * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 tabular-nums">{d.count}次</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
