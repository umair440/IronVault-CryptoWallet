'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export type WalletSummaryItem = {
  id: string;
  name: string;
  network: string;
  createdAt: string | Date;
  addresses: Array<{
    id: string;
    label: string;
    address: string;
    network: string;
  }>;
};

type WalletSummaryProps = {
  wallets: WalletSummaryItem[];
  compact?: boolean;
};

function WalletCard({ wallet }: { wallet: WalletSummaryItem }) {
  return (
    <Link
      href={`/wallets/${wallet.id}`}
      className="block rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700 hover:bg-slate-900/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-white">{wallet.name}</p>
          <p className="mt-1 text-sm text-slate-400">{wallet.network}</p>
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          {new Date(wallet.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>
      </div>
      <div className="mt-4 grid gap-2">
        {wallet.addresses.map((address) => (
          <div key={address.id} className="rounded-xl border border-slate-800 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{address.label}</p>
            <p className="mt-1 break-all font-mono text-sm text-slate-200">{address.address}</p>
          </div>
        ))}
      </div>
    </Link>
  );
}

export function WalletSummary({ wallets, compact = false }: WalletSummaryProps) {
  const visibleWallets = compact ? wallets.slice(0, 3) : wallets;

  if (compact) {
    return (
      <details className="card p-6">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Your wallets</h2>
            <p className="mt-1 text-sm text-slate-400">
              This account currently has {wallets.length} wallet{wallets.length === 1 ? '' : 's'}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/wallets"
              className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              Manage wallets
            </Link>
            <span className="flex items-center gap-2 text-sm text-slate-300">
              View wallets
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>
        </summary>
        <div className="mt-6 grid gap-4">
          {visibleWallets.length > 0 ? (
            visibleWallets.map((wallet) => <WalletCard key={wallet.id} wallet={wallet} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
              No wallets created yet. Visit the wallets page to create your first wallet.
            </div>
          )}
        </div>
        {wallets.length > visibleWallets.length && (
          <p className="mt-4 text-sm text-slate-500">
            Showing {visibleWallets.length} of {wallets.length} wallets.
          </p>
        )}
      </details>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Your wallets</h2>
          <p className="mt-1 text-sm text-slate-400">
            This account currently has {wallets.length} wallet{wallets.length === 1 ? '' : 's'}.
          </p>
        </div>
        <Link
          href="/wallets"
          className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          Manage wallets
        </Link>
      </div>
      <div className="mt-6 grid gap-4">
        {visibleWallets.length > 0 ? (
          visibleWallets.map((wallet) => <WalletCard key={wallet.id} wallet={wallet} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
            No wallets created yet. Visit the wallets page to create your first wallet.
          </div>
        )}
      </div>
    </div>
  );
}
