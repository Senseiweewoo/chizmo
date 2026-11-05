import { SignJWT, jwtVerify } from 'jose';

const EMAIL_VERIFY_SECRET = new TextEncoder().encode(
  process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET || 'chizmo-email-verification-secret-key-32'
);

/**
 * Generate a cryptographically signed email verification token (valid for 24h)
 */
export async function createEmailVerificationToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email, purpose: 'email_verification' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(EMAIL_VERIFY_SECRET);
}

/**
 * Verify email verification token
 */
export async function verifyEmailVerificationToken(token: string): Promise<{ userId: string; email: string }> {
  const { payload } = await jwtVerify(token, EMAIL_VERIFY_SECRET);
  if (payload.purpose !== 'email_verification' || !payload.userId || !payload.email) {
    throw new Error('Invalid token purpose');
  }
  return {
    userId: payload.userId as string,
    email: payload.email as string,
  };
}
