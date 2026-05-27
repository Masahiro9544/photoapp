'use client'

import { useState } from 'react'
import Image from 'next/image'
import JSZip from 'jszip'

interface Photo {
  name: string
  path: string
  signedUrl: string
}

interface PhotoGridProps {
  folders: Record<string, Photo[]>
  onRefresh: () => void
}

export default function PhotoGrid({ folders, onRefresh }: PhotoGridProps) {
  const [activeFolder, setActiveFolder] = useState<string>(Object.keys(folders)[0] ?? '')
  const [downloading, setDownloading] = useState<string | null>(null)

  const folderNames = Object.keys(folders)

  const downloadSingle = async (photo: Photo) => {
    setDownloading(photo.path)
    try {
      const res = await fetch(`/api/admin/photos/download?path=${encodeURIComponent(photo.path)}`)
      const data = await res.json()
      if (data.url) {
        const link = document.createElement('a')
        link.href = data.url
        link.download = photo.name
        link.click()
      }
    } finally {
      setDownloading(null)
    }
  }

  const downloadZip = async (folder: string) => {
    setDownloading(`zip_${folder}`)
    try {
      const res = await fetch(`/api/admin/photos/download?folder=${encodeURIComponent(folder)}`)
      const data = await res.json()

      if (!data.files || data.files.length === 0) return

      const zip = new JSZip()
      const folderZip = zip.folder(folder)!

      await Promise.all(
        data.files.map(async (f: { name: string; url: string }) => {
          const fileRes = await fetch(f.url)
          const blob = await fileRes.blob()
          folderZip.file(f.name, blob)
        })
      )

      const content = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      link.download = `${folder}.zip`
      link.click()
      URL.revokeObjectURL(link.href)
    } finally {
      setDownloading(null)
    }
  }

  if (folderNames.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>まだ写真がアップロードされていません</p>
        <button onClick={onRefresh} className="mt-4 text-sm text-blue-500 underline">更新する</button>
      </div>
    )
  }

  const currentPhotos = folders[activeFolder] ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">アップロード済み写真</h2>
        <button onClick={onRefresh} className="text-sm text-blue-500 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          更新
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {folderNames.map(name => (
          <button
            key={name}
            onClick={() => setActiveFolder(name)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              activeFolder === name
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {name} ({folders[name].length})
          </button>
        ))}
      </div>

      {activeFolder && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => downloadZip(activeFolder)}
              disabled={downloading !== null}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {downloading === `zip_${activeFolder}` ? (
                <span>作成中...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  ZIP一括ダウンロード
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {currentPhotos.map(photo => (
              <div key={photo.path} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
                {photo.signedUrl && (
                  <Image
                    src={photo.signedUrl}
                    alt={photo.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => downloadSingle(photo)}
                    disabled={downloading !== null}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2 shadow-lg"
                  >
                    <svg className="w-5 h-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">{photo.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
