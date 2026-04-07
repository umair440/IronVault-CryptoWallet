import {NextResponse} from 'next/server';
import {z} from 'zod';

import {prisma} from '@/lib/prisma';
import {getSession} from '@/lib/session';
import {decryptSecretBundle} from '@/lib/crypto/vault';
import {
    DecryptionFailedError,
    InvalidPayloadFormatError,
    UnsupportedCryptoVersionError,
} from '@/lib/crypto/errors';

const schema = z.object({
    passphrase: z.string().min(14),
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
            {error: 'You must be logged in to unlock a wallet.'},
            {status: 401},
        );
    }

    const {walletId} = await context.params;
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({error: parsed.error.flatten()}, {status: 400});
    }

    const wallet = await prisma.wallet.findFirst({
        where: {
            id: walletId,
            ownerId: session.user.id,
        },
        include: {
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

    try {
        // Preferred path: new vault model
        if (wallet.vault?.recoverySecrets?.length) {
            const payload = wallet.vault.recoverySecrets[0].encryptedPayload;
            const secretBundle = await decryptSecretBundle(parsed.data.passphrase, payload);

            if (secretBundle.type !== 'recovery-phrase') {
                return NextResponse.json(
                    {error: 'Stored secret is not a recovery phrase.'},
                    {status: 422},
                );
            }

            return NextResponse.json({
                walletId: wallet.id,
                recoveryPhrase: secretBundle.recoveryPhrase,
                warning:
                    'This response contains secret material. Do not cache it or persist it on the client.',
            });
        }

        // Legacy fallback path: old string field
        if (wallet.encryptedRecoveryPhrase) {
            const payload = JSON.parse(wallet.encryptedRecoveryPhrase);
            const secretBundle = await decryptSecretBundle(parsed.data.passphrase, payload);

            if (secretBundle.type !== 'recovery-phrase') {
                return NextResponse.json(
                    {error: 'Stored secret is not a recovery phrase.'},
                    {status: 422},
                );
            }

            return NextResponse.json({
                walletId: wallet.id,
                recoveryPhrase: secretBundle.recoveryPhrase,
                warning:
                    'This response contains secret material. Do not cache it or persist it on the client.',
            });
        }

        return NextResponse.json(
            {error: 'Encrypted wallet secret not found.'},
            {status: 404},
        );
    } catch (error) {
        if (
            error instanceof InvalidPayloadFormatError ||
            error instanceof UnsupportedCryptoVersionError ||
            error instanceof DecryptionFailedError
        ) {
            return NextResponse.json(
                {error: 'Invalid passphrase or unreadable encrypted payload.'},
                {status: 400},
            );
        }

        return NextResponse.json(
            {error: 'Unexpected unlock failure.'},
            {status: 500},
        );
    }
}
