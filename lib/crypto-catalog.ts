export interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  binanceSymbol: string | null;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  category: string;
}

export const cryptoCatalog: CryptoCoin[] = [
  { id: 'bitcoin',       symbol: 'BTC',  name: 'Bitcoin',       binanceSymbol: 'BTCUSDT',   price: 64320.50,    change24h:  2.14,  marketCap: 1_264_000_000_000, volume24h: 38_400_000_000, category: 'Layer 1' },
  { id: 'ethereum',      symbol: 'ETH',  name: 'Ethereum',      binanceSymbol: 'ETHUSDT',   price:  2520.12,    change24h: -1.03,  marketCap:   303_000_000_000, volume24h: 14_200_000_000, category: 'Layer 1' },
  { id: 'tether',        symbol: 'USDT', name: 'Tether',        binanceSymbol: null,        price:     1.00,    change24h:  0.01,  marketCap:   110_000_000_000, volume24h: 62_000_000_000, category: 'Stablecoin' },
  { id: 'binancecoin',   symbol: 'BNB',  name: 'BNB',           binanceSymbol: 'BNBUSDT',   price:   578.40,    change24h:  0.87,  marketCap:    84_000_000_000, volume24h:  1_800_000_000, category: 'Exchange Token' },
  { id: 'solana',        symbol: 'SOL',  name: 'Solana',        binanceSymbol: 'SOLUSDT',   price:   148.62,    change24h:  3.45,  marketCap:    68_000_000_000, volume24h:  3_200_000_000, category: 'Layer 1' },
  { id: 'usd-coin',      symbol: 'USDC', name: 'USD Coin',      binanceSymbol: null,        price:     1.00,    change24h:  0.00,  marketCap:    43_000_000_000, volume24h:  7_100_000_000, category: 'Stablecoin' },
  { id: 'ripple',        symbol: 'XRP',  name: 'XRP',           binanceSymbol: 'XRPUSDT',   price:     0.5312,  change24h: -0.62,  marketCap:    29_000_000_000, volume24h:  1_100_000_000, category: 'Payment' },
  { id: 'dogecoin',      symbol: 'DOGE', name: 'Dogecoin',      binanceSymbol: 'DOGEUSDT',  price:     0.1423,  change24h:  5.22,  marketCap:    20_500_000_000, volume24h:  1_600_000_000, category: 'Meme' },
  { id: 'cardano',       symbol: 'ADA',  name: 'Cardano',       binanceSymbol: 'ADAUSDT',   price:     0.4481,  change24h:  1.12,  marketCap:    15_900_000_000, volume24h:    450_000_000, category: 'Layer 1' },
  { id: 'avalanche-2',   symbol: 'AVAX', name: 'Avalanche',     binanceSymbol: 'AVAXUSDT',  price:    34.72,    change24h: -2.38,  marketCap:    14_300_000_000, volume24h:    620_000_000, category: 'Layer 1' },
  { id: 'shiba-inu',     symbol: 'SHIB', name: 'Shiba Inu',     binanceSymbol: 'SHIBUSDT',  price:     0.00001842, change24h: 7.81, marketCap: 10_800_000_000, volume24h:    980_000_000, category: 'Meme' },
  { id: 'polkadot',      symbol: 'DOT',  name: 'Polkadot',      binanceSymbol: 'DOTUSDT',   price:     7.23,    change24h:  0.34,  marketCap:    10_100_000_000, volume24h:    310_000_000, category: 'Layer 0' },
  { id: 'matic-network', symbol: 'MATIC',name: 'Polygon',       binanceSymbol: 'MATICUSDT', price:     0.73,    change24h: -1.55,  marketCap:     7_200_000_000, volume24h:    420_000_000, category: 'Layer 2' },
  { id: 'chainlink',     symbol: 'LINK', name: 'Chainlink',     binanceSymbol: 'LINKUSDT',  price:    14.08,    change24h:  2.61,  marketCap:     8_500_000_000, volume24h:    490_000_000, category: 'Oracle' },
  { id: 'uniswap',       symbol: 'UNI',  name: 'Uniswap',       binanceSymbol: 'UNIUSDT',   price:     7.94,    change24h: -0.90,  marketCap:     6_000_000_000, volume24h:    230_000_000, category: 'DeFi' },
  { id: 'litecoin',      symbol: 'LTC',  name: 'Litecoin',      binanceSymbol: 'LTCUSDT',   price:    82.31,    change24h:  1.07,  marketCap:     6_100_000_000, volume24h:    370_000_000, category: 'Payment' },
  { id: 'cosmos',        symbol: 'ATOM', name: 'Cosmos',        binanceSymbol: 'ATOMUSDT',  price:     8.63,    change24h: -0.48,  marketCap:     3_300_000_000, volume24h:    160_000_000, category: 'Layer 0' },
  { id: 'dai',           symbol: 'DAI',  name: 'Dai',           binanceSymbol: null,        price:     1.00,    change24h:  0.02,  marketCap:     5_100_000_000, volume24h:    290_000_000, category: 'Stablecoin' },
  { id: 'stellar',       symbol: 'XLM',  name: 'Stellar',       binanceSymbol: 'XLMUSDT',   price:     0.1107,  change24h:  0.73,  marketCap:     3_200_000_000, volume24h:    100_000_000, category: 'Payment' },
  { id: 'near',          symbol: 'NEAR', name: 'NEAR Protocol', binanceSymbol: 'NEARUSDT',  price:     5.41,    change24h:  4.18,  marketCap:     5_700_000_000, volume24h:    380_000_000, category: 'Layer 1' },
];
