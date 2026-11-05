/**
 * Secure Logger Utility
 * Sanitizes and redacts credentials, JWT tokens, session IDs, passwords, and PII from server logs.
 */

const REDACTED = '[REDACTED]';

const SENSITIVE_KEY_PATTERNS = [
  /pass(word)?/i,
  /secret/i,
  /token/i,
  /auth(orization)?/i,
  /cookie/i,
  /key/i,
  /credit/i,
  /card/i,
  /cvv/i,
  /ssn/i,
  /pin/i,
];

/**
 * Mask email address: j***e@example.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `**@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Redact sensitive keys from plain objects or arrays recursively
 */
export function sanitizeLogData(data: unknown, depth = 0): unknown {
  if (depth > 5) return '[MAX_DEPTH_REACHED]';
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Redact JWT patterns (header.payload.signature)
    let sanitized = data.replace(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT]');
    // Redact Bearer tokens
    sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED_TOKEN]');
    return sanitized;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, depth + 1));
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: sanitizeLogData(data.message, depth + 1),
      stack: sanitizeLogData(data.stack, depth + 1),
    };
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  if (data instanceof RegExp) {
    return data.toString();
  }

  const sanitizedObj: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitive) {
      sanitizedObj[key] = REDACTED;
    } else if (key.toLowerCase() === 'email' && typeof val === 'string') {
      sanitizedObj[key] = maskEmail(val);
    } else {
      sanitizedObj[key] = sanitizeLogData(val, depth + 1);
    }
  }

  return sanitizedObj;
}

function safeStringify(data: unknown): string {
  try {
    return JSON.stringify(sanitizeLogData(data));
  } catch {
    return String(data);
  }
}

export const logger = {
  info: (message: string, context?: unknown) => {
    if (context !== undefined) {
      console.log(`[INFO] ${message}`, safeStringify(context));
    } else {
      console.log(`[INFO] ${message}`);
    }
  },
  warn: (message: string, context?: unknown) => {
    if (context !== undefined) {
      console.warn(`[WARN] ${message}`, safeStringify(context));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },
  error: (message: string, context?: unknown) => {
    if (context !== undefined) {
      console.error(`[ERROR] ${message}`, safeStringify(context));
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },
  debug: (message: string, context?: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      if (context !== undefined) {
        console.debug(`[DEBUG] ${message}`, safeStringify(context));
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  },
};
