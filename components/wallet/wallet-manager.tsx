'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type WalletSummary = {
  id: string;
  name: string;
  network: string;
  createdAt: string | Date;
  addresses: Array<{
    id: string;
    label: string;
    address: string;
    network: string;
  }>;
};

type WalletManagerProps = {
  wallets: WalletSummary[];
};

type CreateWalletForm = {
  walletName: string;
  network: 'Ethereum Sepolia' | 'Polygon Amoy' | 'Base Sepolia';
  passphrase: string;
};

export function WalletManager({ wallets }: WalletManagerProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateWalletForm>({
    walletName: '',
    network: 'Ethereum Sepolia',
    passphrase: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setRecoveryPhrase('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as {
        error?: string | { fieldErrors?: Record<string, string[]> };
        wallet?: { name: string };
        recoveryPhrase?: string;
      };

      if (!response.ok) {
        if (typeof data.error === 'string') {
          setError(data.error);
        } else {
          const fieldErrors = data.error?.fieldErrors ?? {};
          setError(Object.values(fieldErrors).flat()[0] ?? 'Unable to create wallet.');
        }
        return;
      }

      setSuccessMessage(`Created ${data.wallet?.name ?? 'wallet'} successfully.`);
      setRecoveryPhrase(data.recoveryPhrase ?? '');
      setFormData({
        walletName: '',
        network: 'Ethereum Sepolia',
        passphrase: '',
      });
      router.refresh();
    } catch (submissionError) {
      console.error('Wallet creation failed:', submissionError);
      setError('Unable to create wallet right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Your wallets</h2>
            <p className="mt-1 text-sm text-slate-400">
              This account currently has {wallets.length} wallet{wallets.length === 1 ? '' : 's'}.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          {wallets.length > 0 ? (
            wallets.map((wallet) => (
              <div key={wallet.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{wallet.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{wallet.network}</p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {new Date(wallet.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4 grid gap-2">
                  {wallet.addresses.map((address) => (
                    <div key={address.id} className="rounded-xl border border-slate-800 px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{address.label}</p>
                      <p className="mt-1 break-all font-mono text-sm text-slate-200">{address.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
              No wallets created yet. Use the form to create your first wallet.
            </div>
          )}
        </div>
      </div>
      <div className="card p-6">
        <h2 className="text-xl font-semibold">Create another wallet</h2>
        <p className="mt-1 text-sm text-slate-400">Each wallet gets its own encrypted recovery phrase and main address.</p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Wallet name</span>
            <input
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
              value={formData.walletName}
              onChange={(event) => setFormData((current) => ({ ...current, walletName: event.target.value }))}
              placeholder="Trading wallet"
              required
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Network</span>
            <select
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
              value={formData.network}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  network: event.target.value as CreateWalletForm['network'],
                }))
              }
            >
              <option value="Ethereum Sepolia">Ethereum Sepolia</option>
              <option value="Polygon Amoy">Polygon Amoy</option>
              <option value="Base Sepolia">Base Sepolia</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Encryption passphrase</span>
            <input
              type="password"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
              value={formData.passphrase}
              onChange={(event) => setFormData((current) => ({ ...current, passphrase: event.target.value }))}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />
          </label>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-400">{successMessage}</p> : null}
          {recoveryPhrase ? (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-200">Recovery phrase</p>
              <p className="mt-2 font-mono text-sm text-amber-100">{recoveryPhrase}</p>
            </div>
          ) : null}
          <button
            type="submit"
            className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating wallet...' : 'Create wallet'}
          </button>
        </form>
      </div>
    </div>
  );
}
