import { Sidebar } from '@/components/layout/sidebar';
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
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[256px_1fr]">
      <Sidebar />
      <section className="space-y-6">
        <div>
          <span className="badge">Portfolio</span>
          <h1 className="mt-3 text-3xl font-bold">Overview</h1>
          <p className="mt-2 text-slate-400">
            Combined value and allocation across all your wallets.
          </p>
        </div>
        <PortfolioView assets={assets} totalWallets={wallets.length} />
      </section>
    </main>
  );
}
