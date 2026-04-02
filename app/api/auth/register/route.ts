import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  username: z.string().trim().min(3).max(30),
  email: z.string().trim().email(),
  password: z.string().min(8),
  mobileNumber: z.string().trim().optional(),
  role: z.enum(['ADMIN', 'DEVELOPER', 'BEGINNER_TRADER', 'GENERIC_TRADER']).default('BEGINNER_TRADER'),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { username, email, password, mobileNumber, role } = parsed.data;
  // Store emails in a normalized format so duplicate checks stay reliable.
  const normalizedEmail = email.toLowerCase();
  const normalizedMobileNumber = mobileNumber || undefined;

  try {
    // Check both unique fields up front so we can return a clearer message than a generic DB error.
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: normalizedEmail }],
      },
      select: {
        username: true,
        email: true,
      },
    });

    if (existingUser) {
      const duplicateField = existingUser.email === normalizedEmail ? 'email' : 'username';

      return NextResponse.json(
        { error: `${duplicateField === 'email' ? 'Email address' : 'Username'} is already in use.` },
        { status: 409 },
      );
    }

    // Only the hash is persisted; the raw password never reaches the database.
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email: normalizedEmail,
        mobileNumber: normalizedMobileNumber,
        passwordHash,
        role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        mobileNumber: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Account created successfully.',
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    // Keep a DB-level uniqueness fallback in case two requests race each other.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Username or email is already in use.' }, { status: 409 });
    }

    console.error('Registration failed:', error);

    return NextResponse.json({ error: 'Unable to create account right now.' }, { status: 500 });
  }
}
