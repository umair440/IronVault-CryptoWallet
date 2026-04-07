import {NextResponse} from 'next/server';
import {z} from 'zod';

import {prisma} from '@/lib/prisma';
import {getSession} from '@/lib/session';
import {decryptSecretBundle, encryptSecretBundle} from '@/lib/crypto/vault';
import {
    DecryptionFailedError,
    InvalidPayloadFormatError,
    UnsupportedCryptoVersionError,
} from '@/lib/crypto/errors';

const encryptedPayloadSchema = z.object({
    version: z.literal(1),
    algorithm: z.literal('aes-256-gcm'),
    kdf: z.literal('scrypt'),
    kdfParams: z.object({
        N: z.number(),
        r: z.number(),
        p: z.number(),
        keyLength: z.number(),
    }),
    keyVersion: z.string(),
    salt: z.string(),
    iv: z.string(),
    authTag: z.string(),
    ciphertext: z.string(),
    createdAt: z.string(),
});

const backupSchema = z.object({
    backupPassword: z.string().min(14),
    walletPassphrase: z.string().min(14),
    backup: z.object({
        version: z.literal(1),
        backupType: z.literal('encrypted-wallet-backup'),
        exportedAt: z.string(),
        wallet: z.object({
            name: z.string(),
            network: z.string(),
            addresses: z.array(
                z.object({
                    label: z.string(),
                    address: z.string(),
                    network: z.string(),
                }),
            ),
        }),
        encryptedSecret: encryptedPayloadSchema,
    }),
});

export async function POST(request: Request) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json(
            {error: 'You must be logged in to import a wallet backup.'},
            {status: 401},
        );
    }

    const body = await request.json();
    const parsed = backupSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            {error: parsed.error.flatten()},
            {status: 400},
        );
    }

    try {
        const decryptedBackupSecret = await decryptSecretBundle(
            parsed.data.backupPassword,
            parsed.data.backup.encryptedSecret,
        );

        if (decryptedBackupSecret.type !== 'recovery-phrase') {
            return NextResponse.json(
                {error: 'Backup secret is not a recovery phrase.'},
                {status: 422},
            );
        }

        const reEncryptedPayload = await encryptSecretBundle(
            parsed.data.walletPassphrase,
            {
                type: 'recovery-phrase',
                recoveryPhrase: decryptedBackupSecret.recoveryPhrase,
            },
        );

        const wallet = await prisma.wallet.create({
            data: {
                name: parsed.data.backup.wallet.name,
                network: parsed.data.backup.wallet.network,
                ownerId: session.user.id,

                // Legacy compatibility
                encryptedRecoveryPhrase: JSON.stringify(reEncryptedPayload),

                vault: {
                    create: {
                        vaultVersion: 1,
                        keyVersion: reEncryptedPayload.keyVersion,
                        recoverySecrets: {
                            create: {
                                secretType: 'RECOVERY_PHRASE',
                                label: 'Imported from encrypted backup',
                                encryptedPayload: reEncryptedPayload,
                            },
                        },
                    },
                },

                addresses: {
                    create: parsed.data.backup.wallet.addresses.map((address) => ({
                        label: address.label,
                        address: address.address,
                        network: address.network,
                    })),
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
                message: 'Encrypted wallet backup imported successfully.',
            },
            {status: 201},
        );
    } catch (error) {
        if (
            error instanceof InvalidPayloadFormatError ||
            error instanceof UnsupportedCryptoVersionError ||
            error instanceof DecryptionFailedError
        ) {
            return NextResponse.json(
                {error: 'Invalid backup password or unreadable encrypted backup payload.'},
                {status: 400},
            );
        }

        return NextResponse.json(
            {error: 'Unexpected backup import failure.'},
            {status: 500},
        );
    }
}
