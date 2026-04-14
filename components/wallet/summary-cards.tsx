import { formatCurrency } from '@/lib/utils';
import { Wallet, BarChart3, Clock } from 'lucide-react';

type Props = {
  totalValue: number;
  totalAssets: number;
  pendingTransactions: number;
};

export function SummaryCards({ totalValue, totalAssets, pendingTransactions }: Props) {
  const cards = [
    {
      label: 'Portfolio value',
      value: formatCurrency(totalValue),
      icon: Wallet,
      color: 'text-emerald-400',
      colSpan: 'md:col-span-2',
    },
    {
      label: 'Tracked assets',
      value: String(totalAssets),
      icon: BarChart3,
      color: 'text-blue-400',
      colSpan: 'md:col-span-1',
    },
    {
      label: 'Pending transactions',
      value: String(pendingTransactions),
      icon: Clock,
      color: 'text-amber-400',
      colSpan: 'md:col-span-1',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className={`card p-5 transition hover:border-slate-600 hover:bg-slate-900/50 ${card.colSpan}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{card.label}</p>
              <Icon className={`h-5 w-5 ${card.color}`} />
            </div>

            <p className="mt-4 text-3xl font-semibold">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}