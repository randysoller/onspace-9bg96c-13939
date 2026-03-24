import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import App from './App.tsx'
import './index.css'
import './stores/authStore'; // Initialize auth state
import { initSentry } from './lib/sentry';
import { initWebVitals } from './lib/web-vitals';
import { logger } from './lib/logger';

// Initialize monitoring (production only)
if (import.meta.env.MODE === 'production') {
  initSentry();
  initWebVitals();
}

// Register service worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        logger.info('Service Worker registered', { scope: registration.scope });
      })
      .catch(error => {
        logger.error('Service Worker registration failed', error);
      });
  });
}

// React Query enabled for better data caching and performance
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
