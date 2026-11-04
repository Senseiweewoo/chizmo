import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { SubscriptionService } from '@/lib/services/subscription-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const body = await req.json();
    const { plan = 'monthly' } = body;

    // Upgrade user tier in service (sandbox ready)
    const updated = await SubscriptionService.upgradeToPro(userId, plan);

    return NextResponse.json({
      success: true,
      message: 'Successfully upgraded to Chizmo Pro! ⚡',
      entitlements: updated,
      // In production with STRIPE_SECRET_KEY, returns { checkoutUrl: session.url }
      checkoutUrl: '/pricing?upgraded=true',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Checkout failed' },
      { status: 500 }
    );
  }
}
