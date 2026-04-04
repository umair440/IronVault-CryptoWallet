export type SupportedNetwork = 'Ethereum Sepolia' | 'Polygon Amoy' | 'Base Sepolia';

export interface BlockchainNetwork {
  networkId: string;
  name: SupportedNetwork;
  chainId: string;
  symbol: string;
  rpcEndpoint?: string;
}

export interface Asset {
  assetId: string;
  symbol: string;
  name: string;
  currentPrice: number;
}

export interface Holding {
  holdingId: string;
  asset: Asset;
  quantity: number;
  averageBuyPrice: number;
  network: SupportedNetwork;
}

export interface Portfolio {
  portfolioId: string;
  holdings: Holding[];
  totalValue: number;
}

export interface AssetBalance {
  assetId: string;
  symbol: string;
  name: string;
  balance: number;
  price: number;
  network: SupportedNetwork;
}

export interface TransactionRecord {
  id: string;
  type: 'send' | 'receive';
  assetSymbol: string;
  amount: number;
  recipientAddress?: string;
  senderAddress?: string;
  network: SupportedNetwork;
  status: 'draft' | 'submitted' | 'failed' | 'cancelled' | 'pending';
  estimatedFee: number;
  createdAt: string;
  riskWarning?: string;
}
