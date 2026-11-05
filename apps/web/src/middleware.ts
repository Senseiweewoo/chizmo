import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { checkRateLimit, RateLimitProfiles, RateLimitProfile, getClientIp } from './lib/security/rate-limiter';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'chizmo-super-secure-default-jwt-secret-key-32-chars';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = 'chizmo_session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const clientIp = getClientIp(req);

  // 1. Rate Limiting on API Endpoints
  if (pathname.startsWith('/api/')) {
    let profile: RateLimitProfile = RateLimitProfiles.STANDARD;

    if (pathname.startsWith('/api/auth/')) {
      profile = RateLimitProfiles.AUTH;
    } else if (pathname.startsWith('/api/ai/')) {
      profile = RateLimitProfiles.AI_GENERATE;
    } else if (pathname.startsWith('/api/ingest/')) {
      profile = RateLimitProfiles.INGEST;
    }

    const rateResult = checkRateLimit(`${clientIp}:${pathname.split('/')[2] || 'api'}`, profile.limit, profile.windowMs);

    if (!rateResult.allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateResult.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please wait before making further requests.',
          retryAfter: retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Limit': String(rateResult.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(rateResult.resetAt / 1000)),
          },
        }
      );
    }
  }

  // 2. Protect Admin Routes & Admin APIs
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const token = req.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/', req.url);
      loginUrl.searchParams.set('authRequired', 'admin');
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = (payload as any).role;

      if (role !== 'ADMIN') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { success: false, error: 'Forbidden: Admin access required' },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL('/', req.url));
      }
    } catch {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired session token' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  const response = NextResponse.next();

  // Enforce defense-in-depth security headers dynamically
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
  ],
};
