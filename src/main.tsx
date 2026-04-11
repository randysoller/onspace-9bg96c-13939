import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import App from './App.tsx'
import './index.css'
import { logger } from './lib/logger';
import { initAuth } from '@/stores/authStore';
import { CHORD_DATABASE } from '@/constants/chords-index';

// ── Self-healing bundle detector ────────────────────────────────────────────
// The diagnostic badge confirmed: mobile shows db:1580 because the service
// worker is serving an old cached JS bundle with 20 fewer chords.
// Fix: if the loaded bundle's CHORD_DATABASE doesn't match the expected count,
// unregister ALL service workers, clear ALL caches, and reload once.
// A localStorage guard prevents infinite reload loops.
const EXPECTED_CHORD_COUNT = 1600;
const RELOAD_GUARD_KEY = 'fretmaster-bundle-reload-at';

await (async () => {
  if (CHORD_DATABASE.length !== EXPECTED_CHORD_COUNT) {
    // Guard: if we already force-reloaded within the last 30 seconds, stop
    // looping — the bundle is simply different from what we expect.
    const lastReload = parseInt(localStorage.getItem(RELOAD_GUARD_KEY) ?? '0', 10);
    if (Date.now() - lastReload < 30_000) {
      console.warn(
        `[FretMaster] Bundle has ${CHORD_DATABASE.length} chords after forced reload (expected ${EXPECTED_CHORD_COUNT}). Proceeding.`
      );
      localStorage.removeItem(RELOAD_GUARD_KEY);
      return; // proceed — let React mount normally
    }

    console.warn(
      `[FretMaster] Stale bundle detected: ${CHORD_DATABASE.length} chords (expected ${EXPECTED_CHORD_COUNT}). Clearing SW cache and reloading…`
    );
    // Mark reload time before navigating away
    localStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
    try {
      // 1. Unregister every registered service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
      }
      // 2. Delete every cache (fretmaster-v1/v2/v3/v4 etc.)
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch (e) {
      console.error('[FretMaster] Failed to clear SW/caches:', e);
    }
    // 3. Hard reload — bypasses SW, fetches fresh bundle
    window.location.reload();
    return; // stop further execution — page is reloading
  }
  // Successful load with correct count — clear any leftover guard
  localStorage.removeItem(RELOAD_GUARD_KEY);
})();

// CRITICAL: Start React app FIRST, then initialize auth and monitoring.
// Top-level Supabase auth calls in authStore previously ran at module-load
// time and raced with React's hook dispatcher, causing "dispatcher is null".
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);

// Auth must be initialized AFTER render() so React's dispatcher is ready
// before any Supabase callbacks can trigger state updates.
initAuth();

// Initialize monitoring AFTER React is running (production only)
if (import.meta.env.MODE === 'production') {
  // Delay monitoring initialization to ensure React is fully mounted
  requestAnimationFrame(() => {
    try {
      // Dynamically import monitoring to avoid blocking app
      import('./lib/sentry').then(({ initSentry }) => {
        initSentry();
        logger.info('Sentry initialized after React mount');
      }).catch(err => {
        logger.error('Failed to initialize Sentry', err);
      });
      
      import('./lib/web-vitals').then(({ initWebVitals }) => {
        initWebVitals();
        logger.info('Web Vitals initialized');
      }).catch(err => {
        logger.error('Failed to initialize Web Vitals', err);
      });
    } catch (error) {
      logger.error('Monitoring initialization failed', error);
    }
  });
}

// ── Startup: clear hidden-chord state if suspiciously large ─────────────────
// If hiddenStandardChords has accumulated IDs (e.g. from a bug), silently
// clear it. A user never hides more than a handful of chords intentionally.
// This runs before React renders to avoid a flash of wrong chord count.
try {
  const raw = localStorage.getItem('fretmaster-hidden-chords');
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 10) {
      // More than 10 hidden chords is almost certainly stale/corrupt state.
      localStorage.removeItem('fretmaster-hidden-chords');
      logger.info('Cleared oversized fretmaster-hidden-chords from localStorage');
    }
  }
} catch {
  localStorage.removeItem('fretmaster-hidden-chords');
}

// Register service worker (production only, non-blocking)
// Note: at this point we know the bundle is fresh (EXPECTED_CHORD_COUNT check
// above would have reloaded otherwise), so the SW can safely cache this bundle.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        logger.info('Service Worker registered', { scope: registration.scope });

        // Force an immediate update check on every page load so mobile
        // gets new SW/JS bundles as soon as they are deployed, rather
        // than waiting up to 1 hour for the stale cache to expire.
        registration.update().catch(() => {});

        // Check every 5 minutes to keep mobile fresh.
        setInterval(() => {
          registration.update().catch(() => {});
        }, 5 * 60 * 1000);
      })
      .catch(error => {
        logger.error('Service Worker registration failed', error);
      });
  });
}
