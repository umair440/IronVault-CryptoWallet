'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

type RegisterFormData = {
  username: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'DEVELOPER' | 'BEGINNER_TRADER' | 'GENERIC_TRADER';
};

export default function RegisterPage() {
  const router = useRouter();
  // Controlled form state keeps the inputs and request payload in sync.
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    role: 'BEGINNER_TRADER',
  });
  // These flags drive the feedback text and submit button behaviour.
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Lets the user temporarily reveal the password they are typing.
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function checkSession() {
      const response = await fetch('/api/auth/session');
      const data = (await response.json()) as { authenticated?: boolean };

      if (!ignore && data.authenticated) {
        router.replace('/dashboard');
      }
    }

    void checkSession();

    return () => {
      ignore = true;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Clear old messages before starting a new registration attempt.
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      // The API route handles validation, password hashing, and MongoDB persistence.
      const response = await fetch('/api/auth/register', {
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
          // Zod field errors come back grouped by field, so surface the first useful message.
          const fieldErrors = data.error?.fieldErrors ?? {};
          const firstFieldError = Object.values(fieldErrors).flat()[0];
          setError(firstFieldError ?? 'Unable to create account.');
        }
        return;
      }

      // Reset the form after a successful account creation.
      setSuccessMessage(data.message ?? 'Account created successfully.');
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'BEGINNER_TRADER',
      });

      // Give users a moment to see success feedback before moving them to login.
      window.setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (submissionError) {
      console.error('Registration request failed:', submissionError);
      setError('Unable to create account right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <div className="card w-full p-6">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="mt-2 text-sm text-slate-400">Register a new IronVault account to get started.</p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          {/* Basic identity fields sent directly to the registration API. */}
          <input
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="Username"
            value={formData.username}
            onChange={(event) => setFormData((current) => ({ ...current, username: event.target.value }))}
            autoComplete="username"
            required
          />
          <input
            type="email"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="Email"
            value={formData.email}
            onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
            autoComplete="email"
            required
          />
          <select
            className="rounded-xl border border-slate-700 bg-slate-950 px-2 py-2"
            value={formData.role}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                role: event.target.value as RegisterFormData['role'],
              }))
            }
          >
            <option value="BEGINNER_TRADER">Beginner trader</option>
            <option value="GENERIC_TRADER">Experienced trader</option>
          </select>
          {/* The password input is wrapped so the visibility toggle can sit inside the field. */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 pr-11"
              placeholder="Password"
              value={formData.password}
              onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <button
              type="button"
              // Keep the toggle inside the input without affecting form submission.
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-200"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Only one of these messages is usually visible, depending on the request outcome. */}
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-400">{successMessage}</p> : null}
          <button
            type="submit"
            className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
