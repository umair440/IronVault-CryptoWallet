import QRCode from 'qrcode';
import { AppShell } from '@/components/layout/app-shell';
import { CopyButton } from '@/components/wallet/copy-button';
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

  // Generate QR SVGs server-side — no client-side JS needed.
  const walletsWithQR = await Promise.all(
    wallets.map(async (wallet) => {
      const address = wallet.addresses[0]?.address ?? null;
      const qrSvg = address
        ? await QRCode.toString(address, { type: 'svg', margin: 1, color: { dark: '#e2e8f0', light: '#0f172a' } })
        : null;
      return { ...wallet, qrSvg };
    }),
  );

  return (
    <AppShell>
      <div>
        <span className="badge">RQ13</span>
        <h1 className="mt-3 text-3xl font-bold">Receive crypto</h1>
        <p className="mt-2 text-slate-400">Share your wallet address or QR code with the sender.</p>
      </div>
      <div className="card p-6">
        {walletsWithQR.length > 0 ? (
          <div className="grid gap-6">
            {walletsWithQR.map((wallet) => (
              <div key={wallet.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm font-semibold text-white">{wallet.name}</p>
                <p className="mt-1 text-sm text-slate-400">{wallet.network}</p>
                {wallet.addresses[0] ? (
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                    {wallet.qrSvg ? (
                      <div
                        className="h-32 w-32 shrink-0 overflow-hidden rounded-xl"
                        dangerouslySetInnerHTML={{ __html: wallet.qrSvg }}
                      />
                    ) : null}
                    <div className="flex-1">
                      <p className="text-sm text-slate-400">Main wallet address</p>
                      <p className="mt-2 break-all rounded-xl bg-slate-950 p-3 font-mono text-sm">
                        {wallet.addresses[0].address}
                      </p>
                      <div className="mt-3">
                        <CopyButton address={wallet.addresses[0].address} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Create a wallet from the dashboard before receiving funds.</p>
        )}
      </div>
    </AppShell>
  );
}
