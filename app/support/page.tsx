import { AppShell } from '@/components/layout/app-shell';
import { requireSession } from '@/lib/session';
import { submitSupportTicket } from '@/app/admin/actions';
import { prisma } from '@/lib/prisma';

export default async function SupportPage() {
  const session = await requireSession();

  const myTickets = await prisma.supportTicket.findMany({
    where: { submitterId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const statusColour: Record<string, string> = {
    OPEN: 'bg-blue-500/10 text-blue-400',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-400',
    RESOLVED: 'bg-emerald-500/10 text-emerald-400',
    CLOSED: 'bg-slate-700 text-slate-300',
  };

  const statusLabel: Record<string, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
  };

  return (
    <AppShell>
      <div>
        <span className="badge">Support</span>
        <h1 className="mt-3 text-3xl font-bold">Submit a support ticket</h1>
        <p className="mt-2 text-slate-400">
          Describe your issue and our team will get back to you.
        </p>
      </div>

      {/* Submission form */}
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold">New ticket</h2>
        <form action={submitSupportTicket} className="space-y-4">
          <div>
            <label htmlFor="subject" className="mb-1 block text-sm text-slate-400">
              Subject
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              required
              maxLength={120}
              placeholder="Brief summary of the issue"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="message" className="mb-1 block text-sm text-slate-400">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              maxLength={2000}
              placeholder="Describe the problem in detail…"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            Submit ticket
          </button>
        </form>
      </div>

      {/* Past tickets for this user */}
      {myTickets.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-800 p-4">
            <h2 className="text-lg font-semibold">Your tickets</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {myTickets.map((ticket) => (
              <div key={ticket.id} className="flex flex-col gap-1 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{ticket.subject}</p>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-1 text-xs font-medium ${statusColour[ticket.status]}`}
                  >
                    {statusLabel[ticket.status]}
                  </span>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2">{ticket.message}</p>
                <p className="text-xs text-slate-500">
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
