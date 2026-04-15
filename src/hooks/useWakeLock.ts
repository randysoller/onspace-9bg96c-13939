/**
 * useWakeLock — prevents the device screen from dimming or sleeping
 * while the metronome (or any feature) is actively running.
 *
 * Uses the Screen Wake Lock API (Baseline 2025 — Chrome 84+, Edge 84+,
 * Safari 16.4+, Firefox 126+). Degrades silently on unsupported browsers.
 *
 * Key behaviors:
 * - Acquires a screen wake lock when `active` is true
 * - Releases the lock when `active` is false or the component unmounts
 * - Re-acquires the lock on `visibilitychange` → visible, because the OS
 *   automatically releases the sentinel when the document becomes hidden
 */

import { useEffect, useRef } from 'react';

export const useWakeLock = (active: boolean): void => {
  // WakeLockSentinel ref — holds the active lock handle so we can release it
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  // Track whether we *want* the lock (mirrors `active`) so the
  // visibilitychange handler knows whether to re-acquire after the tab returns
  const wantLockRef = useRef<boolean>(false);

  useEffect(() => {
    // Bail out immediately on browsers that don't support the API
    // (e.g., older Firefox, some WebViews). The metronome still works — 
    // the screen may dim, but nothing breaks.
    if (!('wakeLock' in navigator)) return;

    wantLockRef.current = active;

    const acquireLock = async () => {
      // Guard: only request if the document is currently visible.
      // The API throws if the document is hidden.
      if (document.visibilityState !== 'visible') return;

      try {
        // Release any existing sentinel before requesting a new one
        if (sentinelRef.current) {
          await sentinelRef.current.release();
          sentinelRef.current = null;
        }

        const sentinel = await navigator.wakeLock.request('screen');

        // OS can revoke the lock at any time (low battery, system settings).
        // Log for debugging but do not throw — metronome must keep playing.
        sentinel.addEventListener('release', () => {
          console.log('[WakeLock] Screen wake lock released by OS');
          sentinelRef.current = null;
        });

        sentinelRef.current = sentinel;
        console.log('[WakeLock] Screen wake lock acquired');
      } catch (err) {
        // Common reason: battery saver mode active, or permissions denied.
        // Not fatal — metronome continues; screen may dim.
        console.warn('[WakeLock] Wake lock request failed:', err);
      }
    };

    const releaseLock = async () => {
      if (sentinelRef.current) {
        try {
          await sentinelRef.current.release();
          console.log('[WakeLock] Screen wake lock released');
        } catch (err) {
          console.warn('[WakeLock] Wake lock release error:', err);
        }
        sentinelRef.current = null;
      }
    };

    // Re-acquire after tab becomes visible again (OS auto-releases on hide)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && wantLockRef.current) {
        acquireLock();
      }
    };

    if (active) {
      acquireLock();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      releaseLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // On unmount while active, release the lock cleanly
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
    };
  }, [active]);
};
