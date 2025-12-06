import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { callHuggingFace } from '../../../lib/server-utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[API analyze] received body keys', Object.keys(body || {}))
    const { text } = body
    if (!text) return NextResponse.json({ error: 'Missing text in body' }, { status: 400 })

    const prompt = `You are a medical report analyzer. Analyze the following medical report and return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "summary": "A 3-5 sentence clinical summary of the key findings and patient status",
  "abnormalities": {
    "CBC": ["complete blood count abnormalities with medical significance"],
    "LFT": ["liver function test abnormalities"],
    "KFT": ["kidney function test abnormalities"],
    "Other": ["other significant findings like inflammation markers, electrolytes, etc"]
  },
  "suggestions": [
    "recommended follow-up tests",
    "possible diagnostic directions",
    "urgent care recommendations if applicable"
  ]
}

MEDICAL REPORT:
${text}

Return ONLY the JSON object, no other text.`

    console.log('[API analyze] calling Mistral-7B model')
    let hf
    try {
      hf = await callHuggingFace(prompt)
      console.log('[API analyze] Mistral response received', typeof hf === 'string' ? hf.slice(0, 500) : hf)
    } catch (hfErr: any) {
      console.warn('[API analyze] Mistral call failed, using fallback analysis', hfErr?.message || hfErr)
      const summary = text.trim().slice(0, 800) + (text.length > 800 ? '...' : '')
      return NextResponse.json({
        summary,
        abnormalities: {
          CBC: [],
          LFT: [],
          KFT: [],
          Other: ['Unable to perform AI analysis; displaying extracted text above.']
        },
        suggestions: ['Please upload a valid medical report for full AI analysis.']
      })
    }

    let raw: string = ''
    if (typeof hf === 'string') raw = hf
    else if (Array.isArray(hf) && hf[0]?.generated_text) raw = hf[0].generated_text
    else if (hf?.generated_text) raw = hf.generated_text
    else raw = JSON.stringify(hf)

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.summary && parsed.abnormalities && parsed.suggestions) {
          return NextResponse.json(parsed)
        }
      } catch (parseErr) {
        console.warn('[API analyze] JSON parse failed, attempting cleanup')
      }
    }

    console.warn('[API analyze] Could not extract valid JSON, using fallback')
    return NextResponse.json({
      summary: raw.slice(0, 500),
      abnormalities: { CBC: [], LFT: [], KFT: [], Other: [raw.slice(500, 800)] },
      suggestions: ['Model response could not be fully parsed.']
    })
  } catch (err: any) {
    console.error('[API analyze] error', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
