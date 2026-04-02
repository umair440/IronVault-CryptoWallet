import { Sidebar } from '@/components/layout/sidebar';
import { requireSession, roleLabels } from '@/lib/session';

export default async function SettingsPage() {
  const session = await requireSession();

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[256px_1fr]">
      <Sidebar />
      <section className="space-y-6">
        <div>
          <span className="badge">Security first</span>
          <h1 className="mt-3 text-3xl font-bold">Wallet settings</h1>
          <p className="mt-2 text-slate-400">
            Signed in as {session.user.username} ({roleLabels[session.user.role]}).
          </p>
        </div>
        <div className="card max-w-3xl p-6">
          <ul className="space-y-3 text-slate-300">
            <li>• Auto-lock after inactivity</li>
            <li>• Export encrypted backup</li>
            <li>• Enable email notifications</li>
            <li>• Update password / passphrase</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
