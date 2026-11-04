/**
 * SSRF Guard for External Import URLs
 * Prevents Server-Side Request Forgery by rejecting localhost, loopback, private RFC-1918 ranges,
 * and cloud metadata IPs before fetching external content.
 */

export interface SSRFValidationResult {
  safe: boolean;
  error?: string;
  normalizedUrl?: string;
}

export function validateSafeUrl(rawUrl: string): SSRFValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { safe: false, error: 'Invalid URL format' };
  }

  // Enforce HTTP / HTTPS protocol
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, error: `Disallowed protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Loopback and localhost
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.localhost')
  ) {
    return { safe: false, error: 'Access to loopback/local addresses is strictly prohibited.' };
  }

  // AWS / GCP / Azure Instance Metadata Service (IMDS)
  if (
    hostname === '169.254.169.254' ||
    hostname === 'metadata.google.internal' ||
    hostname === 'metadata.internal' ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local')
  ) {
    return { safe: false, error: 'Access to internal metadata services is prohibited.' };
  }

  // Private RFC-1918 IPv4 ranges:
  // 10.0.0.0 - 10.255.255.255
  // 172.16.0.0 - 172.31.255.255
  // 192.168.0.0 - 192.168.255.255
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipMatch = hostname.match(ipv4Regex);
  if (ipMatch) {
    const p0 = parseInt(ipMatch[1], 10);
    const p1 = parseInt(ipMatch[2], 10);

    if (p0 === 10) {
      return { safe: false, error: 'Access to private network range 10.0.0.0/8 is prohibited.' };
    }
    if (p0 === 172 && p1 >= 16 && p1 <= 31) {
      return { safe: false, error: 'Access to private network range 172.16.0.0/12 is prohibited.' };
    }
    if (p0 === 192 && p1 === 168) {
      return { safe: false, error: 'Access to private network range 192.168.0.0/16 is prohibited.' };
    }
    if (p0 === 169 && p1 === 254) {
      return { safe: false, error: 'Access to link-local address range 169.254.0.0/16 is prohibited.' };
    }
  }

  return {
    safe: true,
    normalizedUrl: parsed.toString(),
  };
}