/**
 * Text Chunker for Study Material
 * Splits long study texts into semantically coherent chunks based on headings,
 * paragraphs, and token budgets so generated cards are distributed evenly.
 */

export interface TextChunk {
  id: string;
  index: number;
  text: string;
  charStart: number;
  charEnd: number;
  heading?: string;
}

export interface ChunkerOptions {
  maxChunkChars?: number; // default ~4000 (~1000 tokens)
  overlapChars?: number;  // default ~200 chars
}

export function chunkStudyText(text: string, options: ChunkerOptions = {}): TextChunk[] {
  const maxChars = options.maxChunkChars || 4000;
  const overlap = options.overlapChars || 200;

  const trimmed = text.trim();
  if (trimmed.length === 0) return [];

  // If text fits within single chunk
  if (trimmed.length <= maxChars) {
    return [
      {
        id: 'chunk-0',
        index: 0,
        text: trimmed,
        charStart: 0,
        charEnd: trimmed.length,
      },
    ];
  }

  // Split text by markdown headings or double newlines
  const paragraphs = trimmed.split(/(?=\n#{1,4}\s+)|\n\n+/);
  const chunks: TextChunk[] = [];
  let currentText = '';
  let currentStart = 0;
  let currentHeading: string | undefined;

  for (const para of paragraphs) {
    const headingMatch = para.match(/^(#{1,4})\s+(.+)$/m);
    if (headingMatch) {
      currentHeading = headingMatch[2].trim();
    }

    if (currentText.length + para.length > maxChars && currentText.length > 0) {
      chunks.push({
        id: `chunk-${chunks.length}`,
        index: chunks.length,
        text: currentText.trim(),
        charStart: currentStart,
        charEnd: currentStart + currentText.length,
        heading: currentHeading,
      });

      // Retain overlap from end of currentText
      const overlapStart = Math.max(0, currentText.length - overlap);
      const overlapText = currentText.slice(overlapStart);
      currentStart += currentText.length - overlapText.length;
      currentText = overlapText + '\n\n' + para;
    } else {
      currentText = currentText ? currentText + '\n\n' + para : para;
    }
  }

  if (currentText.trim().length > 0) {
    chunks.push({
      id: `chunk-${chunks.length}`,
      index: chunks.length,
      text: currentText.trim(),
      charStart: currentStart,
      charEnd: currentStart + currentText.length,
      heading: currentHeading,
    });
  }

  return chunks;
}