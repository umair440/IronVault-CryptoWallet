'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { cryptoCatalog } from '@/lib/crypto-catalog';
import type { CryptoCoin } from '@/lib/crypto-catalog';
import type { LiveCoinData } from '@/app/api/crypto/route';

function formatPrice(price: number): string {
  if (price < 0.0001) return `$${price.toFixed(8)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 1000) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatLargeNumber(n: number): string {
  if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Layer 1':        'border-blue-700/40 bg-blue-500/10 text-blue-300',
  'Layer 2':        'border-purple-700/40 bg-purple-500/10 text-purple-300',
  'Layer 0':        'border-indigo-700/40 bg-indigo-500/10 text-indigo-300',
  Stablecoin:       'border-emerald-700/40 bg-emerald-500/10 text-emerald-300',
  DeFi:             'border-orange-700/40 bg-orange-500/10 text-orange-300',
  Meme:             'border-yellow-700/40 bg-yellow-500/10 text-yellow-300',
  Payment:          'border-cyan-700/40 bg-cyan-500/10 text-cyan-300',
  Oracle:           'border-pink-700/40 bg-pink-500/10 text-pink-300',
  'Exchange Token': 'border-amber-700/40 bg-amber-500/10 text-amber-300',
};

const BINANCE_WS_URL =
  'wss://stream.binance.com:9443/stream?streams=' +
  cryptoCatalog
    .filter((c) => c.binanceSymbol !== null)
    .map((c) => `${c.binanceSymbol!.toLowerCase()}@ticker`)
    .join('/');

type WsStatus = 'connecting' | 'live' | 'offline';

export function CryptoSearch() {
  const [coins, setCoins] = useState<CryptoCoin[]>(cryptoCatalog);
  const [query, setQuery] = useState('');
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/crypto')
      .then((r) => r.json())
      .then((data: LiveCoinData[]) => {
        if (!Array.isArray(data)) return;
        setCoins((prev) =>
          prev.map((coin) => {
            const live = data.find((d) => d.id === coin.id);
            return live ? { ...coin, ...live } : coin;
          }),
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function connect() {
      setWsStatus('connecting');
      const ws = new WebSocket(BINANCE_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setWsStatus('live');

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as {
            stream: string;
            data: { s: string; c: string; P: string };
          };
          if (!msg?.data) return;
          const { s: symbol, c: closePrice, P: changePercent } = msg.data;
          setCoins((prev) =>
            prev.map((coin) =>
              coin.binanceSymbol === symbol
                ? { ...coin, price: parseFloat(closePrice), change24h: parseFloat(changePercent) }
                : coin,
            ),
          );
          setLastUpdated(new Date());
        } catch {
          // Ignore malformed frames.
        }
      };

      ws.onerror = () => setWsStatus('offline');
      ws.onclose = () => {
        setWsStatus('offline');
        reconnectRef.current = setTimeout(connect, 4_000);
      };
    }

    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return coins;
    return coins.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q),
    );
  }, [coins, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, symbol, or category…"
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 transition hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div
          className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
            wsStatus === 'live'
              ? 'border-emerald-700/40 bg-emerald-500/10 text-emerald-300'
              : wsStatus === 'connecting'
              ? 'border-yellow-700/40 bg-yellow-500/10 text-yellow-300'
              : 'border-red-700/40 bg-red-500/10 text-red-300'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              wsStatus === 'live'
                ? 'animate-pulse bg-emerald-400'
                : wsStatus === 'connecting'
                ? 'animate-pulse bg-yellow-400'
                : 'bg-red-400'
            }`}
          />
          {wsStatus === 'live' ? 'Live' : wsStatus === 'connecting' ? 'Connecting…' : 'Offline — reconnecting'}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {query
            ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"`
            : `Showing ${filtered.length} cryptocurrencies`}
        </p>
        {lastUpdated && (
          <p className="text-xs text-slate-600">Last tick {lastUpdated.toLocaleTimeString()}</p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-slate-400">No cryptocurrencies match your search.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[2rem_1fr_auto_auto_auto_auto] items-center gap-4 border-b border-slate-800 px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            <span>#</span>
            <span>Name</span>
            <span className="text-right">Price</span>
            <span className="text-right">24 h</span>
            <span className="hidden text-right md:block">Market Cap</span>
            <span className="hidden text-right lg:block">Volume (24 h)</span>
          </div>

          {filtered.map((coin, index) => {
            const isPositive = coin.change24h >= 0;
            const categoryClass =
              CATEGORY_COLORS[coin.category] ??
              'border-slate-700/40 bg-slate-500/10 text-slate-300';

            return (
              <Link
                key={coin.id}
                href={`/search/${coin.id}`}
                className="grid grid-cols-[2rem_1fr_auto_auto_auto_auto] items-center gap-4 border-b border-slate-800/60 px-5 py-3.5 text-sm transition hover:bg-slate-800/40 last:border-0 cursor-pointer"
              >
                <span className="text-xs text-slate-500">{index + 1}</span>

                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-emerald-300">
                    {coin.symbol.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{coin.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-slate-400">{coin.symbol}</span>
                      <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${categoryClass}`}>
                        {coin.category}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-right font-mono font-medium text-white">
                  {formatPrice(coin.price)}
                </span>

                <div className={`flex items-center justify-end gap-1 font-mono text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
                </div>

                <span className="hidden text-right font-mono text-slate-300 md:block">
                  {formatLargeNumber(coin.marketCap)}
                </span>

                <span className="hidden text-right font-mono text-slate-400 lg:block">
                  {formatLargeNumber(coin.volume24h)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
