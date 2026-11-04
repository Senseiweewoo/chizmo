import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateMagicBytes } from '../ingestion/magic-bytes.js';
import { validateSafeUrl } from '../ingestion/ssrf-guard.js';
import { cleanExtractedText } from '../ingestion/text-cleaner.js';
import { parseDelimitedCards } from '../ingestion/delimited-parser.js';
import { extractYouTubeVideoId, formatCaptionsWithTimestamps } from '../ingestion/youtube-parser.js';

describe('Content Ingestion Pipeline Utilities Tests', () => {
  it('1. Magic bytes validator detects PDF, ZIP/DOCX/PPTX, PNG, JPEG, and text', () => {
    // PDF signature %PDF-
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
    assert.strictEqual(validateMagicBytes(pdfBytes).detectedType, 'PDF');

    // ZIP signature PK\x03\x04
    const zipBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    assert.strictEqual(validateMagicBytes(zipBytes).detectedType, 'ZIP_OFFICE');

    // PNG signature
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    assert.strictEqual(validateMagicBytes(pngBytes).detectedType, 'PNG');

    // JPEG signature
    const jpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    assert.strictEqual(validateMagicBytes(jpgBytes).detectedType, 'JPEG');

    // Plain text (ASCII)
    const textBytes = new TextEncoder().encode('Cellular respiration notes: glycolysis in cytoplasm.');
    assert.strictEqual(validateMagicBytes(textBytes).detectedType, 'TEXT');
  });

  it('2. SSRF Guard permits safe public URLs and blocks loopback, private IPs, and cloud metadata', () => {
    // Safe public URLs
    assert.strictEqual(validateSafeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ').safe, true);
    assert.strictEqual(validateSafeUrl('https://en.wikipedia.org/wiki/Photosynthesis').safe, true);

    // Blocked: localhost & loopback
    assert.strictEqual(validateSafeUrl('http://localhost:3000/internal').safe, false);
    assert.strictEqual(validateSafeUrl('http://127.0.0.1:8080/admin').safe, false);

    // Blocked: AWS / GCP metadata
    assert.strictEqual(validateSafeUrl('http://169.254.169.254/latest/meta-data').safe, false);
    assert.strictEqual(validateSafeUrl('http://metadata.google.internal/computeMetadata').safe, false);

    // Blocked: Private network ranges (RFC 1918)
    assert.strictEqual(validateSafeUrl('http://10.0.1.5/api').safe, false);
    assert.strictEqual(validateSafeUrl('http://172.20.0.1:5000').safe, false);
    assert.strictEqual(validateSafeUrl('http://192.168.1.1/router').safe, false);

    // Blocked: Disallowed schemes
    assert.strictEqual(validateSafeUrl('file:///etc/passwd').safe, false);
    assert.strictEqual(validateSafeUrl('ftp://example.com/file').safe, false);
  });

  it('3. Text cleaner de-hyphenates line wraps, strips headers, and normalizes unicode', () => {
    const rawScanned = `
Page 1 of 5
The process of photo-
synthesis transforms light energy into chemical energy.
RuBisCO’s primary role is carbon fixation.
Page 1
`;
    const cleaned = cleanExtractedText(rawScanned);
    assert(cleaned.includes('photosynthesis'), 'Should de-hyphenate "photo-\\nsynthesis" to "photosynthesis"');
    assert(cleaned.includes("RuBisCO's"), 'Should normalize curly quote to standard ASCII');
    assert(!cleaned.includes('Page 1 of 5'), 'Should remove running page header');
  });

  it('4. Delimited card parser imports Quizlet/Anki TSV/CSV and strips HTML', () => {
    const tsvData = `
Mitochondria\tPowerhouse of the cell, generating ATP via oxidative phosphorylation.\tBiology Cell
Chloroplast\t<b>Organelle</b> containing thylakoids where photosynthesis occurs.<br>Found in plants.\tPlantBiology
`;
    const result = parseDelimitedCards(tsvData);
    assert.strictEqual(result.totalParsed, 2);
    assert.strictEqual(result.detectedDelimiter, '\t');
    assert.strictEqual(result.cards[0].front, 'Mitochondria');
    assert(!result.cards[1].back.includes('<b>'), 'Should strip HTML tags');
    assert(result.cards[1].back.includes('Organelle'));
  });

  it('5. YouTube parser extracts video IDs and formats timestamps', () => {
    const id1 = extractYouTubeVideoId('https://www.youtube.com/watch?v=0b0xs4j18h8');
    const id2 = extractYouTubeVideoId('https://youtu.be/0b0xs4j18h8?t=42');
    const id3 = extractYouTubeVideoId('https://www.youtube.com/embed/0b0xs4j18h8');

    assert.strictEqual(id1, '0b0xs4j18h8');
    assert.strictEqual(id2, '0b0xs4j18h8');
    assert.strictEqual(id3, '0b0xs4j18h8');

    const formatted = formatCaptionsWithTimestamps([
      { text: 'Introduction to bioenergetics', startSec: 65, durationSec: 10 },
    ]);
    assert.strictEqual(formatted, '[1:05] Introduction to bioenergetics');
  });
});