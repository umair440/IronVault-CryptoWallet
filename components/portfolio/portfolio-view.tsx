'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  type ChartOptions,
  type TooltipItem,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cryptoCatalog } from '@/lib/crypto-catalog';
import { formatCurrency } from '@/lib/utils';
import type { LiveCoinData } from '@/app/api/crypto/route';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend, ArcElement,
);

// ─── Types ────────────────────────────────────────────────────────────────────

type AssetHolding = { symbol: string; amount: number };
type Period = '1D' | '1W' | '1M' | '3M' | '1Y';

interface Props {
  assets: AssetHolding[];
  totalWallets: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIODS: Period[] = ['1D', '1W', '1M', '3M', '1Y'];

const PIE_COLORS = [
  '#34d399', '#60a5fa', '#a78bfa', '#fbbf24',
  '#fb7185', '#22d3ee', '#fb923c', '#f472b6',
  '#818cf8', '#86efac',
];

const PERIOD_CONFIG: Record<Period, { points: number; intervalMs: number; vol: number }> = {
  '1D': { points: 24,  intervalMs: 3_600_000,   vol: 0.007 },
  '1W': { points: 28,  intervalMs: 21_600_000,  vol: 0.012 },
  '1M': { points: 30,  intervalMs: 86_400_000,  vol: 0.022 },
  '3M': { points: 90,  intervalMs: 86_400_000,  vol: 0.035 },
  '1Y': { points: 52,  intervalMs: 604_800_000, vol: 0.055 },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

function symbolSeed(key: string) {
  return key.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
}

function generateHistory(currentPrice: number, symbol: string, period: Period) {
  const { points, intervalMs, vol } = PERIOD_CONFIG[period];
  const rng = seededRng(symbolSeed(symbol + period));
  const prices: number[] = [currentPrice];
  for (let i = 1; i <= points; i++) {
    const noise = (rng() - 0.5) * 2 * vol;
    prices.push(Math.max(prices[i - 1] * (1 - noise), 0.000001));
  }
  prices.reverse();
  const now = Date.now();
  return prices.map((price, i) => ({
    timestamp: now - (points - i) * intervalMs,
    price,
  }));
}

function formatXLabel(timestamp: number, period: Period): string {
  const d = new Date(timestamp);
  if (period === '1D') return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (period === '1W') return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
  if (period === '1Y') return d.toLocaleDateString('en-GB', { month: 'short' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatYTick(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PortfolioView({ assets, totalWallets }: Props) {
  const [period, setPeriod] = useState<Period>('1M');
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {};
    for (const a of assets) {
      const coin = cryptoCatalog.find((c) => c.symbol === a.symbol);
      if (coin) p[a.symbol] = coin.price;
    }
    return p;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crypto')
      .then((r) => r.json())
      .then((data: LiveCoinData[]) => {
        if (!Array.isArray(data)) return;
        const updated: Record<string, number> = {};
        for (const a of assets) {
          const coin = cryptoCatalog.find((c) => c.symbol === a.symbol);
          if (!coin) continue;
          const live = data.find((d) => d.id === coin.id);
          if (live) updated[a.symbol] = live.price;
        }
        if (Object.keys(updated).length > 0)
          setPrices((prev) => ({ ...prev, ...updated }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Chart data ────────────────────────────────────────────────────────────────

  const { lineLabels, lineValues } = useMemo(() => {
    if (assets.length === 0) return { lineLabels: [], lineValues: [] };

    const histories = assets.map((a) => ({
      amount: a.amount,
      history: generateHistory(prices[a.symbol] ?? 0, a.symbol, period),
    }));

    const n = PERIOD_CONFIG[period].points + 1;
    const points = Array.from({ length: n }, (_, i) => ({
      timestamp: histories[0]?.history[i]?.timestamp ?? Date.now(),
      value: histories.reduce(
        (s, { amount, history }) => s + amount * (history[i]?.price ?? 0), 0,
      ),
    }));

    const step = Math.max(1, Math.floor(n / 6));

    return {
      lineLabels: points.map((p, i) =>
        i % step === 0 || i === n - 1 ? formatXLabel(p.timestamp, period) : '',
      ),
      lineValues: points.map((p) => p.value),
    };
  }, [assets, prices, period]);

  const pieData = useMemo(() => {
    const total = assets.reduce((s, a) => s + a.amount * (prices[a.symbol] ?? 0), 0);
    if (total === 0) return [];
    return assets
      .map((a, i) => {
        const coin = cryptoCatalog.find((c) => c.symbol === a.symbol);
        const value = a.amount * (prices[a.symbol] ?? 0);
        return {
          symbol: a.symbol,
          name: coin?.name ?? a.symbol,
          amount: a.amount,
          value,
          pct: (value / total) * 100,
          color: PIE_COLORS[i % PIE_COLORS.length],
        };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [assets, prices]);

  const totalValue = assets.reduce((s, a) => s + a.amount * (prices[a.symbol] ?? 0), 0);

  const periodChange = useMemo(() => {
    if (lineValues.length < 2) return null;
    const first = lineValues[0];
    const last = lineValues[lineValues.length - 1];
    if (first === 0) return null;
    return { pct: ((last - first) / first) * 100, abs: last - first };
  }, [lineValues]);

  const isPositive = (periodChange?.pct ?? 0) >= 0;

  // ── Chart.js configs ──────────────────────────────────────────────────────────

  const lineChartData = {
    labels: lineLabels,
    datasets: [
      {
        data: lineValues,
        borderColor: '#34d399',
        borderWidth: 2,
        backgroundColor: 'rgba(52,211,153,0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#34d399',
        pointHoverBorderColor: '#0f172a',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#94a3b8',
        bodyColor: '#fff',
        bodyFont: { family: 'ui-monospace, monospace', weight: 'bold' as const },
        callbacks: {
          title: (items: TooltipItem<'line'>[]) => lineLabels[items[0].dataIndex] || '',
          label: (item: TooltipItem<'line'>) => ` ${formatCurrency(item.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#475569', font: { size: 11 }, maxRotation: 0 },
        grid: { color: '#1e293b' },
        border: { display: false },
      },
      y: {
        ticks: {
          color: '#475569',
          font: { size: 11, family: 'ui-monospace, monospace' },
          callback: (v) => formatYTick(v as number),
        },
        grid: { color: '#1e293b' },
        border: { display: false },
      },
    },
  };

  const doughnutChartData = {
    labels: pieData.map((d) => d.symbol),
    datasets: [
      {
        data: pieData.map((d) => d.value),
        backgroundColor: pieData.map((d) => d.color),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '60%',
    animation: { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#fff',
        titleFont: { weight: 'bold' as const },
        bodyColor: '#94a3b8',
        callbacks: {
          label: (item: TooltipItem<'doughnut'>) => {
            const d = pieData[item.dataIndex];
            return [
              ` ${formatCurrency(d.value)}`,
              ` ${d.amount.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${d.symbol}  (${d.pct.toFixed(1)}%)`,
            ];
          },
        },
      },
    },
  };

  return (
    <section className="space-y-6">

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Total portfolio value</p>
            <p className="mt-1 font-mono text-4xl font-bold">
              {loading ? <span className="text-slate-600">—</span> : formatCurrency(totalValue)}
            </p>
            {periodChange !== null && (
              <div className={`mt-2 flex items-center gap-1 font-mono text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {isPositive ? '+' : ''}{formatCurrency(periodChange.abs)} ({isPositive ? '+' : ''}{periodChange.pct.toFixed(2)}%) this period
              </div>
            )}
          </div>
          <div className="flex gap-6 sm:text-right">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Wallets</p>
              <p className="mt-1 text-2xl font-bold">{totalWallets}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Assets</p>
              <p className="mt-1 text-2xl font-bold">{pieData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio value chart */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <h2 className="text-lg font-semibold">Portfolio value</h2>
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  period === p
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {totalValue === 0 ? (
            <div className="flex h-60 items-center justify-center text-sm text-slate-500">
              No assets held. Add funds to your wallets to see portfolio history.
            </div>
          ) : (
            <div style={{ height: 280 }}>
              <Line data={lineChartData} options={lineOptions} />
            </div>
          )}
        </div>
      </div>

      {/* Asset allocation */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-800 p-4">
          <h2 className="text-lg font-semibold">Asset allocation</h2>
        </div>

        {pieData.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No assets held across your wallets.
          </div>
        ) : (
          <div className="flex flex-col gap-0 md:flex-row">

            {/* Doughnut */}
            <div className="flex items-center justify-center p-8 md:border-r md:border-slate-800">
              <div style={{ width: 220, height: 220 }}>
                <Doughnut data={doughnutChartData} options={doughnutOptions} />
              </div>
            </div>

            {/* Breakdown list */}
            <div className="flex-1 divide-y divide-slate-800">
              {pieData.map((d) => (
                <div key={d.symbol} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                    <div>
                      <p className="font-medium text-white">{d.symbol}</p>
                      <p className="text-xs text-slate-500">{d.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium text-white">{formatCurrency(d.value)}</p>
                    <p className="text-xs text-slate-400">
                      {d.amount.toLocaleString('en-US', { maximumFractionDigits: 6 })} {d.symbol}
                      <span className="ml-2 text-slate-500">{d.pct.toFixed(1)}%</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

    </section>
  );
}
