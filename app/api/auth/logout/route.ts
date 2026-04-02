import { NextResponse } from 'next/server';
import { clearSessionCookie, deleteSession, getSession } from '@/lib/session';

export async function POST() {
  const session = await getSession();

  if (session) {
    await deleteSession(session.token);
  }

  await clearSessionCookie();

  return NextResponse.json({ message: 'Logged out successfully.' });
}
