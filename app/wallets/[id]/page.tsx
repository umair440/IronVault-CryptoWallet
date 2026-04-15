import { notFound } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { WalletDetail } from '@/components/wallet/wallet-detail';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';

export default async function WalletDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [session, { id }] = await Promise.all([requireSession(), params]);

  const wallet = await prisma.wallet.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      addresses: { orderBy: { createdAt: 'asc' } },
      balances: true,
      transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  });

  if (!wallet) notFound();

  // Serialise for the client component
  const data = {
    id: wallet.id,
    name: wallet.name,
    network: wallet.network,
    createdAt: wallet.createdAt.toISOString(),
    addresses: wallet.addresses.map((a) => ({
      id: a.id,
      label: a.label,
      address: a.address,
      network: a.network,
    })),
    balances: wallet.balances.map((b) => ({
      assetSymbol: b.assetSymbol,
      network: b.network,
      amount: b.amount,
    })),
    transactions: wallet.transactions.map((t) => ({
      id: t.id,
      direction: t.direction,
      assetSymbol: t.assetSymbol,
      amount: t.amount,
      estimatedFee: t.estimatedFee,
      recipientAddress: t.recipientAddress,
      senderAddress: t.senderAddress,
      network: t.network,
      status: t.status,
      txHash: t.txHash,
      riskWarning: t.riskWarning,
      createdAt: t.createdAt.toISOString(),
    })),
  };

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[256px_1fr]">
      <Sidebar />
      <WalletDetail wallet={data} />
    </main>
  );
}
