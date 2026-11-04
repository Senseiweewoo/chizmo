/**
 * Text Normalizer & Cleaner for Document Parsers
 * Cleans extracted text from PDFs, PPTX, Word, and OCR before card generation.
 */

export function cleanExtractedText(raw: string): string {
  if (!raw) return '';

  let cleaned = raw;

  // 1. Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Normalize smart unicode quotes and dashes
  cleaned = cleaned
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...');

  // 3. De-hyphenate words broken by line wraps (e.g. "photo-\nsynthesis" -> "photosynthesis")
  cleaned = cleaned.replace(/([a-zA-Z]{2,})-\n([a-zA-Z]{2,})/g, '$1$2');

  // 4. Strip common page headers / footers (e.g. "Page 12 of 45", "Page 12")
  cleaned = cleaned.replace(/^[ \t]*Page \d+( of \d+)?[ \t]*$/gim, '');

  // 5. Replace non-printable ASCII control characters (preserving \n and \t)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 6. Collapse excessive consecutive empty lines (> 2 newlines to 2)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 7. Trim leading/trailing whitespace
  return cleaned.trim();
}