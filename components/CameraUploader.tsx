'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

interface CameraUploaderProps {
  token: string
  folderName: string
}

interface PreviewFile {
  id: string
  file: File
  previewUrl: string
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

export default function CameraUploader({ token, folderName }: CameraUploaderProps) {
  const [previews, setPreviews] = useState<PreviewFile[]>([])
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const newPreviews: PreviewFile[] = files.map(file => ({
      id: `${Date.now()}_${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setPreviews(prev => {
      const combined = [...prev, ...newPreviews]
      if (combined.length > 10) {
        setErrorMessage('最大10枚まで選択できます')
        newPreviews.slice(10 - prev.length).forEach(p => URL.revokeObjectURL(p.previewUrl))
        return combined.slice(0, 10)
      }
      setErrorMessage('')
      return combined
    })

    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const removePreview = useCallback((id: string) => {
    setPreviews(prev => {
      const removed = prev.find(p => p.id === id)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter(p => p.id !== id)
    })
  }, [])

  const handleUpload = useCallback(async () => {
    if (previews.length === 0) return

    setUploadState('uploading')
    setProgress(0)
    setErrorMessage('')

    const formData = new FormData()
    formData.append('token', token)
    previews.forEach(p => formData.append('photos', p.file))

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 8, 90))
    }, 200)

    try {
      const res = await fetch('/api/upload/photos', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error ?? 'アップロードに失敗しました')
        setUploadState('error')
        return
      }

      previews.forEach(p => URL.revokeObjectURL(p.previewUrl))
      setUploadState('done')
    } catch {
      clearInterval(progressInterval)
      setErrorMessage('ネットワークエラーが発生しました')
      setUploadState('error')
    }
  }, [previews, token])

  if (uploadState === 'done') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">アップロード完了！</h2>
        <p className="text-gray-500">写真が正常に送信されました</p>
        <p className="text-sm text-gray-400 mt-4">フォルダ: {folderName}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6 max-w-lg mx-auto">
      <div className="text-center mb-2">
        <h1 className="text-xl font-bold text-gray-800">写真をアップロード</h1>
        <p className="text-sm text-gray-500 mt-1">フォルダ: {folderName}</p>
      </div>

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploadState === 'uploading'}
        className="flex items-center justify-center gap-3 w-full py-5 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50 text-blue-600 font-semibold text-lg active:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        写真を選択 / 撮影
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
          {errorMessage}
        </div>
      )}

      {previews.length > 0 && (
        <>
          <div className="text-sm text-gray-500 text-center">{previews.length}枚選択中</div>
          <div className="grid grid-cols-3 gap-2">
            {previews.map(p => (
              <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={p.previewUrl}
                  alt="preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  onClick={() => removePreview(p.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {uploadState === 'uploading' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>アップロード中...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {previews.length > 0 && uploadState !== 'uploading' && (
        <button
          onClick={handleUpload}
          className="w-full py-4 rounded-2xl bg-blue-500 text-white font-bold text-lg shadow-md active:bg-blue-600"
        >
          アップロードする（{previews.length}枚）
        </button>
      )}

      {uploadState === 'error' && (
        <button
          onClick={() => { setUploadState('idle'); setErrorMessage('') }}
          className="w-full py-3 rounded-2xl border border-gray-300 text-gray-600 font-medium"
        >
          やり直す
        </button>
      )}
    </div>
  )
}
