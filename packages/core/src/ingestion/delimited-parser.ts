/**
 * Quizlet & Anki Delimited Card Parser
 * Parses Tab-Separated (TSV), Comma-Separated (CSV), or custom exports into atomic cards.
 */

export interface ParsedImportCard {
  front: string;
  back: string;
  hint?: string;
  tags: string[];
}

export interface ParseImportResult {
  cards: ParsedImportCard[];
  totalParsed: number;
  detectedDelimiter: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}

/**
 * Detect delimiter by counting occurrences on non-empty lines
 */
function detectDelimiter(lines: string[]): string {
  const sample = lines.slice(0, 10);
  let tabCount = 0;
  let commaCount = 0;
  let semiCount = 0;

  for (const line of sample) {
    tabCount += (line.match(/\t/g) || []).length;
    commaCount += (line.match(/,/g) || []).length;
    semiCount += (line.match(/;/g) || []).length;
  }

  if (tabCount >= commaCount && tabCount >= semiCount && tabCount > 0) return '\t';
  if (semiCount > commaCount && semiCount > 0) return ';';
  return ',';
}

export function parseDelimitedCards(rawContent: string, explicitDelimiter?: string): ParseImportResult {
  const lines = rawContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#')); // filter comments

  if (lines.length === 0) {
    return { cards: [], totalParsed: 0, detectedDelimiter: explicitDelimiter || '\t' };
  }

  const delimiter = explicitDelimiter || detectDelimiter(lines);
  const cards: ParsedImportCard[] = [];

  for (const line of lines) {
    const parts = line.split(delimiter).map((p) => stripHtml(p.trim()));

    if (parts.length >= 2) {
      const front = parts[0];
      const back = parts[1];
      const tagStr = parts.length >= 3 ? parts[2] : '';
      const tags = tagStr
        ? tagStr.split(/\s+/).map((t) => t.trim()).filter(Boolean)
        : ['Imported'];

      if (front.length > 0 && back.length > 0) {
        cards.push({
          front,
          back,
          tags,
        });
      }
    }
  }

  return {
    cards,
    totalParsed: cards.length,
    detectedDelimiter: delimiter,
  };
}