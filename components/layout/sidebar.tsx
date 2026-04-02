import type { Route } from 'next';
import Link from 'next/link';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, Settings, Shield } from 'lucide-react';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: Wallet },
  { href: '/send', label: 'Send', icon: ArrowUpRight },
  { href: '/receive', label: 'Receive', icon: ArrowDownLeft },
  { href: '/transactions', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/admin', label: 'Admin', icon: Shield },
  // `satisfies` keeps the literal route strings while still enforcing typed-route safety.
] satisfies Array<{ href: Route; label: string; icon: typeof Wallet }>;

export function Sidebar() {
  return (
    <aside className="card h-fit w-full p-4 lg:w-64">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">IronVault</p>
        <h2 className="text-xl font-bold">Student MVP</h2>
      </div>
      <nav className="space-y-2">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
