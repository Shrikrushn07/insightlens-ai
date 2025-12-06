# Medical Report Analyzer

Next.js 14 App Router application to upload PDF/images, extract text, and analyze medical reports using free AI inference (HuggingFace free tier).

Features:
- Upload PDF or image (client-side) with drag & drop
- Server-side text extraction using `pdf-parse` and `tesseract.js`
- Analysis via HuggingFace Inference API (free models)
- Results shown on a dedicated `/result` page

Requirements:
- Node 18+ (Codespace default)
- A free HuggingFace API token (set `HF_API_KEY` environment variable)

Quick setup:

```bash
cd /workspaces/insightlens-ai
npm install
export HF_API_KEY="hf_xxx_your_token_here"
npm run dev
```

By default the app uses the HuggingFace model `google/flan-t5-large`. To change it set `HF_MODEL` env var to another HF model id.

Notes:
- Files are processed temporarily; extracted text is returned and files are placed in `/tmp` during OCR.
- This project uses only free services; HuggingFace has a free tier but requires an account.
# insightlens-ai
AI-powered file analyzer (Next.js + Free AI Models)
