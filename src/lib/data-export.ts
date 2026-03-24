/**
 * Data export utilities for GDPR compliance
 * Allows users to export all their practice data in multiple formats
 */

import { logger } from './logger';
import { supabase } from './supabase';

export interface ExportData {
  exportDate: string;
  userData: {
    id: string;
    username: string;
    email: string;
    createdAt: string;
  };
  practiceSessions: any[];
  customChords: any[];
  chordMastery: any[];
  settings: any;
  achievements: any[];
  goals: any[];
  streaks: any;
  progressionSessions: any[];
  scaleSessions: any[];
  challengeSessions: any[];
  earTrainingSessions: any[];
  userLessons: any[];
}

/**
 * Export all user data to JSON format
 * @param userId - User ID to export data for
 * @returns Complete user data export
 */
export async function exportUserData(userId: string): Promise<ExportData> {
  logger.info('Starting data export', { userId });
  
  try {
    // Fetch all user data from Supabase
    const [
      profile,
      practiceSessions,
      customChords,
      chordMastery,
      settings,
      achievements,
      goals,
      streaks,
      progressionSessions,
      scaleSessions,
      challengeSessions,
      earTrainingSessions,
      userLessons,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('practice_sessions').select('*').eq('user_id', userId),
      supabase.from('custom_chords').select('*').eq('user_id', userId),
      supabase.from('chord_mastery').select('*').eq('user_id', userId),
      supabase.from('user_settings').select('*').eq('user_id', userId).single(),
      supabase.from('user_achievements').select('*, achievement:achievements(*)').eq('user_id', userId),
      supabase.from('practice_goals').select('*').eq('user_id', userId),
      supabase.from('practice_streaks').select('*').eq('user_id', userId).single(),
      supabase.from('progression_practice_sessions').select('*').eq('user_id', userId),
      supabase.from('scale_practice_sessions').select('*').eq('user_id', userId),
      supabase.from('challenge_sessions').select('*').eq('user_id', userId),
      supabase.from('ear_training_sessions').select('*').eq('user_id', userId),
      supabase.from('user_lessons').select('*, lesson:lessons(*)').eq('user_id', userId),
    ]);

    const exportData: ExportData = {
      exportDate: new Date().toISOString(),
      userData: {
        id: profile.data?.id || userId,
        username: profile.data?.username || '',
        email: '', // Email is stored in auth.users, not accessible via client
        createdAt: profile.data?.created_at || '',
      },
      practiceSessions: practiceSessions.data || [],
      customChords: customChords.data || [],
      chordMastery: chordMastery.data || [],
      settings: settings.data || {},
      achievements: achievements.data || [],
      goals: goals.data || [],
      streaks: streaks.data || {},
      progressionSessions: progressionSessions.data || [],
      scaleSessions: scaleSessions.data || [],
      challengeSessions: challengeSessions.data || [],
      earTrainingSessions: earTrainingSessions.data || [],
      userLessons: userLessons.data || [],
    };

    logger.info('Data export completed', { 
      userId,
      sessionCount: exportData.practiceSessions.length,
      chordCount: exportData.customChords.length,
    });

    return exportData;
  } catch (error) {
    logger.error('Failed to export user data', error);
    throw new Error('Failed to export data');
  }
}

/**
 * Convert export data to CSV format
 * @param data - Export data object
 * @returns CSV string
 */
export function convertToCSV(data: ExportData): string {
  const rows: string[] = [];
  
  // Header
  rows.push('Export Date,' + data.exportDate);
  rows.push('User ID,' + data.userData.id);
  rows.push('Username,' + data.userData.username);
  rows.push('');
  
  // Practice Sessions
  rows.push('Practice Sessions');
  rows.push('Started At,Ended At,Total Chords,Correct Chords,Accuracy,Duration (seconds)');
  data.practiceSessions.forEach(session => {
    rows.push([
      session.started_at,
      session.ended_at,
      session.total_chords,
      session.correct_chords,
      session.accuracy,
      session.duration_seconds,
    ].join(','));
  });
  rows.push('');
  
  // Custom Chords
  rows.push('Custom Chords');
  rows.push('Name,Frets,Created At');
  data.customChords.forEach(chord => {
    rows.push([
      chord.name,
      JSON.stringify(chord.frets),
      chord.created_at,
    ].join(','));
  });
  rows.push('');
  
  // Chord Mastery
  rows.push('Chord Mastery');
  rows.push('Chord,Total Attempts,Successful,Accuracy,Mastery Level');
  data.chordMastery.forEach(mastery => {
    rows.push([
      mastery.chord_name,
      mastery.total_attempts,
      mastery.successful_attempts,
      mastery.accuracy,
      mastery.mastery_level,
    ].join(','));
  });
  
  return rows.join('\n');
}

/**
 * Download data export as file
 * @param data - Export data object
 * @param format - Export format (json or csv)
 * @param filename - Optional custom filename
 */
export function downloadExport(data: ExportData, format: 'json' | 'csv' = 'json', filename?: string): void {
  let content: string;
  let mimeType: string;
  let extension: string;
  
  if (format === 'csv') {
    content = convertToCSV(data);
    mimeType = 'text/csv';
    extension = 'csv';
  } else {
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
    extension = 'json';
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename || `fretmaster-data-export-${new Date().toISOString().split('T')[0]}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  logger.info('Data export downloaded', { format, filename: link.download });
}

/**
 * Import user data from JSON
 * @param jsonData - JSON string or object
 * @returns Parsed export data
 */
export function importUserData(jsonData: string | ExportData): ExportData {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    
    // Validate data structure
    if (!data.exportDate || !data.userData) {
      throw new Error('Invalid export data format');
    }
    
    logger.info('Data import validated', { exportDate: data.exportDate });
    return data;
  } catch (error) {
    logger.error('Failed to import user data', error);
    throw new Error('Invalid import data');
  }
}
