'use client'

import { useRef, useState } from 'react'
import { Camera, X, Loader2, ImagePlus } from 'lucide-react'

interface PhotoPickerProps {
  value: string | null
  onChange: (url: string | null) => void
}

export default function PhotoPicker({ value, onChange }: PhotoPickerProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file) return
    setUploading(true)
    setError('')

    // 本地预览（乐观更新）
    const localUrl = URL.createObjectURL(file)
    onChange(localUrl)

    const fd = new FormData()
    fd.append('file', file)

    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()

    setUploading(false)

    if (!res.ok) {
      setError(data.error || '上传失败')
      onChange(null)
      URL.revokeObjectURL(localUrl)
      return
    }
    onChange(data.url)
    URL.revokeObjectURL(localUrl)
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  if (value) {
    return (
      <div className="relative w-full">
        <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-[4/3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="剩菜照片" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-white" />
            </div>
          )}
        </div>
        {!uploading && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white"
          >
            <X size={14} />
          </button>
        )}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    )
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInput}
        className="hidden"
      />
      <div className="grid grid-cols-2 gap-2">
        {/* 拍照 */}
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.setAttribute('capture', 'environment')
              inputRef.current.click()
            }
          }}
          className="flex flex-col items-center justify-center gap-2 py-5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-400 active:scale-95 transition-all"
        >
          <Camera size={24} />
          <span className="text-xs font-medium">拍照</span>
        </button>

        {/* 从相册选 */}
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.removeAttribute('capture')
              inputRef.current.click()
            }
          }}
          className="flex flex-col items-center justify-center gap-2 py-5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-400 active:scale-95 transition-all"
        >
          <ImagePlus size={24} />
          <span className="text-xs font-medium">从相册选</span>
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
