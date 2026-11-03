import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chizmo/db';
import { UserSignupSchema } from '@chizmo/core';
import { getCurrentSession, hashPassword, setSessionCookie, signSessionToken } from '@/lib/auth/session';
import { upgradeGuestAccount } from '@/lib/auth/guest';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UserSignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { email, password, displayName, birthYear } = parsed.data;

    // Check if the current user is an existing guest upgrading their account
    const currentSession = await getCurrentSession();
    if (currentSession && currentSession.isGuest) {
      const upgraded = await upgradeGuestAccount(
        currentSession.userId,
        email,
        password,
        displayName,
        birthYear
      );
      return NextResponse.json({
        success: true,
        user: { id: upgraded.id, email: upgraded.email, displayName: upgraded.displayName },
        upgradedFromGuest: true,
      });
    }

    // Direct registration
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        birthYear,
        isGuest: false,
        profile: {
          create: {
            studyGoalMins: 15,
          },
        },
        subscription: {
          create: {
            plan: 'FREE',
            status: 'ACTIVE',
          },
        },
        entitlement: {
          create: {
            dailyGenerationsUsed: 0,
            maxDecks: 50,
            maxUploadMb: 25,
          },
        },
      },
    });

    const token = await signSessionToken({
      userId: user.id,
      isGuest: false,
      email: user.email || undefined,
      displayName: user.displayName,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Signup failed' },
      { status: 500 }
    );
  }
}
