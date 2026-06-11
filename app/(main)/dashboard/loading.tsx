export default function DashboardLoading() {
  return (
    <div className="sm:ml-48 pb-20 sm:pb-0 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 w-24 bg-gray-200 rounded-lg" />
          <div className="h-4 w-32 bg-gray-100 rounded mt-2" />
        </div>
        <div className="h-9 w-24 bg-gray-200 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`bg-white rounded-xl border border-gray-100 p-4 ${i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}>
            <div className="h-3 w-16 bg-gray-100 rounded mb-3" />
            <div className="h-8 w-12 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
          <div className="h-44 bg-gray-100 rounded-lg" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="h-4 w-36 bg-gray-200 rounded mb-4" />
          <div className="h-48 bg-gray-100 rounded-lg" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="h-4 w-20 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-3.5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-1.5 bg-gray-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
