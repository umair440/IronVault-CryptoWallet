import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { SendForm } from '@/components/wallet/send-form';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import type { WalletOption, Contact } from '@/types';

export default async function SendPage() {
  const session = await requireSession();

  const [wallets, contactRows] = await Promise.all([
  prisma.wallet.findMany({
    where: { ownerId: session.user.id },
    include: {
    addresses: { take: 1, orderBy: { createdAt: 'asc' } },
    balances: true,
    },
    orderBy: { createdAt: 'asc' },
  }),
    prisma.contact.findMany({
      where: { ownerId: session.user.id },
      orderBy: { name: 'asc' },
    }),
  ]);

  const walletOptions: WalletOption[] = wallets
  .filter((w) => w.addresses.length > 0)
  .map((w) => ({
    id: w.id,
    name: w.name,
    network: w.network as WalletOption['network'],
    address: w.addresses[0].address,
    balances: {
      ETH: w.balances.find((b) => b.assetSymbol === 'ETH' && b.network === w.network)?.amount ?? 0,
      MATIC: w.balances.find((b) => b.assetSymbol === 'MATIC' && b.network === w.network)?.amount ?? 0,
      USDC: w.balances.find((b) => b.assetSymbol === 'USDC' && b.network === w.network)?.amount ?? 0,
    },
  }));

  const contacts: Contact[] = contactRows.map((c) => ({
    id: c.id,
    name: c.name,
    address: c.address,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <AppShell>
      <div>
        <span className="badge">RQ12 / RQ17 / RQ18 / RQ22 / RQ23 / RQ24</span>
        <h1 className="mt-3 text-3xl font-bold">Send crypto</h1>
        <p className="mt-2 text-slate-400">
          Select a wallet, enter the recipient address, choose an asset and amount, then review and confirm before sending.
        </p>
      </div>

      {walletOptions.length === 0 ? (
        <div className="card p-6">
          <p className="text-slate-400">You need a wallet before you can send crypto.</p>
          <Link
            href="/wallets"
            className="mt-4 inline-flex rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Create a wallet
          </Link>
        </div>
      ) : (
        <SendForm wallets={walletOptions} contacts={contacts} />
      )}
    </AppShell>
  );
}
