/**
 * React Query custom hooks for data fetching
 * Replaces direct Supabase calls with cached, optimized queries
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, optimisticUpdates } from '@/lib/react-query';
import { practiceApi } from '@/lib/api/practice';
import { leaderboardApi } from '@/lib/api/leaderboard';
import { customChordsApi } from '@/lib/api/customChords';
import { settingsApi } from '@/lib/api/settings';
import { achievementsApi } from '@/lib/api/achievements';
import { goalsApi } from '@/lib/api/goals';
import { streaksApi } from '@/lib/api/streaks';
import { toast } from 'sonner';

/**
 * Fetch practice sessions for a user
 * @param userId - User ID
 * @param enabled - Whether to enable the query
 */
export function usePracticeSessions(userId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.practiceSessions(userId),
    queryFn: () => practiceApi.getPracticeSessions(userId),
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Create a new practice session with optimistic updates
 */
export function useCreatePracticeSession(userId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionData: any) => practiceApi.createSession(sessionData),
    onMutate: async (newSession) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.practiceSessions(userId) });
      
      // Snapshot previous value
      const previousSessions = queryClient.getQueryData(queryKeys.practiceSessions(userId));
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.practiceSessions(userId), (old: any[] = []) => [
        { ...newSession, id: 'temp-' + Date.now() },
        ...old,
      ]);
      
      return { previousSessions };
    },
    onError: (_err, _newSession, context) => {
      // Rollback on error
      if (context?.previousSessions) {
        queryClient.setQueryData(queryKeys.practiceSessions(userId), context.previousSessions);
      }
    },
    onSuccess: () => {
      toast.success('Practice session saved');
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceSessions(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceStats(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.streak(userId) });
    },
  });
}

/**
 * Fetch leaderboard data
 * @param period - Time period (daily, weekly, monthly, all-time)
 */
export function useLeaderboard(period: string = 'weekly') {
  return useQuery({
    queryKey: queryKeys.leaderboard(period),
    queryFn: () => leaderboardApi.getLeaderboard(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch custom chords for a user
 */
export function useCustomChords(userId: string) {
  return useQuery({
    queryKey: queryKeys.customChords(userId),
    queryFn: () => customChordsApi.getCustomChords(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Create a custom chord with optimistic updates
 */
export function useCreateCustomChord(userId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chordData: any) => customChordsApi.createCustomChord({ ...chordData, user_id: userId }),
    onMutate: async (newChord) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.customChords(userId) });
      const previousChords = queryClient.getQueryData(queryKeys.customChords(userId));
      
      optimisticUpdates.addCustomChord(userId, { ...newChord, id: 'temp-' + Date.now() });
      
      return { previousChords };
    },
    onError: (_err, _newChord, context) => {
      if (context?.previousChords) {
        queryClient.setQueryData(queryKeys.customChords(userId), context.previousChords);
      }
    },
    onSuccess: () => {
      toast.success('Custom chord saved');
      queryClient.invalidateQueries({ queryKey: queryKeys.customChords(userId) });
    },
  });
}

/**
 * Delete a custom chord with optimistic updates
 */
export function useDeleteCustomChord(userId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chordId: string) => customChordsApi.deleteCustomChord(chordId),
    onMutate: async (chordId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.customChords(userId) });
      const previousChords = queryClient.getQueryData(queryKeys.customChords(userId));
      
      optimisticUpdates.deleteCustomChord(userId, chordId);
      
      return { previousChords };
    },
    onError: (_err, _chordId, context) => {
      if (context?.previousChords) {
        queryClient.setQueryData(queryKeys.customChords(userId), context.previousChords);
      }
    },
    onSuccess: () => {
      toast.success('Custom chord deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.customChords(userId) });
    },
  });
}

/**
 * Fetch user settings
 */
export function useUserSettings(userId: string) {
  return useQuery({
    queryKey: queryKeys.userSettings(userId),
    queryFn: () => settingsApi.getSettings(userId),
    enabled: !!userId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Update user settings with optimistic updates
 */
export function useUpdateSettings(userId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: any) => settingsApi.syncSettings(userId, settings),
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.userSettings(userId) });
      const previousSettings = queryClient.getQueryData(queryKeys.userSettings(userId));
      
      optimisticUpdates.updateSettings(userId, newSettings);
      
      return { previousSettings };
    },
    onError: (_err, _settings, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKeys.userSettings(userId), context.previousSettings);
      }
    },
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: queryKeys.userSettings(userId) });
    },
  });
}

/**
 * Fetch user achievements
 */
export function useUserAchievements(userId: string) {
  return useQuery({
    queryKey: queryKeys.userAchievements(userId),
    queryFn: () => achievementsApi.getUserAchievements(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch user goals
 */
export function useGoals(userId: string) {
  return useQuery({
    queryKey: queryKeys.goals(userId),
    queryFn: () => goalsApi.getGoals(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a goal
 */
export function useCreateGoal(userId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (goalData: any) => goalsApi.createGoal({ ...goalData, user_id: userId }),
    onSuccess: () => {
      toast.success('Goal created');
      queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) });
    },
  });
}

/**
 * Update a goal
 */
export function useUpdateGoal(userId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ goalId, updates }: { goalId: string; updates: any }) => 
      goalsApi.updateGoal(goalId, updates),
    onSuccess: () => {
      toast.success('Goal updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) });
    },
  });
}

/**
 * Fetch practice streak
 */
export function usePracticeStreak(userId: string) {
  return useQuery({
    queryKey: queryKeys.streak(userId),
    queryFn: () => streaksApi.getStreak(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
