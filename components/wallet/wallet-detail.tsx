'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Copy, CheckCheck, Search, X } from 'lucide-react';
import { cryptoCatalog } from '@/lib/crypto-catalog';
import { formatCurrency, shortenAddress } from '@/lib/utils';
import type { LiveCoinData } from '@/app/api/crypto/route';

// ─── Types ────────────────────────────────────────────────────────────────────

type SerializedAddress = {
  id: string;
  label: string;
  address: string;
  network: string;
};

type SerializedBalance = {
  id: string;
  assetSymbol: string;
  network: string;
  amount: number;
};

type SerializedTransaction = {
  id: string;
  assetSymbol: string;
  amount: number;
  estimatedFee: number;
  recipientAddress: string | null;
  senderAddress: string | null;
  network: string;
  status: string;
  direction: string;
  txHash: string | null;
  riskWarning: string | null;
  createdAt: string;
};

type WalletData = {
  id: string;
  name: string;
  network: string;
  createdAt: string;
  addresses: SerializedAddress[];
  balances: SerializedBalance[];
  transactions: SerializedTransaction[];
};

type Props = {
  wallet: WalletData;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function coinBySymbol(symbol: string) {
  return cryptoCatalog.find((c) => c.symbol === symbol) ?? null;
}

function formatPrice(price: number): string {
  if (price < 0.0001) return `$${price.toFixed(8)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 1000) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_OPTIONS = [
  { value: 'ALL',       label: 'All statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'PENDING',   label: 'Pending' },
  { value: 'FAILED',    label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'DRAFT',     label: 'Draft' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function WalletDetail({ wallet }: Props) {
  // ── Prices ──────────────────────────────────────────────────────────────────
  const buildInitialPrices = () => {
    const prices: Record<string, number> = {};
    const changes: Record<string, number> = {};
    for (const b of wallet.balances) {
      const coin = coinBySymbol(b.assetSymbol);
      if (coin) {
        prices[b.assetSymbol] = coin.price;
        changes[b.assetSymbol] = coin.change24h;
      }
    }
    return { prices, changes };
  };

  const { prices: initPrices, changes: initChanges } = buildInitialPrices();

  const [prices, setPrices] = useState<Record<string, number>>(initPrices);
  const [changes, setChanges] = useState<Record<string, number>>(initChanges);
  const [copied, setCopied] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Transaction filters ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]         = useState('');
  const [statusFilter, setStatusFilter]       = useState('ALL');
  const [directionFilter, setDirectionFilter] = useState('ALL');
  const [dateFrom, setDateFrom]               = useState('');
  const [dateTo, setDateTo]                   = useState('');

  useEffect(() => {
    fetch('/api/crypto')
      .then((r) => r.json())
      .then((data: LiveCoinData[]) => {
        if (!Array.isArray(data)) return;
        const newPrices: Record<string, number> = {};
        const newChanges: Record<string, number> = {};
        for (const b of wallet.balances) {
          const coin = coinBySymbol(b.assetSymbol);
          if (!coin) continue;
          const live = data.find((d) => d.id === coin.id);
          if (live) {
            newPrices[b.assetSymbol] = live.price;
            newChanges[b.assetSymbol] = live.change24h;
          }
        }
        if (Object.keys(newPrices).length > 0) {
          setPrices((prev) => ({ ...prev, ...newPrices }));
          setChanges((prev) => ({ ...prev, ...newChanges }));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const streams = wallet.balances
      .map((b) => {
        const coin = coinBySymbol(b.assetSymbol);
        return coin?.binanceSymbol ? `${coin.binanceSymbol.toLowerCase()}@ticker` : null;
      })
      .filter((s): s is string => s !== null);

    if (streams.length === 0) return;

    const binanceToAsset: Record<string, string> = {};
    for (const b of wallet.balances) {
      const coin = coinBySymbol(b.assetSymbol);
      if (coin?.binanceSymbol) binanceToAsset[coin.binanceSymbol] = b.assetSymbol;
    }

    function connect() {
      const url =
        streams.length === 1
          ? `wss://stream.binance.com:9443/ws/${streams[0]}`
          : `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event: MessageEvent) => {
        try {
          const raw = JSON.parse(event.data as string);
          const ticker = streams.length === 1 ? raw : raw.data;
          if (!ticker?.s) return;
          const assetSym = binanceToAsset[ticker.s as string];
          if (!assetSym) return;
          setPrices((prev) => ({ ...prev, [assetSym]: parseFloat(ticker.c) }));
          setChanges((prev) => ({ ...prev, [assetSym]: parseFloat(ticker.P) }));
        } catch {}
      };

      ws.onclose = () => {
        reconnectRef.current = setTimeout(connect, 4_000);
      };
    }

    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function copyAddress(address: string) {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function clearFilters() {
    setSearchQuery('');
    setStatusFilter('ALL');
    setDirectionFilter('ALL');
    setDateFrom('');
    setDateTo('');
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const primaryAddress = wallet.addresses[0]?.address ?? null;
  const nonZeroBalances = wallet.balances.filter((b) => b.amount > 0);
  const totalValue = nonZeroBalances.reduce(
    (sum, b) => sum + b.amount * (prices[b.assetSymbol] ?? 0),
    0,
  );

  const filteredTxs = wallet.transactions.filter((tx) => {
    if (
      searchQuery &&
      !tx.assetSymbol.toLowerCase().includes(searchQuery.toLowerCase())
    ) return false;

    if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;

    if (directionFilter !== 'ALL' && tx.direction !== directionFilter) return false;

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (new Date(tx.createdAt) < from) return false;
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(tx.createdAt) > to) return false;
    }

    return true;
  });

  const filtersActive =
    searchQuery !== '' ||
    statusFilter !== 'ALL' ||
    directionFilter !== 'ALL' ||
    dateFrom !== '' ||
    dateTo !== '';

  return (
    <section className="space-y-6">

      <Link
        href="/wallets"
        className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to wallets
      </Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="badge">{wallet.network}</span>
            <h1 className="mt-3 text-2xl font-bold">{wallet.name}</h1>
            {primaryAddress && (
              <div className="mt-2 flex items-center gap-2">
                <p className="font-mono text-sm text-slate-400">{primaryAddress}</p>
                <button
                  onClick={() => copyAddress(primaryAddress)}
                  className="text-slate-500 transition hover:text-white"
                  title="Copy full address"
                >
                  {copied
                    ? <CheckCheck className="h-4 w-4 text-emerald-400" />
                    : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total value</p>
            <p className="mt-1 font-mono text-3xl font-bold">{formatCurrency(totalValue)}</p>
          </div>
        </div>
      </div>

      {/* Assets */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-800 p-4">
          <h2 className="text-lg font-semibold">Assets</h2>
        </div>

        {nonZeroBalances.length === 0 ? (
          <div className="p-6 text-sm text-slate-400">
            This wallet doesn&apos;t hold any assets yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[40%]" />
                <col className="w-[15%]" />
                <col className="w-[18%]" />
                <col className="w-[15%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Asset</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3 text-right">24h</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {nonZeroBalances.map((b) => {
                  const coin = coinBySymbol(b.assetSymbol);
                  const price = prices[b.assetSymbol] ?? 0;
                  const change = changes[b.assetSymbol] ?? 0;
                  const value = b.amount * price;
                  const isPositive = change >= 0;

                  return (
                    <tr key={b.id} className="transition hover:bg-slate-900/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-emerald-300">
                            {b.assetSymbol.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white">{b.assetSymbol}</p>
                            <p className="truncate text-xs text-slate-500">{coin?.name ?? b.assetSymbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{formatPrice(price)}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {b.amount.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        {formatCurrency(value)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono text-sm ${
                          isPositive ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isPositive ? '+' : ''}{change.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-slate-700 bg-slate-900/40">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-medium text-slate-400">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    {formatCurrency(totalValue)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* All addresses (only shown if wallet has multiple) */}
      {wallet.addresses.length > 1 && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">Addresses</h2>
          <div className="grid gap-2">
            {wallet.addresses.map((addr) => (
              <div key={addr.id} className="rounded-xl border border-slate-800 px-3 py-2">
                <p className="text-xs uppercase tracking-wider text-slate-500">{addr.label}</p>
                <p className="mt-1 break-all font-mono text-sm text-slate-200">{addr.address}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="card overflow-hidden">

        {/* Card header */}
        <div className="border-b border-slate-800 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              Transactions
              {filtersActive && (
                <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  {filteredTxs.length} of {wallet.transactions.length}
                </span>
              )}
            </h2>
            {filtersActive && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-400 transition hover:border-slate-500 hover:text-white"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        {wallet.transactions.length > 0 && (
          <div className="border-b border-slate-800 bg-slate-900/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              {/* Asset search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search asset"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-8 pr-3 text-sm placeholder-slate-600 focus:border-slate-500 focus:outline-none"
                />
              </div>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* Date from */}
              <div className="flex items-center gap-2">
                <label className="shrink-0 text-xs text-slate-500">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-slate-500 focus:outline-none"
                />
              </div>

              {/* Date to */}
              <div className="flex items-center gap-2">
                <label className="shrink-0 text-xs text-slate-500">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom || undefined}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Direction toggle */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-500">Direction</span>
              {(['ALL', 'SEND', 'RECEIVE'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setDirectionFilter(dir)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    directionFilter === dir
                      ? 'bg-emerald-500 text-slate-950'
                      : 'border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  {dir === 'ALL' ? 'All' : dir === 'SEND' ? 'Send' : 'Receive'}
                  {/* filters for the transaction types */}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Transaction list */}
        {wallet.transactions.length === 0 ? (
          <div className="p-6 text-sm text-slate-400">
            No transactions yet for this wallet.
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="p-6 text-sm text-slate-400">
            No transactions match your filters.{' '}
            <button
              onClick={clearFilters}
              className="text-emerald-400 underline transition hover:text-emerald-300"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredTxs.map((tx) => {
              const isSend = tx.direction === 'SEND';
              return (
                <div
                  key={tx.id}
                  className="flex flex-col gap-3 p-4 transition hover:bg-slate-900/50 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isSend
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {isSend ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </div>
                    <div>
                      <p className="font-medium capitalize">
                        {tx.direction.toLowerCase()} {tx.assetSymbol}
                      </p>
                      <p className="text-sm text-slate-400">
                        {tx.network} · {new Date(tx.createdAt).toLocaleString()}
                      </p>
                      {tx.recipientAddress && (
                        <p className="text-sm text-slate-400">
                          To {shortenAddress(tx.recipientAddress)}
                        </p>
                      )}
                      {tx.senderAddress && (
                        <p className="text-sm text-slate-400">
                          From {shortenAddress(tx.senderAddress)}
                        </p>
                      )}
                      {tx.txHash && (
                        <p className="font-mono text-xs text-slate-500">
                          {tx.txHash.slice(0, 10)}…{tx.txHash.slice(-8)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      {isSend ? '−' : '+'}{tx.amount} {tx.assetSymbol}
                    </p>
                    <p className="text-sm text-slate-400">Fee {formatCurrency(tx.estimatedFee)}</p>
                    <span
                      className={`mt-1 inline-block rounded-lg px-2 py-1 text-xs font-medium ${
                        tx.status === 'SUBMITTED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : tx.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400'
                          : tx.status === 'FAILED'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
