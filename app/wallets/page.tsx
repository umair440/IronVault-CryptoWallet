import { AppShell } from '@/components/layout/app-shell';
import { WalletManager } from '@/components/wallet/wallet-manager';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';

export default async function WalletsPage() {
  const session = await requireSession();
  const wallets = await prisma.wallet.findMany({
    where: {
      ownerId: session.user.id,
    },
    include: {
      addresses: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return (
    <AppShell>
      <div>
        <span className="badge">Wallet management</span>
        <h1 className="mt-3 text-3xl font-bold">Create and manage wallets</h1>
        <p className="mt-2 text-slate-400">
          Review all wallets on your account and create additional wallets for different networks or purposes.
        </p>
      </div>
      <WalletManager wallets={wallets} />
    </AppShell>
  );
}
