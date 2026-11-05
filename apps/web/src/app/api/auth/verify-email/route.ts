import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chizmo/db';
import { getCurrentSession, setSessionCookie, signSessionToken } from '@/lib/auth/session';
import { verifyEmailVerificationToken } from '@/lib/auth/email-verification';
import { logger } from '@/lib/utils/secure-logger';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.redirect(new URL('/?error=missing_verification_token', req.url));
    }

    const { userId, email } = await verifyEmailVerificationToken(token);

    // Update database record if reachable
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { email },
      });
    } catch {
      logger.info('Database unreached during email verification, proceeding with session token update', { userId });
    }

    // Refresh active session with verified email flag
    const current = await getCurrentSession();
    if (current && current.userId === userId) {
      const refreshedToken = await signSessionToken({
        ...current,
        email,
        emailVerified: true,
      });
      await setSessionCookie(refreshedToken);
    }

    return NextResponse.redirect(new URL('/?verified=true', req.url));
  } catch (error: any) {
    logger.warn('Email verification failed', { error: error.message });
    return NextResponse.redirect(new URL('/?error=invalid_verification_token', req.url));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const { userId, email } = await verifyEmailVerificationToken(token);

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { email },
      });
    } catch {
      logger.info('Database offline, token validated cryptographically', { userId });
    }

    const current = await getCurrentSession();
    if (current && current.userId === userId) {
      const refreshedToken = await signSessionToken({
        ...current,
        email,
        emailVerified: true,
      });
      await setSessionCookie(refreshedToken);
    }

    return NextResponse.json({
      success: true,
      message: 'Email address successfully verified',
      email,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired verification token' },
      { status: 400 }
    );
  }
}
