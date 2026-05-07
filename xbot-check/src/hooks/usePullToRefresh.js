import { useRef, useCallback } from 'react';

const THRESHOLD = 80; // px to pull before triggering

/**
 * Pull-to-refresh hook for mobile.
 * Attach onTouchStart/onTouchMove/onTouchEnd to a scrollable container.
 * Returns { pullDistance, pulling, handlers }
 */
export default function usePullToRefresh(onRefresh) {
  const startY = useRef(0);
  const pullDistance = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    const el = containerRef.current || e.currentTarget;
    if (el.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - startY.current;
    pullDistance.current = Math.max(0, Math.min(delta, 120));
  }, []);

  const onTouchEnd = useCallback(() => {
    if (pulling.current && pullDistance.current >= THRESHOLD) {
      onRefresh();
    }
    pulling.current = false;
    pullDistance.current = 0;
    startY.current = 0;
  }, [onRefresh]);

  return {
    containerRef,
    handlers: { onTouchStart, onTouchMove, onTouchEnd }
  };
}
