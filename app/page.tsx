import Link from 'next/link';
import { LogoutButton } from '@/components/auth/logout-button';
import { getSession } from '@/lib/session';

export default async function HomePage() {
  const session = await getSession();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8">
      <nav className="flex items-center justify-between border-b border-slate-800 pb-8">
        <div>
          {session ? (
            <Link
              href="/settings"
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-900 hover:text-white"
            >
              {session.user.username}
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
              >
                Dashboard
              </Link>
              <LogoutButton
                label="Sign out"
                className="w-auto border-transparent bg-emerald-500 px-4 text-slate-950 hover:border-transparent hover:bg-emerald-400 hover:text-slate-950"
              />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
      <section className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-center">
        <div className="max-w-3xl">
          <p className={`text-5xl uppercase tracking-[0.2em] text-emerald-300 md:text-7xl`}>IronVault</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">A beginner friendly crypto wallet.</h1>
          <p className="mt-6 text-lg text-slate-300">
            Crypto with confidence. IronVault is a secure and user-friendly crypto wallet designed for beginners. Manage your assets, track transactions, and explore the world of crypto with ease.
          </p>
        </div>
      </section>
    </main>
  );
}
