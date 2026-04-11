
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import App from './App.tsx'
import './index.css'
import { logger } from './lib/logger';
import { initAuth } from '@/stores/authStore';
import { CHORD_DATABASE } from '@/constants/chords-index';

// ── Startup: unregister any previously installed service workers ─────────────
// Service workers caused persistent mobile caching problems (db:1580 vs 1600).
// We now run without a SW entirely — every page load fetches fresh from server.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(r => r.unregister());
  }).catch(() => {});
  // Also wipe all SW caches so old cached bundles are gone
  if ('caches' in window) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
  }
}

// ── Stale bundle guard ───────────────────────────────────────────────────────
// If the phone's HTTP cache is still serving an old index.html that points to
// an old JS bundle (db:1580), force a hard navigation with a cache-bust param.
// The no-cache meta tags in index.html prevent this from recurring after this
// one forced reload.
{
  const EXPECTED = 1600;
  const GUARD_KEY = 'fm-bust-done';
  if (CHORD_DATABASE.length !== EXPECTED) {
    const alreadyBusted = sessionStorage.getItem(GUARD_KEY);
    if (!alreadyBusted) {
      sessionStorage.setItem(GUARD_KEY, '1');
      // Navigate to same page with cache-bust param; forces browser to re-fetch index.html
      const url = new URL(window.location.href);
      url.searchParams.set('_cb', Date.now().toString());
      window.location.replace(url.toString());
    }
    // If we already busted and still wrong — log and proceed (don't loop)
    console.warn('[FretMaster] Chord count still', CHORD_DATABASE.length, 'after cache bust — proceeding');
  } else {
    // Count is correct; clear any leftover bust guard
    sessionStorage.removeItem(GUARD_KEY);
  }
}

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
try {
  const raw = localStorage.getItem('fretmaster-hidden-chords');
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 10) {
      localStorage.removeItem('fretmaster-hidden-chords');
      logger.info('Cleared oversized fretmaster-hidden-chords from localStorage');
    }
  }
} catch {
  localStorage.removeItem('fretmaster-hidden-chords');
}
// Note: Service worker registration removed — SW caching caused stale bundle
// issues on mobile (db:1580 instead of 1600). Push notifications use the
// Supabase-side server push; no local SW needed.
