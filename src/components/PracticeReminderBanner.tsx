/**
 * In-app practice reminder banner
 * Shows motivational prompts when user should practice based on reminder settings
 */

import { memo, useState, useEffect } from 'react';
import { X, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  shouldShowReminder, 
  getMotivationalMessage, 
  getTimeSinceLastPractice,
  type PracticeReminderSettings 
} from '@/lib/practice-reminder';

interface PracticeReminderBannerProps {
  settings: PracticeReminderSettings;
  currentStreak: number;
  onDismiss: () => void;
}

export const PracticeReminderBanner = memo(({
  settings,
  currentStreak,
  onDismiss,
}: PracticeReminderBannerProps) => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const shouldDisplay = shouldShowReminder(settings);
    setShow(shouldDisplay);
  }, [settings]);

  const handleStartPractice = () => {
    onDismiss();
    navigate('/chord-setup');
  };

  const handleClose = () => {
    setShow(false);
    onDismiss();
  };

  if (!show) return null;

  const message = getMotivationalMessage(settings.lastPracticeDate, currentStreak);
  const timeSince = getTimeSinceLastPractice(settings.lastPracticeDate);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-0 right-0 z-40 px-4"
          role="alert"
          aria-live="polite"
        >
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg shadow-2xl border border-amber-400">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5" aria-hidden="true" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg mb-1">Practice Reminder</h3>
                  <p className="text-sm text-white/90 mb-2">{message}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-white/80 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      <span>Last practice: {timeSince}</span>
                    </div>
                    {currentStreak > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" aria-hidden="true" />
                        <span>{currentStreak} day streak</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleStartPractice}
                      className="px-4 py-2 bg-white text-amber-600 font-semibold rounded-lg hover:bg-amber-50 transition-colors min-h-[44px] flex items-center justify-center"
                      aria-label="Start practicing now"
                    >
                      Start Practicing
                    </button>
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
                      aria-label="Dismiss reminder"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleClose}
                  className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close reminder"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

PracticeReminderBanner.displayName = 'PracticeReminderBanner';
