import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { encryptSecret, generateDemoEvmAddress, generateRecoveryPhrase } from '@/lib/wallet';

const schema = z.object({
  walletName: z.string().trim().min(2),
  passphrase: z.string().min(8),
  network: z.enum(['Ethereum Sepolia', 'Polygon Amoy', 'Base Sepolia']),
});

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'You must be logged in to create a wallet.' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const recoveryPhrase = generateRecoveryPhrase();
  const encryptedVault = encryptSecret(recoveryPhrase, parsed.data.passphrase);
  const primaryAddress = generateDemoEvmAddress();

  const wallet = await prisma.wallet.create({
    data: {
      name: parsed.data.walletName,
      network: parsed.data.network,
      encryptedRecoveryPhrase: JSON.stringify(encryptedVault),
      ownerId: session.user.id,
      addresses: {
        create: {
          label: 'Main',
          address: primaryAddress,
          network: parsed.data.network,
        },
      },
    },
    include: {
      addresses: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  return NextResponse.json({
    wallet: {
      id: wallet.id,
      name: wallet.name,
      network: wallet.network,
      addresses: wallet.addresses,
      createdAt: wallet.createdAt,
    },
    recoveryPhrase,
    encryptedVault,
    warning: 'Show the recovery phrase once, then store only ciphertext. Do not keep plaintext in your database.',
  });
}
