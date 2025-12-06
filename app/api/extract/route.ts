import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Offline-first PDF extraction route
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const base64 = body?.data || body?.file || body?.base64
    const filename = body?.filename
    const mimeType = body?.mimeType || ''

    if (!base64 || typeof base64 !== 'string') {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    // Decode base64 to Buffer
    const pdfBuffer = Buffer.from(base64.replace(/^data:.*;base64,/, ''), 'base64')

    // Basic file type check
    if (mimeType && !mimeType.includes('pdf') && !(filename && filename.toLowerCase().endsWith('.pdf'))) {
      return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 })
    }

    // Require pdf-parse (primary)
    let pdfParse: any
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      pdfParse = require('pdf-parse')
    } catch (e) {
      pdfParse = null
    }

    const attemptErrors: string[] = []

    // Helper to run pdf-parse with timeout
    const runPdfParse = (opts: any, t = 20000) => {
      if (!pdfParse) return Promise.reject(new Error('pdf-parse not available'))
      return Promise.race([
        pdfParse(pdfBuffer, opts),
        new Promise((_, rej) => setTimeout(() => rej(new Error('pdf-parse timeout')), t))
      ])
    }

    if (pdfParse) {
      const parseStrategies = [{ max: 0, version: 'v2' }, { max: 0 }, undefined]
      let parsedData: any = null
      for (const strat of parseStrategies) {
        try {
          // eslint-disable-next-line no-await-in-loop
          parsedData = await runPdfParse(strat, 20000)
          console.log('[API extract] pdf-parse succeeded with strategy', strat)
          break
        } catch (err: any) {
          const msg = err?.message || String(err)
          attemptErrors.push(`pdf-parse(${JSON.stringify(strat)}): ${msg}`)
          console.warn('[API extract] pdf-parse attempt failed', strat, msg)
        }
      }

      if (parsedData) {
        try {
          const extractedText = (parsedData && parsedData.text) || ''
          const trimmedText = extractedText.trim()
          if (trimmedText && trimmedText.length > 0) {
            console.log('[API extract] extracted', trimmedText.length, 'characters via pdf-parse')
            return NextResponse.json({ text: trimmedText })
          }
          console.warn('[API extract] pdf-parse returned no text')
          return NextResponse.json({ text: 'Scanned PDF detected. OCR is disabled because the app is running in offline mode.' })
        } catch (err: any) {
          attemptErrors.push(`pdf-parse(process): ${err?.message || String(err)}`)
        }
      }
    } else {
      attemptErrors.push('pdf-parse not available')
    }

    console.warn('[API extract] pdf-parse failed all strategies')

    // Try pdf2json fallback
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const PDFParser = require('pdf2json')
      const parser = new PDFParser()
      const resultText: string = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('pdf2json parse timeout')), 20000)
        parser.on('pdfParser_dataReady', (data: any) => {
          clearTimeout(timeout)
          try {
            let fullText = ''
            if (data?.Pages && Array.isArray(data.Pages)) {
              for (const page of data.Pages) {
                if (page.Texts && Array.isArray(page.Texts)) {
                  for (const textBlock of page.Texts) {
                    if (textBlock.R && Array.isArray(textBlock.R)) {
                      for (const run of textBlock.R) {
                        if (run.T) {
                          fullText += decodeURIComponent(run.T)
                        }
                      }
                    }
                  }
                }
              }
            }
            resolve(fullText.trim())
          } catch (e) {
            reject(e)
          }
        })
        parser.on('pdfParser_dataError', (err: any) => {
          clearTimeout(timeout)
          reject(err)
        })
        try {
          parser.parseBuffer(pdfBuffer)
        } catch (e) {
          clearTimeout(timeout)
          reject(e)
        }
      })

      if (resultText && resultText.length > 0) {
        console.log('[API extract] extracted via pdf2json, length:', resultText.length)
        return NextResponse.json({ text: resultText })
      }
      console.warn('[API extract] pdf2json returned no text')
      return NextResponse.json({ text: 'Scanned PDF detected. OCR is disabled because the app is running in offline mode.' })
    } catch (e: any) {
      const details = attemptErrors.concat([String(e?.message || e)]).join(' | ')
      console.error('[API extract] pdf2json failed:', e?.message || e, e)
      return NextResponse.json({ error: 'Failed to extract PDF. File may be corrupted or in an unsupported format.', details }, { status: 400 })
    }
  } catch (err: any) {
    console.error('[API extract] unhandled error:', err?.message || err)
    return NextResponse.json({ error: `Extraction failed: ${err?.message || 'Unknown error'}` }, { status: 500 })
  }
}
