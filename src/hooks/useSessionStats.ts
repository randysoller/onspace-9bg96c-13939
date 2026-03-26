/**
 * Session Statistics Hook - Track practice attempts with timing
 */

import { useState, useRef, useCallback } from 'react';

export interface SessionAttempt {
  chordSymbol: string;
  chordName: string;
  result: 'correct' | 'skipped';
  timeMs: number;
  timestamp: number;
}

export interface SessionSummary {
  totalCorrect: number;
  totalSkipped: number;
  accuracyRate: number;
  avgResponseTimeMs: number;
  fastestTimeMs: number;
  slowestTimeMs: number;
  totalDurationMs: number;
  attempts: SessionAttempt[];
}

export function useSessionStats() {
  const [attempts, setAttempts] = useState<SessionAttempt[]>([]);
  const sessionStartRef = useRef<number>(0);
  const chordStartRef = useRef<number>(0);
  const [showSummary, setShowSummary] = useState(false);
  
  const startSession = useCallback(() => {
    sessionStartRef.current = Date.now();
    chordStartRef.current = Date.now();
    setAttempts([]);
    setShowSummary(false);
  }, []);
  
  const resetChordTimer = useCallback(() => {
    chordStartRef.current = Date.now();
  }, []);
  
  const recordAttempt = useCallback((
    chordSymbol: string,
    chordName: string,
    result: 'correct' | 'skipped'
  ): SessionAttempt => {
    const timeMs = Date.now() - chordStartRef.current;
    const attempt: SessionAttempt = {
      chordSymbol,
      chordName,
      result,
      timeMs,
      timestamp: Date.now(),
    };
    
    setAttempts(prev => [...prev, attempt]);
    chordStartRef.current = Date.now();
    
    return attempt;
  }, []);
  
  const endSession = useCallback(() => {
    setShowSummary(true);
  }, []);
  
  const dismissSummary = useCallback(() => {
    setShowSummary(false);
  }, []);
  
  const getSummary = useCallback((): SessionSummary => {
    const totalCorrect = attempts.filter(a => a.result === 'correct').length;
    const totalSkipped = attempts.filter(a => a.result === 'skipped').length;
    const total = totalCorrect + totalSkipped;
    
    const correctAttempts = attempts.filter(a => a.result === 'correct');
    const times = correctAttempts.map(a => a.timeMs);
    
    return {
      totalCorrect,
      totalSkipped,
      accuracyRate: total > 0 ? (totalCorrect / total) * 100 : 0,
      avgResponseTimeMs: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      fastestTimeMs: times.length > 0 ? Math.min(...times) : 0,
      slowestTimeMs: times.length > 0 ? Math.max(...times) : 0,
      totalDurationMs: sessionStartRef.current > 0 ? Date.now() - sessionStartRef.current : 0,
      attempts,
    };
  }, [attempts]);
  
  return {
    startSession,
    recordAttempt,
    resetChordTimer,
    endSession,
    getSummary,
    showSummary,
    dismissSummary,
  };
}
