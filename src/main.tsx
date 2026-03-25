import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import App from './App.tsx'
import './index.css'
import './stores/authStore'; // Initialize auth state
import { logger } from './lib/logger';

// Initialize monitoring (production only) with error handling
if (import.meta.env.MODE === 'production') {
  try {
    // Dynamically import monitoring to avoid blocking app startup
    import('./lib/sentry').then(({ initSentry }) => {
      initSentry();
    }).catch(err => {
      logger.error('Failed to initialize Sentry', err);
    });
    
    import('./lib/web-vitals').then(({ initWebVitals }) => {
      initWebVitals();
    }).catch(err => {
      logger.error('Failed to initialize Web Vitals', err);
    });
  } catch (error) {
    logger.error('Monitoring initialization failed', error);
  }
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

// React Query enabled for better data caching and performance
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
