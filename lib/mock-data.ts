import { Asset, AssetBalance, BlockchainNetwork, Holding, Portfolio, TransactionRecord } from '@/types';

export const supportedNetworks: BlockchainNetwork[] = [
  {
    networkId: 'eth-sepolia',
    name: 'Ethereum Sepolia',
    chainId: '11155111',
    symbol: 'ETH',
    rpcEndpoint: 'https://sepolia.infura.io/v3/demo',
  },
  {
    networkId: 'polygon-amoy',
    name: 'Polygon Amoy',
    chainId: '80002',
    symbol: 'MATIC',
    rpcEndpoint: 'https://rpc-amoy.polygon.technology',
  },
  {
    networkId: 'base-sepolia',
    name: 'Base Sepolia',
    chainId: '84532',
    symbol: 'ETH',
    rpcEndpoint: 'https://sepolia.base.org',
  },
];

export const assets: Asset[] = [
  { assetId: 'asset-eth', symbol: 'ETH', name: 'Ethereum', currentPrice: 2520.12 },
  { assetId: 'asset-matic', symbol: 'MATIC', name: 'Polygon', currentPrice: 0.73 },
  { assetId: 'asset-usdc', symbol: 'USDC', name: 'USD Coin', currentPrice: 1 },
];

export const holdings: Holding[] = [
  {
    holdingId: 'holding-eth',
    asset: assets[0],
    quantity: 1.24,
    averageBuyPrice: 2280,
    network: 'Ethereum Sepolia',
  },
  {
    holdingId: 'holding-matic',
    asset: assets[1],
    quantity: 240,
    averageBuyPrice: 0.64,
    network: 'Polygon Amoy',
  },
  {
    holdingId: 'holding-usdc',
    asset: assets[2],
    quantity: 640,
    averageBuyPrice: 1,
    network: 'Base Sepolia',
  },
];

export const portfolio: Portfolio = {
  portfolioId: 'portfolio-demo',
  holdings,
  totalValue: holdings.reduce((sum, holding) => sum + holding.quantity * holding.asset.currentPrice, 0),
};

export const assetBalances: AssetBalance[] = holdings.map((holding) => ({
  assetId: holding.asset.assetId,
  symbol: holding.asset.symbol,
  name: holding.asset.name,
  balance: holding.quantity,
  price: holding.asset.currentPrice,
  network: holding.network,
}));

export const transactions: TransactionRecord[] = [
  {
    id: 'tx_001',
    type: 'send',
    assetSymbol: 'ETH',
    amount: 0.14,
    recipientAddress: '0x9Bf2A3b0e487C8Dc1A7c8319143454B2e04f11Af',
    network: 'Ethereum Sepolia',
    status: 'submitted',
    estimatedFee: 2.11,
    createdAt: new Date().toISOString(),
    riskWarning: 'Address not saved in address book. Extra confirmation advised.',
  },
  {
    id: 'tx_002',
    type: 'receive',
    assetSymbol: 'USDC',
    senderAddress: '0x6AF8B4CdA23f43a6B4976b5951aAbC9f7b1ac112',
    amount: 120,
    network: 'Base Sepolia',
    status: 'pending',
    estimatedFee: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
];
