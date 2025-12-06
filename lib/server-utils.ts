import fs from 'fs'
import path from 'path'
import axios from 'axios'

export function bufferFromBase64(b64: string) {
  return Buffer.from(b64, 'base64')
}

export async function callHuggingFace(prompt: string) {
  const key = process.env.HF_API_KEY
  if (!key) throw new Error('Missing HF_API_KEY environment variable')

  const model = process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct'

  const url = `https://api-inference.huggingface.co/models/${model}`
  console.log('[server-utils] calling HF model', model)

  const resp = await axios.post(
    url,
    { inputs: prompt },
    { headers: { Authorization: `Bearer ${key}` }, timeout: 120000 }
  )
  console.log('[server-utils] HF status', resp.status)
  return resp.data
}

export function writeTmpFile(filename: string, buf: Buffer) {
  const tmp = path.join('/tmp', filename)
  fs.writeFileSync(tmp, buf)
  return tmp
}
