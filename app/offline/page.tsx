'use client'

export default function OfflinePage() {
  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      </div>
      <h1 className="text-lg font-semibold text-gray-800 mb-2">当前无网络连接</h1>
      <p className="text-sm text-gray-400 mb-6">请检查网络后重试</p>
      <button
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 active:scale-95 transition-all"
      >
        重新连接
      </button>
    </div>
  );
}
