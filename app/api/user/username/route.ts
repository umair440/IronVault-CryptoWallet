import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

const schema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters.').max(30, 'Username must be at most 30 characters.'),
});

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { username } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { username, NOT: { id: session.user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 });
  }

  try {
    await prisma.user.update({ where: { id: session.user.id }, data: { username } });
    return NextResponse.json({ message: 'Username updated.' });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Unable to update username.' }, { status: 500 });
  }
}
