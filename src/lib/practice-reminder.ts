/**
 * Practice reminder utilities for tracking practice sessions and displaying reminders
 * Calculates next practice time based on frequency and shows in-app notifications
 */

import { logger } from './logger';

export type ReminderFrequency = 'daily' | 'every-other-day' | 'weekly';

export interface PracticeReminderSettings {
  enabled: boolean;
  frequency: ReminderFrequency;
  reminderTime: string; // HH:MM format
  lastPracticeDate?: number; // timestamp
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calculate next practice reminder time based on frequency and last practice
 * @param settings - Reminder settings with frequency and time
 * @returns Timestamp of next reminder, or null if reminders disabled
 */
export function calculateNextReminder(settings: PracticeReminderSettings): number | null {
  if (!settings.enabled) return null;

  const now = Date.now();
  const lastPractice = settings.lastPracticeDate || now;
  
  // Parse reminder time (HH:MM)
  const [hours, minutes] = settings.reminderTime.split(':').map(Number);
  
  // Calculate next reminder date
  let nextReminder = new Date(lastPractice);
  nextReminder.setHours(hours, minutes, 0, 0);
  
  // Add days based on frequency
  switch (settings.frequency) {
    case 'daily':
      nextReminder.setDate(nextReminder.getDate() + 1);
      break;
    case 'every-other-day':
      nextReminder.setDate(nextReminder.getDate() + 2);
      break;
    case 'weekly':
      nextReminder.setDate(nextReminder.getDate() + 7);
      break;
  }
  
  // If next reminder is in the past, move it to today at reminder time
  if (nextReminder.getTime() < now) {
    nextReminder = new Date();
    nextReminder.setHours(hours, minutes, 0, 0);
    
    // If today's reminder time already passed, schedule for tomorrow
    if (nextReminder.getTime() < now) {
      nextReminder.setDate(nextReminder.getDate() + 1);
    }
  }
  
  return nextReminder.getTime();
}

/**
 * Check if practice reminder should be shown
 * @param settings - Reminder settings
 * @returns True if reminder should be displayed
 */
export function shouldShowReminder(settings: PracticeReminderSettings): boolean {
  if (!settings.enabled) return false;
  
  const now = Date.now();
  const nextReminder = calculateNextReminder(settings);
  
  if (!nextReminder) return false;
  
  // Show reminder if we've passed the scheduled time and haven't practiced today
  const lastPractice = settings.lastPracticeDate || 0;
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const hasNotPracticedToday = lastPractice < todayStart;
  
  return now >= nextReminder && hasNotPracticedToday;
}

/**
 * Get time since last practice in human-readable format
 * @param lastPracticeTimestamp - Timestamp of last practice session
 * @returns Human-readable string (e.g., "2 days ago", "5 hours ago")
 */
export function getTimeSinceLastPractice(lastPracticeTimestamp?: number): string {
  if (!lastPracticeTimestamp) return 'Never';
  
  const now = Date.now();
  const diff = now - lastPracticeTimestamp;
  
  const days = Math.floor(diff / MILLISECONDS_PER_DAY);
  const hours = Math.floor((diff % MILLISECONDS_PER_DAY) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  
  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  } else if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Get motivational message based on practice streak and time since last practice
 * @param lastPracticeTimestamp - Timestamp of last practice
 * @param currentStreak - Current practice streak in days
 * @returns Motivational message string
 */
export function getMotivationalMessage(lastPracticeTimestamp?: number, currentStreak: number = 0): string {
  const timeSince = lastPracticeTimestamp ? Date.now() - lastPracticeTimestamp : Infinity;
  const daysSince = Math.floor(timeSince / MILLISECONDS_PER_DAY);
  
  if (daysSince === 0) {
    return "Great job practicing today! Keep the momentum going! 🎸";
  } else if (daysSince === 1) {
    return "You practiced yesterday! Ready for another session? 🎵";
  } else if (daysSince === 2) {
    return "It's been 2 days. Let's keep your streak alive! 🔥";
  } else if (daysSince >= 3 && daysSince < 7) {
    return "Your guitar misses you! Time to practice some chords! 🎶";
  } else if (daysSince >= 7 && daysSince < 14) {
    return "It's been over a week. Let's get back to practicing! 💪";
  } else if (daysSince >= 14) {
    return "Ready to pick up where you left off? Let's practice! 🌟";
  } else if (!lastPracticeTimestamp) {
    return "Start your guitar journey today! 🚀";
  }
  
  return "Time to practice! 🎸";
}

/**
 * Mark practice session as completed and update last practice time
 * @param userId - User ID to update practice time for
 * @returns Updated timestamp
 */
export function markPracticeCompleted(): number {
  const now = Date.now();
  logger.info('Practice session completed', { timestamp: now });
  return now;
}

/**
 * Format reminder time for display
 * @param timestamp - Timestamp of reminder
 * @returns Formatted time string (e.g., "Tomorrow at 9:00 AM")
 */
export function formatReminderTime(timestamp: number): string {
  const reminderDate = new Date(timestamp);
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isTomorrow = reminderDate.toDateString() === tomorrow.toDateString();
  const isToday = reminderDate.toDateString() === now.toDateString();
  
  const timeStr = reminderDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (isToday) {
    return `Today at ${timeStr}`;
  } else if (isTomorrow) {
    return `Tomorrow at ${timeStr}`;
  } else {
    return `${reminderDate.toLocaleDateString('en-US', { weekday: 'long' })} at ${timeStr}`;
  }
}
