'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type LoginFormData = {
  identifier: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  // Controlled form state keeps the visible inputs aligned with the request payload.
  const [formData, setFormData] = useState<LoginFormData>({
    identifier: '',
    password: '',
  });
  // These values drive the request feedback shown below the fields.
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      // The API route checks whether the account exists and compares the stored password hash.
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as {
        error?: string | { fieldErrors?: Record<string, string[]> };
        message?: string;
      };

      if (!response.ok) {
        if (typeof data.error === 'string') {
          setError(data.error);
        } else {
          const fieldErrors = data.error?.fieldErrors ?? {};
          const firstFieldError = Object.values(fieldErrors).flat()[0];
          setError(firstFieldError ?? 'Unable to log in.');
        }
        return;
      }

      setSuccessMessage(data.message ?? 'Login successful.');

      // This app does not have sessions yet, so redirect after a successful credential check.
      window.setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (submissionError) {
      console.error('Login request failed:', submissionError);
      setError('Unable to log in right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <div className="card w-full p-6">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="mt-2 text-sm text-slate-400">Enter your account details to access IronVault.</p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <input
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="Username or email"
            value={formData.identifier}
            onChange={(event) => setFormData((current) => ({ ...current, identifier: event.target.value }))}
            autoComplete="username"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 pr-11"
              placeholder="Password"
              value={formData.password}
              onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-200"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-400">{successMessage}</p> : null}
          <button
            type="submit"
            className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Checking account...' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-400">
          Need an account?{' '}
          <Link href="/register" className="font-medium text-emerald-400 hover:text-emerald-300">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
