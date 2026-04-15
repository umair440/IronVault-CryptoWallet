import { IdleAutoLogout } from '@/components/auth/idle-auto-logout';
import { Sidebar } from '@/components/layout/sidebar';

/** Matches dashboard: outer padding and grid with nav sidebar. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IdleAutoLogout />
      <main className="grid min-h-screen w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[256px_1fr]">
        <div className="self-start lg:sticky lg:top-8 lg:shrink-0">
          <Sidebar />
        </div>
        <section className="min-w-0 space-y-6">{children}</section>
      </main>
    </>
  );
}
