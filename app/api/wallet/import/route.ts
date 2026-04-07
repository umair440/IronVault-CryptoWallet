import {NextResponse} from 'next/server';
import {z} from 'zod';

import {prisma} from '@/lib/prisma';
import {getSession} from '@/lib/session';
import {encryptSecretBundle} from '@/lib/crypto/vault';
import {generateDemoEvmAddress} from '@/lib/wallet';

const schema = z.object({
    walletName: z.string().trim().min(2),
    passphrase: z.string().min(14),
    network: z.enum(['Ethereum Sepolia', 'Polygon Amoy', 'Base Sepolia']),
    recoveryPhrase: z
        .string()
        .trim()
        .min(20)
        .transform((value) => value.replace(/\s+/g, ' ')),
});

export async function POST(request: Request) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json(
            {error: 'You must be logged in to import a wallet.'},
            {status: 401},
        );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            {error: parsed.error.flatten()},
            {status: 400},
        );
    }

    const encryptedPayload = await encryptSecretBundle(parsed.data.passphrase, {
        type: 'recovery-phrase',
        recoveryPhrase: parsed.data.recoveryPhrase,
    });

    // Demo-safe address generation for now.
    // Replace this later with deterministic chain-specific derivation.
    const primaryAddress = generateDemoEvmAddress();

    const wallet = await prisma.wallet.create({
        data: {
            name: parsed.data.walletName,
            network: parsed.data.network,
            ownerId: session.user.id,

            // Keep legacy compatibility until you fully migrate away from this field.
            encryptedRecoveryPhrase: JSON.stringify(encryptedPayload),

            vault: {
                create: {
                    vaultVersion: 1,
                    keyVersion: encryptedPayload.keyVersion,
                    recoverySecrets: {
                        create: {
                            secretType: 'RECOVERY_PHRASE',
                            label: 'Imported recovery phrase',
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
        },
    });

    return NextResponse.json(
        {
            wallet: {
                id: wallet.id,
                name: wallet.name,
                network: wallet.network,
                addresses: wallet.addresses,
                createdAt: wallet.createdAt,
            },
            message:
                'Wallet imported successfully. Secret material was encrypted before persistence.',
        },
        {status: 201},
    );
}
