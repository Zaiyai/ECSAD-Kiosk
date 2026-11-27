import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export const KITCHEN_COOKIE_NAME = 'ecsad_kitchen_session';

function getAuthSecret(): string {
  return process.env.KITCHEN_AUTH_SECRET || 'ecsad-kiosk-session-key-2026';
}

export function getExpectedKitchenCredentials(): {
  email: string;
  passcode: string;
} {
  return {
    email: (process.env.KITCHEN_STAFF_EMAIL || 'kitchen-team@ecsad.local')
      .trim()
      .toLowerCase(),
    passcode: process.env.KITCHEN_STAFF_PASSCODE || 'ecsad2026',
  };
}

export function verifyKitchenCredentials(
  email: string,
  passcode: string
): boolean {
  const expected = getExpectedKitchenCredentials();
  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail === expected.email && passcode === expected.passcode;
}

export function createSignedSessionToken(email: string): string {
  const payload = JSON.stringify({
    email,
    role: 'kitchen',
    iat: Date.now(),
  });
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getAuthSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySignedSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getAuthSecret())
    .update(encoded)
    .digest('base64url');

  try {
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return false;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

    const decoded = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as { role?: string };
    return decoded.role === 'kitchen';
  } catch {
    return false;
  }
}

export async function isKitchenAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(KITCHEN_COOKIE_NAME)?.value;
  return verifySignedSessionToken(token);
}
