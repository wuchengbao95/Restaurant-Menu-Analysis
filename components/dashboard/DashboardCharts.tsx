'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'

interface TrendPoint { date: string; leftoverRate: number; count: number }
interface DishStat { name: string; category: string; count: number; leftoverRate: number }

export default function DashboardCharts({
  trendData,
  topProblems,
}: {
  trendData: TrendPoint[]
  topProblems: DishStat[]
}) {
  return (
    <div className="space-y-4">
      {/* 趋势图 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-4">近7天剩余率趋势</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
            <Tooltip formatter={(v) => [`${v}%`, '剩余率']} />
            <Line
              type="monotone"
              dataKey="leftoverRate"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 4, fill: '#f97316' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 问题菜品 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-4">问题菜品 TOP 5（剩余率）</h3>
        {topProblems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProblems} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} unit="%" domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}`} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip formatter={(v) => [`${(Number(v) * 100).toFixed(0)}%`, '剩余率']} />
              <Bar
                dataKey="leftoverRate"
                fill="#f97316"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 问题菜品列表 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">详细排名</h3>
        <div className="space-y-2">
          {topProblems.map((d, i) => (
            <div key={d.name} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 0 ? 'bg-red-100 text-red-600' :
                i === 1 ? 'bg-orange-100 text-orange-600' :
                'bg-gray-100 text-gray-500'
              }`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-800 truncate">{d.name}</span>
                  <span className={`text-sm font-bold ${d.leftoverRate >= 0.5 ? 'text-red-500' : 'text-orange-400'}`}>
                    {(d.leftoverRate * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${d.leftoverRate >= 0.5 ? 'bg-red-400' : 'bg-orange-400'}`}
                      style={{ width: `${d.leftoverRate * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{d.count}次</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
