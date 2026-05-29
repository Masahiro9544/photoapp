'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const ERROR_MESSAGES: Record<string, string> = {
  invalid: '無効なリンクです',
  used: 'このリンクはすでに使用済みです',
  expired: 'リンクの有効期限が切れています',
  server: 'サーバーエラーが発生しました',
}

function LoginForm() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const [passphrase, setPassphrase] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLink, setMagicLink] = useState('')
  const [error, setError] = useState(errorParam ? (ERROR_MESSAGES[errorParam] ?? 'エラーが発生しました') : '')
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMagicLink('')

    try {
      const res = await fetch('/api/admin/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'エラーが発生しました。')
        return
      }

      setMagicLink(data.magicLink)
      setPassphrase('')
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(magicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">管理者ログイン</h1>
            <p className="text-gray-500 text-sm mt-1">パスフレーズを入力してください</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {!magicLink ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                placeholder="パスフレーズ"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold text-base disabled:opacity-50 hover:bg-blue-600 transition-colors"
              >
                {loading ? '確認中...' : 'ログインリンクを生成'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-green-700 text-sm font-medium mb-3">マジックリンクが生成されました</p>
                <p className="text-xs text-gray-500 break-all font-mono bg-white p-2 rounded-lg border border-gray-200">
                  {magicLink}
                </p>
              </div>
              <button
                onClick={copyLink}
                className="w-full py-3 bg-gray-800 text-white rounded-xl font-semibold text-base hover:bg-gray-900 transition-colors"
              >
                {copied ? 'コピーしました！' : 'リンクをコピー'}
              </button>
              <a
                href={magicLink}
                className="block w-full py-3 bg-blue-500 text-white rounded-xl font-semibold text-base text-center hover:bg-blue-600 transition-colors"
              >
                管理画面を開く
              </a>
              <button
                onClick={() => setMagicLink('')}
                className="w-full py-2 text-gray-500 text-sm hover:text-gray-700"
              >
                別のリンクを生成する
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center"><div className="text-gray-400">読み込み中...</div></div>}>
      <LoginForm />
    </Suspense>
  )
}
