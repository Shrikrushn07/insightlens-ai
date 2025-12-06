import '../styles/globals.css'
import React from 'react'

export const metadata = {
  title: 'Medical Report Analyzer',
  description: 'AI-powered medical report analysis with Mistral-7B'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-6 py-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Medical Report Analyzer
              </h1>
              <p className="text-slate-600 text-base mt-2">
                Advanced AI-powered analysis powered by Mistral-7B
              </p>
            </div>
          </header>
          <main className="flex-1">
            <div className="max-w-6xl mx-auto px-6 py-12">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
