import { Sidebar } from '@/components/layout/sidebar';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';

export default async function ReceivePage() {
  const session = await requireSession();
  const wallets = await prisma.wallet.findMany({
    where: {
      ownerId: session.user.id,
    },
    include: {
      addresses: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[256px_1fr]">
      <Sidebar />
      <section className="space-y-6">
        <div>
          <span className="badge">RQ13</span>
          <h1 className="mt-3 text-3xl font-bold">Receive crypto</h1>
        </div>
        <div className="card max-w-3xl p-6">
          {wallets.length > 0 ? (
            <div className="grid gap-4">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-sm font-semibold text-white">{wallet.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{wallet.network}</p>
                  {wallet.addresses[0] ? (
                    <>
                      <p className="mt-4 text-sm text-slate-400">Main wallet address</p>
                      <p className="mt-2 break-all rounded-xl bg-slate-950 p-3 font-mono text-sm">{wallet.addresses[0].address}</p>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Create a wallet from the dashboard before receiving funds.</p>
          )}
        </div>
      </section>
    </main>
  );
}
