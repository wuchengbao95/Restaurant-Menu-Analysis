export default function MenuLoading() {
  return (
    <div className="sm:ml-48 pb-20 sm:pb-0 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 w-20 bg-gray-200 rounded-lg" />
          <div className="h-4 w-32 bg-gray-100 rounded mt-2" />
        </div>
      </div>

      <div className="h-10 w-28 bg-gray-200 rounded-xl mb-4" />

      <div className="space-y-4">
        {['热菜', '凉菜', '汤类'].map((cat) => (
          <div key={cat} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <div className="h-3 w-12 bg-gray-200 rounded" />
            </div>
            <div className="divide-y divide-gray-50">
              {[...Array(cat === '热菜' ? 4 : cat === '凉菜' ? 3 : 2)].map((_, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                  <div className="flex gap-2">
                    <div className="h-4 w-4 bg-gray-100 rounded" />
                    <div className="h-4 w-8 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
