import { Sidebar } from '@/components/layout/sidebar';
import { WalletSummary } from '@/components/wallet/wallet-summary';
import { AssetTable } from '@/components/wallet/asset-table';
import { SummaryCards } from '@/components/wallet/summary-cards';
import { TransactionList } from '@/components/wallet/transaction-list';
import { assetBalances, portfolio, transactions } from '@/lib/mock-data';
import { prisma } from '@/lib/prisma';
import { requireSession, roleLabels } from '@/lib/session';

const dashboardCopy = {
  ADMIN: {
    badge: 'Admin access',
    description: 'Monitor platform activity, review operational alerts, and keep an eye on wallet usage across the prototype.',
  },
  DEVELOPER: {
    badge: 'Developer tools',
    description: 'Use the wallet views for regular testing, then jump into admin diagnostics to inspect prototype behaviour.',
  },
  BEGINNER_TRADER: {
    badge: 'Guided onboarding',
    description: 'Start here for a simpler overview of your portfolio and recent activity while you learn the core wallet flow.',
  },
  GENERIC_TRADER: {
    badge: 'Core MVP',
    description: 'Use this as the starting point for portfolio value, supported assets, and transaction monitoring.',
  },
} as const;

export default async function DashboardPage() {
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
  const totalValue = portfolio.totalValue;
  const pendingTransactions = transactions.filter((tx) => tx.status === 'pending').length;
  const currentRoleCopy = dashboardCopy[session.user.role];

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[256px_1fr]">
      <Sidebar />
      <section className="space-y-6">
        <div>
          <span className="badge">{currentRoleCopy.badge}</span>
          <h1 className="mt-3 text-3xl font-bold">Portfolio dashboard</h1>
          <p className="mt-2 text-slate-400">{currentRoleCopy.description}</p>
          <p className="mt-3 text-sm text-slate-500">
            Logged in as {session.user.username} ({roleLabels[session.user.role]}).
          </p>
        </div>
        <WalletSummary wallets={wallets} compact />
        <SummaryCards totalValue={totalValue} totalAssets={assetBalances.length} pendingTransactions={pendingTransactions} />
        <AssetTable assets={assetBalances} />
        <TransactionList transactions={transactions} />
      </section>
    </main>
  );
}
