'use client';

import { useMemo, useState } from 'react';
import { TransactionRecord } from '@/types';
import {
  formatCurrency,
  formatDurationSince,
  isTransactionStuck,
  shortenAddress,
} from '@/lib/utils';
import { ArrowUpRight, ArrowDownLeft, AlertTriangle } from 'lucide-react';

type Props = {
  transactions: TransactionRecord[];
};

export function TransactionList({ transactions }: Props) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'send' | 'receive'>('all');
  const [assetFilter, setAssetFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const assetOptions = useMemo(
    () => Array.from(new Set(transactions.map((tx) => tx.assetSymbol))),
    [transactions]
  );

  const statusOptions = useMemo(
    () => Array.from(new Set(transactions.map((tx) => (isTransactionStuck(tx.status, tx.createdAt) ? 'stuck' : tx.status)))),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const stuck = isTransactionStuck(tx.status, tx.createdAt);
      const displayStatus = stuck ? 'stuck' : tx.status;

      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesAsset = assetFilter === 'all' || tx.assetSymbol === assetFilter;
      const matchesStatus = statusFilter === 'all' || displayStatus === statusFilter;

      return matchesType && matchesAsset && matchesStatus;
    });
  }, [transactions, typeFilter, assetFilter, statusFilter]);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-800 p-4">
        <h3 className="text-lg font-semibold">Recent transactions</h3>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-slate-800 p-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'all' | 'send' | 'receive')}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        >
          <option value="all">All types</option>
          <option value="send">Send</option>
          <option value="receive">Receive</option>
        </select>

        <select
          value={assetFilter}
          onChange={(e) => setAssetFilter(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        >
          <option value="all">All assets</option>
          {assetOptions.map((asset) => (
            <option key={asset} value={asset}>
              {asset}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        >
          <option value="all">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="p-6 text-sm text-slate-400">
          No transactions match the selected filters.
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {filteredTransactions.map((tx) => {
            const isSend = tx.type === 'send';
            const stuck = isTransactionStuck(tx.status, tx.createdAt);

            return (
              <div
                key={tx.id}
                className="flex flex-col gap-3 p-4 transition hover:bg-slate-900/50 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 flex h-9 w-9 items-center justify-center rounded-xl ${
                      isSend ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {isSend ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>

                  <div>
                    <p className="font-medium capitalize">
                      {tx.type} {tx.assetSymbol}
                    </p>

                    <p className="text-sm text-slate-400">
                      {tx.network} · {new Date(tx.createdAt).toLocaleString()}
                    </p>

                    {tx.recipientAddress ? (
                      <p className="text-sm text-slate-400">
                        To {shortenAddress(tx.recipientAddress)}
                      </p>
                    ) : null}

                    {tx.senderAddress ? (
                      <p className="text-sm text-slate-400">
                        From {shortenAddress(tx.senderAddress)}
                      </p>
                    ) : null}

                    {stuck ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-rose-400">
                        <AlertTriangle size={12} />
                        Pending for {formatDurationSince(tx.createdAt)} — longer than expected
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold">
                    {tx.amount} {tx.assetSymbol}
                  </p>

                  <p className="text-sm text-slate-400">
                    Fee {formatCurrency(tx.estimatedFee)}
                  </p>

                  <span
                    className={`mt-1 inline-block rounded-lg px-2 py-1 text-xs font-medium ${
                      stuck
                        ? 'bg-rose-500/10 text-rose-400'
                        : tx.status === 'submitted'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : tx.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {stuck ? 'stuck' : tx.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}