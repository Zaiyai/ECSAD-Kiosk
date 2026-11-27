import { NextRequest, NextResponse } from 'next/server';
import {
  createSignedSessionToken,
  KITCHEN_COOKIE_NAME,
  verifyKitchenCredentials,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string;
      passcode?: string;
      keepSignedIn?: boolean;
    };

    const email = body.email?.trim() || '';
    const passcode = body.passcode || '';
    const keepSignedIn = Boolean(body.keepSignedIn);

    if (!verifyKitchenCredentials(email, passcode)) {
      return NextResponse.json(
        {
          code: '401 Auth Error',
          error: 'Invalid Credentials',
          message:
            'The kitchen credentials entered do not match active kitchen station permissions. Verify them with your ECSAD lead.',
        },
        { status: 401 }
      );
    }

    const token = createSignedSessionToken(email);
    const response = NextResponse.json({ authenticated: true, email });

    response.cookies.set({
      name: KITCHEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      ...(keepSignedIn ? { maxAge: 60 * 60 * 24 * 7 } : {}),
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Invalid login request.' },
      { status: 400 }
    );
  }
}
