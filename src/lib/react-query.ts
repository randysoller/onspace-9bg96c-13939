/**
 * React Query configuration and utilities
 * Provides centralized caching, refetching, and state management for server data
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from './logger';

/**
 * Global query client with optimized defaults
 * - 5 minute stale time for most queries
 * - 10 minute cache time
 * - Automatic background refetching
 * - Retry failed queries 3 times
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      logger.error('Query error', { error, queryKey: query.queryKey });
      
      // Don't show toast for background refetches
      if (query.state.data !== undefined) {
        return;
      }
      
      const message = error instanceof Error ? error.message : 'Failed to fetch data';
      toast.error(message);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      logger.error('Mutation error', { error, mutationKey: mutation.options.mutationKey });
      const message = error instanceof Error ? error.message : 'Operation failed';
      toast.error(message);
    },
  }),
});

/**
 * Query keys for consistent cache management
 */
export const queryKeys = {
  // Practice
  practiceSessions: (userId: string) => ['practiceSessions', userId] as const,
  practiceSession: (sessionId: string) => ['practiceSession', sessionId] as const,
  practiceHistory: (userId: string, filters?: any) => ['practiceHistory', userId, filters] as const,
  practiceStats: (userId: string) => ['practiceStats', userId] as const,
  
  // Leaderboard
  leaderboard: (period: string) => ['leaderboard', period] as const,
  leaderboardRank: (userId: string, period: string) => ['leaderboardRank', userId, period] as const,
  
  // Chords
  customChords: (userId: string) => ['customChords', userId] as const,
  customChord: (chordId: string) => ['customChord', chordId] as const,
  chordMastery: (userId: string) => ['chordMastery', userId] as const,
  
  // Settings
  userSettings: (userId: string) => ['userSettings', userId] as const,
  
  // Achievements
  achievements: () => ['achievements'] as const,
  userAchievements: (userId: string) => ['userAchievements', userId] as const,
  
  // Goals
  goals: (userId: string) => ['goals', userId] as const,
  goal: (goalId: string) => ['goal', goalId] as const,
  
  // Streaks
  streak: (userId: string) => ['streak', userId] as const,
  
  // Lessons
  lessons: () => ['lessons'] as const,
  userLessons: (userId: string) => ['userLessons', userId] as const,
  
  // Songs
  songs: () => ['songs'] as const,
  userSongs: (userId: string) => ['userSongs', userId] as const,
  
  // Profile
  profile: (userId: string) => ['profile', userId] as const,
  
  // Friends
  friends: (userId: string) => ['friends', userId] as const,
  
  // Challenges
  challenges: () => ['challenges'] as const,
  userChallenges: (userId: string) => ['userChallenges', userId] as const,
  
  // Ear Training
  earTrainingSessions: (userId: string) => ['earTrainingSessions', userId] as const,
  
  // Progression
  progressionSessions: (userId: string) => ['progressionSessions', userId] as const,
  
  // Scales
  scaleSessions: (userId: string) => ['scaleSessions', userId] as const,
} as const;

/**
 * Prefetch strategies for common navigation patterns
 */
export const prefetchStrategies = {
  /**
   * Prefetch data when user is likely to navigate to practice history
   */
  prefetchPracticeHistory: async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.practiceHistory(userId),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  },
  
  /**
   * Prefetch leaderboard when viewing practice stats
   */
  prefetchLeaderboard: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.leaderboard('weekly'),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
  
  /**
   * Prefetch user profile when loading analytics
   */
  prefetchProfile: async (userId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.profile(userId),
        staleTime: 10 * 60 * 1000, // 10 minutes
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.practiceStats(userId),
        staleTime: 5 * 60 * 1000,
      }),
    ]);
  },
  
  /**
   * Prefetch custom chords when entering chord setup
   */
  prefetchChordLibrary: async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.customChords(userId),
      staleTime: 10 * 60 * 1000,
    });
  },
};

/**
 * Optimistic update helpers
 */
export const optimisticUpdates = {
  /**
   * Optimistically update a practice session
   */
  updatePracticeSession: (sessionId: string, updates: any) => {
    queryClient.setQueryData(
      queryKeys.practiceSession(sessionId),
      (old: any) => ({ ...old, ...updates })
    );
  },
  
  /**
   * Optimistically add a custom chord
   */
  addCustomChord: (userId: string, chord: any) => {
    queryClient.setQueryData(
      queryKeys.customChords(userId),
      (old: any[] = []) => [...old, chord]
    );
  },
  
  /**
   * Optimistically delete a custom chord
   */
  deleteCustomChord: (userId: string, chordId: string) => {
    queryClient.setQueryData(
      queryKeys.customChords(userId),
      (old: any[] = []) => old.filter(c => c.id !== chordId)
    );
  },
  
  /**
   * Optimistically update settings
   */
  updateSettings: (userId: string, updates: any) => {
    queryClient.setQueryData(
      queryKeys.userSettings(userId),
      (old: any) => ({ ...old, ...updates })
    );
  },
};
