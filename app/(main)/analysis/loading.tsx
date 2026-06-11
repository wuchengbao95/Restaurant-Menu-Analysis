export default function AnalysisLoading() {
  return (
    <div className="sm:ml-48 pb-20 sm:pb-0 animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-20 bg-gray-200 rounded-lg" />
        <div className="h-4 w-40 bg-gray-100 rounded mt-2" />
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="h-4 w-28 bg-gray-200 rounded mb-3" />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="h-9 bg-gray-100 rounded-lg" />
            <div className="h-9 bg-gray-100 rounded-lg" />
          </div>
          <div className="h-10 bg-gray-200 rounded-lg" />
        </div>

        <div className="h-4 w-16 bg-gray-200 rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 w-36 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-28 bg-gray-100 rounded" />
              </div>
              <div className="w-5 h-5 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
