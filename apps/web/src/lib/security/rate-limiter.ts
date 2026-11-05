/**
 * In-memory & Redis-ready Sliding Window Rate Limiter
 * Guards auth endpoints, AI card generation, and ingestion pipelines against brute-force and DoS.
 */

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory bucket store
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection to prevent memory leaks (runs every 5 minutes)
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 300_000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 300_000);
  (timer as any).unref?.();
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp ms
}

/**
 * Checks and records a request under the sliding window algorithm.
 *
 * @param identifier Unique client ID (e.g., client IP or User ID)
 * @param limit Maximum allowed requests within the time window
 * @param windowMs Duration of the sliding window in milliseconds (default: 60,000ms = 1 min)
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Retain only requests within the current rolling window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0] || now;
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: oldestTimestamp + windowMs,
    };
  }

  // Record this request
  record.timestamps.push(now);

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - record.timestamps.length),
    resetAt: now + windowMs,
  };
}

export interface RateLimitProfile {
  limit: number;
  windowMs: number;
}

/**
 * Rate limit profiles for sensitive system endpoints
 */
export const RateLimitProfiles: Record<'AUTH' | 'AI_GENERATE' | 'INGEST' | 'STANDARD', RateLimitProfile> = {
  // Strictest: 10 attempts per minute (prevents credential stuffing & password brute force)
  AUTH: { limit: 10, windowMs: 60_000 },
  // Strict: 20 generations per minute (prevents LLM token drainage & budget burnout)
  AI_GENERATE: { limit: 20, windowMs: 60_000 },
  // Ingest: 15 uploads per minute (prevents file processing queue saturation)
  INGEST: { limit: 15, windowMs: 60_000 },
  // Standard API: 120 requests per minute
  STANDARD: { limit: 120, windowMs: 60_000 },
};

/**
 * Helper to extract client IP from Next.js request headers
 */
export function getClientIp(req: Request): string {
  // 1. Direct IP attached by Next.js / server framework
  const directIp = (req as any).ip;
  if (directIp) return directIp;

  // 2. Cloudflare or Edge CDN client IP header
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  // 3. X-Real-IP set by trusted upstream reverse proxy
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  // 4. In multi-hop X-Forwarded-For, use the rightmost IP added by the upstream reverse proxy
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map((ip) => ip.trim());
    return ips[ips.length - 1] || ips[0] || '127.0.0.1';
  }

  return '127.0.0.1';
}
