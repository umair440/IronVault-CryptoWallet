import { AppShell } from '@/components/layout/app-shell';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { prisma } from '@/lib/prisma';
import { requireSession, roleLabels } from '@/lib/session';

export default async function SettingsPage() {
  const session = await requireSession();

  const [user, wallets] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailNotifications: true },
    }),
    prisma.wallet.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true, network: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return (
    <AppShell>
      <div>
        <span className="badge">Security first</span>
        <h1 className="mt-3 text-3xl font-bold">Wallet settings</h1>
        <p className="mt-2 text-slate-400">
          Signed in as {session.user.username} ({roleLabels[session.user.role]}).
        </p>
      </div>
      <SettingsPanel
        username={session.user.username}
        emailNotifications={user?.emailNotifications ?? false}
        wallets={wallets}
      />
    </AppShell>
  );
}
