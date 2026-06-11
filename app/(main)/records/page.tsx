import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Suspense } from 'react'
import RecordFilter from '@/components/records/RecordFilter'
import RecordList from '@/components/records/RecordList'

const PAGE_SIZE = 20

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; start?: string; end?: string }>
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

  const { page: pageParam, start, end } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('leftover_records')
    .select('*, menu_item:menu_items(id, name, category)', { count: 'exact' })
    .eq('restaurant_id', profile.restaurant_id)
    .order('record_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (start) query = query.gte('record_date', start)
  if (end) query = query.lte('record_date', end)

  const { data: records, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">共 {count ?? 0} 条记录</p>
        <Link
          href="/records/new"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 active:scale-95 transition-transform"
        >
          <Plus size={16} />
          新增记录
        </Link>
      </div>

      {/* 日期快捷筛选 */}
      <Suspense>
        <RecordFilter />
      </Suspense>

      {!records || records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">没有找到记录</p>
        </div>
      ) : (
        <>
          <RecordList initialRecords={records as Parameters<typeof RecordList>[0]['initialRecords']} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <Link
                href={`/records?page=${page - 1}${start ? `&start=${start}` : ''}${end ? `&end=${end}` : ''}`}
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
              <span className="text-sm text-gray-400">第 {page} / {totalPages} 页</span>
              <Link
                href={`/records?page=${page + 1}${start ? `&start=${start}` : ''}${end ? `&end=${end}` : ''}`}
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
