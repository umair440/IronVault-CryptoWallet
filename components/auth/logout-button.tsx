'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      className="w-full rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
      onClick={handleLogout}
      disabled={isSubmitting}
    >
      {isSubmitting ? 'Logging out...' : 'Log out'}
    </button>
  );
}
