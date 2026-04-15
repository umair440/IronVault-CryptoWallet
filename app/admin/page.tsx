import { AppShell } from '@/components/layout/app-shell';
import { requireRole, roleLabels } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { updateTicketStatus } from './actions';
import { CheckCircle, AlertTriangle, WrenchIcon, XCircle, Clock, Ticket, Activity } from 'lucide-react';
import type { TicketStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Static mock — service status is prototype-only, no DB model needed.
// ---------------------------------------------------------------------------
type ServiceStatus = 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE' | 'DOWN';

const SERVICES: Array<{ name: string; status: ServiceStatus }> = [
  { name: 'API Gateway', status: 'OPERATIONAL' },
  { name: 'Database', status: 'OPERATIONAL' },
  { name: 'Transaction Processor', status: 'OPERATIONAL' },
  { name: 'Price Feed', status: 'DEGRADED' },
];

const serviceStatusMeta: Record<ServiceStatus, { label: string; colour: string; icon: typeof CheckCircle }> = {
  OPERATIONAL: { label: 'Operational', colour: 'text-emerald-400', icon: CheckCircle },
  DEGRADED:    { label: 'Degraded',    colour: 'text-amber-400',   icon: AlertTriangle },
  MAINTENANCE: { label: 'Maintenance', colour: 'text-blue-400',    icon: WrenchIcon },
  DOWN:        { label: 'Down',        colour: 'text-rose-400',    icon: XCircle },
};

// ---------------------------------------------------------------------------
// Ticket display helpers
// ---------------------------------------------------------------------------
const ticketStatusColour: Record<TicketStatus, string> = {
  OPEN:        'bg-blue-500/10 text-blue-400',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-400',
  RESOLVED:    'bg-emerald-500/10 text-emerald-400',
  CLOSED:      'bg-slate-700 text-slate-300',
};

const ticketStatusLabel: Record<TicketStatus, string> = {
  OPEN:        'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED:    'Resolved',
  CLOSED:      'Closed',
};

const ALL_TICKET_STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function AdminPage() {
  const session = await requireRole(['ADMIN', 'DEVELOPER']);

  const [tickets, pendingTxRows, openCount] = await Promise.all([
    prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      include: { submitter: { select: { username: true } } },
    }),
    prisma.transaction.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: { wallet: { select: { name: true, owner: { select: { username: true } } } } },
    }),
    prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
  ]);

  const overallHealth = SERVICES.every((s) => s.status === 'OPERATIONAL')
    ? 'ALL_OPERATIONAL'
    : SERVICES.some((s) => s.status === 'DOWN')
    ? 'INCIDENTS'
    : 'ISSUES';

  const healthMeta = {
    ALL_OPERATIONAL: { label: 'All systems operational', colour: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-700/40' },
    ISSUES:          { label: 'Partial issues detected',  colour: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-700/40' },
    INCIDENTS:       { label: 'Active incidents',         colour: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-700/40' },
  }[overallHealth];

  return (
    <AppShell>
      {/* Header */}
      <div>
        <span className="badge">
          {session.user.role === 'ADMIN' ? 'Admin monitoring' : 'Developer diagnostics'}
        </span>
        <h1 className="mt-3 text-3xl font-bold">Operations dashboard</h1>
        <p className="mt-2 text-slate-400">
          Support tickets, service health, and pending transactions across the platform.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Access granted for {session.user.username} ({roleLabels[session.user.role]}).
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Summary stat cards                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5 transition hover:border-slate-600 hover:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Open tickets</p>
            <Ticket className="h-5 w-5 text-blue-400" />
          </div>
          <p className="mt-4 text-3xl font-semibold">{openCount}</p>
        </div>

        <div className="card p-5 transition hover:border-slate-600 hover:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Total tickets</p>
            <Ticket className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-4 text-3xl font-semibold">{tickets.length}</p>
        </div>

        <div className="card p-5 transition hover:border-slate-600 hover:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Platform-wide pending txns</p>
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-4 text-3xl font-semibold">{pendingTxRows.length}</p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. Service status                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold">Service status</h2>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${healthMeta.colour} ${healthMeta.bg}`}
          >
            {healthMeta.label}
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {SERVICES.map((service) => {
            const meta = serviceStatusMeta[service.status];
            const Icon = meta.icon;
            return (
              <div
                key={service.name}
                className="flex items-center justify-between px-4 py-3 transition hover:bg-slate-900/50"
              >
                <p className="text-sm font-medium">{service.name}</p>
                <div className={`flex items-center gap-1.5 text-sm font-medium ${meta.colour}`}>
                  <Icon className="h-4 w-4" />
                  {meta.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Support tickets (primary focus)                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-800 p-4">
          <Ticket className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">Support tickets</h2>
          {openCount > 0 && (
            <span className="ml-auto rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
              {openCount} open
            </span>
          )}
        </div>

        {tickets.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No tickets submitted yet.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {tickets.map((ticket) => {
              const updateAction = updateTicketStatus.bind(null, ticket.id);
              return (
                <div key={ticket.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`shrink-0 rounded-lg px-2 py-1 text-xs font-medium ${ticketStatusColour[ticket.status]}`}
                      >
                        {ticketStatusLabel[ticket.status]}
                      </span>
                      <p className="font-medium">{ticket.subject}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-400 line-clamp-2">{ticket.message}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      From <span className="text-slate-300">{ticket.submitter.username}</span>{' '}
                      · {new Date(ticket.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Status update form */}
                  <form action={updateAction} className="flex shrink-0 items-center gap-2">
                    <select
                      name="status"
                      defaultValue={ticket.status}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 focus:border-emerald-600 focus:outline-none"
                    >
                      {ALL_TICKET_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {ticketStatusLabel[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-xl bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-slate-600"
                    >
                      Update
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-slate-800 px-4 py-3">
          <p className="text-xs text-slate-500">
            Users can submit tickets at{' '}
            <a href="/support" className="text-emerald-400 hover:underline">
              /support
            </a>
            .
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Pending transactions (secondary — rare case)                     */}
      {/* ------------------------------------------------------------------ */}
      <details className="card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 border-b border-slate-800 p-4 transition hover:bg-slate-900/50">
          <Clock className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold">Pending transactions</h2>
          <span className="ml-auto rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
            {pendingTxRows.length}
          </span>
        </summary>

        {pendingTxRows.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No pending transactions platform-wide.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {pendingTxRows.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-col gap-1 px-4 py-3 text-sm transition hover:bg-slate-900/50 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {tx.direction === 'SEND' ? 'Send' : 'Receive'} {tx.amount} {tx.assetSymbol}
                  </p>
                  <p className="text-xs text-slate-400">
                    {tx.network} · wallet "{tx.wallet.name}" · user{' '}
                    <span className="text-slate-300">{tx.wallet.owner.username}</span>
                  </p>
                </div>
                <p className="text-xs text-slate-500 md:text-right">
                  {new Date(tx.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </details>
    </AppShell>
  );
}
