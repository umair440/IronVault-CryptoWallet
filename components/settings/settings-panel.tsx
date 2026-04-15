'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';

type Wallet = { id: string; name: string; network: string };

type Props = {
  username: string;
  emailNotifications: boolean;
  wallets: Wallet[];
};

type Section = 'password' | 'recovery' | 'notifications' | 'username' | null;

export function SettingsPanel({ username, emailNotifications: initialNotifications, wallets }: Props) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Recovery phrase state
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id ?? '');
  const [passphrase, setPassphrase] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySubmitting, setRecoverySubmitting] = useState(false);

  // Notifications state
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialNotifications);
  const [notificationsError, setNotificationsError] = useState('');

  // Username state
  const [newUsername, setNewUsername] = useState(username);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [usernameSubmitting, setUsernameSubmitting] = useState(false);

  function toggleSection(section: Section) {
    setActiveSection((prev) => (prev === section ? null : section));
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordSubmitting(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json() as { message?: string; error?: string | { fieldErrors?: Record<string, string[]> } };
      if (!res.ok) {
        setPasswordError(typeof data.error === 'string' ? data.error : 'Unable to update password.');
        return;
      }
      setPasswordSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      setPasswordError('Unable to reach the server. Please try again.');
    } finally {
      setPasswordSubmitting(false);
    }
  }

  async function handleRevealPhrase(e: React.FormEvent) {
    e.preventDefault();
    setRecoveryError('');
    setRecoveryPhrase('');
    setRecoverySubmitting(true);
    try {
      const res = await fetch(`/api/wallet/${selectedWalletId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
      });
      const data = await res.json() as { recoveryPhrase?: string; error?: string };
      if (!res.ok) {
        setRecoveryError(typeof data.error === 'string' ? data.error : 'Unable to reveal recovery phrase.');
        return;
      }
      setRecoveryPhrase(data.recoveryPhrase ?? '');
      setPassphrase('');
    } catch {
      setRecoveryError('Unable to reach the server. Please try again.');
    } finally {
      setRecoverySubmitting(false);
    }
  }

  async function handleNotificationsToggle() {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    setNotificationsError('');
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailNotifications: next }),
      });
      if (!res.ok) {
        setNotificationsEnabled(!next);
        setNotificationsError('Unable to save preference.');
      }
    } catch {
      setNotificationsEnabled(!next);
      setNotificationsError('Unable to reach the server.');
    }
  }

  async function handleUsernameChange(e: React.FormEvent) {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess('');
    setUsernameSubmitting(true);
    try {
      const res = await fetch('/api/user/username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername }),
      });
      const data = await res.json() as { message?: string; error?: string | { fieldErrors?: Record<string, string[]> } };
      if (!res.ok) {
        setUsernameError(typeof data.error === 'string' ? data.error : 'Unable to update username.');
        return;
      }
      setUsernameSuccess('Username updated successfully.');
      router.refresh();
    } catch {
      setUsernameError('Unable to reach the server. Please try again.');
    } finally {
      setUsernameSubmitting(false);
    }
  }

  const inputClass = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500';
  const btnPrimary = 'rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70';

  return (
    <div className="space-y-4">

      {/* Change Password */}
      <div className="card p-6">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => toggleSection('password')}
        >
          <div>
            <p className="font-semibold text-white">Change password</p>
            <p className="mt-0.5 text-sm text-slate-400">Update your account login password.</p>
          </div>
          {activeSection === 'password' ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {activeSection === 'password' && (
          <form className="mt-5 space-y-4" onSubmit={handlePasswordChange}>
            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Current password</span>
              <input
                type="password"
                className={inputClass}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-slate-300">New password</span>
              <input
                type="password"
                className={inputClass}
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </label>
            {passwordError && <p className="text-sm text-rose-400">{passwordError}</p>}
            {passwordSuccess && <p className="text-sm text-emerald-400">{passwordSuccess}</p>}
            <button type="submit" disabled={passwordSubmitting} className={btnPrimary}>
              {passwordSubmitting ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>

      {/* View Recovery Phrase */}
      <div className="card p-6">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => toggleSection('recovery')}
        >
          <div>
            <p className="font-semibold text-white">View recovery phrase</p>
            <p className="mt-0.5 text-sm text-slate-400">Reveal the recovery phrase for one of your wallets.</p>
          </div>
          {activeSection === 'recovery' ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {activeSection === 'recovery' && (
          <div className="mt-5">
            {wallets.length === 0 ? (
              <p className="text-sm text-slate-400">You have no wallets yet.</p>
            ) : recoveryPhrase ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">Recovery phrase — keep this secret</p>
                  <p className="font-mono text-sm leading-relaxed text-amber-200">{recoveryPhrase}</p>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
                  onClick={() => setRecoveryPhrase('')}
                >
                  Hide phrase
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleRevealPhrase}>
                <label className="grid gap-2">
                  <span className="text-sm text-slate-300">Wallet</span>
                  <select
                    className={inputClass}
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} — {w.network}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm text-slate-300">Wallet passphrase</span>
                  <input
                    type="password"
                    className={inputClass}
                    minLength={14}
                    placeholder="Enter wallet passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    required
                  />
                </label>
                {recoveryError && <p className="text-sm text-rose-400">{recoveryError}</p>}
                <button type="submit" disabled={recoverySubmitting} className={btnPrimary}>
                  {recoverySubmitting ? 'Verifying...' : 'Reveal phrase'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Email Notifications */}
      <div className="card p-6">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => toggleSection('notifications')}
        >
          <div>
            <p className="font-semibold text-white">Email notifications</p>
            <p className="mt-0.5 text-sm text-slate-400">Receive email alerts for transactions and security events.</p>
          </div>
          {activeSection === 'notifications' ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {activeSection === 'notifications' && (
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">
                {notificationsEnabled ? 'Notifications are enabled' : 'Notifications are disabled'}
              </span>
              <button
                type="button"
                onClick={handleNotificationsToggle}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                role="switch"
                aria-checked={notificationsEnabled}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
            {notificationsError && <p className="mt-2 text-sm text-rose-400">{notificationsError}</p>}
          </div>
        )}
      </div>

      {/* Change Username */}
      <div className="card p-6">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => toggleSection('username')}
        >
          <div>
            <p className="font-semibold text-white">Change username</p>
            <p className="mt-0.5 text-sm text-slate-400">Update the name shown on your account.</p>
          </div>
          {activeSection === 'username' ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {activeSection === 'username' && (
          <form className="mt-5 space-y-4" onSubmit={handleUsernameChange}>
            <label className="grid gap-2">
              <span className="text-sm text-slate-300">New username</span>
              <input
                type="text"
                className={inputClass}
                minLength={3}
                maxLength={30}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </label>
            {usernameError && <p className="text-sm text-rose-400">{usernameError}</p>}
            {usernameSuccess && <p className="text-sm text-emerald-400">{usernameSuccess}</p>}
            <button type="submit" disabled={usernameSubmitting} className={btnPrimary}>
              {usernameSubmitting ? 'Saving...' : 'Save username'}
            </button>
          </form>
        )}
      </div>

    </div>
  );
}
