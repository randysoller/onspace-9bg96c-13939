import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import App from './App.tsx'
import './index.css'
import { logger } from './lib/logger';
import { initAuth } from '@/stores/authStore';

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

// Register service worker (production only, non-blocking)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        logger.info('Service Worker registered', { scope: registration.scope });
        
        // Check for updates periodically
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000); // Check every hour
      })
      .catch(error => {
        logger.error('Service Worker registration failed', error);
      });
  });
}
