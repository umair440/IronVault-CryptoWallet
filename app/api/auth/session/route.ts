import { NextResponse } from 'next/server';
import { getSession, roleLabels } from '@/lib/session';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      ...session.user,
      roleLabel: roleLabels[session.user.role],
    },
  });
}
