import crypto from 'crypto';

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Signing key for session tokens. AUTH_SECRET is preferred; when unset we derive
// a stable key from DATABASE_URL so existing deployments keep working without
// new configuration.
function sessionSecret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  return crypto
    .createHash('sha256')
    .update(`hukumpekerja:${process.env.DATABASE_URL ?? ''}`)
    .digest('hex');
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', sessionSecret()).update(payload).digest('hex');
}

/** Creates a `userId.expiresAt.signature` token; verifiable server-side only. */
export function createSessionToken(userId: string): string {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns the userId if the token is valid and unexpired, otherwise null. */
export function verifySessionToken(token: string | null | undefined): string | null {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [userId, expiresAt, signature] = parts;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(userId)) return null;

  const expiresAtNum = Number(expiresAt);
  if (!Number.isFinite(expiresAtNum) || expiresAtNum < Date.now()) return null;

  const expected = Buffer.from(sign(`${userId}.${expiresAt}`));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;

  return userId;
}

/** Extracts the authenticated userId from an Authorization: Bearer header. */
export function getUserIdFromRequest(request: Request): string | null {
  const authorization = request.headers.get('authorization') ?? '';
  const match = /^Bearer (.+)$/.exec(authorization);
  return verifySessionToken(match?.[1]);
}
