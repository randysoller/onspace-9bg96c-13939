import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { notificationsApi, Notification } from '@/lib/api/notifications';
import { achievementsApi } from '@/lib/api/achievements';
import { streaksApi } from '@/lib/api/streaks';
import { toast } from 'sonner';

export const useNotifications = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    loadNotifications();
    checkForNewAchievements();
    checkStreakStatus();

    // Check periodically for reminders
    const reminderInterval = setInterval(() => {
      checkPracticeReminder();
    }, 60000); // Every minute

    return () => clearInterval(reminderInterval);
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const [notifs, count] = await Promise.all([
        notificationsApi.getUserNotifications(user.id),
        notificationsApi.getUnreadCount(user.id),
      ]);

      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewAchievements = async () => {
    if (!user) return;

    try {
      const newAchievements = await achievementsApi.checkAndAwardAchievements(user.id);
      
      for (const achievement of newAchievements) {
        // Create notification
        await notificationsApi.createNotification({
          user_id: user.id,
          type: 'achievement',
          title: '🏆 Achievement Unlocked!',
          message: `${achievement.name}: ${achievement.description}`,
          icon: achievement.icon,
          read: false,
          action_url: '/achievements',
        });

        // Show toast
        toast.success(`Achievement Unlocked: ${achievement.name}`, {
          description: achievement.description,
          duration: 5000,
        });
      }

      if (newAchievements.length > 0) {
        loadNotifications();
      }
    } catch (err) {
      console.error('Failed to check achievements:', err);
    }
  };

  const checkStreakStatus = async () => {
    if (!user) return;

    try {
      const streak = await streaksApi.getUserStreak(user.id);
      
      if (!streak) return;

      const lastPractice = new Date(streak.last_practice_date || '');
      const today = new Date();
      const daysSinceLastPractice = Math.floor(
        (today.getTime() - lastPractice.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Streak about to break (missed today and yesterday)
      if (daysSinceLastPractice >= 1 && streak.current_streak > 0) {
        const existing = notifications.find(
          n => n.type === 'streak_alert' && !n.read
        );

        if (!existing) {
          await notificationsApi.createNotification({
            user_id: user.id,
            type: 'streak_alert',
            title: '🔥 Streak Alert!',
            message: `Your ${streak.current_streak}-day streak is about to break! Practice today to keep it going.`,
            icon: '🔥',
            read: false,
            action_url: '/chord-setup',
          });

          toast.warning(`Your ${streak.current_streak}-day streak is at risk!`, {
            description: 'Practice today to keep it alive',
            duration: 7000,
          });

          loadNotifications();
        }
      }
    } catch (err) {
      console.error('Failed to check streak status:', err);
    }
  };

  const checkPracticeReminder = async () => {
    if (!user) return;

    const now = new Date();
    const hour = now.getHours();

    // Only send reminder between 6pm-9pm
    if (hour < 18 || hour > 21) return;

    const streak = await streaksApi.getUserStreak(user.id);
    if (!streak) return;

    const lastPractice = new Date(streak.last_practice_date || '');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastPractice.setHours(0, 0, 0, 0);

    // Haven't practiced today
    if (lastPractice.getTime() < today.getTime()) {
      const existing = notifications.find(
        n => n.type === 'practice_reminder' && 
        new Date(n.created_at).toDateString() === today.toDateString()
      );

      if (!existing) {
        await notificationsApi.createNotification({
          user_id: user.id,
          type: 'practice_reminder',
          title: '🎸 Practice Time!',
          message: "You haven't practiced today. Just 10 minutes can make a difference!",
          icon: '🎸',
          read: false,
          action_url: '/chord-setup',
        });

        loadNotifications();
      }
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await notificationsApi.markAllAsRead(user.id);
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      loadNotifications();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications,
    checkForNewAchievements,
  };
};
