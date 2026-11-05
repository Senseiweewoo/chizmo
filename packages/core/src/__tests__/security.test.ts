import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateMagicBytes,
  validateSafeUrl,
  UserSignupSchema,
  UserLoginSchema,
  CreateDeckSchema,
} from '../index.js';

describe('Security & Input Validation Tests', () => {
  it('1. Zod schemas enforce strict boundary validation on authentication inputs', () => {
    // Missing required fields
    const invalidSignup = UserSignupSchema.safeParse({ email: 'bad-email' });
    assert.strictEqual(invalidSignup.success, false);

    // Password too short (< 8 chars)
    const shortPassword = UserSignupSchema.safeParse({
      email: 'valid@example.com',
      password: '123',
      displayName: 'Alex',
    });
    assert.strictEqual(shortPassword.success, false);

    // Valid registration payload
    const validSignup = UserSignupSchema.safeParse({
      email: 'scholar@example.com',
      password: 'securePassword123!',
      displayName: 'Alex Learner',
      birthYear: 2005,
    });
    assert.strictEqual(validSignup.success, true);
  });

  it('2. SSRF Guard prevents access to localhost, link-local, private IPs, and cloud metadata', () => {
    // Cloud metadata endpoints
    assert.strictEqual(validateSafeUrl('http://169.254.169.254/latest/meta-data/').safe, false);
    // Localhost loopback
    assert.strictEqual(validateSafeUrl('http://127.0.0.1:3000/admin').safe, false);
    assert.strictEqual(validateSafeUrl('http://localhost:8080/').safe, false);
    // Private subnet (RFC 1918)
    assert.strictEqual(validateSafeUrl('http://10.0.0.1/internal').safe, false);
    assert.strictEqual(validateSafeUrl('http://192.168.1.1/router').safe, false);
    // Valid public web article / YouTube
    assert.strictEqual(validateSafeUrl('https://en.wikipedia.org/wiki/Spaced_repetition').safe, true);
    assert.strictEqual(validateSafeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ').safe, true);
  });

  it('3. Magic bytes validation rejects executable binaries and disguised malicious files', () => {
    // Windows PE executable (MZ header: 0x4D, 0x5A)
    const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    const exeResult = validateMagicBytes(exeBytes);
    assert.strictEqual(exeResult.valid, false);

    // ELF executable (0x7F, 'E', 'L', 'F')
    const elfBytes = new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00]);
    const elfResult = validateMagicBytes(elfBytes);
    assert.strictEqual(elfResult.valid, false);

    // Legitimate PDF (0x25, 0x50, 0x44, 0x46: %PDF)
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
    const pdfResult = validateMagicBytes(pdfBytes);
    assert.strictEqual(pdfResult.valid, true);
    assert.strictEqual(pdfResult.detectedType, 'PDF');
  });

  it('4. Deck creation schema enforces title bounds and prevents blank entries', () => {
    const blankDeck = CreateDeckSchema.safeParse({ title: '' });
    assert.strictEqual(blankDeck.success, false);

    const validDeck = CreateDeckSchema.safeParse({
      title: 'Cellular Respiration Biology',
      description: 'AP Bio Chapter 9 study notes',
      visibility: 'PRIVATE',
    });
    assert.strictEqual(validDeck.success, true);
  });
});
