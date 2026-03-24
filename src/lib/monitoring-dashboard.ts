/**
 * Monitoring dashboard data aggregation
 * Provides analytics for Admin dashboard
 */

import { supabase } from './supabase';
import { logger } from './logger';

/**
 * Get aggregate practice statistics
 */
export async function getPracticeStats(timeRange: 'day' | 'week' | 'month' | 'all' = 'week') {
  try {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    const { data, error } = await supabase
      .from('practice_sessions')
      .select('total_chords, correct_chords, accuracy, duration_seconds, created_at')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const totalSessions = data.length;
    const totalChords = data.reduce((sum, session) => sum + (session.total_chords || 0), 0);
    const totalCorrect = data.reduce((sum, session) => sum + (session.correct_chords || 0), 0);
    const avgAccuracy = data.reduce((sum, session) => sum + (session.accuracy || 0), 0) / totalSessions || 0;
    const totalDuration = data.reduce((sum, session) => sum + (session.duration_seconds || 0), 0);

    return {
      totalSessions,
      totalChords,
      totalCorrect,
      avgAccuracy,
      totalDuration,
      avgSessionDuration: totalDuration / totalSessions || 0,
    };
  } catch (error) {
    logger.error('Failed to get practice stats', error);
    throw error;
  }
}

/**
 * Get user engagement metrics
 */
export async function getUserEngagementMetrics(timeRange: 'day' | 'week' | 'month' = 'week') {
  try {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Active users (users who practiced)
    const { data: activeSessions, error: activeError } = await supabase
      .from('practice_sessions')
      .select('user_id')
      .gte('created_at', startDate.toISOString());

    if (activeError) throw activeError;

    const activeUsers = new Set(activeSessions.map(s => s.user_id)).size;

    // Total users
    const { count: totalUsers, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Retention rate (users who practiced in both current and previous period)
    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    
    const { data: previousSessions, error: previousError } = await supabase
      .from('practice_sessions')
      .select('user_id')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    if (previousError) throw previousError;

    const previousUsers = new Set(previousSessions.map(s => s.user_id));
    const currentUsers = new Set(activeSessions.map(s => s.user_id));
    const retainedUsers = [...previousUsers].filter(id => currentUsers.has(id)).length;
    const retentionRate = previousUsers.size > 0 ? (retainedUsers / previousUsers.size) * 100 : 0;

    return {
      totalUsers: totalUsers || 0,
      activeUsers,
      inactiveUsers: (totalUsers || 0) - activeUsers,
      engagementRate: totalUsers ? (activeUsers / totalUsers) * 100 : 0,
      retentionRate,
    };
  } catch (error) {
    logger.error('Failed to get engagement metrics', error);
    throw error;
  }
}

/**
 * Get feature usage statistics
 */
export async function getFeatureUsageStats() {
  try {
    // This would pull from analytics_events table if it exists
    // For now, return mock data structure
    return {
      metronome: { users: 0, sessions: 0 },
      tuner: { users: 0, sessions: 0 },
      chordEditor: { users: 0, chords: 0 },
      customChords: { users: 0, chords: 0 },
      achievements: { users: 0, unlocked: 0 },
      goals: { users: 0, goals: 0 },
    };
  } catch (error) {
    logger.error('Failed to get feature usage stats', error);
    throw error;
  }
}

/**
 * Get system health metrics
 */
export async function getSystemHealthMetrics() {
  try {
    // Check database connectivity
    const { error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    const databaseStatus = dbError ? 'error' : 'healthy';

    // Storage usage (would need actual implementation)
    const storageUsage = {
      used: 0,
      total: 0,
      percentage: 0,
    };

    return {
      databaseStatus,
      storageUsage,
      serviceWorkerActive: 'serviceWorker' in navigator,
      indexedDBAvailable: 'indexedDB' in window,
    };
  } catch (error) {
    logger.error('Failed to get system health metrics', error);
    return {
      databaseStatus: 'error',
      storageUsage: { used: 0, total: 0, percentage: 0 },
      serviceWorkerActive: false,
      indexedDBAvailable: false,
    };
  }
}
