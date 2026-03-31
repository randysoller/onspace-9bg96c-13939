import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Header } from './Header';
import { MobileTabBar } from './MobileTabBar';
import { PracticeReminderBanner } from '@/components/PracticeReminderBanner';
import { InstallPrompt } from '@/components/InstallPrompt';
import { usePWA } from '@/hooks/usePWA';
import MetronomeModal from '@/components/features/MetronomeModal';
import type { PracticeReminderSettings } from '@/lib/practice-reminder';

export const AppLayout = () => {
  const { isUpdateAvailable, updateServiceWorker } = usePWA();
  const location = useLocation();
  const isPracticePage = location.pathname === '/practice';
  
  const [reminderSettings, setReminderSettings] = useState<PracticeReminderSettings>(() => {
    const stored = localStorage.getItem('practiceReminderSettings');
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      enabled: false,
      frequency: 'daily' as const,
      reminderTime: '09:00',
    };
  });

  const [currentStreak, setCurrentStreak] = useState(0);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  // Load reminder settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('practiceReminderSettings');
    if (stored) {
      setReminderSettings(JSON.parse(stored));
    }
    
    // Load current streak (you can replace with actual streak from practice store)
    const streakStored = localStorage.getItem('currentStreak');
    if (streakStored) {
      setCurrentStreak(Number(streakStored));
    }
  }, []);

  const handleDismissReminder = () => {
    setReminderDismissed(true);
    // Hide reminder for 1 hour
    setTimeout(() => {
      setReminderDismissed(false);
    }, 60 * 60 * 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white">
      {!reminderDismissed && (
        <PracticeReminderBanner 
          settings={reminderSettings} 
          currentStreak={currentStreak}
          onDismiss={handleDismissReminder}
        />
      )}
      
      {/* PWA update notification */}
      {isUpdateAvailable && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm font-medium mb-2">New version available!</p>
          <button
            onClick={updateServiceWorker}
            className="px-3 py-1 bg-black text-white rounded text-xs hover:bg-zinc-800 transition-colors"
          >
            Update Now
          </button>
        </div>
      )}
      
      {/* Hide header on mobile for the practice page to maximise screen space */}
      <div className={isPracticePage ? 'hidden md:block' : ''}>
        <Header />
      </div>
      <main
        id="main-content"
        className={`pb-20 md:pb-8 ${isPracticePage ? 'pt-0 md:pt-16' : 'pt-16'}`}
        tabIndex={-1}
      >
        <Outlet />
      </main>
      <MobileTabBar />
      <MetronomeModal />
      <InstallPrompt />
    </div>
  );
};
