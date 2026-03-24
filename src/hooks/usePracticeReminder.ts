/**
 * Custom hook for managing practice reminders with push notifications
 * Tracks practice sessions and shows timely reminders
 */

import { useEffect, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { 
  schedulePracticeReminder,
  getNotificationPermission,
  type PracticeNotificationData 
} from '@/lib/push-notifications';
import type { PracticeReminderSettings } from '@/lib/practice-reminder';

export function usePracticeReminder() {
  const [reminderSettings, setReminderSettings] = useState<PracticeReminderSettings>(() => {
    const stored = localStorage.getItem('practiceReminderSettings');
    return stored ? JSON.parse(stored) : {
      enabled: false,
      frequency: 'daily',
      reminderTime: '09:00',
    };
  });

  const [pushEnabled, setPushEnabled] = useState(() => {
    const stored = localStorage.getItem('pushNotificationsEnabled');
    return stored ? JSON.parse(stored) : false;
  });

  // Update last practice time
  const markPracticeCompleted = useCallback(() => {
    const now = Date.now();
    const updatedSettings: PracticeReminderSettings = {
      ...reminderSettings,
      lastPracticeDate: now,
    };
    setReminderSettings(updatedSettings);
    localStorage.setItem('practiceReminderSettings', JSON.stringify(updatedSettings));
    logger.info('Practice session marked complete', { timestamp: now });
  }, [reminderSettings]);

  // Schedule reminders when settings change
  useEffect(() => {
    if (!reminderSettings.enabled || !pushEnabled) return;

    const permission = getNotificationPermission();
    if (!permission.granted) {
      logger.warn('Cannot schedule reminders: notification permission not granted');
      return;
    }

    // Get practice stats from localStorage (replace with actual store data)
    const practiceData: PracticeNotificationData = {
      currentStreak: parseInt(localStorage.getItem('currentStreak') || '0'),
      totalSessions: parseInt(localStorage.getItem('totalSessions') || '0'),
      averageAccuracy: parseFloat(localStorage.getItem('averageAccuracy') || '0'),
      lastPracticeDate: reminderSettings.lastPracticeDate,
    };

    schedulePracticeReminder(reminderSettings, practiceData);
  }, [reminderSettings, pushEnabled]);

  return {
    reminderSettings,
    setReminderSettings,
    markPracticeCompleted,
  };
}
