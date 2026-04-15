import { AppShell } from '@/components/layout/app-shell';
import { WalletSummary } from '@/components/wallet/wallet-summary';
import { AssetTable } from '@/components/wallet/asset-table';
import { PortfolioChart } from '@/components/wallet/portfolio-chart';
import { SummaryCards } from '@/components/wallet/summary-cards';
import { TransactionList } from '@/components/wallet/transaction-list';
import { assets } from '@/lib/mock-data';
import { prisma } from '@/lib/prisma';
import { requireSession, roleLabels } from '@/lib/session';
import type { AssetBalance, TransactionRecord } from '@/types';

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

// Static mock prices — no live price feed in prototype.
const ASSET_PRICES: Record<string, number> = Object.fromEntries(
  assets.map((a) => [a.symbol, a.currentPrice]),
);
const ASSET_NAMES: Record<string, string> = Object.fromEntries(
  assets.map((a) => [a.symbol, a.name]),
);

export default async function DashboardPage() {
  const session = await requireSession();

  const [wallets, balanceRows, recentTxRows, pendingCount] = await Promise.all([
    prisma.wallet.findMany({
      where: { ownerId: session.user.id },
      include: { addresses: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.balance.findMany({
      where: { wallet: { ownerId: session.user.id } },
    }),
    prisma.transaction.findMany({
      where: { wallet: { ownerId: session.user.id } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.transaction.count({
      where: { wallet: { ownerId: session.user.id }, status: 'PENDING' },
    }),
  ]);

  // Aggregate balances across wallets, summing duplicate symbol+network combos.
  const aggregated = new Map<string, { symbol: string; network: string; balance: number }>();
  for (const row of balanceRows) {
    const key = `${row.assetSymbol}::${row.network}`;
    const existing = aggregated.get(key);
    if (existing) {
      existing.balance += row.amount;
    } else {
      aggregated.set(key, { symbol: row.assetSymbol, network: row.network, balance: row.amount });
    }
  }

  const assetBalances: AssetBalance[] = Array.from(aggregated.values()).map((row, i) => ({
    assetId: `${row.symbol}-${row.network}-${i}`,
    symbol: row.symbol,
    name: ASSET_NAMES[row.symbol] ?? row.symbol,
    balance: row.balance,
    price: ASSET_PRICES[row.symbol] ?? 0,
    network: row.network as AssetBalance['network'],
  }));

  const totalValue = assetBalances.reduce((sum, a) => sum + a.balance * a.price, 0);

  const transactions: TransactionRecord[] = recentTxRows.map((tx) => ({
    id: tx.id,
    type: tx.direction === 'SEND' ? 'send' : 'receive',
    assetSymbol: tx.assetSymbol,
    amount: tx.amount,
    recipientAddress: tx.recipientAddress ?? undefined,
    senderAddress: tx.senderAddress ?? undefined,
    network: tx.network as TransactionRecord['network'],
    status: tx.status.toLowerCase() as TransactionRecord['status'],
    estimatedFee: tx.estimatedFee,
    createdAt: tx.createdAt.toISOString(),
    riskWarning: tx.riskWarning ?? undefined,
  }));

  const currentRoleCopy = dashboardCopy[session.user.role];

  return (
    <AppShell>
      <div>
        <span className="badge">{currentRoleCopy.badge}</span>
        <h1 className="mt-3 text-3xl font-bold">Portfolio dashboard</h1>
        <p className="mt-2 text-slate-400">{currentRoleCopy.description}</p>
        <p className="mt-3 text-sm text-slate-500">
          Logged in as {session.user.username} ({roleLabels[session.user.role]}).
        </p>
      </div>
      <WalletSummary wallets={wallets} compact />
      <SummaryCards totalValue={totalValue} totalAssets={assetBalances.length} pendingTransactions={pendingCount} />
      <PortfolioChart assets={assetBalances} totalValue={totalValue} />
      <AssetTable assets={assetBalances} />
      <TransactionList transactions={transactions} />
    </AppShell>
  );
}
