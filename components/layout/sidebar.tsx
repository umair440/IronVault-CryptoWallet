import type { Route } from 'next';
import Link from 'next/link';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, Settings, Shield, House, WalletCards, BookUser, Search, TrendingUp } from 'lucide-react';
import { LogoutButton } from '@/components/auth/logout-button';
import { requireSession, roleLabels } from '@/lib/session';
// ...
const baseItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Wallet },
  { href: '/portfolio', label: 'Portfolio', icon: TrendingUp },   // ← new
  { href: '/wallets',   label: 'Wallets',   icon: WalletCards },
  { href: '/send', label: 'Send', icon: ArrowUpRight },
  { href: '/receive', label: 'Receive', icon: ArrowDownLeft },
  { href: '/transactions', label: 'History', icon: History },
  { href: '/contacts', label: 'Contacts', icon: BookUser },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
] satisfies Array<{ href: Route; label: string; icon: typeof Wallet }>;

const privilegedItems = [{ href: '/admin', label: 'Admin', icon: Shield }] satisfies Array<{
  href: Route;
  label: string;
  icon: typeof Wallet;
}>;

export async function Sidebar() {
  const session = await requireSession();
  const items =
    session.user.role === 'ADMIN' || session.user.role === 'DEVELOPER'
      ? [...baseItems, ...privilegedItems]
      : baseItems;

  return (
    <aside className="card h-fit w-full p-4 lg:w-64">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">IronVault</p>
        <h2 className="text-xl font-bold">Crypto Wallet</h2>
        <p className="mt-3 text-sm font-medium text-white">{session.user.username}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{roleLabels[session.user.role]}</p>
      </div>
      <nav className="space-y-2">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white">
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        <LogoutButton />
        <Link href="/" className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white">
          <House className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </aside>
  );
}
