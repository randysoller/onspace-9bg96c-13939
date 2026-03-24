/**
 * PWA utilities hook
 * Provides PWA-related functionality and status
 */

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export interface PWAStatus {
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  canInstall: boolean;
}

export function usePWA() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
    canInstall: false,
  });

  useEffect(() => {
    // Check if installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
    
    setStatus(prev => ({ ...prev, isInstalled }));

    // Online/offline status
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      logger.info('App is online');
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
      logger.info('App is offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service worker update detection
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setStatus(prev => ({ ...prev, isUpdateAvailable: true }));
                logger.info('New service worker available');
              }
            });
          }
        });
      });
    }

    // Install prompt availability
    const handleBeforeInstallPrompt = () => {
      setStatus(prev => ({ ...prev, canInstall: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  /**
   * Update service worker
   */
  const updateServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      
      // Reload page after update
      window.location.reload();
    }
  };

  return {
    ...status,
    updateServiceWorker,
  };
}
