import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE_NAME = 'ironvault_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

export const roleLabels = {
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  BEGINNER_TRADER: 'Beginner trader',
  GENERIC_TRADER: 'Generic trader',
} as const;

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      tokenHash,
      expiresAt,
      userId,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export async function deleteSession(token?: string) {
  if (!token) {
    return;
  }

  await prisma.session.deleteMany({
    where: {
      tokenHash: hashSessionToken(token),
    },
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashSessionToken(token),
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    return null;
  }

  return {
    id: session.id,
    expiresAt: session.expiresAt,
    user: session.user,
    token,
  };
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

export async function requireRole(allowedRoles: Array<keyof typeof roleLabels>) {
  const session = await requireSession();

  if (!allowedRoles.includes(session.user.role)) {
    redirect('/dashboard');
  }

  return session;
}
