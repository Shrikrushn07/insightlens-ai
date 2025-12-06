'use client'
import React, { useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExtract = async (text: string) => {
    console.log('[Home] received extracted text length', text?.length)
    setError(null)
    setAnalyzing(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      const raw = await res.text()
      console.log('[Home] /api/analyze raw response:', raw)
      if (!res.ok) throw new Error(raw || 'Analysis failed')
      const json = JSON.parse(raw)
      sessionStorage.setItem('insightlens_analysis', JSON.stringify(json))
      console.log('[Home] saved analysis to sessionStorage:', sessionStorage.getItem('insightlens_analysis'))
      router.push('/result')
    } catch (e: any) {
      console.error('[Home] analyze error', e)
      setError(e?.message || 'Unknown error')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
        <Dropzone onExtract={handleExtract} />
      </div>

      {analyzing && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 flex items-center gap-3">
          <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse" />
          <p className="text-indigo-700 font-medium">Analyzing with Mistral-7B AI model...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <p className="text-red-800"><strong>Error:</strong> {error}</p>
        </div>
      )}

      <button
        onClick={() => router.push('/result')}
        className="w-full px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
      >
        View Previous Result
      </button>
    </div>
  )
}
