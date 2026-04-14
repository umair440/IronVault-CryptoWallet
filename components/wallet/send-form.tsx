'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency, shortenAddress } from '@/lib/utils';
import type { WalletOption, SupportedNetwork, Contact } from '@/types';

type Props = {
  wallets: WalletOption[];
  contacts: Contact[];
};

type Step = 'input' | 'confirmation' | 'result';

type FormData = {
  walletId: string;
  recipientAddress: string;
  network: SupportedNetwork;
  assetSymbol: string;
  amount: string;
  recipientSaved: boolean;
};

type Draft = {
  id: string;
  senderAddress: string | null;
  recipientAddress: string;
  network: string;
  assetSymbol: string;
  amount: number;
  estimatedFee: number;
  warnings: string[];
};

type Result = {
  id: string;
  txHash: string;
  status: string;
  amount: number;
  assetSymbol: string;
  network: string;
  recipientAddress: string | null;
};

const SUPPORTED_ASSETS = ['ETH', 'MATIC', 'USDC'] as const;

export function SendForm({ wallets, contacts }: Props) {
  const router = useRouter();

  const firstWallet = wallets[0];
  const [step, setStep] = useState<Step>('input');
  const [formData, setFormData] = useState<FormData>({
    walletId: firstWallet?.id ?? '',
    recipientAddress: '',
    network: (firstWallet?.network ?? 'Ethereum Sepolia') as SupportedNetwork,
    assetSymbol: 'ETH',
    amount: '',
    recipientSaved: false,
  });
  const [selectedContactId, setSelectedContactId] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [addressConfirmed, setAddressConfirmed] = useState(false);

  function handleContactSelect(id: string) {
    if (id === '') {
      setSelectedContactId('');
      setFormData((prev) => ({ ...prev, recipientAddress: '', recipientSaved: false }));
    } else {
      const contact = contacts.find((c) => c.id === id);
      if (contact) {
        setSelectedContactId(id);
        setFormData((prev) => ({ ...prev, recipientAddress: contact.address, recipientSaved: true }));
      }
    }
  }

  function handleWalletChange(walletId: string) {
    const selected = wallets.find((w) => w.id === walletId);
    setFormData((prev) => ({
      ...prev,
      walletId,
      network: selected?.network ?? prev.network,
    }));
  }

  function getSelectedWallet() {
  return wallets.find((wallet) => wallet.id === formData.walletId);
}

function getSelectedWalletAssetBalance() {
  const selectedWallet = getSelectedWallet();
  if (!selectedWallet || !selectedWallet.balances) return 0;

  const value = selectedWallet.balances[formData.assetSymbol as 'ETH' | 'MATIC' | 'USDC'];
  return typeof value === 'number' ? value : 0;
}

function setQuickAmount(value: number) {
  setFormData((prev) => ({
    ...prev,
    amount: value > 0 ? value.toFixed(4).replace(/\.?0+$/, '') : '',
  }));
}

function setMaxAmount() {
  const balance = getSelectedWalletAssetBalance();

  let estimatedFee = 0;

  if (formData.assetSymbol === 'ETH') {
    estimatedFee = 0.001;
  } else if (formData.assetSymbol === 'MATIC') {
    estimatedFee = 0.01;
  } else {
    estimatedFee = 0;
  }

  const maxAmount = Math.max(balance - estimatedFee, 0);

  if (maxAmount <= 0) {
    setError('Not enough balance to cover network fees.');
    return;
  }

  setError('');
  setFormData((prev) => ({
    ...prev,
    amount: maxAmount.toFixed(4).replace(/\.?0+$/, ''),
  }));
}

  async function handleInitiate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      const data = (await response.json()) as {
        error?: string | { fieldErrors?: Record<string, string[]> };
        draft?: Draft;
      };

      if (!response.ok) {
        if (typeof data.error === 'string') {
          setError(data.error);
        } else {
          const fieldErrors = data.error?.fieldErrors ?? {};
          setError(Object.values(fieldErrors).flat()[0] ?? 'Unable to process transaction.');
        }
        return;
      }

      setDraft(data.draft!);
      setAddressConfirmed(false);
      setStep('confirmation');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (!draft) return;
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/transactions/${draft.id}/submit`, {
        method: 'POST',
      });

      const data = (await response.json()) as {
        error?: string;
        result?: Result;
      };

      if (!response.ok) {
        setError(data.error ?? 'Unable to submit transaction.');
        return;
      }

      setResult(data.result!);
      setStep('result');
      router.refresh();
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setStep('input');
    setDraft(null);
    setResult(null);
    setError('');
    setAddressConfirmed(false);
    setSelectedContactId('');
    setFormData((prev) => ({
      ...prev,
      recipientAddress: '',
      amount: '',
      recipientSaved: false,
    }));
  }

  if (step === 'confirmation' && draft) {
  const total = draft.amount + draft.estimatedFee;
  const hasWarnings = draft.warnings.length > 0;

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-400">Details</span>
        <span className="text-slate-500">→</span>
        <span className="rounded-full bg-emerald-500/20 px-3 py-1 font-semibold text-emerald-300">Confirm</span>
        <span className="text-slate-500">→</span>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-400">Done</span>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold">Confirm transaction</h2>
        <p className="mt-1 text-sm text-slate-400">Review the details below before signing.</p>

        <dl className="mt-6 grid gap-3 text-sm">
          <div className="flex justify-between border-b border-slate-800 pb-3">
            <dt className="text-slate-400">From</dt>
            <dd className="font-mono">{draft.senderAddress ? shortenAddress(draft.senderAddress) : '—'}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-3">
            <dt className="text-slate-400">To</dt>
            <dd className="font-mono">{shortenAddress(draft.recipientAddress)}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-3">
            <dt className="text-slate-400">Network</dt>
            <dd>{draft.network}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-3">
            <dt className="text-slate-400">Amount</dt>
            <dd className="font-semibold">{draft.amount} {draft.assetSymbol}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-3">
            <dt className="text-slate-400">Estimated fee</dt>
            <dd>{formatCurrency(draft.estimatedFee)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Total cost</dt>
            <dd className="font-semibold">{draft.amount} {draft.assetSymbol} + {formatCurrency(total - draft.amount)}</dd>
          </div>  
        </dl>

        {hasWarnings && (
          <div className="mt-5 space-y-2">
            {draft.warnings.map((warning, i) => (
              <div key={i} className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
                <p className="text-sm text-amber-200">⚠ {warning}</p>
              </div>
            ))}
            <label className="mt-3 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-0.5 accent-emerald-500"
                checked={addressConfirmed}
                onChange={(e) => setAddressConfirmed(e.target.checked)}
              />
              <span className="text-sm text-slate-300">I have double-checked the recipient address and confirm it is correct.</span>
            </label>
          </div>
        )}

        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => { setStep('input'); setError(''); }}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (hasWarnings && !addressConfirmed)}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Sending...' : 'Confirm & Send'}
          </button>
        </div>
      </div>
    </div>  
    );
  }

  if (step === 'result' && result) {
  const shortHash = result.txHash
    ? `${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}`
    : '—';

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-400">Details</span>
        <span className="text-slate-500">→</span>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-400">Confirm</span>
        <span className="text-slate-500">→</span>
        <span className="rounded-full bg-emerald-500/20 px-3 py-1 font-semibold text-emerald-300">Done</span>
      </div>

      <div className="card p-6">
        <p className="text-lg font-semibold text-emerald-400">Transaction submitted</p>
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex justify-between border-b border-slate-800 pb-3">
            <dt className="text-slate-400">Amount</dt>
            <dd className="font-semibold">{result.amount} {result.assetSymbol}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-3">
            <dt className="text-slate-400">Network</dt>
            <dd>{result.network}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-3">
            <dt className="text-slate-400">Recipient</dt>
            <dd className="font-mono">{result.recipientAddress ? shortenAddress(result.recipientAddress) : '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Transaction hash</dt>
            <dd className="font-mono text-xs">{shortHash}</dd>
          </div>
        </dl>
        <span className="badge mt-4 inline-block">{result.status}</span>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Send another
          </button>
          <Link
            href="/transactions"
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            View history
          </Link>
        </div>
      </div>
    </div>  
    );
  }

  // Step: input
return (
  <div className="max-w-3xl">
    <div className="mb-4 flex items-center gap-2 text-sm">
      <span className="rounded-full bg-emerald-500/20 px-3 py-1 font-semibold text-emerald-300">Details</span>
      <span className="text-slate-500">→</span>
      <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-400">Confirm</span>
      <span className="text-slate-500">→</span>
      <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-400">Done</span>
    </div>

    <div className="card p-6">
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleInitiate}>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm text-slate-300">From wallet</span>
          <select
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
            value={formData.walletId}
            onChange={(e) => handleWalletChange(e.target.value)}
            required
          >
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name} — {wallet.network}
              </option>
            ))}
          </select>
        </label>

        {contacts.length > 0 && (
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm text-slate-300">
              Select from contacts <span className="text-slate-500">(optional)</span>
            </span>
            <select
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
              value={selectedContactId}
              onChange={(e) => handleContactSelect(e.target.value)}
            >
              <option value="">— Type an address manually —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {shortenAddress(c.address)}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm text-slate-300">Recipient address</span>
          <input
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
            placeholder="0x..."
            value={formData.recipientAddress}
            onChange={(e) => {
              setSelectedContactId('');
              setFormData((prev) => ({ ...prev, recipientAddress: e.target.value, recipientSaved: false }));
            }}
            required
          />
          <p className="text-xs text-slate-500">
           Make sure this address is correct. Transactions cannot be reversed.
          </p>
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Network</span>
          <select
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
            value={formData.network}
            onChange={(e) => setFormData((prev) => ({ ...prev, network: e.target.value as SupportedNetwork }))}
          >
            <option>Ethereum Sepolia</option>
            <option>Polygon Amoy</option>
            <option>Base Sepolia</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Asset</span>
          <select
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
            value={formData.assetSymbol}
            onChange={(e) => setFormData((prev) => ({ ...prev, assetSymbol: e.target.value }))}
          >
            {SUPPORTED_ASSETS.map((sym) => (
              <option key={sym}>{sym}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 md:col-span-2">
  <div className="flex items-center justify-between">
    <span className="text-sm text-slate-300">Amount</span>
    <span className="text-xs text-slate-500">
    Available: {getSelectedWalletAssetBalance().toFixed(4)} {formData.assetSymbol}
    </span>
  </div>

  <input
    type="number"
    step="0.0001"
    min="0.0001"
    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
    placeholder="0.10"
    value={formData.amount}
    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
    required
  />

  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => setQuickAmount(0.1)}
      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
    >
      0.1
    </button>

    <button
      type="button"
      onClick={() => setQuickAmount(0.5)}
      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
    >
      0.5
    </button>

    <button
      type="button"
      onClick={() => setQuickAmount(1)}
      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
    >
      1.0
    </button>

    <button
      type="button"
      onClick={setMaxAmount}
      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
    >
      Max
    </button>
  </div>

  <p className="text-xs text-slate-500">
    Max leaves room for estimated network fees where applicable.
  </p>
</label>

        {error ? <p className="text-sm text-rose-400 md:col-span-2">{error}</p> : null}

        <div className="flex items-center justify-between md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Validating...' : 'Review transaction'}
          </button>
          <Link href="/contacts" className="text-xs text-slate-500 transition hover:text-slate-300">
            Manage address book →
          </Link>
        </div>
      </form>
    </div>
  </div>  
  );
}
