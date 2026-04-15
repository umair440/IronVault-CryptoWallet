import { NextResponse } from 'next/server';

const IDS = [
  'bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana',
  'usd-coin', 'ripple', 'dogecoin', 'cardano', 'avalanche-2',
  'shiba-inu', 'polkadot', 'matic-network', 'chainlink', 'uniswap',
  'litecoin', 'cosmos', 'dai', 'stellar', 'near',
].join(',');

const COINGECKO_URL =
  `https://api.coingecko.com/api/v3/coins/markets` +
  `?vs_currency=usd&ids=${IDS}&order=market_cap_desc&per_page=20&page=1&sparkline=false`;

export interface LiveCoinData {
  id: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

export async function GET() {
  try {
    const res = await fetch(COINGECKO_URL, { next: { revalidate: 60 } });
    if (!res.ok) {
      return NextResponse.json({ error: `CoinGecko returned ${res.status}` }, { status: 502 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any[] = await res.json();
    const coins: LiveCoinData[] = raw.map((c) => ({
      id: c.id,
      price: c.current_price ?? 0,
      change24h: c.price_change_percentage_24h ?? 0,
      marketCap: c.market_cap ?? 0,
      volume24h: c.total_volume ?? 0,
    }));
    return NextResponse.json(coins);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
