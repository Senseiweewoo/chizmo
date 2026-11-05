# Backend Security Practices

Hardened security invariants, authentication architectures, input validation, and defense-in-depth measures.

---

## 1. Authentication & Session Hygiene

1. **Token Transport**:
   - Store authentication JWTs and session identifiers strictly in `httpOnly`, `secure`, `sameSite: 'lax'` cookies.
   - Never store auth tokens in browser `localStorage` or `sessionStorage` (which are vulnerable to XSS exfiltration).
2. **Password Hashing**:
   - Use `bcrypt` with at least 12 salt rounds, or `argon2id` (memory-hard).
   - Reject authentication completely if demo/fallback accounts are accessed in production environments.
3. **Session Revocation**:
   - Maintain a revocable session record in PostgreSQL/Redis or embed short-lived access tokens (15m) with rotating refresh tokens.

---

## 2. Server-Side Authorization & Row-Level Security (RLS)

1. **Never Trust Client-Supplied User IDs**:
   - Derive the requesting `userId` directly from the validated server-side session:
     ```typescript
     const session = await getCurrentSession();
     const userId = session?.userId;
     ```
2. **Resource Ownership Invariant**:
   - Before mutating any entity (`Deck`, `Card`, `Folder`), query its `ownerId` and assert `ownerId === session.userId || session.role === 'ADMIN'`.
   - Never rely on UI route hiding as an authorization barrier.

---

## 3. Input Validation & Injection Defense

1. **Boundary Validation**:
   - Every API endpoint must parse requests through strict Zod / Pydantic schemas before executing business logic.
   - Strip unknown properties (`.strict()` or default zod parsing).
2. **SQL Injection Defense**:
   - Use ORMs (Prisma, Drizzle) or tagged template literals (`prisma.$queryRaw`\``).
   - Strictly prohibit string concatenation in raw queries (`$queryRawUnsafe`).
3. **SSRF Guard**:
   - If an endpoint accepts a URL to ingest (e.g. YouTube, web scrape), validate the protocol (`http:` / `https:`) and resolve the DNS hostname.
   - Reject private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`).

---

## 4. Rate Limiting & Webhook Verification

1. **Sliding-Window Rate Limiting**:
   - Enforce rate limits across auth routes (10 req/min per IP), AI endpoints (20 req/min), and upload routes (15 req/min).
   - Use trusted upstream proxy IP headers (`cf-connecting-ip`, `x-real-ip`, or rightmost `x-forwarded-for`).
2. **Webhook Signature Verification**:
   - Always verify cryptographic signatures (HMAC-SHA256) on raw request byte buffers.
   - Enforce a replay attack tolerance window (e.g. 300 seconds).
   - Fail closed if the webhook secret is missing; never fall back to static or hardcoded secrets.
