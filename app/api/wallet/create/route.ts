import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { encryptSecretBundle } from '@/lib/crypto/vault';
import { generateDemoEvmAddress, generateRecoveryPhrase } from '@/lib/wallet';

const schema = z.object({
  walletName: z.string().trim().min(2),
  passphrase: z.string().min(14),
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
  const encryptedPayload = await encryptSecretBundle(parsed.data.passphrase, {
    type: 'recovery-phrase',
    recoveryPhrase,
  });
  const primaryAddress = generateDemoEvmAddress();

  const wallet = await prisma.wallet.create({
    data: {
      name: parsed.data.walletName,
      network: parsed.data.network,
      ownerId: session.user.id,

      // Legacy compatibility: keep filling the existing field for now.
      encryptedRecoveryPhrase: JSON.stringify(encryptedPayload),

      // New vault structure for all new wallets.
      vault: {
        create: {
          vaultVersion: 1,
          keyVersion: encryptedPayload.keyVersion,
          recoverySecrets: {
            create: {
              secretType: 'RECOVERY_PHRASE',
              label: 'Primary recovery phrase',
              encryptedPayload,
            },
          },
        },
      },

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
      vault: {
        include: {
          recoverySecrets: true,
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
    warning:
        'Show the recovery phrase once only. It is not stored in plaintext on the server.',
  });
}
