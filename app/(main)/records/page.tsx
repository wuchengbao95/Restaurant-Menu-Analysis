import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LEFTOVER_RATIO_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 20

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/register')

  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: records, count } = await supabase
    .from('leftover_records')
    .select('*, menu_item:menu_items(id, name, category)', { count: 'exact' })
    .eq('restaurant_id', profile.restaurant_id)
    .order('record_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="sm:ml-48 pb-20 sm:pb-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">剩菜记录</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {count ?? 0} 条记录
          </p>
        </div>
        <Link
          href="/records/new"
          className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600"
        >
          <Plus size={16} />
          新增记录
        </Link>
      </div>

      {!records || records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">还没有记录</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {records.map((r) => {
              const item = r.menu_item as { name: string; category: string } | null
              const ratioNum = { none: 0, little: 0.2, half: 0.5, most: 0.8, all: 1 }[r.leftover_ratio as string] ?? 0
              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{item?.name ?? '未知菜品'}</span>
                      <span className="ml-2 text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                        {item?.category}
                      </span>
                    </div>
                    <span className={`text-sm font-semibold ${
                      ratioNum >= 0.5 ? 'text-red-500' : ratioNum > 0 ? 'text-orange-400' : 'text-green-500'
                    }`}>
                      {LEFTOVER_RATIO_LABELS[r.leftover_ratio as keyof typeof LEFTOVER_RATIO_LABELS]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{formatDate(r.record_date)}</span>
                    <span>{r.meal_period === 'lunch' ? '午市' : '晚市'}</span>
                    <span>{r.table_size}人桌</span>
                  </div>
                  {r.notes && <p className="mt-2 text-xs text-gray-500 italic">{r.notes}</p>}
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Link
                href={`/records?page=${page - 1}`}
                className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  page <= 1
                    ? 'border-gray-100 text-gray-300 pointer-events-none'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                aria-disabled={page <= 1}
              >
                <ChevronLeft size={16} />
                上一页
              </Link>
              <span className="text-sm text-gray-400">
                第 {page} / {totalPages} 页
              </span>
              <Link
                href={`/records?page=${page + 1}`}
                className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  page >= totalPages
                    ? 'border-gray-100 text-gray-300 pointer-events-none'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                aria-disabled={page >= totalPages}
              >
                下一页
                <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
