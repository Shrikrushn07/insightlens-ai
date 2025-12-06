'use client'
import React, { useCallback, useRef, useState } from 'react'

type Props = {
  onExtract: (text: string) => void
}

export default function Dropzone({ onExtract }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const openPicker = () => {
    console.log('[Dropzone] openPicker called')
    inputRef.current?.click()
  }

  const handleFile = useCallback(async (file: File) => {
    console.log('[Dropzone] handleFile', file.name, file.type, file.size)
    setError(null)
    setLoading(true)
    setFileName(file.name)
    try {
      const reader = new FileReader()
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.onload = () => resolve(String(reader.result))
        reader.readAsDataURL(file)
      })

      const parts = dataUrl.split(',')
      if (parts.length !== 2) throw new Error('Unexpected file encoding')
      const mimeMatch = parts[0].match(/data:(.*);base64/)
      const mimeType = mimeMatch ? mimeMatch[1] : file.type || 'application/octet-stream'
      const base64 = parts[1]
      console.log('[Dropzone] sending to /api/extract', { filename: file.name, mimeType, sizeBase64: base64.length })

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, mimeType, data: base64 })
      })

      const textOrError = await res.text()
      console.log('[Dropzone] /api/extract response raw:', textOrError)
      if (!res.ok) throw new Error(textOrError || 'Extraction failed')
      const json = JSON.parse(textOrError)
      if (!json?.text) throw new Error('No text extracted')
      console.log('[Dropzone] extracted text length', json.text?.length)
      onExtract(json.text)
    } catch (e: any) {
      console.error('[Dropzone] error', e)
      setError(e?.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [onExtract])

  const onDrop: React.DragEventHandler = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  return (
    <div>
      <div
        onClick={openPicker}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50 shadow-md'
            : 'border-slate-300 bg-white hover:border-indigo-400 hover:shadow-md'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openPicker() }}
      >
        <svg className="w-12 h-12 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
        <p className="text-lg font-semibold text-slate-700 mb-2">Upload Medical Report</p>
        <p className="text-slate-500">Drag & drop a PDF or image here, or click to select</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      <div className="mt-6">
        {loading && <div className="flex items-center gap-2"><div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" /><p className="text-sm text-indigo-600">Extracting text...</p></div>}
        {fileName && <p className="text-sm text-slate-600">File: <span className="font-semibold text-slate-900">{fileName}</span></p>}
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
      </div>
    </div>
  )
}
