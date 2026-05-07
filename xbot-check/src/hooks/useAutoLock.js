import { useEffect, useRef, useCallback } from 'react';

const AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Auto-lock the vault after N minutes of inactivity.
 * Listens to touch, mouse, and keyboard events to reset the timer.
 */
export default function useAutoLock(onLock, enabled = true) {
  const timerRef = useRef(null);
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (enabled) {
      timerRef.current = setTimeout(() => {
        onLockRef.current();
      }, AUTO_LOCK_MS);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const events = ['touchstart', 'mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // start on mount

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [resetTimer, enabled]);
}
