/**
 * Browser push notification service using Web Push API
 * Handles permission requests, notification scheduling, and rich notification content
 */

import { logger } from './logger';
import type { PracticeReminderSettings } from './practice-reminder';

export interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export interface PracticeNotificationData {
  currentStreak: number;
  totalSessions: number;
  averageAccuracy: number;
  lastPracticeDate?: number;
}

/**
 * Check if browser supports push notifications
 */
export function isPushNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isPushNotificationSupported()) {
    return { granted: false, denied: true, prompt: false };
  }

  const permission = Notification.permission;
  return {
    granted: permission === 'granted',
    denied: permission === 'denied',
    prompt: permission === 'default',
  };
}

/**
 * Request notification permission from user
 * @returns True if permission granted, false otherwise
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    logger.warn('Push notifications not supported in this browser');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    logger.info('Notification permission result', { permission });
    return permission === 'granted';
  } catch (error) {
    logger.error('Failed to request notification permission', error);
    return false;
  }
}

/**
 * Show rich practice reminder notification
 * @param data - Practice stats and streak information
 * @param settings - Reminder settings for customization
 */
export async function showPracticeNotification(
  data: PracticeNotificationData,
  settings: PracticeReminderSettings
): Promise<void> {
  const permission = getNotificationPermission();
  
  if (!permission.granted) {
    logger.warn('Cannot show notification: permission not granted');
    return;
  }

  const { currentStreak, totalSessions, averageAccuracy } = data;
  
  // Generate notification content based on streak
  let title = '🎸 Time to Practice!';
  let body = 'Ready to improve your guitar skills?';
  
  if (currentStreak > 0) {
    title = `🔥 ${currentStreak} Day Streak!`;
    body = `Keep it going! You've completed ${totalSessions} sessions with ${averageAccuracy.toFixed(0)}% accuracy.`;
  } else if (totalSessions > 0) {
    title = '🎵 Let\'s Practice!';
    body = `You've practiced ${totalSessions} times. Start a new streak today!`;
  }

  // Get notification icon
  const icon = '/favicon.ico';
  const badge = '/favicon.ico';

  // Notification options
  const options: NotificationOptions = {
    body,
    icon,
    badge,
    tag: 'practice-reminder',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url: window.location.origin + '/chord-setup',
      timestamp: Date.now(),
      streak: currentStreak,
    },
    actions: [
      {
        action: 'practice',
        title: '🎸 Start Practicing',
      },
      {
        action: 'snooze',
        title: '⏰ Remind me later',
      },
    ],
  };

  try {
    // Check if service worker is available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Use service worker notification for background notifications
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      logger.info('Service worker notification shown');
    } else {
      // Fallback to regular notification
      const notification = new Notification(title, options);
      
      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        window.location.href = '/chord-setup';
        notification.close();
      };
      
      logger.info('Browser notification shown');
    }
  } catch (error) {
    logger.error('Failed to show notification', error);
  }
}

/**
 * Schedule practice reminder notification
 * @param settings - Reminder settings with time and frequency
 * @param data - Practice stats for rich notification content
 */
export function schedulePracticeReminder(
  settings: PracticeReminderSettings,
  data: PracticeNotificationData
): void {
  if (!settings.enabled) {
    logger.debug('Reminders disabled, skipping schedule');
    return;
  }

  const permission = getNotificationPermission();
  if (!permission.granted) {
    logger.warn('Cannot schedule notification: permission not granted');
    return;
  }

  // Parse reminder time
  const [hours, minutes] = settings.reminderTime.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  // If time has passed today, schedule for tomorrow
  if (scheduledTime.getTime() <= now.getTime()) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const delay = scheduledTime.getTime() - now.getTime();

  logger.info('Scheduling practice reminder', {
    scheduledTime: scheduledTime.toISOString(),
    delayMs: delay,
  });

  // Schedule notification
  setTimeout(() => {
    showPracticeNotification(data, settings);
  }, delay);
}

/**
 * Clear all practice reminder notifications
 */
export async function clearPracticeNotifications(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications({ tag: 'practice-reminder' });
      notifications.forEach(notification => notification.close());
      logger.info('Cleared practice notifications', { count: notifications.length });
    } catch (error) {
      logger.error('Failed to clear notifications', error);
    }
  }
}

/**
 * Play notification sound
 * @param soundType - Type of notification sound
 */
export function playNotificationSound(soundType: 'default' | 'chime' | 'guitar' | 'none' = 'default'): void {
  if (soundType === 'none') return;

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  switch (soundType) {
    case 'chime':
      // Gentle chime sound (E4 -> C#4 -> A3)
      oscillator.frequency.setValueAtTime(329.63, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(277.18, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(220.00, audioContext.currentTime + 0.4);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.6);
      break;

    case 'guitar':
      // Guitar-like pluck (harmonics)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(82.41, audioContext.currentTime); // Low E
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.0);
      break;

    case 'default':
    default:
      // Simple beep
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      break;
  }
}

/**
 * Test notification with current settings
 * @param data - Practice stats for preview
 */
export async function testNotification(data: PracticeNotificationData): Promise<void> {
  const permission = await requestNotificationPermission();
  if (!permission) {
    throw new Error('Notification permission denied');
  }

  await showPracticeNotification(data, {
    enabled: true,
    frequency: 'daily',
    reminderTime: '09:00',
  });
}
