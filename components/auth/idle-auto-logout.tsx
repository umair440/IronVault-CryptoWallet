'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const IDLE_MS = 5 * 60 * 1000;
const CHECK_INTERVAL_MS = 15_000;

/**
 * Clears the session after no user activity for {@link IDLE_MS}.
 * Mounted from AppShell on authenticated app routes.
 */
export function IdleAutoLogout() {
  const router = useRouter();
  const lastActivityRef = useRef(Date.now());
  const loggingOutRef = useRef(false);

  useEffect(() => {
    function markActivity() {
      lastActivityRef.current = Date.now();
    }

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
      if (Date.now() - lastActivityRef.current < IDLE_MS) {
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
    }, CHECK_INTERVAL_MS);

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

  return null;
}
