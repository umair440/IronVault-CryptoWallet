import { AppShell } from '@/components/layout/app-shell';
import { TransactionList } from '@/components/wallet/transaction-list';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import type { TransactionRecord } from '@/types';

export default async function TransactionsPage() {
  const session = await requireSession();

  const rows = await prisma.transaction.findMany({
    where: { wallet: { ownerId: session.user.id } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const transactions: TransactionRecord[] = rows.map((row) => ({
    id: row.id,
    type: (row.direction ?? (row.recipientAddress ? 'SEND' : 'RECEIVE')) === 'SEND' ? 'send' : 'receive',
    assetSymbol: row.assetSymbol,
    amount: row.amount,
    recipientAddress: row.recipientAddress ?? undefined,
    senderAddress: row.senderAddress ?? undefined,
    network: row.network as TransactionRecord['network'],
    status: row.status.toLowerCase() as TransactionRecord['status'],
    estimatedFee: row.estimatedFee,
    createdAt: row.createdAt.toISOString(),
    riskWarning: row.riskWarning ?? undefined,
  }));

  return (
    <AppShell>
      <div>
        <span className="badge">RQ14 / RQ20 / RQ44</span>
        <h1 className="mt-3 text-3xl font-bold">Transaction history</h1>
        <p className="mt-2 text-slate-400">All transactions across your wallets, most recent first.</p>
      </div>
      {transactions.length === 0 ? (
        <div className="card p-6">
          <p className="text-sm text-slate-400">No transactions yet. Send crypto to see your history here.</p>
        </div>
      ) : (
        <TransactionList transactions={transactions} />
      )}
    </AppShell>
  );
}
