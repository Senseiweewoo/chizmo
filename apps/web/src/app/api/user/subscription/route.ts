import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { SubscriptionService } from '@/lib/services/subscription-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const entitlements = await SubscriptionService.getEntitlements(userId);

    return NextResponse.json({
      success: true,
      entitlements,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
