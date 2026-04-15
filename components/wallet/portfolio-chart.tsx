'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import type { AssetBalance } from '@/types';

type Props = {
  assets: AssetBalance[];
  totalValue: number;
};

const COLORS = [
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
];

type Slice = {
  symbol: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
  startAngle: number;
  endAngle: number;
};

function buildSlices(assets: AssetBalance[], totalValue: number): Slice[] {
  if (totalValue === 0) return [];

  // Aggregate by symbol (collapse networks)
  const grouped = new Map<string, { symbol: string; name: string; value: number }>();
  for (const a of assets) {
    const val = a.balance * a.price;
    const existing = grouped.get(a.symbol);
    if (existing) {
      existing.value += val;
    } else {
      grouped.set(a.symbol, { symbol: a.symbol, name: a.name, value: val });
    }
  }

  const sorted = Array.from(grouped.values()).sort((a, b) => b.value - a.value);
  let angle = 0;

  return sorted.map((item, i) => {
    const percentage = (item.value / totalValue) * 100;
    const sweep = (percentage / 100) * 360;
    const slice: Slice = {
      symbol: item.symbol,
      name: item.name,
      value: item.value,
      percentage,
      color: COLORS[i % COLORS.length],
      startAngle: angle,
      endAngle: angle + sweep,
    };
    angle += sweep;
    return slice;
  });
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  // For a full circle (or nearly), draw two half-arcs
  if (endAngle - startAngle >= 359.99) {
    const mid = startAngle + 180;
    return (
      describeArc(cx, cy, r, startAngle, mid) +
      ' ' +
      describeArc(cx, cy, r, mid, endAngle - 0.01)
    );
  }

  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function PortfolioChart({ assets, totalValue }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const slices = buildSlices(assets, totalValue);

  const cx = 100;
  const cy = 100;
  const radius = 80;
  const strokeWidth = 28;

  if (slices.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold">Asset Distribution</h2>
        <p className="text-sm text-slate-400">No assets to display. Create a wallet and add funds to see your portfolio distribution.</p>
      </div>
    );
  }

  const hovered = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="card p-6">
      <h2 className="mb-4 text-lg font-semibold">Asset Distribution</h2>

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        {/* Donut chart */}
        <div className="relative h-[200px] w-[200px] flex-shrink-0">
          <svg viewBox="0 0 200 200" className="h-full w-full">
            {slices.map((slice, i) => (
              <path
                key={slice.symbol}
                d={describeArc(cx, cy, radius - strokeWidth / 2, slice.startAngle, slice.endAngle)}
                fill="none"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.3}
                className="cursor-pointer transition-opacity duration-200"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </svg>

          {/* Center label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {hovered ? (
              <>
                <span className="text-xs text-slate-400">{hovered.symbol}</span>
                <span className="text-lg font-bold">{hovered.percentage.toFixed(1)}%</span>
                <span className="text-xs text-slate-400">{formatCurrency(hovered.value)}</span>
              </>
            ) : (
              <>
                <span className="text-xs text-slate-400">Total</span>
                <span className="text-lg font-bold">{formatCurrency(totalValue)}</span>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-1 flex-col gap-2">
          {slices.map((slice, i) => (
            <div
              key={slice.symbol}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-slate-800/50"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-sm font-medium">{slice.symbol}</span>
                <span className="text-xs text-slate-400">{slice.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium">{slice.percentage.toFixed(1)}%</span>
                <span className="ml-2 text-xs text-slate-400">{formatCurrency(slice.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
