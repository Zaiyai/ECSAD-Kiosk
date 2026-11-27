import { NextResponse } from 'next/server';
import { isKitchenAuthenticated } from '@/lib/auth';

export async function GET() {
  const authenticated = await isKitchenAuthenticated();
  return NextResponse.json({ authenticated });
}
