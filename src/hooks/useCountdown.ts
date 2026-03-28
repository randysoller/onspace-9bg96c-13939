/**
 * Countdown Timer Hook
 * Uses Date.now() elapsed time calculation, updating at 50ms intervals
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCountdownOptions {
  duration: number;      // seconds
  onComplete?: () => void;
}

interface UseCountdownReturn {
  timeLeft: number;      // seconds remaining (float)
  isRunning: boolean;
  progress: number;      // 0–1 (timeLeft / duration)
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useCountdown({ duration, onComplete }: UseCountdownOptions): UseCountdownReturn {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const start = useCallback(() => {
    if (isRunning) return;
    startTimeRef.current = Date.now();
    completedRef.current = false;
    setIsRunning(true);
  }, [isRunning]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTimeLeft(duration);
    startTimeRef.current = null;
    completedRef.current = false;
  }, [duration, stop]);

  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      
      setTimeLeft(remaining);
      
      if (remaining <= 0 && !completedRef.current) {
        completedRef.current = true;
        setIsRunning(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        onComplete?.();
      }
    }, 50); // 50ms update interval

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, duration, onComplete]);

  const progress = duration > 0 ? timeLeft / duration : 0;

  return {
    timeLeft,
    isRunning,
    progress,
    start,
    stop,
    reset,
  };
}
