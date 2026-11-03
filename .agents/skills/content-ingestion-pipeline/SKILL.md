---
name: content-ingestion-pipeline
description: >-
  Build the "import anything" pipeline for a study app that turns PDFs, PowerPoints, Word files, YouTube links, audio, photos of notes, web articles, and Quizlet/Anki exports into clean text ready for flashcard generation. Use this skill whenever the user needs file upload handling, text extraction, OCR, YouTube transcripts, speech-to-text, chunking, background jobs for ingestion, or importing Quizlet/Anki decks, even if they only mention one file type.
---

# Content Ingestion Pipeline

Shape: `source -> validate -> extract -> clean -> chunk -> (hand off to ai-card-generation) -> save`. Each step is an idempotent background job that updates `Source.status` so the UI can show real progress and recover from failure.

## Status machine
`pending -> extracting -> generating -> review -> ready` or `failed` (store `error` with a user-readable reason). Notify the user (push/email/in-app) when done so they can leave.

## Upload safety
- Direct-to-bucket uploads with signed URLs; never stream large files through the web server.
- Validate by magic bytes, not extension; enforce size and page limits per plan (free: smaller).
- Add a virus-scan hook before extraction; sandbox parsers (worker container, no network, CPU/memory limits) because document parsers have a history of vulnerabilities.
- Rate-limit per user; reject encrypted PDFs with a clear message.

## Extractors by type
| Source | Approach | Gotchas |
|---|---|---|
| PDF | Text layer first (pdfjs/pdf-parse or PyMuPDF); if a page has little text, OCR it | Columns and footers; strip repeated headers/footers; keep page numbers for `sourceRef` |
| PPTX | Unzip, read slide XML: titles, body, notes, image alt text | Order by slide number; speaker notes are gold |
| DOCX | mammoth or python-docx; keep heading hierarchy | Tables to markdown |
| Image / photo | OCR (Tesseract or a vision LLM for handwriting) | Deskew, contrast; show the user the OCR text to correct |
| YouTube | Fetch captions; fall back to downloading audio and running speech-to-text | Respect the platform's terms; some videos have no transcript; chunk by chapters/timestamps |
| Audio | Speech-to-text with timestamps; diarization optional | Long files: split into 10-min segments |
| Web URL | Readability extraction | Block private IP ranges (SSRF) and cap response size |
| Quizlet/Anki | CSV/TSV (term, definition) or `.apkg` (a zip containing a SQLite DB + media) | Map fields, strip HTML, keep media; offer to preserve or reset progress |

## Cleaning
Normalize whitespace and unicode, de-hyphenate line-break splits, remove page furniture, detect language, and drop near-empty chunks. Preserve structure (headings, lists) as lightweight markdown; the chunker and the model both use it.

## Chunking
Split on structure first (headings, slides, chapters), then by token size (~800-1,500) with small overlap. Each chunk keeps `{sourceId, page|slide|startSec, headingPath}` so cards can cite it.

## Generation settings step
Before running generation, let the user choose: card count (auto/small/medium/large), difficulty, language, card styles, and whether to also create a summary. Show estimated time and, for free users, how many generations remain.

## Quizlet/Anki import wizard
Upload file or paste export -> preview first 10 cards -> map columns -> choose destination deck -> import. Do not scrape Quizlet pages; use user-provided exports. Describe feature comparisons honestly and verifiably.

## Reliability
- Idempotency key per job; safe to retry. Exponential backoff; dead-letter queue.
- Persist extracted text so regenerating cards doesn't re-run OCR/transcription.
- Cache by file hash to skip duplicate work.
- Emit metrics: time per stage, failure rate by file type, cost per source.

## Tests
Fixtures for a text PDF, a scanned PDF, a PPTX with notes, a video with and without captions, a malformed file, an oversized file, and a corrupt `.apkg`. Assert friendly errors for each failure.
