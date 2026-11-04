/**
 * Magic Bytes Validator for Secure Direct File Uploads
 * Verifies actual binary file signatures instead of trusting client-reported MIME types or extensions.
 */

export interface MagicByteValidation {
  valid: boolean;
  detectedType: 'PDF' | 'ZIP_OFFICE' | 'PNG' | 'JPEG' | 'WEBP' | 'AUDIO_MP3' | 'AUDIO_WAV' | 'TEXT' | 'UNKNOWN';
  mimeType: string;
}

export function validateMagicBytes(bytes: Uint8Array): MagicByteValidation {
  if (!bytes || bytes.length === 0) {
    return { valid: false, detectedType: 'UNKNOWN', mimeType: 'application/octet-stream' };
  }

  // PDF: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return { valid: true, detectedType: 'PDF', mimeType: 'application/pdf' };
  }

  // ZIP / DOCX / PPTX: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  ) {
    return { valid: true, detectedType: 'ZIP_OFFICE', mimeType: 'application/zip' };
  }

  // PNG: \x89PNG\r\n\x1a\n (0x89, 0x50, 0x4E, 0x47)
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { valid: true, detectedType: 'PNG', mimeType: 'image/png' };
  }

  // JPEG: 0xFF, 0xD8, 0xFF
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { valid: true, detectedType: 'JPEG', mimeType: 'image/jpeg' };
  }

  // WEBP: RIFF....WEBP (0x52, 0x49, 0x46, 0x46 at 0, 0x57, 0x45, 0x42, 0x50 at 8)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { valid: true, detectedType: 'WEBP', mimeType: 'image/webp' };
  }

  // MP3: ID3 tag or frame sync (0xFF, 0xFB)
  if (
    (bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
    (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  ) {
    return { valid: true, detectedType: 'AUDIO_MP3', mimeType: 'audio/mpeg' };
  }

  // WAV: RIFF....WAVE
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
  ) {
    return { valid: true, detectedType: 'AUDIO_WAV', mimeType: 'audio/wav' };
  }

  // Plain Text check: inspect first 512 bytes for binary null bytes
  const sampleLength = Math.min(bytes.length, 512);
  let isBinary = false;
  for (let i = 0; i < sampleLength; i++) {
    if (bytes[i] === 0) {
      isBinary = true;
      break;
    }
  }

  if (!isBinary) {
    return { valid: true, detectedType: 'TEXT', mimeType: 'text/plain' };
  }

  return { valid: false, detectedType: 'UNKNOWN', mimeType: 'application/octet-stream' };
}