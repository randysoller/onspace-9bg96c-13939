import { useRef, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { MobileTabBar } from './MobileTabBar';
import { PracticeReminderBanner } from '@/components/PracticeReminderBanner';
import { InstallPrompt } from '@/components/InstallPrompt';
import { usePWA } from '@/hooks/usePWA';
import MetronomeModal from '@/components/features/MetronomeModal';
import { useMetronomeAudio } from '@/hooks/useMetronomeAudio';
import type { PracticeReminderSettings } from '@/lib/practice-reminder';

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadReminderSettings(): PracticeReminderSettings {
  try {
    const stored = localStorage.getItem('practiceReminderSettings');
    if (stored) return JSON.parse(stored);
  } catch { /* ignore parse errors */ }
  return { enabled: false, frequency: 'daily', reminderTime: '09:00' };
}

function loadCurrentStreak(): number {
  const stored = localStorage.getItem('currentStreak');
  return stored ? Number(stored) : 0;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AppLayout = () => {
  const { isUpdateAvailable, updateServiceWorker } = usePWA();
  const location = useLocation();

  // Mount the metronome audio engine at the app-shell level so it stays alive
  // regardless of whether MetronomeModal is open or closed. This ensures
  // incrementBeat() fires on every tick and beatsUntilAdvance decrements correctly
  // for the Beat Sync chord-advance feature on the Practice page.
  useMetronomeAudio();
  const isPracticePage = location.pathname === '/practice';

  // Initialise directly from localStorage — no redundant useEffect re-read
  const [reminderSettings] = useState<PracticeReminderSettings>(loadReminderSettings);
  const [currentStreak]    = useState<number>(loadCurrentStreak);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  // Keep a ref to the dismiss timer so we can cancel it on unmount
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  const handleDismissReminder = () => {
    setReminderDismissed(true);
    // Re-show banner after 1 hour; clear any previous timer first
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => setReminderDismissed(false), 60 * 60 * 1000);
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
