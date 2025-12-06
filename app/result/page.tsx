'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Analysis = {
  summary?: string
  abnormalities?: {
    CBC?: string[]
    LFT?: string[]
    KFT?: string[]
    Other?: string[]
  }
  suggestions?: string[]
  raw?: any
}

export default function ResultPage() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('insightlens_analysis')
    if (!raw) return
    try {
      setAnalysis(JSON.parse(raw))
    } catch {
      setAnalysis({ raw })
    }
  }, [])

  if (!analysis) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
        <p className="text-slate-600">No analysis found. Please upload a report first.</p>
        <button
          className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          onClick={() => router.push('/')}
        >
          Go Back
        </button>
      </div>
    )
  }

  const renderAbnormalities = () => {
    const abn = analysis.abnormalities
    if (!abn) return null

    const categories = [
      { key: 'CBC' as const, label: 'Complete Blood Count' },
      { key: 'LFT' as const, label: 'Liver Function Tests' },
      { key: 'KFT' as const, label: 'Kidney Function Tests' },
      { key: 'Other' as const, label: 'Other Findings' }
    ]

    return (
      <div className="space-y-4">
        {categories.map(({ key, label }) => {
          const items = abn[key] || []
          if (items.length === 0) return null
          return (
            <div key={key} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-semibold text-slate-700 mb-2">{label}</h4>
              <ul className="space-y-1">
                {items.map((item, idx) => (
                  <li key={idx} className="text-slate-600 text-sm flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 border border-indigo-200 shadow-sm">
        <h2 className="text-2xl font-bold text-indigo-900 mb-4">Clinical Summary</h2>
        <p className="text-indigo-800 leading-relaxed text-lg">{analysis.summary || 'No summary available.'}</p>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Findings & Abnormalities</h2>
        {renderAbnormalities()}
        {!analysis.abnormalities && <p className="text-slate-600">No abnormalities recorded.</p>}
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Recommendations</h2>
        <ul className="space-y-3">
          {(analysis.suggestions || []).map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <span className="text-indigo-600 font-bold mt-0.5">→</span>
              <span className="text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-4">
        <button
          className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          onClick={() => router.push('/')}
        >
          Analyze Another Report
        </button>
        <button
          className="px-6 py-4 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
          onClick={() => window.print()}
        >
          Print Results
        </button>
      </div>
    </div>
  )
}
