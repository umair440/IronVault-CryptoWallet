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
import {WalletAddress} from "@prisma/client";

const schema = z.object({
    passphrase: z.string().min(14),
    backupPassword: z.string().min(14),
});

type RouteContext = {
    params: Promise<{
        walletId: string;
    }>;
};

export async function POST(request: Request, context: RouteContext) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json(
            {error: 'You must be logged in to export a wallet backup.'},
            {status: 401},
        );
    }

    const {walletId} = await context.params;
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            {error: parsed.error.flatten()},
            {status: 400},
        );
    }

    const wallet = await prisma.wallet.findFirst({
        where: {
            id: walletId,
            ownerId: session.user.id,
        },
        include: {
            addresses: {
                orderBy: {
                    createdAt: 'asc',
                },
            },
            vault: {
                include: {
                    recoverySecrets: {
                        where: {
                            secretType: 'RECOVERY_PHRASE',
                        },
                        take: 1,
                    },
                },
            },
        },
    });

    if (!wallet) {
        return NextResponse.json({error: 'Wallet not found.'}, {status: 404});
    }

    const recoverySecret = wallet.vault?.recoverySecrets?.[0];

    if (!recoverySecret) {
        return NextResponse.json(
            {error: 'Encrypted recovery secret not found.'},
            {status: 404},
        );
    }

    try {
        const decrypted = await decryptSecretBundle(
            parsed.data.passphrase,
            recoverySecret.encryptedPayload,
        );

        if (decrypted.type !== 'recovery-phrase') {
            return NextResponse.json(
                {error: 'Stored secret is not a recovery phrase.'},
                {status: 422},
            );
        }

        const backupPlaintext = {
            version: 1,
            backupType: 'encrypted-wallet-backup',
            exportedAt: new Date().toISOString(),
            wallet: {
                id: wallet.id,
                name: wallet.name,
                network: wallet.network,
                addresses: wallet.addresses.map((address: WalletAddress) => (
                    label: address.label,
                    address: address.address,
                    network: address.network,
                })),
            },
            secretBundle: {
                type: 'recovery-phrase' as const,
                recoveryPhrase: decrypted.recoveryPhrase,
            },
        };

        const encryptedBackupPayload = await encryptSecretBundle(
            parsed.data.backupPassword,
            {
                type: 'recovery-phrase',
                recoveryPhrase: backupPlaintext.secretBundle.recoveryPhrase,
            },
        );

        return NextResponse.json({
            backup: {
                version: 1,
                backupType: 'encrypted-wallet-backup',
                exportedAt: backupPlaintext.exportedAt,
                wallet: backupPlaintext.wallet,
                encryptedSecret: encryptedBackupPayload,
            },
            warning:
                'Store this encrypted backup securely. This is an MVP export format, not audited production backup security.',
        });
    } catch (error) {
        if (
            error instanceof InvalidPayloadFormatError ||
            error instanceof UnsupportedCryptoVersionError ||
            error instanceof DecryptionFailedError
        ) {
            return NextResponse.json(
                {error: 'Invalid passphrase or unreadable encrypted wallet secret.'},
                {status: 400},
            );
        }

        return NextResponse.json(
            {error: 'Unexpected backup export failure.'},
            {status: 500},
        );
    }
}
