import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

type Props = {
  stuckCount: number;
};

export function StuckTransactionAlert({ stuckCount }: Props) {
  if (stuckCount <= 0) return null;

  return (
    <div className="card flex items-start gap-3 border-rose-500/40 bg-rose-500/5 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-400" />
      <div className="flex-1">
        <p className="font-medium text-rose-300">
          {stuckCount === 1
            ? '1 transaction has been pending longer than expected'
            : `${stuckCount} transactions have been pending longer than expected`}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Transactions pending for more than 10 minutes may be stuck. Check the network status or review them in your history.
        </p>
        <Link
          href="/transactions"
          className="mt-2 inline-block text-sm font-medium text-rose-300 underline-offset-4 hover:underline"
        >
          View transactions →
        </Link>
      </div>
    </div>
  );
}
