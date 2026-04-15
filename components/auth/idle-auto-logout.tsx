'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const IDLE_MS = 5 * 60 * 1000;
/** Show countdown after this much idle time (10s while verifying behavior; raise for production UX). */
const WARNING_AFTER_IDLE_MS = 10 * 1000;
const TICK_MS = 1_000;

/**
 * Clears the session after no user activity for {@link IDLE_MS}.
 * Mounted from AppShell on authenticated app routes.
 */
export function IdleAutoLogout() {
  const router = useRouter();
  const lastActivityRef = useRef(Date.now());
  const loggingOutRef = useRef(false);
  const staySignedInRef = useRef<() => void>(() => {});
  const [remainingMs, setRemainingMs] = useState(IDLE_MS);

  useEffect(() => {
    function markActivity() {
      lastActivityRef.current = Date.now();
      setRemainingMs(IDLE_MS);
    }

    staySignedInRef.current = markActivity;

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    function markActivityThrottled() {
      if (throttleTimer !== null) {
        return;
      }
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        markActivity();
      }, 1000);
    }

    const events: Array<{ name: keyof WindowEventMap; useThrottle: boolean }> = [
      { name: 'mousedown', useThrottle: false },
      { name: 'mousemove', useThrottle: true },
      { name: 'keydown', useThrottle: false },
      { name: 'scroll', useThrottle: false },
      { name: 'touchstart', useThrottle: false },
      { name: 'click', useThrottle: false },
      { name: 'wheel', useThrottle: false },
      { name: 'focus', useThrottle: false },
    ];

    for (const { name, useThrottle } of events) {
      const handler = useThrottle ? markActivityThrottled : markActivity;
      window.addEventListener(name, handler as EventListener, { passive: true });
    }

    const interval = setInterval(() => {
      if (loggingOutRef.current) {
        return;
      }

      const idleForMs = Date.now() - lastActivityRef.current;
      const nextRemainingMs = Math.max(0, IDLE_MS - idleForMs);

      if (idleForMs < WARNING_AFTER_IDLE_MS) {
        setRemainingMs((prev) => (prev === IDLE_MS ? prev : IDLE_MS));
        return;
      }

      setRemainingMs(nextRemainingMs);

      if (idleForMs < IDLE_MS) {
        return;
      }

      loggingOutRef.current = true;
      clearInterval(interval);

      void (async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } finally {
          router.push('/');
          router.refresh();
        }
      })();
    }, TICK_MS);

    return () => {
      clearInterval(interval);
      if (throttleTimer !== null) {
        clearTimeout(throttleTimer);
      }
      for (const { name, useThrottle } of events) {
        const handler = useThrottle ? markActivityThrottled : markActivity;
        window.removeEventListener(name, handler as EventListener);
      }
    };
  }, [router]);

  if (remainingMs === IDLE_MS) {
    return null;
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2"
    >
      <div className="pointer-events-auto flex max-w-[min(100vw-2rem,40rem)] flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border border-red-400/45 bg-red-950/90 px-4 py-2.5 text-center text-sm text-red-50 shadow-[0_8px_30px_rgba(127,29,29,0.35)] backdrop-blur-md sm:px-5">
        <span className="font-medium text-red-200/95">
          Signing out for inactivity in{' '}
          <span className="tabular-nums font-semibold text-red-50">{timeText}</span>
        </span>
        <button
          type="button"
          className="shrink-0 rounded-full border border-red-300/55 bg-red-900/85 px-3 py-1 text-xs font-semibold text-red-50 transition hover:border-red-200/70 hover:bg-red-800/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
          onClick={() => staySignedInRef.current()}
        >
          Stay signed in
        </button>
      </div>
    </div>
  );
}
