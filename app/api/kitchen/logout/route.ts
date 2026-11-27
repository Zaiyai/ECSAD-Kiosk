import { NextResponse } from 'next/server';
import { KITCHEN_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set({
    name: KITCHEN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
