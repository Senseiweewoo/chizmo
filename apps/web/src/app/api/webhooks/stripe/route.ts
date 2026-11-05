import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@chizmo/db';
import { logger } from '@/lib/utils/secure-logger';

export const dynamic = 'force-dynamic';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const TOLERANCE_SECONDS = 300; // 5 minute replay window

/**
 * Verifies Stripe HMAC-SHA256 signature against the raw body buffer
 */
function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  try {
    const parts = signatureHeader.split(',');
    let timestamp = '';
    const signatures: string[] = [];

    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      if (key === 't') timestamp = value;
      if (key === 'v1') signatures.push(value);
    }

    if (!timestamp || signatures.length === 0) {
      return false;
    }

    // Guard against replay attacks
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const eventTimestamp = parseInt(timestamp, 10);
    if (isNaN(eventTimestamp) || Math.abs(currentTimestamp - eventTimestamp) > TOLERANCE_SECONDS) {
      logger.warn('Stripe webhook timestamp outside tolerance window', { eventTimestamp, currentTimestamp });
      return false;
    }

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    // Constant-time comparison against any provided v1 signatures
    for (const sig of signatures) {
      const sigBuffer = Buffer.from(sig, 'hex');
      if (sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        return true;
      }
    }

    return false;
  } catch (err: any) {
    logger.error('Error during webhook signature verification', { error: err.message });
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const secret = STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      logger.error('STRIPE_WEBHOOK_SECRET is not configured on the server');
      return NextResponse.json(
        { success: false, error: 'Webhook service misconfigured' },
        { status: 500 }
      );
    }
    const isValid = verifyStripeSignature(rawBody, signature, secret);

    if (!isValid) {
      logger.warn('Unauthorized Stripe webhook attempt detected: invalid signature');
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    logger.info(`Received verified Stripe webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const clientReferenceId = session.client_reference_id;

        if (clientReferenceId) {
          try {
            await prisma.subscription.upsert({
              where: { userId: clientReferenceId },
              update: {
                stripeCustomerId: customerId,
                status: 'ACTIVE',
                plan: 'PRO',
              },
              create: {
                userId: clientReferenceId,
                stripeCustomerId: customerId,
                status: 'ACTIVE',
                plan: 'PRO',
              },
            });
          } catch {
            logger.info('DB offline during subscription upgrade event', { clientReferenceId });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        try {
          const userSub = await prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
          });

          if (userSub) {
            await prisma.subscription.update({
              where: { id: userSub.id },
              data: {
                status: 'CANCELED',
                plan: 'FREE',
              },
            });
          }
        } catch {
          logger.info('DB offline during subscription cancellation event', { customerId });
        }
        break;
      }

      default:
        // Acknowledge unhandled events cleanly
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error('Failed to process Stripe webhook', { error: error.message });
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
