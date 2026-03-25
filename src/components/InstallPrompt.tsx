/**
 * PWA Install Prompt
 * Prompts users to install the app on their device
 */

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { logger } from '@/lib/logger';
import { analytics } from '@/lib/analytics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      logger.info('App is already installed');
      return;
    }

    // Check if previously dismissed
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for beforeinstallprompt event
    let timeoutId: number | null = null;
    
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 30 seconds of usage
      timeoutId = window.setTimeout(() => {
        setShowPrompt(true);
        analytics.track('feature_enabled', {
          feature: 'install_prompt',
          action: 'shown',
        });
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show install prompt
    await deferredPrompt.prompt();
    
    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;
    
    logger.info(`Install prompt outcome: ${outcome}`);
    analytics.track('feature_enabled', {
      feature: 'install_prompt',
      action: outcome,
    });

    // Clear prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
    
    analytics.track('feature_disabled', {
      feature: 'install_prompt',
      action: 'dismissed',
    });
  };

  // iOS install instructions
  if (isIOS && showPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-zinc-900 border border-amber-500/20 rounded-lg p-4 shadow-xl z-50 max-w-md mx-auto">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-zinc-800 rounded"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">
              Install FretMaster
            </h3>
            <p className="text-sm text-zinc-400 mb-3">
              Install this app on your iPhone: tap <span className="inline-block w-4 h-4 border border-zinc-400 rounded text-center text-xs leading-4">↑</span> then "Add to Home Screen"
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop install prompt
  if (!deferredPrompt || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-zinc-900 border border-amber-500/20 rounded-lg p-4 shadow-xl z-50 max-w-md mx-auto">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-zinc-800 rounded"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <Download className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">
            Install FretMaster
          </h3>
          <p className="text-sm text-zinc-400 mb-3">
            Install the app for quick access and offline support
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg text-sm transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
