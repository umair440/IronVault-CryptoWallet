import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  identifier: z.string().trim().min(1, 'Enter your username or email.'),
  password: z.string().min(1, 'Enter your password.'),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { identifier, password } = parsed.data;
  const normalizedIdentifier = identifier.trim();
  const normalizedEmail = normalizedIdentifier.toLowerCase();

  try {
    // Allow login with either the original username or the normalized email address.
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: normalizedIdentifier }, { email: normalizedEmail }],
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'No account found with those details.' }, { status: 401 });
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    return NextResponse.json(
      {
        message: 'Login successful.',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Unable to log in right now.' }, { status: 500 });
  }
}
