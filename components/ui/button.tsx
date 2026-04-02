import type { Route } from 'next';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  // Typed routes catch invalid internal links at build time.
  href?: Route;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
};

const base =
  'inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400';

export function Button({ children, href, className, type = 'button' }: ButtonProps) {
  if (href) {
    return (
      <Link href={href} className={cn(base, className)}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={cn(base, className)}>
      {children}
    </button>
  );
}
