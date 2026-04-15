import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { CoinDetail } from '@/components/search/coin-detail';
import { cryptoCatalog } from '@/lib/crypto-catalog';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import type { WalletOption, Contact } from '@/types';

export default async function CoinPage({ params }: { params: { id: string } }) {
  const coin = cryptoCatalog.find((c) => c.id === params.id);
  if (!coin) notFound();

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
      <CoinDetail coin={coin} wallets={walletOptions} contacts={contacts} />
    </AppShell>
  );
}
