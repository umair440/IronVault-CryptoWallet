import { AppShell } from '@/components/layout/app-shell';
import { CryptoSearch } from '@/components/search/crypto-search';

export default function SearchPage() {
  return (
    <AppShell>
      <div>
        <span className="badge">Live market data</span>
        <h1 className="mt-3 text-3xl font-bold">Crypto search</h1>
        <p className="mt-2 text-slate-400">
          Prices via Binance WebSocket in real time. Market cap and volume from CoinGecko, refreshed every minute.
        </p>
      </div>
      <CryptoSearch />
    </AppShell>
  );
}
