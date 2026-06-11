export default function RecordsLoading() {
  return (
    <div className="sm:ml-48 pb-20 sm:pb-0 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 w-20 bg-gray-200 rounded-lg" />
          <div className="h-4 w-24 bg-gray-100 rounded mt-2" />
        </div>
        <div className="h-9 w-24 bg-gray-200 rounded-lg" />
      </div>

      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-12 bg-gray-100 rounded" />
              </div>
              <div className="h-4 w-14 bg-gray-200 rounded" />
            </div>
            <div className="flex gap-3">
              <div className="h-3 w-16 bg-gray-100 rounded" />
              <div className="h-3 w-10 bg-gray-100 rounded" />
              <div className="h-3 w-10 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
