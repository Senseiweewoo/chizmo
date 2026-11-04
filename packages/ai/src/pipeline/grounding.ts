/**
 * Grounding Quote Verification Pass
 * Verifies that each generated card's source citation actually appears in the source text.
 */

export interface GroundingResult {
  isGrounded: boolean;
  confidence: number; // 0.0 to 1.0
  matchedQuote?: string;
  flag?: string;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verify whether a quoted source citation is present in the source text
 */
export function verifyCardGrounding(quote: string | undefined, sourceText: string): GroundingResult {
  if (!quote || quote.trim().length === 0) {
    return {
      isGrounded: false,
      confidence: 0,
      flag: 'Missing source citation quote',
    };
  }

  const cleanQuote = quote.trim();
  const lowerSource = sourceText.toLowerCase();
  const lowerQuote = cleanQuote.toLowerCase();

  // 1. Direct case-insensitive substring match
  if (lowerSource.includes(lowerQuote)) {
    return {
      isGrounded: true,
      confidence: 1.0,
      matchedQuote: cleanQuote,
    };
  }

  // 2. Normalized alphanumeric match
  const normSource = normalize(sourceText);
  const normQuote = normalize(cleanQuote);

  if (normSource.includes(normQuote)) {
    return {
      isGrounded: true,
      confidence: 0.95,
      matchedQuote: cleanQuote,
    };
  }

  // 3. Token-level Jaccard overlap (handles minor paraphrase or OCR jitter)
  const quoteTokens = new Set(normQuote.split(' ').filter((w) => w.length > 2));
  if (quoteTokens.size === 0) {
    return { isGrounded: false, confidence: 0, flag: 'Quote too short or empty' };
  }

  const sourceTokens = new Set(normSource.split(' ').filter((w) => w.length > 2));
  let matchCount = 0;
  for (const t of quoteTokens) {
    if (sourceTokens.has(t)) matchCount++;
  }

  const overlapRatio = matchCount / quoteTokens.size;

  if (overlapRatio >= 0.75) {
    return {
      isGrounded: true,
      confidence: Number(overlapRatio.toFixed(2)),
      matchedQuote: cleanQuote,
    };
  }

  return {
    isGrounded: false,
    confidence: Number(overlapRatio.toFixed(2)),
    flag: 'Quote not found in source material',
  };
}