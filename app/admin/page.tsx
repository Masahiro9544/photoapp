'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import PhotoGrid from '@/components/PhotoGrid'

const QRCode = dynamic(() => import('@/components/QRCode'), { ssr: false })

interface Photo {
  name: string
  path: string
  signedUrl: string
}

interface GeneratedLink {
  uploadUrl: string
  folderName: string
}

export default function AdminPage() {
  const [folderName, setFolderName] = useState('')
  const [generatedLink, setGeneratedLink] = useState<GeneratedLink | null>(null)
  const [linkError, setLinkError] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [folders, setFolders] = useState<Record<string, Photo[]>>({})
  const [photosLoading, setPhotosLoading] = useState(true)

  const fetchPhotos = useCallback(async () => {
    setPhotosLoading(true)
    try {
      const res = await fetch('/api/admin/photos')
      if (res.status === 401) {
        window.location.href = '/login'
        return
      }
      const data = await res.json()
      setFolders(data.folders ?? {})
    } catch {
      // network error — keep existing state
    } finally {
      setPhotosLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const generateLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLinkError('')
    setLinkLoading(true)
    setGeneratedLink(null)

    try {
      const res = await fetch('/api/admin/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName }),
      })
      const data = await res.json()

      if (!res.ok) {
        setLinkError(data.error ?? 'エラーが発生しました')
        return
      }

      setGeneratedLink(data)
      setFolderName('')
    } catch {
      setLinkError('ネットワークエラーが発生しました')
    } finally {
      setLinkLoading(false)
    }
  }

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">管理画面</h1>
          <form action="/api/admin/auth/logout" method="post">
            <button
              type="button"
              onClick={() => {
                document.cookie = 'admin_session=; Max-Age=0; path=/'
                window.location.href = '/login'
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ログアウト
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">共有リンクを生成</h2>

          <form onSubmit={generateLink} className="flex gap-3">
            <input
              type="text"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              placeholder="フォルダ名（例: 運動会2024）"
              required
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
            />
            <button
              type="submit"
              disabled={linkLoading}
              className="px-5 py-2.5 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-blue-600 transition-colors whitespace-nowrap"
            >
              {linkLoading ? '生成中...' : 'リンク生成'}
            </button>
          </form>

          {linkError && (
            <p className="mt-3 text-red-500 text-sm">{linkError}</p>
          )}

          {generatedLink && (
            <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
              <div>
                <p className="text-sm font-medium text-blue-800 mb-2">フォルダ: {generatedLink.folderName}</p>
                <p className="text-xs font-mono text-gray-600 break-all bg-white p-2 rounded-lg border border-gray-200">
                  {generatedLink.uploadUrl}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyLink(generatedLink.uploadUrl)}
                  className="flex-1 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors"
                >
                  {copied ? 'コピーしました！' : 'URLをコピー'}
                </button>
                <button
                  onClick={() => setGeneratedLink(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50"
                >
                  閉じる
                </button>
              </div>
              <div className="flex justify-center pt-2">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-3">QRコード</p>
                  <QRCode url={generatedLink.uploadUrl} size={180} />
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {photosLoading ? (
            <div className="text-center py-12 text-gray-400">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p>読み込み中...</p>
            </div>
          ) : (
            <PhotoGrid folders={folders} onRefresh={fetchPhotos} />
          )}
        </section>
      </main>
    </div>
  )
}
