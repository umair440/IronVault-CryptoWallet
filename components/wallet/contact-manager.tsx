'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { shortenAddress } from '@/lib/utils';
import type { Contact } from '@/types';

type Props = {
  contacts: Contact[];
};

export function ContactManager({ contacts: initialContacts }: Props) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address }),
      });

      const data = (await response.json()) as {
        error?: string | { fieldErrors?: Record<string, string[]> };
        contact?: Contact;
      };

      if (!response.ok) {
        if (typeof data.error === 'string') {
          setError(data.error);
        } else {
          const fieldErrors = data.error?.fieldErrors ?? {};
          setError(Object.values(fieldErrors).flat()[0] ?? 'Unable to save contact.');
        }
        return;
      }

      setContacts((prev) => [data.contact!, ...prev]);
      setName('');
      setAddress('');
      router.refresh();
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      }
    } catch {
      // Silently fail — user can refresh if needed
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold">Add contact</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleAdd}>
          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Name</span>
            <input
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
              placeholder="Alice"
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Address</span>
            <input
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </label>

          {error ? <p className="text-sm text-rose-400 md:col-span-2">{error}</p> : null}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Save contact'}
            </button>
          </div>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Saved contacts</h2>
        {contacts.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No contacts saved yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-800">
            {contacts.map((contact) => (
              <li key={contact.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{contact.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-slate-400">{contact.address}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(contact.id)}
                  className="text-xs text-rose-400 transition hover:text-rose-300"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
