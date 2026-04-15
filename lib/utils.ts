export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function shortenAddress(address: string) {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Threshold after which a pending transaction is considered "stuck".
// RQ19: notify users when a transaction remains pending beyond this window.
export const STUCK_TRANSACTION_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export function isTransactionStuck(
  status: string,
  createdAt: string | Date,
  now: Date = new Date(),
): boolean {
  if (status !== 'pending' && status !== 'PENDING') return false;
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  return now.getTime() - created.getTime() > STUCK_TRANSACTION_THRESHOLD_MS;
}

export function formatDurationSince(from: string | Date, now: Date = new Date()): string {
  const fromDate = typeof from === 'string' ? new Date(from) : from;
  const diffMs = Math.max(0, now.getTime() - fromDate.getTime());
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
