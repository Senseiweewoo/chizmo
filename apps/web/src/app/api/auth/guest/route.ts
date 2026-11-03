import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { getOrCreateGuestSession } from '@/lib/auth/guest';

export async function POST() {
  try {
    const existing = await getCurrentSession();
    if (existing) {
      return NextResponse.json({ success: true, session: existing });
    }

    const { userId, token } = await getOrCreateGuestSession();
    return NextResponse.json({
      success: true,
      session: { userId, isGuest: true, displayName: `Scholar_${userId.slice(-4)}` },
      token,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initialize guest session' },
      { status: 500 }
    );
  }
}
