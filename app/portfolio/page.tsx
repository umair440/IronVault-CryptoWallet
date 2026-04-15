import { AppShell } from '@/components/layout/app-shell';
import { PortfolioView } from '@/components/portfolio/portfolio-view';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';

export default async function PortfolioPage() {
  const session = await requireSession();

  const wallets = await prisma.wallet.findMany({
    where: { ownerId: session.user.id },
    include: { balances: true },
  });

  const totals: Record<string, number> = {};
  for (const wallet of wallets) {
    for (const balance of wallet.balances) {
      if (balance.amount > 0) {
        totals[balance.assetSymbol] = (totals[balance.assetSymbol] ?? 0) + balance.amount;
      }
    }
  }

  const assets = Object.entries(totals).map(([symbol, amount]) => ({ symbol, amount }));

  return (
    <AppShell>
      <div>
        <span className="badge">Portfolio</span>
        <h1 className="mt-3 text-3xl font-bold">Overview</h1>
        <p className="mt-2 text-slate-400">
          Combined value and allocation across all your wallets.
        </p>
      </div>
      <PortfolioView assets={assets} totalWallets={wallets.length} />
    </AppShell>
  );
}
