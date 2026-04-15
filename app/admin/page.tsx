import { AppShell } from '@/components/layout/app-shell';
import { requireRole, roleLabels } from '@/lib/session';

export default async function AdminPage() {
  const session = await requireRole(['ADMIN', 'DEVELOPER']);

  return (
    <AppShell>
      <div>
        <span className="badge">{session.user.role === 'ADMIN' ? 'Admin monitoring' : 'Developer diagnostics'}</span>
        <h1 className="mt-3 text-3xl font-bold">Operations dashboard</h1>
        <p className="mt-2 text-slate-400">
          Use this page for pending transaction monitoring, service status, and support tickets.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Access granted for {session.user.username} ({roleLabels[session.user.role]}).
        </p>
      </div>
    </AppShell>
  );
}
